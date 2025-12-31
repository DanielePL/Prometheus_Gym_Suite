import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Gym, StaffRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  gym: Gym | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, gymName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// DEV MODE - bypass auth for development
const DEV_MODE = true;

const MOCK_GYM: Gym = {
  id: 'dev-gym-001',
  name: 'Prometheus Gym',
  email: 'info@prometheusgym.com',
  phone: '+41 79 123 45 67',
  address: 'Zürich, Switzerland',
  logo_url: null,
  timezone: 'Europe/Zurich',
  currency: 'CHF',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_PROFILE: Profile = {
  id: 'dev-user-001',
  gym_id: 'dev-gym-001',
  email: 'dev@prometheus.gym',
  full_name: 'Dev User',
  avatar_url: null,
  role: 'owner',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? { id: 'dev-user-001', email: 'dev@prometheus.gym' } as User : null);
  const [session, setSession] = useState<Session | null>(DEV_MODE ? {} as Session : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null);
  const [gym, setGym] = useState<Gym | null>(DEV_MODE ? MOCK_GYM : null);
  const [loading, setLoading] = useState(DEV_MODE ? false : true);

  useEffect(() => {
    // Skip auth in dev mode
    if (DEV_MODE) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setGym(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData);

        // Fetch gym if profile has gym_id
        if (profileData.gym_id) {
          const { data: gymData, error: gymError } = await supabase
            .from('gyms')
            .select('*')
            .eq('id', profileData.gym_id)
            .single();

          if (gymError) {
            console.error('Error fetching gym:', gymError);
          } else {
            setGym(gymData);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    gymName?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          gym_name: gymName,
        },
      },
    });

    if (!error && data.user) {
      // Create gym if gymName provided (new gym owner)
      if (gymName) {
        const { data: gymData, error: gymError } = await supabase
          .from('gyms')
          .insert({ name: gymName })
          .select()
          .single();

        if (gymError) {
          console.error('Error creating gym:', gymError);
        } else if (gymData) {
          // Create profile with gym association
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            gym_id: gymData.id,
            role: 'owner' as StaffRole,
          });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
      } else {
        // Create basic profile without gym
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: 'coach' as StaffRole,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setGym(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    gym,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
