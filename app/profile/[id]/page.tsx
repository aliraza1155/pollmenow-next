// app/profile/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { db, auth } from '@/lib/firebase';
import {
  doc, getDoc, getDocs, updateDoc, collection, query, where,
  deleteDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { uploadToFirebaseStorage } from '@/lib/upload';
import { getFollowers, getFollowing, isFollowing, followUser, unfollowUser } from '@/lib/follow';
import { getMonthlyPollLimit } from '@/lib/tierUtils';
import { formatDate, toDate } from '@/lib/utils';
import { VerifiedBadge, PremiumBadge, Button } from '@/components/UI';
import { BADGES } from '@/lib/constants';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  Camera, MapPin, Calendar, Users, BarChart2,
  Pencil, Trash2, Share2, CheckCircle, UserPlus,
  UserCheck, Zap, LogOut, ChevronRight, Award,
  Zap as ZapIcon, Star, Layers, Radio,
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = { quick: ZapIcon, yesno: CheckCircle, rating: Star, comparison: Layers, live: Radio };

const inputCls = `w-full px-3.5 py-3 rounded-xl text-sm
  bg-gray-50 dark:bg-white/5
  border border-gray-200 dark:border-white/12
  text-gray-800 dark:text-gray-200
  placeholder-gray-400 dark:placeholder-gray-500
  focus:border-purple-500 dark:focus:border-purple-500
  focus:ring-2 focus:ring-purple-500/20
  outline-none transition font-medium`;

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string | undefined;
  const { user, refreshUser } = useAuth();
  const { activeAccount, organizations, refreshActiveOrganization } = useAccount();
  const router = useRouter();

  const isFriendProfile = !!id && id !== user?.uid;
  const showOrganizationProfile = !isFriendProfile && activeAccount !== 'personal';
  const targetUserId = isFriendProfile ? id : (showOrganizationProfile ? activeAccount : user?.uid);

  const [profile, setProfile] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('polls');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [followingCreator, setFollowingCreator] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);
  const pollsUnsubRef = useRef<() => void | null>(null);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };
  const updateForm = (key: string, val: any) => setFormData(p => ({ ...p, [key]: val }));

  useEffect(() => {
    if (pollsUnsubRef.current) { pollsUnsubRef.current(); pollsUnsubRef.current = null; }
    const load = async () => {
      setLoading(true);
      try {
        if (!targetUserId) { setLoading(false); return; }
        const snap = await getDoc(doc(db, 'users', targetUserId));
        if (!snap.exists()) { setProfile(null); setLoading(false); return; }
        const d = snap.data();
        setProfile({ uid: targetUserId, ...d });
        setFormData({
          name: d.name || '', username: d.username || '', email: d.email || '',
          phone: d.phone || '', age: d.age?.toString() || '', gender: d.gender || '',
          city: d.location?.city || '', country: d.location?.country || '',
          description: d.description || '', logo: d.profileImage || null,
        });
        if (d.type !== 'organization') {
          const [fols, fing] = await Promise.all([
            getFollowers(targetUserId).catch(() => []),
            getFollowing(targetUserId).catch(() => []),
          ]);
          setFollowers(fols); setFollowing(fing);
        } else { setFollowers([]); setFollowing([]); }
        if (user && user.uid !== targetUserId) setFollowingCreator(await isFollowing(targetUserId, user.uid).catch(() => false));

        const pollsQ = showOrganizationProfile && d.type === 'organization'
          ? query(collection(db, 'polls'), where('context.type', '==', 'organization'), where('context.orgId', '==', targetUserId))
          : query(collection(db, 'polls'), where('creator.id', '==', targetUserId));
        const unsub = onSnapshot(pollsQ, snap => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt ? toDate(doc.data().createdAt) : new Date() }));
          data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setPolls(data);
        });
        pollsUnsubRef.current = unsub;
      } catch (err) { console.error(err); showToast('error', 'Failed to load profile'); }
      finally { setLoading(false); }
    };
    if (targetUserId) load();
    else setLoading(false);
    return () => { if (pollsUnsubRef.current) pollsUnsubRef.current(); };
  }, [targetUserId, showOrganizationProfile, user]);

  useEffect(() => {
    if (!editing || isFriendProfile) return;
    const timer = setTimeout(async () => {
      const uname = (formData.username || '').trim();
      if (uname.length < 3 || uname === profile?.username) { setUsernameOk(null); return; }
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', uname.toLowerCase())));
        setUsernameOk(snap.empty);
      } catch { setUsernameOk(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, editing, profile?.username, isFriendProfile]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToFirebaseStorage(file, `profiles/${targetUserId}`);
      await updateDoc(doc(db, 'users', targetUserId), { profileImage: url, updatedAt: serverTimestamp() });
      setProfile((p: any) => ({ ...p, profileImage: url }));
      await refreshUser();
      showToast('success', 'Photo updated!');
    } catch (err) { showToast('error', 'Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (isFriendProfile || !targetUserId) return;
    if (formData.username !== profile?.username && !usernameOk) { showToast('error', 'Username not available.'); return; }
    if (formData.phone && !parsePhoneNumberFromString(formData.phone)?.isValid()) { showToast('error', 'Invalid phone number.'); return; }
    setSaving(true);
    try {
      const updates: any = {
        name: (formData.name || '').trim(),
        username: (formData.username || '').trim().toLowerCase(),
        email: (formData.email || '').trim(),
        phone: (formData.phone || '').trim() || null,
        updatedAt: serverTimestamp(),
      };
      if (profile.type === 'individual') {
        if (formData.age) updates.age = parseInt(formData.age);
        if (formData.gender) updates.gender = formData.gender;
        updates['location.city'] = (formData.city || '').trim() || null;
      } else {
        updates['location.country'] = (formData.country || '').trim() || null;
        updates['location.city'] = (formData.city || '').trim() || null;
        updates.description = (formData.description || '').trim() || null;
        updates.profileImage = formData.logo || null;
      }
      await updateDoc(doc(db, 'users', targetUserId), updates);
      setProfile((p: any) => ({ ...p, ...updates }));
      await refreshUser();
      setEditing(false);
      showToast('success', 'Profile updated!');
    } catch (err) { showToast('error', 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handleFollow = async () => {
    if (!user) { router.push('/login'); return; }
    if (!isFriendProfile) return;
    setFollowingLoading(true);
    try {
      if (followingCreator) {
        await unfollowUser(targetUserId!, user.uid);
        setFollowingCreator(false);
        setFollowers(prev => prev.filter(i => i !== user.uid));
      } else {
        await followUser(targetUserId!, user.uid);
        setFollowingCreator(true);
        setFollowers(prev => [...prev, user.uid]);
      }
    } catch (err) { showToast('error', (err as Error).message); }
    finally { setFollowingLoading(false); }
  };

  const handleSharePoll = (pollId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`).catch(() => {});
    showToast('success', 'Link copied!');
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Delete this poll permanently?')) return;
    try { await deleteDoc(doc(db, 'polls', pollId)); showToast('success', 'Poll deleted'); }
    catch { showToast('error', 'Failed to delete poll.'); }
  };

  const isOwnProfile = !!user && !isFriendProfile && targetUserId === user.uid;
  const monthlyLimit = getMonthlyPollLimit(profile?.tier || 'free');
  const usagePct = monthlyLimit === Infinity ? 10 : Math.min(100, ((profile?.pollsThisMonth || 0) / monthlyLimit) * 100);
  const earnedBadges = (profile?.badges || []).map((bid: string) => BADGES.find(b => b.id === bid)).filter(Boolean);
  const showTeamTab = showOrganizationProfile && user && user.memberships?.[activeAccount] != null;
  const tabs = ['polls', ...(profile?.type !== 'organization' ? ['achievements', 'about'] : ['about']), ...(showTeamTab ? ['team'] : [])];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="w-10 h-10 border-2 border-gray-200 dark:border-white/10 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center">
        <Users size={40} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-semibold mb-3">Profile not found</p>
        <Link href="/explore" className="text-purple-600 dark:text-purple-400 text-sm font-semibold hover:underline">Browse polls →</Link>
      </div>
    </div>
  );

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* Hero / Profile card */}
        <div className="bg-white dark:bg-[#0f1120] rounded-3xl border border-gray-100 dark:border-white/8 overflow-hidden shadow-sm mb-4">
          <div className="h-24 sm:h-32 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="px-4 sm:px-6 pb-5">
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 to-purple-400 border-4 border-white dark:border-[#0f1120] flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-lg overflow-hidden">
                  {profile.profileImage
                    ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                    : (profile.name?.[0] || 'U').toUpperCase()
                  }
                </div>
                {isOwnProfile && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 rounded-xl flex items-center justify-center cursor-pointer shadow-md border-2 border-white dark:border-[#0f1120] text-white hover:bg-purple-700 transition">
                    {uploading
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={13} />
                    }
                    <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              {!editing && (
                <div className="flex gap-2 flex-wrap justify-end">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/12 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition">
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => { auth.signOut(); router.push('/'); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                        <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
                      </button>
                    </>
                  ) : isFriendProfile && profile.type !== 'organization' && (
                    <button
                      onClick={handleFollow}
                      disabled={followingLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${followingCreator ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/25' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'} ${followingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {followingLoading
                        ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : followingCreator
                          ? <><UserCheck size={15} /> Following</>
                          : <><UserPlus size={15} /> Follow</>
                      }
                    </button>
                  )}
                </div>
              )}
            </div>

            {!editing ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">{profile.name}</h1>
                  {profile.verified && <VerifiedBadge size={18} />}
                  {(profile.tier === 'premium' || profile.tier === 'organization') && <PremiumBadge size={18} />}
                  {showOrganizationProfile && <span className="text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">Org</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">@{profile.username}</p>
                {(profile.location?.city || profile.location?.country) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={12} /> {[profile.location?.city, profile.location?.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {profile.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{profile.description}</p>
                )}

                <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-gray-100 dark:border-white/8">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-[#f0f0ff]">{polls.length}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Polls</p>
                  </div>
                  {profile.type !== 'organization' && (
                    <>
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-[#f0f0ff]">{followers.length}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-[#f0f0ff]">{following.length}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Following</p>
                      </div>
                    </>
                  )}
                </div>

                {isOwnProfile && profile.tier === 'free' && (
                  <Link href="/upgrade" className="mt-4 flex items-center justify-between bg-gradient-to-r from-purple-50 dark:from-purple-500/10 to-pink-50 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-[#f0f0ff]">Upgrade to Premium</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Unlock unlimited polls, AI, analytics & more</p>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Zap size={16} className="text-white" />
                    </div>
                  </Link>
                )}
              </>
            ) : (
              // Edit form
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
                    <input className={inputCls} value={formData.name || ''} onChange={e => updateForm('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Username</label>
                    <input
                      className={`${inputCls} ${usernameOk === false ? 'border-red-400' : usernameOk === true ? 'border-green-400' : ''}`}
                      value={formData.username || ''} onChange={e => updateForm('username', e.target.value)}
                    />
                    {formData.username?.length >= 3 && (
                      <p className={`text-xs mt-1 ${usernameOk === true ? 'text-green-600 dark:text-green-400' : usernameOk === false ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                        {usernameOk === true ? '✓ Available' : usernameOk === false ? '✗ Taken' : 'Checking…'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" className={inputCls} value={formData.email || ''} onChange={e => updateForm('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone</label>
                    <input type="tel" className={inputCls} value={formData.phone || ''} onChange={e => updateForm('phone', e.target.value)} placeholder="+1234567890" />
                  </div>
                </div>
                {profile.type === 'individual' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Age</label>
                      <input type="number" className={inputCls} value={formData.age || ''} onChange={e => updateForm('age', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Gender</label>
                      <select className={inputCls} value={formData.gender || ''} onChange={e => updateForm('gender', e.target.value)}>
                        <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">City</label>
                      <input className={inputCls} value={formData.city || ''} onChange={e => updateForm('city', e.target.value)} />
                    </div>
                  </div>
                )}
                {profile.type === 'organization' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Country</label>
                        <input className={inputCls} value={formData.country || ''} onChange={e => updateForm('country', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">City</label>
                        <input className={inputCls} value={formData.city || ''} onChange={e => updateForm('city', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
                      <textarea className={inputCls} rows={3} value={formData.description || ''} onChange={e => updateForm('description', e.target.value)} />
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : 'Save changes'}
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 dark:border-white/12 text-gray-700 dark:text-gray-300 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage bar (own profile) */}
        {isOwnProfile && profile.type === 'individual' && (
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 mb-4 shadow-sm">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
              <span>Monthly polls</span>
              <span>{profile.pollsThisMonth || 0} / {monthlyLimit === Infinity ? '∞' : monthlyLimit}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-600 to-purple-400'}`} style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        )}

        {/* Badges strip */}
        {profile.type === 'individual' && earnedBadges.length > 0 && (
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 mb-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-1.5">
              <Award size={15} className="text-yellow-500" /> Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((b: any) => (
                <div key={b.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl px-3 py-1.5">
                  <span className="text-base">{b.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-white/10 mb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => { if (t === 'team') router.push('/team'); else setTab(t); }}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab === t ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'polls' && ` (${polls.length})`}
            </button>
          ))}
        </div>

        {/* Polls tab */}
        {tab === 'polls' && (
          polls.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
              <BarChart2 size={36} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-semibold mb-3">No polls yet</p>
              {isOwnProfile && <Link href="/create" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow">Create first poll</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {polls.map(poll => {
                const TypeIcon = TYPE_ICONS[poll.type] || BarChart2;
                const canModify = isOwnProfile;
                const isActive = !poll.endsAt || new Date(poll.endsAt) > new Date();
                return (
                  <div key={poll.id} className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden hover:shadow-md dark:hover:shadow-black/30 transition-all group">
                    <div className="bg-gray-50 dark:bg-[#161829] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                          <TypeIcon size={16} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-gray-500'}`}>
                          {isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      <Link href={`/poll/${poll.id}`}>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {poll.question}
                        </p>
                      </Link>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-white/6">
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-medium">{(poll.totalVotes || 0).toLocaleString()} votes</span>
                        <span className="mx-1.5">·</span>
                        <span>{formatDate(poll.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSharePoll(poll.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                          <Share2 size={13} />
                        </button>
                        {canModify && (
                          <Link href={`/create?edit=${poll.id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                            <Pencil size={13} />
                          </Link>
                        )}
                        {canModify && (
                          <button onClick={() => handleDeletePoll(poll.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                            <Trash2 size={13} />
          </button>
                        )}
                        <Link href={`/poll/${poll.id}`} className="ml-1 flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition">
                          View <ChevronRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Achievements tab */}
        {tab === 'achievements' && profile.type === 'individual' && (
          earnedBadges.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
              <Award size={36} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-semibold">No badges yet. Keep creating polls!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {earnedBadges.map((b: any) => (
                <div key={b.id} className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 text-center shadow-sm">
                  <div className="text-3xl mb-2">{b.icon}</div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{b.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff] mb-4">About {profile.name}</h3>
            <div className="space-y-3">
              {[
                { label: 'Account type', value: profile.type === 'individual' ? 'Individual' : 'Organization' },
                { label: 'Tier', value: (profile.tier || 'free').charAt(0).toUpperCase() + (profile.tier || 'free').slice(1) },
                { label: 'Joined', value: formatDate(toDate(profile.createdAt)) },
                { label: 'Polls created', value: polls.length },
                { label: 'Email', value: profile.email || 'Not provided' },
                { label: 'Phone', value: profile.phone || 'Not provided' },
                ...(profile.location?.country ? [{ label: 'Country', value: profile.location.country }] : []),
                ...(profile.location?.city ? [{ label: 'City', value: profile.location.city }] : []),
                ...(profile.description ? [{ label: 'Bio', value: profile.description }] : []),
              ].map((row, idx, arr) => (
                <div key={row.label} className={`flex justify-between py-2.5 ${idx !== arr.length - 1 ? 'border-b border-gray-100 dark:border-white/6' : ''}`}>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[60%] break-words">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}