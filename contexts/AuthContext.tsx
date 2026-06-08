// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  username: string;
  type: string;
  tier: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  followersCount: number;
  followingCount: number;
  pollsCreated: number;
  pollsThisMonth: number;
  phone: string | null;
  location: { country: string | null; city: string | null };
  memberships: Record<string, any>;
  activeAccount: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const defaultUserData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            username: `user_${firebaseUser.uid.slice(0, 8)}`,
            type: 'individual',
            tier: 'free',
            verified: firebaseUser.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            followersCount: 0,
            followingCount: 0,
            pollsCreated: 0,
            pollsThisMonth: 0,
            phone: null,
            location: { country: null, city: null },
            memberships: {},
            activeAccount: 'personal',
          };
          await setDoc(userDocRef, defaultUserData);
          userDoc = await getDoc(userDocRef);
        }
        const data = userDoc.data()!;
        const activeAccount = data.type === 'organization' ? firebaseUser.uid : (data.activeAccount || 'personal');
        const userData: UserData = {
          uid: firebaseUser.uid,
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          type: data.type || 'individual',
          tier: data.tier || 'free',
          verified: data.verified || false,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          pollsCreated: data.pollsCreated || 0,
          pollsThisMonth: data.pollsThisMonth || 0,
          phone: data.phone || null,
          location: data.location || { country: null, city: null },
          memberships: data.memberships || {},
          activeAccount,
          // Spread any additional fields from data (optional)
          ...data,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data()!;
        const activeAccount = data.type === 'organization' ? auth.currentUser.uid : (data.activeAccount || 'personal');
        const userData: UserData = {
          uid: auth.currentUser.uid,
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          type: data.type || 'individual',
          tier: data.tier || 'free',
          verified: data.verified || false,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          pollsCreated: data.pollsCreated || 0,
          pollsThisMonth: data.pollsThisMonth || 0,
          phone: data.phone || null,
          location: data.location || { country: null, city: null },
          memberships: data.memberships || {},
          activeAccount,
          ...data,
        };
        setUser(userData);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};