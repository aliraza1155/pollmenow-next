'use client';

import { useEffect, useState } from 'react';
import { isFollowing } from '../lib/follow';
import { useAuth } from '../contexts/AuthContext';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user || !targetUserId) {
        setFollowing(false);
        setLoading(false);
        return;
      }
      try {
        const result = await isFollowing(targetUserId, user.uid);
        setFollowing(result);
      } catch (err) {
        console.error('Follow check error:', err);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [targetUserId, user]);

  return { following, loading };
}