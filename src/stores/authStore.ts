
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'doctor' | 'records_officer' | 'analyst';
  name: string;
  email: string;
  department?: string;
  lastLogin?: Date;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, userData: { name: string; role?: string; department?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  handleAuthenticatedUser: (session: Session) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      clearError: () => set({ error: null }),

      initialize: async () => {
        try {
          console.log('🔄 Initializing UHS Clinical System authentication...');
          
          // Set up auth state listener
          supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
            console.log('🔐 Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              // Handle authenticated user
              await get().handleAuthenticatedUser(session);
            } else {
              // Handle unauthenticated user
              console.log('👋 User signed out or session expired');
              set({ 
                user: null, 
                session: null, 
                isAuthenticated: false, 
                isLoading: false,
                error: null
              });
            }
          });

          // Check for existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Error getting session:', error);
            set({ isLoading: false, error: 'Failed to restore session' });
            return;
          }

          if (!session) {
            console.log('📝 No existing session found');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
          set({ isLoading: false, error: 'Failed to initialize authentication system' });
        }
      },

      handleAuthenticatedUser: async (session: Session) => {
        try {
          console.log('👤 Processing authenticated user for medical system:', session.user.email);
          
          // Get user profile from database
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // Profile doesn't exist, create one
              console.log('📋 Creating new medical professional profile...');
              
              const newProfileData = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'user',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Medical Professional',
                email: session.user.email || '',
                role: (session.user.user_metadata?.role as any) || 'doctor',
                department: session.user.user_metadata?.department || 'General Medicine'
              };

              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfileData)
                .select()
                .single();

              if (createError) {
                console.error('❌ Error creating medical professional profile:', createError);
                set({ 
                  user: null, 
                  session: null, 
                  isAuthenticated: false, 
                  isLoading: false,
                  error: 'Unable to create your medical professional profile. Please contact system administrator.'
                });
                return;
              }

              console.log('✅ Medical professional profile created successfully');
              // Set the profile data to use the newly created profile
              Object.assign(profileData || {}, newProfile);
            } else {
              console.error('❌ Database error fetching profile:', error);
              set({ 
                user: null, 
                session: null, 
                isAuthenticated: false, 
                isLoading: false,
                error: 'Unable to access your medical professional profile. Please try signing in again.'
              });
              return;
            }
          }

          // Create user profile object
          if (profileData) {
            const userProfile: UserProfile = {
              id: profileData.id,
              username: profileData.username,
              role: profileData.role,
              name: profileData.name,
              email: profileData.email,
              department: profileData.department,
              lastLogin: profileData.last_login ? new Date(profileData.last_login) : undefined
            };

            console.log(`✅ Welcome to UHS Clinical System, ${userProfile.name} (${userProfile.role})`);
            console.log(`🏥 Department: ${userProfile.department || 'Not specified'}`);

            set({ 
              user: userProfile, 
              session, 
              isAuthenticated: true, 
              isLoading: false,
              error: null
            });

            // Update last login timestamp in background
            try {
              await supabase
                .from('profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);
              console.log('📊 Last login timestamp updated');
            } catch (err) {
              console.error('⚠️ Error updating last login:', err);
              // Don't fail authentication for this
            }
          } else {
            throw new Error('Profile data is null after creation attempt');
          }
        } catch (error) {
          console.error('❌ Error processing authenticated user:', error);
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Authentication system error. Please try signing in again or contact support.'
          });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ error: null, isLoading: true });
          console.log('🔐 Attempting login to UHS Clinical System:', email);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            console.error('❌ Login failed:', error);
            let errorMessage = 'Login failed. Please check your credentials and try again.';
            
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Invalid email or password. Please verify your medical professional credentials.';
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = 'Please check your email and confirm your account to access the medical system.';
            } else if (error.message.includes('Too many requests')) {
              errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
            }
            
            set({ error: errorMessage, isLoading: false });
            return false;
          }

          console.log('✅ Login successful for medical professional:', data.user?.email);
          // The auth state change listener will handle the rest
          return true;
        } catch (error) {
          console.error('❌ Login system error:', error);
          set({ error: 'Unable to connect to authentication system. Please try again.', isLoading: false });
          return false;
        }
      },

      signup: async (email: string, password: string, userData) => {
        try {
          set({ error: null, isLoading: true });
          console.log('📝 Creating new medical professional account:', email, 'Role:', userData.role);
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: userData.name,
                role: userData.role || 'doctor',
                department: userData.department || 'General Medicine',
                username: email.split('@')[0]
              }
            }
          });

          if (error) {
            console.error('❌ Registration failed:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('already been registered')) {
              errorMessage = 'A medical professional account with this email already exists. Please sign in instead.';
            } else if (error.message.includes('Password should be')) {
              errorMessage = 'Password must be at least 6 characters long for security compliance.';
            }
            
            set({ error: errorMessage, isLoading: false });
            return false;
          }

          console.log('✅ Medical professional account created:', data.user?.email);
          set({ isLoading: false });
          return true;
        } catch (error) {
          console.error('❌ Registration system error:', error);
          set({ error: 'Unable to create account. Please try again or contact system administrator.', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          console.log('👋 Signing out from UHS Clinical System...');
          await supabase.auth.signOut();
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false,
            error: null
          });
          console.log('✅ Successfully signed out');
        } catch (error) {
          console.error('❌ Logout error:', error);
          set({ error: 'Error signing out. Please refresh the page.' });
        }
      }
    }),
    {
      name: 'uhs-clinical-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
