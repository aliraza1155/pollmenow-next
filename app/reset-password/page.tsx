'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600 mb-6">We sent a password reset link to <strong>{email}</strong>.</p>
          <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset password</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a link to reset your password.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}