// app/poll/analytics/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generatePollInsights } from '@/lib/ai';
import { hasPremiumAnalytics } from '@/lib/tierUtils';
import { toDate, formatDate } from '@/lib/utils';
import { canViewAnalytics, canViewAdvancedAnalytics } from '@/lib/permissions';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────
const computeRegressionLine = (data: any[], yKey: string) => {
  const n = data.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const y = data[i][yKey] || 0;
    sumX += i; sumY += y; sumXY += i * y; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return data.map((p, i) => ({ ...p, trend: slope * i + intercept }));
};

function unflatten(obj: Record<string, any>) {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return result;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#161829] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
};

export default function PollAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [poll, setPoll] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [exporting, setExporting] = useState({ png: false, pdf: false, csv: false });

  useEffect(() => {
    const fetch = async () => {
      const pollDoc = await getDoc(doc(db, 'polls', id));
      if (!pollDoc.exists()) { alert('Poll not found'); router.push('/'); return; }
      const pollData = pollDoc.data();
      if (!canViewAnalytics(user, pollData)) { alert('No permission to view analytics'); router.push('/'); return; }

      let role = null;
      if (pollData.context?.type === 'organization' && user) {
        role = user.memberships?.[pollData.context.orgId]?.role || null;
      }
      setUserRole(role);
      setPoll({ id: pollDoc.id, ...pollData });

      const aDoc = await getDoc(doc(db, 'pollAnalytics', id));
      setAnalytics(aDoc.exists() ? unflatten(aDoc.data()) : null);
      setLoading(false);
    };
    if (user && id) fetch();

    const unsub = onSnapshot(doc(db, 'pollAnalytics', id), snap => {
      if (snap.exists()) setAnalytics(unflatten(snap.data()));
    });
    return () => unsub();
  }, [id, user, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
  if (!poll || !analytics) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="text-center">
        <p className="text-5xl mb-3">📊</p>
        <p className="text-lg font-bold text-gray-800 dark:text-[#f0f0ff]">No analytics data yet.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Votes will appear here once people start participating.</p>
      </div>
    </div>
  );

  const totalVotes = analytics.totalVotes || 0;
  const totalViews = analytics.totalViews || 0;
  const shares = analytics.shares || 0;
  const engagementRate = totalViews ? (totalVotes / totalViews) * 100 : 0;
  const countriesCount = Object.keys(analytics.countryCounts || {}).length;
  const lastHourVotes = Object.values(analytics.votesByHour || {}).slice(-1)[0] || 0;
  const isRatingPoll = poll.type === 'rating' && (!poll.options || poll.options.length === 0);
  const hasOptions = poll.options && poll.options.length > 0;

  const votesByDay = analytics.votesByDay || {};
  const days = Object.keys(votesByDay).sort().slice(-30);
  const timeData = days.map(d => ({ date: d.slice(5), votes: votesByDay[d] || 0 }));
  const timeDataWithTrend = computeRegressionLine(timeData, 'votes');

  const votesByHour = analytics.votesByHour || {};
  const hours = Object.keys(votesByHour).sort().slice(-24);
  const hourlyData = hours.map(h => ({ hour: h.slice(11,13)+':00', votes: votesByHour[h] || 0 }));

  const genderCounts = analytics.genderCounts || { male:0, female:0, other:0 };
  const genderData = [
    { name:'Male', value: genderCounts.male || 0 },
    { name:'Female', value: genderCounts.female || 0 },
    { name:'Other', value: genderCounts.other || 0 },
  ];
  const ageBucketsObj = analytics.ageBuckets || {};
  const ageData = Object.entries(ageBucketsObj).map(([k,v]) => ({ age:k, count:v as number }));
  const countryEntries = Object.entries(analytics.countryCounts || {}) as [string, number][];
  const countryData = countryEntries.sort((a,b)=>b[1]-a[1]).slice(0,10);

  const optionDemographics = analytics.optionDemographics || {};
  const optionResults = (poll.options || []).map((opt: any) => {
    let votes = 0;
    if (optionDemographics[opt.id]?.totalVotes) votes = optionDemographics[opt.id].totalVotes;
    else if (opt.votes !== undefined) votes = opt.votes;
    return { id: opt.id, text: opt.text, votes };
  });
  const totalOptionVotes = optionResults.reduce((s: number, o: any) => s+o.votes, 0);
  const maxVotes = Math.max(...optionResults.map((o: any) => o.votes), 1);

  const isCreator = poll?.creator?.id === user?.uid;
  // ✅ Fix: provide fallback 'free' for user?.tier
  const canViewAdvanced = isCreator || hasPremiumAnalytics(user?.tier || 'free') || canViewAdvancedAnalytics(userRole);
  const isPremium = hasPremiumAnalytics(user?.tier || 'free');

  let ageBucketsList: string[] = [], optionsLabels: string[] = [], heatmapData: any = {}, genderOptionData: any[] = [], topCountryPerOption: any[] = [];
  if (canViewAdvanced && poll.options) {
    ageBucketsList = ['18-24','25-34','35-44','45-54','55+'];
    optionsLabels = poll.options.map((o: any) => o.text);
    for (const age of ageBucketsList) {
      heatmapData[age] = {};
      for (const opt of poll.options) {
        const optDemo = optionDemographics[opt.id]?.ageBuckets || {};
        const bucketVotes = optDemo[age] || 0;
        const totalAgeVotes = ageBucketsObj[age] || 1;
        heatmapData[age][opt.text] = (bucketVotes / totalAgeVotes) * 100;
      }
    }
    genderOptionData = poll.options.map((opt: any) => ({
      option: opt.text,
      male: optionDemographics[opt.id]?.genderCounts?.male || 0,
      female: optionDemographics[opt.id]?.genderCounts?.female || 0,
      other: optionDemographics[opt.id]?.genderCounts?.other || 0,
    }));
    topCountryPerOption = poll.options.map((opt: any) => {
      const countries = optionDemographics[opt.id]?.countryCounts || {};
      const entries = Object.entries(countries) as [string, number][];
      const top = entries.sort((a,b)=>b[1]-a[1])[0];
      return { option: opt.text, countryCode: top?.[0], percent: top?.[1] };
    });
  }

  const exportPNG = async () => {
    if (!containerRef.current) return;
    setExporting(e => ({ ...e, png: true }));
    try {
      const [{ default: html2canvas }, { saveAs }] = await Promise.all([
        import('html2canvas'),
        import('file-saver'),
      ]);
      const canvas = await html2canvas(containerRef.current);
      canvas.toBlob(blob => {
        if (blob) saveAs(blob, `poll-${id}-analytics.png`);
      });
    } finally {
      setExporting(e => ({ ...e, png: false }));
    }
  };

  const exportPDF = async () => {
    setExporting(e => ({ ...e, pdf: true }));
    try {
      window.print();
    } finally {
      setExporting(e => ({ ...e, pdf: false }));
    }
  };

  const exportCSV = async () => {
    if (!isPremium) return;
    setExporting(e => ({ ...e, csv: true }));
    try {
      const { saveAs } = await import('file-saver');
      let csv = 'Option,Votes,Percentage\n';
      optionResults.forEach((opt: any) => {
        const pct = totalVotes ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0;
        csv += `"${opt.text.replace(/"/g,'""')}",${opt.votes},${pct}%\n`;
      });
      saveAs(new Blob([csv], { type:'text/csv' }), `poll-${id}-analytics.csv`);
    } finally {
      setExporting(e => ({ ...e, csv: false }));
    }
  };

  const handleAIInsight = async () => {
    setGeneratingInsight(true);
    try {
      const insight = await generatePollInsights(id);
      setAnalytics((prev: any) => ({ ...prev, aiInsight: insight }));
    } catch (err) { alert('Failed to generate insight: ' + (err as Error).message); }
    finally { setGeneratingInsight(false); }
  };

  const cardCls = 'bg-white dark:bg-[#0f1120] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm';
  const labelCls = 'font-bold text-gray-800 dark:text-gray-100 mb-2';
  const subCls = 'text-xs text-gray-500 dark:text-gray-400';
  const tabBtnCls = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
      active
        ? 'text-primary border-primary'
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
    }`;
  const axisColor = '#9898a8';
  const gridColor = 'rgba(152,152,168,0.15)';

  const renderHeatmap = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161829] text-gray-700 dark:text-gray-300">Age</th>
            {optionsLabels.map(col => (
              <th key={col} className="p-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161829] text-gray-700 dark:text-gray-300">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ageBucketsList.map(age => (
            <tr key={age}>
              <td className="p-2 border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300">{age}</td>
              {optionsLabels.map(col => {
                const pct = heatmapData[age]?.[col] || 0;
                const intensity = Math.min(0.85, pct / 100);
                return (
                  <td
                    key={col}
                    className="p-2 border border-gray-200 dark:border-white/10 text-center text-xs font-semibold"
                    style={{
                      backgroundColor: `rgba(108,92,231,${intensity})`,
                      color: intensity > 0.45 ? '#fff' : undefined,
                    }}
                  >
                    {pct.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const KpiCard = ({ value, label, sub, subGreen }: any) => (
    <div className={`${cardCls} p-4 text-center`}>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      <div className={subCls + ' mt-0.5'}>{label}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${subGreen ? 'text-green-500 dark:text-green-400' : subCls}`}>{sub}</div>}
    </div>
  );

  const tabs = [
    { key:'overview', label:'Overview' },
    { key:'options', label:'Results' },
    ...(canViewAdvanced ? [
      { key:'demographics', label:'Demographics' },
      { key:'byOption', label:'By Option' },
      { key:'insights', label:'AI Insights' },
    ] : []),
  ];

  const ExportBtn = ({ onClick, loading: btnLoading, children }: any) => (
    <button
      onClick={onClick}
      disabled={btnLoading}
      className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 flex items-center gap-1.5"
    >
      {btnLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a] py-6 px-4 sm:px-6">
      <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
        <style>{`@media print { .no-print, button, .export-actions, nav, footer { display:none!important; } }`}</style>

        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold">Analytics Dashboard</h1>
            <div className="export-actions flex gap-2 flex-wrap">
              <ExportBtn onClick={exportPNG} loading={exporting.png}>📸 PNG</ExportBtn>
              <ExportBtn onClick={exportPDF} loading={exporting.pdf}>🖨️ PDF</ExportBtn>
              {isPremium && <ExportBtn onClick={exportCSV} loading={exporting.csv}>📊 CSV</ExportBtn>}
            </div>
          </div>
          <h2 className="text-lg font-bold mt-3 break-words opacity-95">{poll.question}</h2>
          <div className="flex flex-wrap gap-3 mt-2 text-sm opacity-80">
            <span>{poll.meta?.isLive ? '🔴 LIVE' : (poll.endsAt && new Date() > toDate(poll.endsAt)! ? '⏰ EXPIRED' : '🟢 ACTIVE')}</span>
            <span>Created: {formatDate(poll.createdAt)}</span>
            {poll.endsAt && <span>Ends: {formatDate(poll.endsAt)}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard value={totalVotes.toLocaleString()} label="Total Votes" sub={`+${lastHourVotes} last hour`} subGreen />
          <KpiCard value={totalViews.toLocaleString()} label="Total Views" sub={`Rate: ${engagementRate.toFixed(1)}%`} subGreen />
          <KpiCard value={shares.toLocaleString()} label="Shares" />
          <KpiCard value={countriesCount} label="Countries" />
        </div>

        <div className={`${cardCls} overflow-hidden`}>
          <div className="flex overflow-x-auto border-b border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-[#161829]/50">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={tabBtnCls(activeTab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className={labelCls}>Votes Trend (Last 30 days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={timeDataWithTrend || timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ color: axisColor, fontSize: 12 }} />
                      <Line type="monotone" dataKey="votes" stroke="#6C5CE7" name="Actual votes" strokeWidth={2} dot={{ r:3, fill:'#6C5CE7' }} />
                      {timeDataWithTrend && <Line type="monotone" dataKey="trend" stroke="#e5184c" strokeDasharray="5 5" name="Trend" dot={false} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className={labelCls}>Votes by Hour (Last 24h)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="hour" tick={{ fill: axisColor, fontSize: 11 }} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="votes" fill="#6C5CE7" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'options' && (
              <div className="space-y-4">
                <h3 className={labelCls}>Vote Distribution</h3>
                {isRatingPoll ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-[#161829] rounded-xl border border-gray-100 dark:border-white/8">
                    <p className="text-3xl font-extrabold text-primary mb-1">{poll.averageRating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average rating out of {poll.scale?.max || 5}</p>
                    <p className={subCls + ' mt-1'}>Based on {totalVotes} ratings</p>
                  </div>
                ) : !hasOptions ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No options to display</p>
                ) : (
                  optionResults.map((opt: any) => {
                    const pct = totalOptionVotes ? ((opt.votes / totalOptionVotes) * 100).toFixed(1) : 0;
                    const isWinner = opt.votes === maxVotes && opt.votes > 0;
                    return (
                      <div key={opt.id} className="group">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className={`font-medium ${isWinner ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                            {isWinner && '🏆 '}{opt.text}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">{opt.votes} <span className="text-primary font-semibold">({pct}%)</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-primary/35 dark:bg-primary/30'}`}
                            style={{ width: `${(opt.votes / maxVotes) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'demographics' && canViewAdvanced && (
              <div className="space-y-8">
                <div>
                  <h3 className={labelCls}>Gender</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" tick={{ fill: axisColor, fontSize:11 }} />
                      <YAxis tick={{ fill: axisColor, fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Voters" fill="#6C5CE7" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className={labelCls}>Age Groups</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="age" tick={{ fill: axisColor, fontSize:11 }} />
                      <YAxis tick={{ fill: axisColor, fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Voters" fill="#a855f7" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className={labelCls}>Top Countries</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, countryData.length * 32)}>
                    <BarChart data={countryData.map(([code, count]) => ({ code, count }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis type="number" tick={{ fill: axisColor, fontSize:11 }} />
                      <YAxis type="category" dataKey="code" width={80} tick={{ fill: axisColor, fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Voters" fill="#e5184c" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'byOption' && canViewAdvanced && (
              <div className="space-y-8">
                <div>
                  <h4 className={labelCls}>Option Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(poll.options || []).map((opt: any) => {
                      const totalOpt = (optionDemographics[opt.id]?.genderCounts?.male || 0)
                                    + (optionDemographics[opt.id]?.genderCounts?.female || 0)
                                    + (optionDemographics[opt.id]?.genderCounts?.other || 0);
                      const pct = totalVotes ? ((totalOpt / totalVotes) * 100).toFixed(1) : 0;
                      const ageBuck = optionDemographics[opt.id]?.ageBuckets || {};
                      const ageEntries = Object.entries(ageBuck) as [string, number][];
                      const dominantAge = ageEntries.sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                      const gender = optionDemographics[opt.id]?.genderCounts || {};
                      const genderEntries = Object.entries(gender) as [string, number][];
                      const dominantGender = genderEntries.sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                      const countryEntries = Object.entries(optionDemographics[opt.id]?.countryCounts || {}) as [string, number][];
                      const country = countryEntries.sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                      return (
                        <div key={opt.id} className="bg-gray-50 dark:bg-[#161829] rounded-xl p-4 border border-gray-100 dark:border-white/8">
                          <p className="font-bold text-gray-800 dark:text-gray-100">{opt.text}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{totalOpt} votes ({pct}%)</p>
                          <p className="text-xs text-primary mt-1.5">Mostly {dominantAge} · {dominantGender} · from {country}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className={labelCls}>Age × Option Heatmap</h4>
                  {renderHeatmap()}
                </div>
                <div>
                  <h4 className={labelCls}>Gender × Option</h4>
                  <div className="space-y-4">
                    {genderOptionData.map((item: any) => {
                      const total = item.male + item.female + item.other;
                      const hasVotes = total > 0;
                      return (
                        <div key={item.option}>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{item.option}</p>
                          <div className="flex h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8">
                            {hasVotes ? (
                              <>
                                {item.male > 0 && (
                                  <div className="bg-primary flex items-center justify-center text-white text-[10px] font-semibold" style={{ width:`${(item.male/total)*100}%` }}>
                                    {Math.round((item.male/total)*100)}%
                                  </div>
                                )}
                                {item.female > 0 && (
                                  <div className="bg-secondary flex items-center justify-center text-white text-[10px] font-semibold" style={{ width:`${(item.female/total)*100}%` }}>
                                    {Math.round((item.female/total)*100)}%
                                  </div>
                                )}
                                {item.other > 0 && (
                                  <div className="bg-purple-500 flex items-center justify-center text-white text-[10px] font-semibold" style={{ width:`${(item.other/total)*100}%` }}>
                                    {Math.round((item.other/total)*100)}%
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px]">No votes yet</div>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-full inline-block"/>Male</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary rounded-full inline-block"/>Female</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full inline-block"/>Other</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className={labelCls}>Top Country per Option</h4>
                  <div className="space-y-2 bg-gray-50 dark:bg-[#161829] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                    {topCountryPerOption.map((item: any, i: number) => (
                      <div key={item.option} className={`flex justify-between px-4 py-3 text-sm ${i !== topCountryPerOption.length-1 ? 'border-b border-gray-100 dark:border-white/6' : ''}`}>
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-4">{item.option}</span>
                        <span className="font-semibold text-primary whitespace-nowrap">
                          {item.countryCode || '—'}{item.percent ? ` (${item.percent})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && canViewAdvanced && (
              <div>
                {analytics.aiInsight ? (
                  <div className="bg-purple-50 dark:bg-primary/10 border border-purple-200 dark:border-primary/25 rounded-xl p-5">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{analytics.aiInsight.text}</p>
                    <div className="mt-4 border-t border-purple-200 dark:border-primary/20 pt-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">💡 Suggestion: </span>
                      <span className="text-gray-700 dark:text-gray-300">{analytics.aiInsight.suggestion}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-5xl mb-3">🤖</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-5">Generate AI-powered insights for this poll.</p>
                    <button
                      onClick={handleAIInsight}
                      disabled={generatingInsight}
                      className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow hover:shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                      {generatingInsight
                        ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"/>Generating…</>
                        : '✨ Generate Insight'}
                    </button>
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