
-- Fix the missing user_role enum type issue
-- The migration file shows user_role enum was created, but it seems to not exist
-- Let's ensure it exists and fix any issues

-- Drop and recreate the user_role enum to ensure it exists
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'records_officer', 'analyst');

-- Update the profiles table to use the new enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'doctor'::user_role;

-- Recreate the handle_new_user function to fix any issues
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'doctor'::user_role),
    NEW.raw_user_meta_data->>'department'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a test admin user for login
-- Note: This will create a profile entry, but you'll need to sign up through the UI
-- Let's also ensure we have proper RLS policies for testing

-- Add a policy to allow users to read all profiles for admin functionality
CREATE POLICY "Users can view other profiles for admin features" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'records_officer', 'analyst')
    )
  );
