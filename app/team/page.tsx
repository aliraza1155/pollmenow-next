// app/team/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { db, functions } from '@/lib/firebase';
import {
  collection, doc, onSnapshot, updateDoc, deleteDoc,
  getDoc, serverTimestamp, deleteField,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  Users, UserPlus, Trash2, Crown, Shield,
  UserCog, Mail, Check, AlertCircle, ChevronDown,
  ArrowLeft,
} from 'lucide-react';

const createInvitationCall = httpsCallable(functions, 'createInvitation');

const ROLE_CONFIG: Record<string, any> = {
  owner:        { Icon: Crown,   label: 'Owner',        bg: 'bg-amber-50 dark:bg-amber-400/12',    text: 'text-amber-700 dark:text-amber-300'     },
  admin:        { Icon: Crown,   label: 'Admin',        bg: 'bg-amber-50 dark:bg-amber-400/10',    text: 'text-amber-600 dark:text-amber-300'     },
  poll_manager: { Icon: UserCog, label: 'Poll Manager', bg: 'bg-blue-50 dark:bg-blue-400/12',      text: 'text-blue-700 dark:text-blue-300'       },
  analyst:      { Icon: Shield,  label: 'Analyst',      bg: 'bg-emerald-50 dark:bg-emerald-400/12',text: 'text-emerald-700 dark:text-emerald-300'  },
  member:       { Icon: Users,   label: 'Member',       bg: 'bg-gray-100 dark:bg-white/8',         text: 'text-gray-700 dark:text-gray-300'       },
};

const ROLE_PERMISSIONS = [
  { role: 'Owner',        desc: 'Full control — manage everything, delete organization, transfer ownership', color: 'text-amber-600 dark:text-amber-400' },
  { role: 'Admin',        desc: 'Full access except delete org — manage members, all polls, billing, settings', color: 'text-amber-500 dark:text-amber-400' },
  { role: 'Poll Manager', desc: 'Create, edit, delete polls — view basic and advanced analytics', color: 'text-blue-600 dark:text-blue-400' },
  { role: 'Analyst',      desc: 'View-only access — polls and analytics (no edits, no poll creation)', color: 'text-emerald-600 dark:text-emerald-400' },
  { role: 'Member',       desc: 'Create own polls, view organization polls (read-only)', color: 'text-gray-600 dark:text-gray-400' },
];

function RoleBadge({ role }: { role: string }) {
  const conf = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  const Icon = conf.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${conf.bg} ${conf.text}`}>
      <Icon size={11} />
      {conf.label}
    </span>
  );
}

function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium ${
        type === 'success'
          ? 'bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/25 text-green-800 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 text-red-800 dark:text-red-300'
      }`}>
        {type === 'success' ? <Check size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition">✕</button>
      </div>
    </motion.div>
  );
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const orgId = activeAccount !== 'personal' ? activeAccount : null;
  const isOwner = orgId ? user?.memberships?.[orgId]?.role === 'owner' : false;
  const isAdmin = orgId ? (user?.memberships?.[orgId]?.role === 'admin' || isOwner) : false;
  const canEdit = isAdmin || isOwner;

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    const teamRef = collection(db, 'organizations', orgId, 'team');
    const unsub = onSnapshot(teamRef, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userDoc = await getDoc(doc(db, 'users', docSnap.id));
          const ud = userDoc.exists() ? userDoc.data() : null;
          return {
            id: docSnap.id,
            email: data.email,
            role: data.role,
            name: ud?.name || data.email?.split('@')[0] || 'Unknown',
            profileImage: ud?.profileImage || null,
            addedAt: data.addedAt?.toDate?.() || new Date(),
          };
        })
      );
      setMembers(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      showToast('Failed to load team members', 'error');
      setLoading(false);
    });
    return () => unsub();
  }, [orgId, user?.uid]);

  const handleInvite = async () => {
    if (!canEdit) { showToast('Only admins can invite members', 'error'); return; }
    if (!inviteEmail.trim()) { showToast('Please enter an email address', 'error'); return; }
    if (!inviteEmail.includes('@')) { showToast('Please enter a valid email', 'error'); return; }
    if (members.some(m => m.email === inviteEmail)) { showToast('User is already a team member', 'error'); return; }
    setInviting(true);
    try {
      await createInvitationCall({ email: inviteEmail, role: inviteRole, orgId: orgId! });
      showToast(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteEmail('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally { setInviting(false); }
  };

  const handleRemove = async (member: any) => {
    if (!canEdit) { showToast('Only admins can remove members', 'error'); return; }
    if (!orgId) { showToast('Organization not found', 'error'); return; }
    if (member.role === 'owner') { showToast('Cannot remove the organization owner', 'error'); return; }
    if (!window.confirm(`Remove ${member.name} from your team?`)) return;
    setRemovingId(member.id);
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'team', member.id));
      await updateDoc(doc(db, 'users', member.id), { [`memberships.${orgId}`]: deleteField() });
      showToast(`${member.name} removed from team`, 'success');
    } catch { showToast('Failed to remove member', 'error'); }
    finally { setRemovingId(null); }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canEdit) { showToast('Only admins can change roles', 'error'); return; }
    if (!orgId) { showToast('Organization not found', 'error'); return; }
    setChangingRoleId(memberId);
    try {
      await updateDoc(doc(db, 'organizations', orgId, 'team', memberId), { role: newRole });
      await updateDoc(doc(db, 'users', memberId), { [`memberships.${orgId}.role`]: newRole });
      showToast('Role updated successfully', 'success');
    } catch { showToast('Failed to update role', 'error'); }
    finally { setChangingRoleId(null); }
  };

  const inputCls = `w-full bg-gray-50 dark:bg-white/5
    border border-gray-200 dark:border-white/12
    text-gray-800 dark:text-gray-200
    placeholder-gray-400 dark:placeholder-gray-500
    rounded-xl px-4 py-3 text-sm font-medium
    focus:border-purple-500 dark:focus:border-purple-500
    focus:ring-2 focus:ring-purple-500/20
    outline-none transition`;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Users size={28} className="text-gray-300 dark:text-white/20" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-[#f0f0ff] mb-4">Sign in to view team</h2>
        <Link href="/login" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">Sign in</Link>
      </div>
    </div>
  );

  if (!orgId) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Crown size={28} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#f0f0ff] mb-2">No Organization Selected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Switch to an organization account to manage your team.</p>
        <Link href="/dashboard" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">Go to Dashboard</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a]">
      <div className="w-10 h-10 border-2 border-gray-200 dark:border-white/10 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition mb-4">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-md">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Team Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {canEdit ? 'Manage members, assign roles, and control access.' : 'View all members of this organization.'}
              </p>
            </div>
          </div>
        </motion.div>

        {canEdit && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
            className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-4 sm:p-5 mb-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                <UserPlus size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff]">Invite New Member</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  className={`${inputCls} pl-9`}
                />
              </div>

              <div className="relative sm:w-40">
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="member">Member</option>
                  <option value="poll_manager">Poll Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
              >
                {inviting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              The user must have a PollMeNow account. They'll receive an email invitation.
            </p>
          </motion.div>
        )}

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden mb-5 shadow-sm"
        >
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between bg-gray-50/50 dark:bg-[#161829]/50">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff]">Team Members</h2>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/8 px-2 py-0.5 rounded-full">
                {members.length}
              </span>
            </div>
            {!canEdit && <span className="text-xs text-gray-400 dark:text-gray-500 italic">View only</span>}
          </div>

          {members.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-gray-300 dark:text-white/20" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold">No team members yet</p>
              {canEdit && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Invite your first member using the form above.</p>}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/6">
              {members.map((member, idx) => {
                const isCurrentUser = member.id === user.uid;
                const isOwnerMember = member.role === 'owner';

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity:0, x:-16 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/3 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm">
                      {member.profileImage
                        ? <img src={member.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                        : (member.name?.[0]?.toUpperCase() || 'U')
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{member.name}</p>
                        {isCurrentUser && <span className="text-xs text-gray-400 dark:text-gray-500">(you)</span>}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{member.email}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden sm:block">
                        <RoleBadge role={member.role} />
                      </div>

                      {canEdit && !isCurrentUser && !isOwnerMember && (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.id, e.target.value)}
                            disabled={changingRoleId === member.id}
                            className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/12 bg-white dark:bg-[#161829] text-gray-700 dark:text-gray-300 outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="poll_manager">Poll Mgr</option>
                            <option value="analyst">Analyst</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      )}

                      {(!canEdit || isCurrentUser || isOwnerMember) && (
                        <div className="sm:hidden">
                          <RoleBadge role={member.role} />
                        </div>
                      )}

                      {canEdit && !isCurrentUser && !isOwnerMember && (
                        <button
                          onClick={() => handleRemove(member)}
                          disabled={removingId === member.id}
                          className="w-8 h-8 rounded-xl border border-red-100 dark:border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-40"
                          title="Remove member"
                        >
                          {removingId === member.id
                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden shadow-sm"
        >
          <button
            onClick={() => setShowPermissions(v => !v)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/3 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-100 dark:bg-white/8 rounded-xl flex items-center justify-center">
                <Shield size={15} className="text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Role Permissions</span>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showPermissions ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPermissions && (
              <motion.div
                initial={{ height:0, opacity:0 }}
                animate={{ height:'auto', opacity:1 }}
                exit={{ height:0, opacity:0 }}
                transition={{ duration:0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 dark:border-white/8 pt-4 space-y-3">
                  {ROLE_PERMISSIONS.map(item => (
                    <div key={item.role} className="flex items-start gap-3">
                      <span className={`text-xs font-extrabold ${item.color} flex-shrink-0 mt-0.5 min-w-[80px]`}>{item.role}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}