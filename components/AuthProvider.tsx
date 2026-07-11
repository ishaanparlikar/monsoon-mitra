'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Family, FamilyMember } from '@/types/database';

interface AuthContextType {
  profile: Profile | null;
  family: Family | null;
  members: FamilyMember[];
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      const { data: memberData } = await (supabase as any)
        .from('family_members')
        .select('*, profiles(*)')
        .eq('profile_id', user.id)
        .single();

      if (memberData?.family_id) {
        const { data: familyData } = await (supabase as any)
          .from('families')
          .select('*')
          .eq('id', memberData.family_id)
          .single();

        if (familyData) {
          setFamily(familyData);

          const { data: membersData } = await (supabase as any)
            .from('family_members')
            .select('*, profiles(*)')
            .eq('family_id', familyData.id);

          setMembers(membersData || []);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setFamily(null);
    setMembers([]);
  };

  const refreshProfile = fetchProfile;

  return (
    <AuthContext.Provider value={{ profile, family, members, loading, signInWithPhone, verifyOTP, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}