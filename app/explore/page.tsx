// app/explore/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { convertOptionsToArray, toDate } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import { getFollowing } from '@/lib/follow';
import {
  Flame, Radio, Gem, Users, Sparkles, SlidersHorizontal,
  X, Lock, ChevronRight, Zap, CheckCircle, Star, Layers, Search,
} from 'lucide-react';

const SECTIONS = [
  { key: 'trending', label: 'Trending', Icon: Flame,    color: '#f59e0b' },
  { key: 'live',     label: 'Live',     Icon: Radio,    color: '#ef4444' },
  { key: 'premium',  label: 'Premium',  Icon: Gem,      color: '#8b5cf6' },
  { key: 'friends',  label: 'Friends',  Icon: Users,    color: '#3b82f6' },
  { key: 'for_you',  label: 'For You',  Icon: Sparkles, color: '#6C5CE7' },
];

const TYPE_FILTERS = [
  { key: 'all',        label: 'All'       },
  { key: 'quick',      label: 'Quick'     },
  { key: 'yesno',      label: 'Yes/No'   },
  { key: 'rating',     label: 'Rating'    },
  { key: 'comparison', label: 'Compare'  },
  { key: 'live',       label: 'Live'      },
];

const TYPE_ICONS = { quick: Zap, yesno: CheckCircle, rating: Star, comparison: Layers, live: Radio };

function processDoc(docSnap: any) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    question:      d.question || '',
    options:       convertOptionsToArray(d.options),
    type:          d.type || 'quick',
    category:      d.category || 'general',
    tags:          d.tags || [],
    totalVotes:    Number(d.totalVotes) || 0,
    totalViews:    Number(d.totalViews) || 0,
    score24h:      Number(d.score24h) || 0,
    visibility:    d.visibility || 'public',
    accessCode:    d.accessCode,
    questionMedia: d.questionMedia,
    createdAt:     toDate(d.createdAt) || new Date(),
    endsAt:        d.endsAt ? toDate(d.endsAt) : undefined,
    averageRating: d.averageRating || 0,
    creator: {
      id:           d.creator?.id || '',
      name:         d.creator?.name || 'Anonymous',
      username:     d.creator?.username,
      verified:     d.creator?.verified || false,
      profileImage: d.creator?.profileImage,
      tier:         d.creator?.tier || 'free',
    },
    meta: {
      isPremium: d.meta?.isPremium || false,
      isLive:    d.meta?.isLive || false,
    },
  };
}

function timeLeft(endsAt?: Date) {
  if (!endsAt) return null;
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0)  return `${h}h ${m}m left`;
  return `${m}m left`;
}

function ExploreCard({ poll }: { poll: any }) {
  const TypeIcon = TYPE_ICONS[poll.type as keyof typeof TYPE_ICONS] || Zap;
  const tLeft    = timeLeft(poll.endsAt);
  const totalV   = poll.totalVotes;
  const top2     = poll.options.slice(0, 2);

  return (
    <article className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden hover:shadow-md dark:hover:shadow-black/40 transition-all duration-200 hover:-translate-y-0.5 flex flex-col group">
      <Link href={`/poll/${poll.id}`} className="block">
        <div className="bg-gray-50 dark:bg-[#161829] p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10">
              <TypeIcon size={11} strokeWidth={2.5} />
              <span>{poll.type}</span>
            </span>
            {tLeft && (
              <span className={`text-xs font-semibold ${poll.meta?.isLive ? 'text-red-500 dark:text-red-400 flex items-center gap-1' : 'text-gray-400 dark:text-gray-500'}`}>
                {poll.meta?.isLive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {tLeft}
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-gray-900 dark:text-[#f0f0ff] leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {poll.question}
          </p>

          <div className="mt-3">
            {poll.type === 'yesno' ? (
              <div className="grid grid-cols-2 gap-1.5">
                {['Yes','No'].map((label, i) => {
                  const opt = poll.options.find((o: any) => o.text === label);
                  const pct = totalV > 0 && opt ? ((opt.votes / totalV) * 100).toFixed(0) : 0;
                  return (
                    <div key={label} className={`text-center py-1.5 px-2 rounded-lg text-xs font-bold ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-500/12 text-red-700 dark:text-red-300'}`}>
                      {label}{totalV > 0 && ` · ${pct}%`}
                    </div>
                  );
                })}
              </div>
            ) : poll.type === 'rating' ? (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className={i <= Math.round(poll.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-white/12'} />
                ))}
                {totalV > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{poll.averageRating.toFixed(1)}</span>}
              </div>
            ) : (poll.type === 'comparison' || poll.type === 'live') && top2.some((o: any) => o.mediaUrl) ? (
              <div className="grid grid-cols-2 gap-1.5">
                {top2.map((opt: any) => (
                  <div key={opt.id} className="rounded-lg overflow-hidden">
                    {opt.mediaUrl
                      ? <img src={opt.mediaUrl} alt={opt.text} className="w-full h-14 object-cover" loading="lazy" />
                      : <div className="h-14 bg-gray-100 dark:bg-white/5 flex items-center justify-center"><Layers size={14} className="text-gray-300 dark:text-white/20" /></div>
                    }
                    <p className="text-[10px] font-medium text-center text-gray-600 dark:text-gray-400 mt-1 truncate">{opt.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {top2.map((opt: any) => {
                  const pct = totalV > 0 ? (opt.votes / totalV) * 100 : 0;
                  return (
                    <div key={opt.id} className="relative h-7 bg-white dark:bg-[#0f1120] rounded-lg border border-gray-100 dark:border-white/8 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-purple-50 dark:bg-purple-500/15 transition-all duration-500" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between px-2 h-full">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{opt.text}</span>
                        {totalV > 0 && <span className="text-xs font-bold text-purple-600 dark:text-purple-400 ml-2 flex-shrink-0">{pct.toFixed(0)}%</span>}
                      </div>
                    </div>
                  );
                })}
                {poll.options.length > 2 && <p className="text-xs text-center text-gray-400 dark:text-gray-500">+{poll.options.length - 2} more</p>}
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 dark:border-white/6">
        <Link href={`/profile/${poll.creator.id}`} className="flex items-center gap-2 min-w-0 flex-1" onClick={e => e.stopPropagation()}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
            {poll.creator.profileImage
              ? <img src={poll.creator.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              : (poll.creator.name?.[0] || 'U').toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
              {poll.creator.name}
              {poll.creator.verified && <span className="text-purple-500 ml-1 text-[10px]">✓</span>}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">{totalV.toLocaleString()}</span>
          <Link href={`/poll/${poll.id}`} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:opacity-90 transition">
            Vote
          </Link>
        </div>
      </div>
    </article>
  );
}

function Sidebar({ activeSection, setActiveSection, selectedCats, toggleCat }: any) {
  return (
    <aside className="space-y-3 sticky top-[76px] self-start">
      <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-3">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2">Browse</p>
        <div className="space-y-0.5">
          {SECTIONS.map(sec => {
            const Icon = sec.Icon;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === sec.key
                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={16} style={{ color: activeSection === sec.key ? undefined : sec.color }} />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-3">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2">Categories</p>
        <div className="space-y-0.5">
          {[{ id: 'all', name: 'All Topics' }, ...CATEGORIES].map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCat(cat.id)}
              className={`flex items-center w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCats.includes(cat.id)
                  ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden">
      <div className="bg-gray-50 dark:bg-[#161829] p-4">
        <div className="flex justify-between mb-3"><div className="h-6 w-20 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" /><div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" /></div>
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/8 animate-pulse mb-2" />
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-white/8 animate-pulse mb-4" />
        <div className="space-y-2"><div className="h-7 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" /><div className="h-7 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" /></div>
      </div>
      <div className="px-4 py-3 flex justify-between"><div className="h-6 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" /><div className="h-6 w-16 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" /></div>
    </div>
  );
}

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [polls, setPolls] = useState({ trending: [], live: [], premium: [], friends: [], for_you: [] });
  const [activeSection, setActiveSection] = useState('trending');
  const [activePollType, setActivePollType] = useState('all');
  const [selectedCats, setSelectedCats] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [initialDone, setInitialDone] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [potd, setPotd] = useState<any>(null);

  const showToast = (msg: string, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Poll of the Day
  useEffect(() => {
    const fetchPotd = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const snap = await getDocs(query(collection(db, 'polls'), where('isPollOfTheDay', '==', true), where('pollOfTheDayDate', '==', today), where('visibility', '==', 'public'), limit(1)));
        if (!snap.empty) setPotd(processDoc(snap.docs[0]));
      } catch {}
    };
    fetchPotd();
  }, []);

  const fetchSection = useCallback(async (section: string) => {
    setSectionLoading(prev => ({ ...prev, [section]: true }));
    try {
      const base = collection(db, 'polls');
      const now = Timestamp.now();
      let q: any;
      switch (section) {
        case 'trending':
          q = query(base, where('visibility', '==', 'public'), where('showInPublicFeed', '==', true), orderBy('totalVotes', 'desc'), limit(20));
          break;
        case 'live':
          q = query(base, where('visibility', '==', 'public'), where('showInPublicFeed', '==', true), where('meta.isLive', '==', true), where('endsAt', '>', now), orderBy('endsAt', 'asc'), limit(15));
          break;
        case 'premium':
          q = query(base, where('visibility', '==', 'public'), where('showInPublicFeed', '==', true), where('meta.isPremium', '==', true), orderBy('createdAt', 'desc'), limit(15));
          break;
        case 'friends': {
          if (!user) { setPolls(prev => ({ ...prev, friends: [] })); return; }
          const ids = await getFollowing(user.uid);
          if (!ids.length) { setPolls(prev => ({ ...prev, friends: [] })); return; }
          q = query(base, where('visibility', 'in', ['public', 'friends']), where('creator.id', 'in', ids.slice(0, 10)), orderBy('createdAt', 'desc'), limit(15));
          break;
        }
        case 'for_you': {
          if (!user) { setPolls(prev => ({ ...prev, for_you: [] })); return; }
          q = query(base, where('visibility', '==', 'public'), where('showInPublicFeed', '==', true), orderBy('score24h', 'desc'), limit(15));
          break;
        }
        default: return;
      }
      const snap = await getDocs(q);
      let results = snap.docs.map(processDoc);
      if (!selectedCats.includes('all')) results = results.filter(p => selectedCats.includes(p.category));
      if (activePollType !== 'all') results = results.filter(p => p.type === activePollType);
      setPolls(prev => ({ ...prev, [section]: results }));
    } catch (err) { console.error(err); }
    finally { setSectionLoading(prev => ({ ...prev, [section]: false })); }
  }, [user, selectedCats, activePollType]);

  useEffect(() => {
    const sections = ['trending', 'live', 'premium', ...(user ? ['friends', 'for_you'] : [])];
    Promise.all(sections.map(s => fetchSection(s))).finally(() => setInitialDone(true));
  }, [fetchSection, user]);

  useEffect(() => {
    if (!initialDone) return;
    const timeout = setTimeout(() => fetchSection(activeSection), 200);
    return () => clearTimeout(timeout);
  }, [selectedCats, activePollType, activeSection, fetchSection, initialDone]);

  const toggleCat = (id: string) => {
    if (id === 'all') { setSelectedCats(['all']); return; }
    setSelectedCats(prev => {
      const without = prev.filter(c => c !== 'all');
      return without.includes(id) ? without.filter(c => c !== id) : [...without, id];
    });
  };

  const handleAccessCode = async () => {
    setAccessError('');
    if (!accessCode.trim()) return;
    try {
      const snap = await getDocs(query(collection(db, 'polls'), where('accessCode', '==', accessCode.trim().toUpperCase()), limit(1)));
      if (!snap.empty) { router.push(`/poll/${snap.docs[0].id}`); setAccessCode(''); }
      else setAccessError('No poll found with this code.');
    } catch { setAccessError('Failed to validate code.'); }
  };

  const currentPolls = polls[activeSection as keyof typeof polls] || [];
  const isLoading = sectionLoading[activeSection] && !initialDone;
  const curSection = SECTIONS.find(s => s.key === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[76px] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className={`rounded-2xl px-4 py-3 shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/25 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 text-red-800 dark:text-red-300'}`}>
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-7">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} selectedCats={selectedCats} toggleCat={toggleCat} />
          </div>

          {/* Main content */}
          <div className="space-y-5">
            {/* Mobile section chips */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {SECTIONS.map(sec => {
                  const Icon = sec.Icon;
                  return (
                    <button
                      key={sec.key}
                      onClick={() => setActiveSection(sec.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                        activeSection === sec.key
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm shadow-purple-500/25'
                          : 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <Icon size={14} style={{ color: activeSection === sec.key ? 'white' : sec.color }} />
                      {sec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Poll of the Day */}
            {potd && (
              <Link href={`/poll/${potd.id}`} className="block bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 rounded-2xl p-4 sm:p-5 text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs font-bold uppercase tracking-wide">
                    <Star size={12} fill="currentColor" />
                    Poll of the Day
                  </div>
                  <ChevronRight size={16} className="text-white/60" />
                </div>
                <h3 className="text-base sm:text-lg font-bold line-clamp-1">{potd.question}</h3>
                <p className="text-white/70 text-sm mt-1">{potd.totalVotes.toLocaleString()} voted globally</p>
              </Link>
            )}

            {/* Access code bar */}
            <div>
              <div className="flex items-center gap-2 bg-white dark:bg-[#0f1120] border border-gray-100 dark:border-white/8 rounded-2xl px-4 py-3 shadow-sm">
                <Lock size={15} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter private poll access code…"
                  value={accessCode}
                  onChange={e => { setAccessCode(e.target.value); setAccessError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAccessCode()}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button onClick={handleAccessCode} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm hover:opacity-90 transition flex-shrink-0">
                  Unlock
                </button>
              </div>
              {accessError && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 px-4">{accessError}</p>}
            </div>

            {/* Section header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {curSection && <curSection.Icon size={20} style={{ color: curSection.color }} />}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">{curSection?.label}</h2>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{currentPolls.length} polls</p>
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${showFilters ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/25' : 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
              >
                {showFilters ? <X size={14} /> : <SlidersHorizontal size={14} />}
                {showFilters ? 'Close' : 'Filter'}
              </button>
            </div>

            {/* Filter chips */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="space-y-3 pb-2">
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {TYPE_FILTERS.map(f => (
                        <button key={f.key} onClick={() => setActivePollType(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 transition-all ${activePollType === f.key ? 'bg-purple-600 text-white border-transparent' : 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {/* Category filter — mobile only */}
                    <div className="lg:hidden flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {[{ id: 'all', name: 'All' }, ...CATEGORIES].map(cat => (
                        <button key={cat.id} onClick={() => toggleCat(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 transition-all ${selectedCats.includes(cat.id) ? 'bg-purple-600 text-white border-transparent' : 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Poll grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : currentPolls.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-300 dark:text-white/20" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-semibold mb-4">No polls here yet</p>
                {(!user && (activeSection === 'friends' || activeSection === 'for_you'))
                  ? <Link href="/login" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow">Sign in to see more</Link>
                  : <Link href="/create" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow">Create the first poll</Link>
                }
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {currentPolls.map((poll: any) => (
                  <motion.div
                    key={poll.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <ExploreCard poll={poll} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}