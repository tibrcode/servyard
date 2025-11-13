import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, User, signOut as fbSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export type UserRole = 'provider' | 'customer' | 'unknown' | null;

export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone_numbers?: string[];
  city?: string;
  country?: string;
  user_type?: UserRole;
  is_online?: boolean;
  profile_description?: string;
  timezone?: string; // e.g., 'Asia/Dubai', 'America/New_York'
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      // Clean up any previous profile subscription when auth state changes
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(u);

      if (u) {
        // Keep UI in loading state until the profile is resolved
        setLoading(true);

        const profileRef = doc(db, 'profiles', u.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as any;
              setProfile({ id: snap.id, ...data });
            } else {
              setProfile({
                id: u.uid,
                full_name: u.displayName || undefined,
                email: u.email || undefined,
                user_type: 'unknown',
              });
            }
            setLoading(false);
          },
          (e) => {
            console.warn('Failed to subscribe to profile', e);
            setProfile({
              id: u.uid,
              full_name: u.displayName || undefined,
              email: u.email || undefined,
              user_type: 'unknown',
            });
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const role: UserRole = useMemo(() => {
    return (profile?.user_type as UserRole) ?? null;
  }, [profile]);

  const displayName = useMemo(() => {
    if (!user && !profile) return '';
    return (
      profile?.full_name || user?.displayName || user?.email || ''
    );
  }, [user, profile]);

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const value: AuthContextValue = {
    user,
    profile,
    role,
    loading,
    displayName,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
