'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toDate } from '../lib/utils';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username: string;
  type: string;
  tier: string;
  verified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
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

export function useUser(userId: string | undefined) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            uid: userDoc.id,
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as UserProfile);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  return { user, loading, error };
}