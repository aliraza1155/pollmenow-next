// app/upgrade-success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UpgradeSuccess() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const upgrade = async () => {
      await refreshUser();
      setTimeout(() => router.push('/dashboard'), 2000);
    };
    upgrade();
  }, [refreshUser, router]);

  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful! 🎉</h1>
      <p>Your account is being upgraded. Redirecting to dashboard...</p>
    </div>
  );
}