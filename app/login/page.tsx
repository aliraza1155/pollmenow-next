// app/login/page.tsx
'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const AUTH_ERROR_MSGS: Record<string, string> = {
  'auth/user-not-found':    'No account found with this email.',
  'auth/wrong-password':    'Incorrect password.',
  'auth/invalid-email':     'Invalid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/invalid-credential':'Invalid email or password.',
};

const FEATURES = [
  'AI-generated polls in seconds',
  'Real-time results & live analytics',
  'Target specific demographics',
  '1M+ votes cast on the platform',
];

function AuthLeft() {
  return (
    <div className="hidden lg:flex flex-col justify-center bg-[#08091a] p-10 xl:p-14 text-[#f0f0ff] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1120] via-[#08091a] to-[#0d0a1e]" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-pink-500/6 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/35 rounded-2xl flex items-center justify-center">
            <BarChart3 size={20} className="text-purple-400" />
          </div>
          <span className="text-xl font-extrabold">
            Poll<span className="text-purple-400">Me</span>Now
          </span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-3 text-[#f0f0ff]">
          Welcome back to<br />PollMeNow
        </h2>
        <p className="text-[rgba(240,240,255,0.5)] text-sm xl:text-base mb-10 leading-relaxed">
          Sign in to create polls, track analytics,<br />and engage your audience.
        </p>

        <div className="space-y-3 mb-10">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={12} className="text-purple-400" />
              </div>
              <span className="text-sm text-[rgba(240,240,255,0.7)]">{f}</span>
            </div>
          ))}
        </div>

        {/* Mini poll preview */}
        <div className="bg-[#0f1120] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wide text-[rgba(240,240,255,0.4)]">Live · Trending</span>
          </div>
          <p className="text-sm font-bold mb-4 text-[#f0f0ff]">"Most critical feature for 2026?"</p>
          {[
            { label:'AI Automation',  pct:44, color:'#7c2fff' },
            { label:'Privacy Control',pct:30, color:'#a855f7' },
            { label:'Cross-Platform', pct:26, color:'#e5184c' },
          ].map(bar => (
            <div key={bar.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1 text-[rgba(240,240,255,0.5)]">
                <span>{bar.label}</span>
                <span className="font-bold text-[rgba(240,240,255,0.8)]">{bar.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${bar.pct}%`, backgroundColor:bar.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!cred.user.emailVerified) {
        const queryParams = new URLSearchParams();
        queryParams.set('email', email);
        if (redirect && redirect !== '/') queryParams.set('redirect', redirect);
        router.push(`/verify-email?${queryParams.toString()}`);
        return;
      }
      router.push(redirect);
    } catch (err: any) {
      setError(AUTH_ERROR_MSGS[err.code] || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push(redirect);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed.');
    }
  };

  const inputCls = `w-full px-4 py-3.5 rounded-xl text-sm
    bg-gray-50 dark:bg-white/5
    border border-gray-200 dark:border-white/12
    text-gray-900 dark:text-[#f0f0ff]
    placeholder-gray-400 dark:placeholder-[rgba(240,240,255,0.35)]
    focus:border-purple-500 dark:focus:border-purple-500
    focus:ring-2 focus:ring-purple-500/20
    outline-none transition font-medium`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-[#08091a]">
      <AuthLeft />

      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10 lg:px-12 bg-white dark:bg-[#08091a]">
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-md">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              PollMeNow
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Sign in</h1>
            <p className="text-gray-500 dark:text-[rgba(240,240,255,0.5)] mt-2 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                Create one free →
              </Link>
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3
              border border-gray-200 dark:border-white/12
              bg-white dark:bg-white/4
              hover:bg-gray-50 dark:hover:bg-white/8
              text-gray-700 dark:text-gray-200
              rounded-2xl py-3.5 px-4 text-sm font-semibold transition-all mb-6 min-h-[48px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center my-5">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
            <span className="mx-4 text-xs text-gray-400 dark:text-[rgba(240,240,255,0.35)] font-medium">or continue with email</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-[rgba(240,240,255,0.45)] uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-[rgba(240,240,255,0.45)] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/reset-password" className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-1"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/12 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] text-base"
            >
              {loading
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : <><span>Sign in</span> <ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-[rgba(240,240,255,0.3)] mt-8">
            By signing in you agree to our{' '}
            <Link href="/terms" className="underline hover:text-purple-600 dark:hover:text-purple-400">Terms</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}