
-- Fix the user signup trigger and profiles table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'doctor'::user_role),
    NEW.raw_user_meta_data->>'department'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure documents table has proper foreign key setup
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_created_by_fkey;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update documents table to auto-set created_by
CREATE OR REPLACE FUNCTION public.set_document_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_document_creator_trigger ON public.documents;
CREATE TRIGGER set_document_creator_trigger
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_document_creator();

-- Ensure patients table has proper foreign key setup
ALTER TABLE public.patients 
DROP CONSTRAINT IF EXISTS patients_created_by_fkey;

ALTER TABLE public.patients 
ADD CONSTRAINT patients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update patients table to auto-set created_by
CREATE OR REPLACE FUNCTION public.set_patient_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_patient_creator_trigger ON public.patients;
CREATE TRIGGER set_patient_creator_trigger
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_patient_creator();

-- Add RLS policy for documents to allow users to view documents they can access
DROP POLICY IF EXISTS "Users can view accessible documents" ON public.documents;
CREATE POLICY "Users can view accessible documents" ON public.documents
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'records_officer', 'analyst')
      )
    )
  );

-- Add RLS policy for patients to allow users to view patients they can access
DROP POLICY IF EXISTS "Users can view accessible patients" ON public.patients;
CREATE POLICY "Users can view accessible patients" ON public.patients
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'records_officer', 'analyst')
      )
    )
  );

-- Ensure storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents', 
  'medical-documents', 
  true, 
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Create storage policy for medical documents
DROP POLICY IF EXISTS "Authenticated users can upload medical documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload medical documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can view medical documents" ON storage.objects;
CREATE POLICY "Authenticated users can view medical documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can update medical documents" ON storage.objects;
CREATE POLICY "Authenticated users can update medical documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'medical-documents' AND
    auth.uid() IS NOT NULL
  );

-- Add function to get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
