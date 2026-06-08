// app/verify-email/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || auth.currentUser?.email || '';
  const redirect = searchParams.get('redirect') || null;

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) interval = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setCooldown(60);
      setSent(true);
    } catch {
      alert('Failed to resend verification email. Please try again.');
    } finally { setLoading(false); }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { verified: true });
        if (redirect && redirect !== '/') router.push(redirect);
        else router.push('/dashboard');
      } else {
        alert('Email not verified yet. Please check your inbox and click the link.');
      }
    } catch {
      alert('Failed to check verification status. Please try again.');
    } finally { setChecking(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const emailDomain = email.split('@')[1];
  const mailClientUrl = emailDomain === 'gmail.com'
    ? 'https://mail.google.com'
    : emailDomain === 'outlook.com' || emailDomain === 'hotmail.com'
    ? 'https://outlook.live.com'
    : emailDomain === 'yahoo.com'
    ? 'https://mail.yahoo.com'
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-[#0f1120] rounded-3xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-600 to-purple-400" />
          <div className="p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Mail size={34} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-[#f0f0ff] mb-2">Verify your email</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">We've sent a verification link to</p>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1 break-all">{email}</p>
            </div>

            <div className="bg-gray-50 dark:bg-white/4 rounded-2xl p-4 mb-6 space-y-3">
              {[
                { step: '1', text: 'Open the email we sent you' },
                { step: '2', text: 'Click the verification link' },
                { step: '3', text: 'Come back and tap "I\'ve verified"' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">{item.step}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.text}</p>
                </div>
              ))}
            </div>

            {mailClientUrl && (
              <a
                href={mailClientUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-2xl py-3 text-sm font-bold mb-4 hover:bg-blue-100 dark:hover:bg-blue-500/15 transition"
              >
                <Mail size={15} />
                Open {emailDomain === 'gmail.com' ? 'Gmail' : emailDomain === 'outlook.com' || emailDomain === 'hotmail.com' ? 'Outlook' : 'Yahoo Mail'}
                <ExternalLink size={13} />
              </a>
            )}

            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {checking ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking…</>
              ) : (
                <><CheckCircle size={18} /> I've verified my email</>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-white/12 bg-gray-50 dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-2xl py-3 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/8 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending…' : sent ? 'Resend email' : 'Resend verification email'}
            </button>

            {sent && cooldown > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl px-3 py-2 text-xs font-medium mb-4"
              >
                <CheckCircle size={14} />
                Verification email sent! Check your inbox.
              </motion.div>
            )}

            <div className="border-t border-gray-100 dark:border-white/8 pt-4 text-center space-y-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition mx-auto font-medium"
              >
                <ArrowLeft size={14} />
                Use a different email
              </button>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Didn't receive it? Check spam, or{' '}
                <Link href="/contact" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}