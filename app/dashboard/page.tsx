// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { getUserVotes } from '@/lib/vote';
import { getMonthlyPollLimit, hasPremiumAnalytics } from '@/lib/tierUtils';
import { getPollAnalytics } from '@/lib/analytics';
import { formatDate, toDate } from '@/lib/utils';
import { canEditPoll, canCreatePoll, canViewAdvancedAnalytics } from '@/lib/permissions';
import {
  BarChart2, CheckCircle, Zap, Star, Layers, Radio,
  PlusCircle, Pencil, Trash2, TrendingUp, Users,
  Eye, ArrowUpRight, LayoutDashboard, ChevronRight,
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = { quick: Zap, yesno: CheckCircle, rating: Star, comparison: Layers, live: Radio };

function StatCard({ icon: Icon, iconColor = '#6C5CE7', value, label, sub, subGreen }: any) {
  return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 flex flex-col gap-1.5 shadow-sm">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-0.5" style={{ background: `${iconColor}18` }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <p className="text-2xl font-extrabold" style={{ color: iconColor }}>{value}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{label}</p>
      {sub && <p className={`text-xs ${subGreen ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{sub}</p>}
    </div>
  );
}

function SimpleBarChart({ data, xKey, yKey }: any) {
  if (!data?.length) return <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">Not enough data yet</p>;
  const max = Math.max(...data.map((d: any) => d[yKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((item: any, i: number) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">{item[xKey]}</span>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{item[yKey]}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all" style={{ width: `${(item[yKey] / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const pillBase   = 'px-3 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap';
const pillActive = 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent shadow-sm';
const pillIdle   = 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/40';

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeAccount, organizations } = useAccount();
  const router = useRouter();

  const [myPolls, setMyPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('polls');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [filter, setFilter] = useState('all');
  const [orgInfo, setOrgInfo] = useState<any>(null);

  const [allPolls, setAllPolls] = useState<any[]>([]);
  const [pollsAnalytics, setPollsAnalytics] = useState<Record<string, any>>({});
  const [analyticsOverview, setAnalyticsOverview] = useState({ totalPolls: 0, totalVotes: 0, totalViews: 0, totalShares: 0 });
  const [filterStatus, setFilterStatus] = useState('all');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [audienceProfile, setAudienceProfile] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (activeAccount && activeAccount !== 'personal') {
      const unsub = onSnapshot(doc(db, 'organizations', activeAccount), snap => { setOrgInfo(snap.exists() ? snap.data() : null); });
      return () => unsub();
    } else { setOrgInfo(null); }
  }, [activeAccount]);

  // ✅ Remove unused activeOrg variable
  // const activeOrg = activeAccount && activeAccount !== 'personal' ? organizations.find(o => o.id === activeAccount) : null;

  // ✅ Simplified: canCreatePoll now accepts string | null
  const canCreate = canCreatePoll(user, activeAccount, activeAccount && activeAccount !== 'personal' ? activeAccount : null);
  const currentOrgRole = activeAccount && activeAccount !== 'personal' ? user?.memberships?.[activeAccount]?.role : null;
  const canViewAdvanced = canViewAdvancedAnalytics(currentOrgRole) && hasPremiumAnalytics(user?.tier || 'free');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const pollsQ = activeAccount === 'personal'
      ? query(collection(db, 'polls'), where('creator.id', '==', user.uid))
      : activeAccount ? query(collection(db, 'polls'), where('context.type', '==', 'organization'), where('context.orgId', '==', activeAccount)) : query(collection(db, 'polls'), where('creator.id', '==', user.uid));

    const unsub = onSnapshot(pollsQ, snap => {
      setMyPolls(snap.docs.map(d => ({
        id: d.id,
        question: d.data().question || '',
        type: d.data().type || 'quick',
        totalVotes: d.data().totalVotes || 0,
        visibility: d.data().visibility || 'public',
        createdAt: d.data().createdAt ? toDate(d.data().createdAt) : new Date(),
        endsAt: d.data().endsAt ? toDate(d.data().endsAt) : null,
        meta: d.data().meta || {},
        accessCode: d.data().accessCode,
        context: d.data().context || { type: 'personal' },
      })));
      setLoading(false);
    });
    return () => unsub();
  }, [user, activeAccount]);

  useEffect(() => {
    if (!user) return;
    getUserVotes(user.uid).then(setVotes).catch(() => setVotes([]));
  }, [user]);

  useEffect(() => {
    if (!user || tab !== 'analytics') return;
    const load = async () => {
      setLoadingAnalytics(true);
      try {
        const snap = await getDocs(
          activeAccount === 'personal'
            ? query(collection(db, 'polls'), where('creator.id', '==', user.uid))
            : activeAccount ? query(collection(db, 'polls'), where('context.type', '==', 'organization'), where('context.orgId', '==', activeAccount)) : query(collection(db, 'polls'), where('creator.id', '==', user.uid))
        );
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllPolls(list);
        const map: Record<string, any> = {};
        let tv = 0, tvw = 0, ts = 0;
        for (const poll of list) {
          const a = await getPollAnalytics(poll.id, user.tier || 'free', user.uid);
          if (a) { map[poll.id] = a; tv += a.totalVotes || 0; tvw += a.totalViews || 0; ts += a.shares || 0; }
        }
        setPollsAnalytics(map);
        setAnalyticsOverview({ totalPolls: list.length, totalVotes: tv, totalViews: tvw, totalShares: ts });
        if (canViewAdvanced) {
          const daily: Record<string, number> = {};
          for (const p of list) {
            const a = map[p.id];
            if (a?.votesByDay) {
              for (const [day, v] of Object.entries(a.votesByDay)) {
                const voteCount = typeof v === 'number' ? v : Number(v);
                daily[day] = (daily[day] || 0) + voteCount;
              }
            }
          }
          setTrendData(Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([day, votes]) => ({ day: day.slice(5), votes })));
        }
      } catch (err) { console.error(err); }
      finally { setLoadingAnalytics(false); }
    };
    load();
  }, [user, tab, activeAccount, canViewAdvanced]);

  const handleDelete = async (pollId: string, poll: any) => {
    if (!canEditPoll(user, poll)) { showToast('error', 'No permission.'); return; }
    if (!window.confirm('Delete this poll permanently?')) return;
    setDeleting(pollId);
    try { await deleteDoc(doc(db, 'polls', pollId)); showToast('success', 'Poll deleted.'); }
    catch { showToast('error', 'Delete failed.'); }
    finally { setDeleting(null); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800 dark:text-[#f0f0ff] mb-4">Please sign in</p>
        <Link href="/login" className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl px-6 py-3 font-bold shadow-lg">Sign in</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="w-10 h-10 border-2 border-gray-200 dark:border-white/10 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  const totalVotesReceived = myPolls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const limit = getMonthlyPollLimit(user.tier || 'free');
  const used = user.pollsThisMonth || 0;
  const left = activeAccount !== 'personal' ? '∞' : (limit === Infinity ? Infinity : Math.max(0, limit - used));
  const usagePct = (activeAccount !== 'personal' || limit === Infinity) ? 10 : Math.min(100, (used / limit) * 100);

  const filteredPolls = myPolls.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return !p.endsAt || new Date(p.endsAt) > new Date();
    if (filter === 'ended') return p.endsAt && new Date(p.endsAt) <= new Date();
    return true;
  });

  const filteredAnalyticsPolls = allPolls.filter(poll => {
    const active = !poll.endsAt || new Date(poll.endsAt) > new Date();
    const live = poll.meta?.isLive === true;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return active && !live;
    if (filterStatus === 'expired') return !active && !live;
    if (filterStatus === 'live') return live;
    return true;
  });

  const tabs = [
    { key: 'polls', label: `Polls (${myPolls.length})`, icon: BarChart2 },
    { key: 'votes', label: `Votes (${votes.length})`, icon: CheckCircle },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const entityName = activeAccount === 'personal' ? user.name?.split(' ')[0] || 'User' : orgInfo?.name?.split(' ')[0] || 'Team';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className={`rounded-2xl px-4 py-3 shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/25 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 text-red-800 dark:text-red-300'}`}>
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Welcome back, {entityName}!{activeAccount !== 'personal' && orgInfo && <span className="text-purple-600 dark:text-purple-400 font-semibold ml-1">· {orgInfo.name}</span>}
            </p>
          </div>
          {canCreate && (
            <Link href="/create" className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:opacity-90 transition">
              <PlusCircle size={16} /> Create Poll
            </Link>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-7">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 mb-4 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 mx-auto flex items-center justify-center text-white text-2xl font-extrabold overflow-hidden mb-3">
                {(activeAccount === 'personal' ? user.profileImage : orgInfo?.logo)
                  ? <img src={activeAccount === 'personal' ? user.profileImage : orgInfo?.logo} alt="" className="w-full h-full object-cover" />
                  : (activeAccount === 'personal' ? (user.name?.[0] || 'U') : (orgInfo?.name?.[0] || 'O')).toUpperCase()
                }
              </div>
              <p className="font-bold text-gray-800 dark:text-gray-100">{activeAccount === 'personal' ? user.name : orgInfo?.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{activeAccount === 'personal' ? `@${user.username || 'user'}` : 'Organization'}</p>
              {activeAccount === 'personal' && <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white capitalize">{user.tier || 'free'}</span>}
            </div>

            <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-2 mb-4 shadow-sm">
              {tabs.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setTab(item.key)} className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 last:mb-0 ${tab === item.key ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
              <div className="border-t border-gray-100 dark:border-white/7 mt-2 pt-2">
                <Link href={`/profile/${user.uid}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                  <Users size={16} /> View Profile
                </Link>
                <Link href="/upgrade" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10">
                  <Zap size={16} /> Upgrade
                </Link>
              </div>
            </div>

            {activeAccount === 'personal' && (
              <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Monthly usage</p>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>{used} polls used</span>
                  <span>{limit === Infinity ? '∞' : limit} total</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, background: usagePct >= 90 ? '#ef4444' : 'linear-gradient(90deg,#6C5CE7,#a855f7)' }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {left === '∞' || left === Infinity ? 'Unlimited' : `${left} remaining`}
                  {user.tier === 'free' && <Link href="/upgrade" className="text-purple-600 dark:text-purple-400 font-bold ml-1">· Upgrade</Link>}
                </p>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div>
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
              {tabs.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setTab(item.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${tab === item.key ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm' : 'bg-white dark:bg-[#0f1120] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                    <Icon size={14} /> {item.label}
                  </button>
                );
              })}
            </div>

            {tab !== 'analytics' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard icon={BarChart2}   iconColor="#6C5CE7" value={myPolls.length}                 label="Polls created"  sub={activeAccount === 'personal' ? 'By you' : 'In org'} />
                <StatCard icon={Users}       iconColor="#a855f7" value={totalVotesReceived.toLocaleString()} label="Votes received" />
                <StatCard icon={CheckCircle} iconColor="#22c55e" value={votes.length}                   label="Votes cast"     />
                <StatCard icon={Zap}         iconColor={left !== '∞' && left !== Infinity && left <= 1 ? '#ef4444' : '#f59e0b'} value={left === '∞' || left === Infinity ? '∞' : left} label="Polls left" sub={activeAccount === 'personal' ? 'This month' : 'Unlimited'} subGreen={left === '∞' || left === Infinity || (typeof left === 'number' && left > 3)} />
              </div>
            )}

            {tab === 'polls' && (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {['all','active','ended'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`${pillBase} ${filter === f ? pillActive : pillIdle}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredPolls.length === 0 ? (
                  <div className="text-center py-14 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
                    <BarChart2 size={36} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
                    <p className="font-semibold text-gray-500 dark:text-gray-400 mb-4">No polls yet</p>
                    {canCreate && <Link href="/create" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow">Create your first poll</Link>}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPolls.map(poll => {
                      const isActive = !poll.endsAt || new Date(poll.endsAt) > new Date();
                      const canDelete = canEditPoll(user, poll);
                      const TypeIcon = TYPE_ICONS[poll.type] || BarChart2;
                      return (
                        <div key={poll.id} className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <TypeIcon size={18} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/poll/${poll.id}`} className="font-bold text-gray-800 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition line-clamp-1 text-sm sm:text-base">{poll.question}</Link>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                              <span>{formatDate(poll.createdAt)}</span>·<span>{poll.totalVotes.toLocaleString()} votes</span>·<span className={isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>{isActive ? 'Active' : 'Ended'}</span>{poll.meta?.isLive && <span className="text-red-500 font-bold">· Live</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {canDelete && <Link href={`/create?edit=${poll.id}`} className="w-8 h-8 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"><Pencil size={14} /></Link>}
                            {canDelete && <button onClick={() => handleDelete(poll.id, poll)} disabled={deleting === poll.id} className="w-8 h-8 rounded-xl border border-red-100 dark:border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50">{deleting === poll.id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === 'votes' && (
              votes.length === 0 ? (
                <div className="text-center py-14 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
                  <CheckCircle size={36} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
                  <p className="font-semibold text-gray-500 dark:text-gray-400 mb-4">You haven't voted yet</p>
                  <Link href="/explore" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow">Browse polls</Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {votes.slice(0, 20).map(vote => (
                    <div key={vote.id} className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-3.5 flex items-center justify-between gap-3 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">Poll: <span className="text-gray-500 dark:text-gray-400 font-normal">{vote.pollId}</span></p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Option: <span className="text-purple-600 dark:text-purple-400 font-semibold">{vote.optionId}</span></p>
                      </div>
                      <Link href={`/poll/${vote.pollId}`} className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl flex-shrink-0 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition">
                        View <ChevronRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'analytics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={BarChart2} iconColor="#6C5CE7" value={analyticsOverview.totalPolls} label="Total Polls" />
                  <StatCard icon={Users} iconColor="#a855f7" value={analyticsOverview.totalVotes.toLocaleString()} label="Total Votes" />
                  <StatCard icon={Eye} iconColor="#3b82f6" value={analyticsOverview.totalViews.toLocaleString()} label="Total Views" />
                  <StatCard icon={ArrowUpRight} iconColor="#22c55e" value={analyticsOverview.totalShares.toLocaleString()} label="Shares" />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {['all','active','expired','live'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`${pillBase} ${filterStatus === s ? pillActive : pillIdle}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-[#161829]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Poll</th>
                          <th>Rate</th>
                          <th>Votes</th>
                          <th>Views</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingAnalytics ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">Loading analytics…</td></tr>
                        ) : filteredAnalyticsPolls.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No polls found</td></tr>
                        ) : (
                          filteredAnalyticsPolls.map(poll => {
                            const a = pollsAnalytics[poll.id];
                            const voteRate = a?.totalViews ? ((a.totalVotes / a.totalViews) * 100).toFixed(1) : 0;
                            return (
                              <tr key={poll.id} className="border-t border-gray-100 dark:border-white/6 hover:bg-gray-50 dark:hover:bg-white/3 transition">
                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{poll.question}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{voteRate}%</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a?.totalVotes || 0}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a?.totalViews || 0}</td>
                                <td className="px-4 py-3">
                                  <Link href={`/poll/analytics/${poll.id}`} className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition whitespace-nowrap">
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {canViewAdvanced && trendData.length > 0 && (
                  <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm">Engagement Trend</h3>
                    <SimpleBarChart data={trendData} xKey="day" yKey="votes" />
                  </div>
                )}

                {!hasPremiumAnalytics(user?.tier || 'free') && (
                  <div className="bg-gradient-to-br from-purple-50 dark:from-purple-500/10 to-indigo-50 dark:to-indigo-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-5 text-center">
                    <TrendingUp size={28} className="text-purple-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-800 dark:text-[#f0f0ff] mb-1">Advanced Analytics</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Demographics, trends, geographic breakdowns.</p>
                    <Link href="/upgrade" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-5 py-2 text-sm font-bold shadow">Upgrade to Premium</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}