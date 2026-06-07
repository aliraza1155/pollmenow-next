// app/search/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { useDebounce } from '@/hooks/useDebounce';
import { VerifiedBadge, PremiumBadge } from '@/components/UI';
import {
  Search, X, Users, BarChart2, TrendingUp,
  Zap, CheckCircle, Star, Layers, Radio, ChevronRight,
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = { quick:Zap, yesno:CheckCircle, rating:Star, comparison:Layers, live:Radio };
const TRENDING_TAGS = ['remote work','AI tools','sports','technology','politics','food','gaming','movies'];
const POLLS_PER_PAGE = 20;

function extractKeywords(text: string) {
  return text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
}

function PollResult({ poll }: { poll: any }) {
  const TypeIcon = TYPE_ICONS[poll.type] || BarChart2;
  return (
    <Link
      href={`/poll/${poll.id}`}
      className="block bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 hover:shadow-md dark:hover:shadow-black/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
          <TypeIcon size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm sm:text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
            {poll.question}
          </p>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1"><Users size={11} />{(poll.totalVotes||0).toLocaleString()} votes</span>
            <span>by {poll.creator?.name||'Anonymous'}</span>
            {poll.category && <span className="text-purple-500 dark:text-purple-400">#{poll.category}</span>}
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition">
            Vote <ChevronRight size={12} />
          </span>
          <ChevronRight size={16} className="sm:hidden text-gray-300 dark:text-white/20" />
        </div>
      </div>
    </Link>
  );
}

function UserResult({ user: u }: { user: any }) {
  return (
    <Link
      href={`/profile/${u.uid}`}
      className="flex items-center gap-3 p-3.5 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 hover:shadow-md dark:hover:shadow-black/30 transition-all group"
    >
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden shadow-sm">
        {u.profileImage
          ? <img src={u.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
          : (u.name?.[0]||'U').toUpperCase()
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
            {u.name||'Anonymous'}
          </p>
          {u.verified && <VerifiedBadge size={14} />}
          {u.tier==='premium' && <PremiumBadge size={14} />}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">@{u.username}</p>
        <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          <span>{u.followersCount||0} followers</span>
          <span>{u.pollsCreated||0} polls</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-white/20 flex-shrink-0" />
    </Link>
  );
}

function ResultSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/6 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-white/6 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-white/6 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [term, setTerm] = useState('');
  const [polls, setPolls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [pollLastDoc, setPollLastDoc] = useState<any>(null);
  const [hasMorePolls, setHasMorePolls] = useState(true);
  const [pollLoadingMore, setPollLoadingMore] = useState(false);
  const debounced = useDebounce(term, 450);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPolls([]); setPollLastDoc(null); setHasMorePolls(true); setUsers([]);
  }, [debounced]);

  const searchPolls = useCallback(async (loadMore = false) => {
    if (!debounced.trim()) return;
    if (loadMore && (!hasMorePolls || pollLoadingMore)) return;
    if (loadMore) setPollLoadingMore(true); else setLoading(true);
    try {
      const keywords = extractKeywords(debounced).slice(0,10);
      if (!keywords.length) { setPolls([]); setHasMorePolls(false); return; }
      let q = query(
        collection(db, 'polls'),
        where('visibility','==','public'),
        where('searchKeywords','array-contains-any',keywords),
        orderBy('totalVotes','desc'),
        limit(POLLS_PER_PAGE)
      );
      if (loadMore && pollLastDoc) q = query(q, startAfter(pollLastDoc));
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      if (loadMore) setPolls(prev => [...prev, ...results]);
      else setPolls(results);
      setPollLastDoc(snap.docs[snap.docs.length-1]);
      setHasMorePolls(snap.docs.length === POLLS_PER_PAGE);
    } catch (err) { console.error(err); }
    finally {
      if (loadMore) setPollLoadingMore(false);
      else setLoading(false);
    }
  }, [debounced, pollLastDoc, hasMorePolls, pollLoadingMore]);

  useEffect(() => {
    if (debounced.trim()) searchPolls(false);
    else { setPolls([]); setUsers([]); }
  }, [debounced]);

  useEffect(() => {
    if (!debounced.trim()) { setUsers([]); return; }
    const searchUsers = async () => {
      try {
        const lower = debounced.toLowerCase();
        let snap = await getDocs(query(collection(db,'users'), where('username','>=',lower), where('username','<=',lower+'\uf8ff'), limit(20)));
        let results = snap.docs.map(d => ({ uid:d.id, ...d.data() }));
        if (results.length < 20) {
          const nameSnap = await getDocs(query(collection(db,'users'), where('name','>=',lower), where('name','<=',lower+'\uf8ff'), limit(20-results.length)));
          const nameUsers = nameSnap.docs.map(d => ({ uid:d.id, ...d.data() }));
          results = [...results, ...nameUsers].filter((v,i,a)=>a.findIndex(t=>t.uid===v.uid)===i);
        }
        setUsers(results);
      } catch (err) { console.error(err); }
    };
    searchUsers();
  }, [debounced]);

  useEffect(() => {
    if (!hasMorePolls || !debounced.trim() || loading || pollLoadingMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePolls && !pollLoadingMore && !loading) searchPolls(true);
    }, { threshold:0.5 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMorePolls, debounced, loading, pollLoadingMore, searchPolls]);

  const shownPolls = tab === 'people' ? [] : polls;
  const shownUsers = tab === 'polls'  ? [] : users;
  const hasResults = shownPolls.length > 0 || shownUsers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-10">

        {/* Hero */}
        <div className="text-center mb-7">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-[#f0f0ff] mb-2">
            Search polls &amp; people
          </h1>
          <p className="text-gray-500 dark:text-[rgba(240,240,255,0.5)] text-sm sm:text-base">
            Find polls by keyword, topic, or creator.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <div className="flex items-center bg-white dark:bg-[#0f1120] border border-gray-200 dark:border-white/12 rounded-2xl shadow-sm focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:ring-2 focus:within:ring-purple-500/20 transition-all overflow-hidden">
            <div className="pl-4 flex-shrink-0">
              <Search size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="Search polls, people, topics…"
              className="flex-1 py-4 px-3 bg-transparent text-gray-800 dark:text-[#f0f0ff] placeholder-gray-400 dark:placeholder-[rgba(240,240,255,0.38)] outline-none text-sm sm:text-base font-medium"
              autoFocus
            />
            {term && (
              <button onClick={() => { setTerm(''); inputRef.current?.focus(); }} className="pr-4 flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Trending tags */}
        {!debounced && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="space-y-3 mb-6">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={12} /> Trending searches
            </p>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTerm(tag)}
                  className="px-3.5 py-2 text-xs font-semibold
                    bg-white dark:bg-[#0f1120]
                    border border-gray-200 dark:border-white/10
                    rounded-full text-gray-600 dark:text-gray-400
                    hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400
                    transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {loading && polls.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_,i) => <ResultSkeleton key={i} />)}
          </div>
        ) : debounced ? (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/10 mb-5">
              {[
                { key:'all',    label:`All (${polls.length+users.length})` },
                { key:'polls',  label:`Polls (${polls.length})`            },
                { key:'people', label:`People (${users.length})`           },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${tab===t.key ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* People section */}
            {shownUsers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Users size={15} className="text-purple-500" /> People
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {shownUsers.map(u => <UserResult key={u.uid} user={u} />)}
                </div>
              </div>
            )}

            {/* Polls section */}
            {shownPolls.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <BarChart2 size={15} className="text-purple-500" /> Polls
                </h2>
                <div className="space-y-2.5">
                  {shownPolls.map(poll => <PollResult key={poll.id} poll={poll} />)}
                </div>
                {hasMorePolls && (
                  <div ref={loadMoreRef} className="flex justify-center py-5">
                    {pollLoadingMore && <div className="w-6 h-6 border-2 border-gray-200 dark:border-white/15 border-t-purple-600 rounded-full animate-spin" />}
                  </div>
                )}
                {!hasMorePolls && polls.length > 0 && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium mt-4">All results loaded</p>
                )}
              </div>
            )}

            {/* Empty state */}
            {!hasResults && !loading && (
              <div className="text-center py-14 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
                <Search size={36} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
                <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">No results for "{debounced}"</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-14">
            <Search size={40} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Start typing to search</p>
          </div>
        )}
      </div>
    </div>
  );
}