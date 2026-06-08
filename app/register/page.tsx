// app/register/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification,
} from 'firebase/auth';
import {
  doc, setDoc, getDocs, query, collection, where,
  serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { detectLocation } from '@/lib/location';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { motion } from 'framer-motion';
import {
  BarChart3, Eye, EyeOff, CheckCircle, ArrowRight,
  User, Building2, Check, X,
} from 'lucide-react';

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

        <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-3">
          Join PollMeNow
        </h2>
        <p className="text-[rgba(240,240,255,0.5)] text-sm xl:text-base mb-10 leading-relaxed">
          Start creating polls, gather insights,<br />and grow your audience.
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
          <p className="text-sm font-bold mb-4">"Most critical feature for 2026?"</p>
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

// Use `as const` to make the `key` property a literal union type
const CHECK_CONFIG = [
  { key: 'length', label: '8+ characters' },
  { key: 'upper', label: 'Uppercase letter' },
  { key: 'lower', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special character' },
] as const;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || null;

  const [userType,   setUserType]   = useState('individual');
  const [email,      setEmail]      = useState(prefilledEmail);
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [name,       setName]       = useState('');
  const [username,   setUsername]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [age,        setAge]        = useState('');
  const [gender,     setGender]     = useState('');
  const [orgName,    setOrgName]    = useState('');
  const [orgCountry, setOrgCountry] = useState('');
  const [orgCity,    setOrgCity]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername,  setCheckingUsername]  = useState(false);
  const [detectedLocation,  setDetectedLocation]  = useState<any>(null);

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });
  const [pwFocused, setPwFocused] = useState(false);

  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (username.length < 3) { setUsernameAvailable(null); return; }
      setCheckingUsername(true);
      try {
        const snap = await getDocs(query(collection(db,'users'), where('username','==',username.toLowerCase())));
        setUsernameAvailable(snap.empty);
      } catch { setUsernameAvailable(false); }
      finally { setCheckingUsername(false); }
    }, 500);
    return () => clearTimeout(delay);
  }, [username]);

  useEffect(() => {
    detectLocation().then(loc => setDetectedLocation(loc));
  }, []);

  const validateAge = (v: string) => {
    if (!v) return true;
    const n = parseInt(v, 10);
    return !isNaN(n) && n >= 13 && n <= 120;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (usernameAvailable !== true) { setError('Username not available'); return; }
    if (userType === 'individual' && !name.trim()) { setError('Full name is required'); return; }
    if (userType === 'organization' && !orgName.trim()) { setError('Organization name is required'); return; }
    if (userType === 'individual' && phone && !parsePhoneNumberFromString(phone)?.isValid()) {
      setError('Please enter a valid phone number with country code'); return;
    }
    if (userType === 'individual' && !validateAge(age)) {
      setError('Please enter a valid age (13–120)'); return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const displayName = userType === 'individual' ? name : orgName;
      await updateProfile(user, { displayName });

      const loc = detectedLocation || { country:null, city:null };
      const userData: any = {
        uid:user.uid, name:displayName, email, username:username.toLowerCase(),
        type:userType, tier:'free', verified:false,
        createdAt:serverTimestamp(), updatedAt:serverTimestamp(),
        followersCount:0, followingCount:0, pollsCreated:0, pollsThisMonth:0,
        phone:phone||null,
        location:{ country:loc.country||null, city:userType==='individual'?null:orgCity },
        memberships:{}, activeAccount:'personal',
      };

      if (userType === 'individual') {
        if (age) userData.age = parseInt(age, 10);
        if (gender) userData.gender = gender;
      } else {
        userData.organization = { name:orgName, size:null, industry:null, tagline:null, verified:false };
        userData.location.country = orgCountry;
        userData.location.city    = orgCity;
      }
      await setDoc(doc(db,'users',user.uid), userData);

      if (userType === 'organization') {
        await setDoc(doc(db,'organizations',user.uid), {
          name:orgName, ownerId:user.uid, createdAt:serverTimestamp(),
          settings:{ allowMemberInvites:true, defaultRole:'member' },
        });
        await updateDoc(doc(db,'users',user.uid), {
          [`memberships.${user.uid}`]:{ role:'owner', name:orgName, joinedAt:serverTimestamp() },
          activeAccount:user.uid,
        });
      }

      await sendEmailVerification(user);
      const queryParams = new URLSearchParams();
      queryParams.set('email', email);
      if (redirect) queryParams.set('redirect', redirect);
      router.push(`/verify-email?${queryParams.toString()}`);
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use':'Email already in use',
        'auth/invalid-email':'Invalid email address',
        'auth/weak-password':'Password is too weak',
      };
      setError(msgs[err.code] || err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const inputCls = `w-full px-4 py-3.5 rounded-xl text-sm
    bg-gray-50 dark:bg-white/5
    border border-gray-200 dark:border-white/12
    text-gray-900 dark:text-[#f0f0ff]
    placeholder-gray-400 dark:placeholder-[rgba(240,240,255,0.35)]
    focus:border-purple-500 dark:focus:border-purple-500
    focus:ring-2 focus:ring-purple-500/20
    outline-none transition font-medium`;

  const labelCls = 'block text-xs font-bold text-gray-500 dark:text-[rgba(240,240,255,0.45)] uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-[#08091a]">
      <AuthLeft />

      <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-8 py-8 lg:px-12 bg-white dark:bg-[#08091a] overflow-y-auto">
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4 }}
          className="w-full max-w-md py-2"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-md">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              PollMeNow
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Create account</h1>
            <p className="text-gray-500 dark:text-[rgba(240,240,255,0.5)] mt-2 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Sign in →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Account type toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
              {[
                { val:'individual',    label:'Individual',    Icon:User      },
                { val:'organization',  label:'Organization',  Icon:Building2 },
              ].map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setUserType(t.val)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    userType === t.val
                      ? 'bg-white dark:bg-[#0f1120] text-purple-600 dark:text-purple-400 shadow-sm border border-gray-100 dark:border-white/10'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <t.Icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" autoComplete="email" required />
            </div>

            {/* Username */}
            <div>
              <label className={labelCls}>Username *</label>
              <div className="relative">
                <input
                  value={username}
                  onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
                  className={`${inputCls} pr-10 ${usernameAvailable===false?'border-red-400 dark:border-red-400/60':usernameAvailable===true?'border-emerald-400 dark:border-emerald-400/60':''}`}
                  placeholder="your_username"
                  autoComplete="username"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-purple-500 rounded-full animate-spin" />}
                  {!checkingUsername && usernameAvailable === true  && <Check size={16} className="text-emerald-500" />}
                  {!checkingUsername && usernameAvailable === false && <X size={16} className="text-red-500" />}
                </div>
              </div>
              {username.length >= 3 && (
                <p className={`text-xs mt-1 font-medium ${usernameAvailable===true?'text-emerald-600 dark:text-emerald-400':usernameAvailable===false?'text-red-500 dark:text-red-400':'text-gray-400'}`}>
                  {checkingUsername?'Checking…':usernameAvailable===true?'Username available!':usernameAvailable===false?'Username taken':''}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setPwFocused(true)}
                  onBlur={()=>setPwFocused(false)}
                  className={`${inputCls} pr-12`}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              {(pwFocused || password.length > 0) && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {CHECK_CONFIG.map(c => (
                    <div key={c.key} className={`flex items-center gap-1.5 text-xs font-medium ${passwordChecks[c.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {passwordChecks[c.key]
                        ? <Check size={12} className="flex-shrink-0" />
                        : <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                      }
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phone (individual only) */}
            {userType === 'individual' && (
              <div>
                <label className={labelCls}>Phone <span className="text-gray-400 dark:text-gray-500 normal-case font-normal tracking-normal">(optional)</span></label>
                <input type="tel" placeholder="+1 234 567 8900" value={phone} onChange={e=>setPhone(e.target.value)} className={inputCls} />
              </div>
            )}

            {/* Individual fields */}
            {userType === 'individual' && (
              <>
                <div>
                  <label className={labelCls}>Full name *</label>
                  <input value={name} onChange={e=>setName(e.target.value)} className={inputCls} placeholder="Your full name" autoComplete="name" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Age</label>
                    <input type="number" value={age} onChange={e=>setAge(e.target.value)} min="13" max="120" className={inputCls} placeholder="25" />
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={gender} onChange={e=>setGender(e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                {detectedLocation?.country && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                    <Check size={12} /> Location detected: {detectedLocation.country}
                  </p>
                )}
              </>
            )}

            {/* Organization fields */}
            {userType === 'organization' && (
              <>
                <div>
                  <label className={labelCls}>Organization name *</label>
                  <input value={orgName} onChange={e=>setOrgName(e.target.value)} className={inputCls} placeholder="Acme Corporation" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Country *</label>
                    <input value={orgCountry} onChange={e=>setOrgCountry(e.target.value)} className={inputCls} placeholder="United States" required />
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <input value={orgCity} onChange={e=>setOrgCity(e.target.value)} className={inputCls} placeholder="New York" required />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-500/12 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 font-medium flex items-start gap-2">
                <X size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allChecksPassed || usernameAvailable !== true}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-4 rounded-xl hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base min-h-[56px]"
            >
              {loading
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account…</>
                : <><span>Create account</span> <ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-[rgba(240,240,255,0.3)] mt-6">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-purple-600 dark:hover:text-purple-400">Terms</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}