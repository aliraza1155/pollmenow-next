// app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, writeBatch, limit,
} from 'firebase/firestore';
import { formatRelativeTime } from '@/lib/utils';
import {
  Bell, CheckCircle, Settings, Users, Trophy,
  MessageCircle, Star, Check, X, ChevronRight,
} from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import { motion, AnimatePresence } from 'framer-motion';

function getIconConfig(type: string) {
  if (type?.includes('vote'))        return { Icon: CheckCircle,    bg: 'bg-emerald-50 dark:bg-emerald-500/12', color: 'text-emerald-500 dark:text-emerald-400' };
  if (type?.includes('follower'))    return { Icon: Users,          bg: 'bg-blue-50 dark:bg-blue-500/12',     color: 'text-blue-500 dark:text-blue-400'      };
  if (type?.includes('achievement')) return { Icon: Trophy,         bg: 'bg-amber-50 dark:bg-amber-500/12',   color: 'text-amber-500 dark:text-amber-400'    };
  if (type?.includes('discussion'))  return { Icon: MessageCircle,  bg: 'bg-purple-50 dark:bg-purple-500/12', color: 'text-purple-500 dark:text-purple-400'  };
  if (type?.includes('premium'))     return { Icon: Star,           bg: 'bg-pink-50 dark:bg-pink-500/12',     color: 'text-pink-500 dark:text-pink-400'      };
  return                                    { Icon: Bell,           bg: 'bg-gray-50 dark:bg-white/6',         color: 'text-gray-500 dark:text-gray-400'      };
}

function getLink(notif: any) {
  if (!notif.relatedId) return '/';
  if (notif.type?.includes('poll'))       return `/poll/${notif.relatedId}`;
  if (notif.type === 'follower_added')    return `/profile/${notif.data?.followerId || notif.relatedId}`;
  if (notif.type?.includes('discussion')) return `/discussion/${notif.relatedId}`;
  return '/';
}

function NotifCard({ notif, onRead }: { notif: any; onRead: (id: string) => void }) {
  const { Icon, bg, color } = getIconConfig(notif.type);
  const link = getLink(notif);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <Link
        href={link}
        onClick={() => !notif.read && onRead(notif.id)}
        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm dark:hover:shadow-black/20 ${
          !notif.read
            ? 'bg-purple-50/50 dark:bg-purple-500/8 border-purple-100 dark:border-purple-500/20'
            : 'bg-white dark:bg-[#0f1120] border-gray-100 dark:border-white/8'
        }`}
      >
        <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-snug ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-[#f0f0ff]'}`}>
            {notif.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
            {notif.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
            {formatRelativeTime(notif.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {!notif.read && <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />}
          <ChevronRight size={14} className="text-gray-300 dark:text-white/20" />
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Bell size={28} className="text-gray-300 dark:text-white/20" />
      </div>
      <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">No notifications yet</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
        You'll see updates about your polls, followers, and achievements here.
      </p>
      <Link
        href="/explore"
        className="text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-4 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition"
      >
        Browse polls →
      </Link>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      })));
    });
    return () => unsub();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    setMarkingAll(true);
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
    setMarkingAll(false);
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Bell size={28} className="text-gray-300 dark:text-white/20" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-[#f0f0ff] mb-4">Sign in to see notifications</h2>
        <Link href="/login" className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">Sign in</Link>
      </div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const tabs = [
    { key: 'all',    label: `All (${notifications.length})` },
    { key: 'unread', label: `Unread (${unreadCount})`       },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex flex-col md:flex-row gap-5">

          {/* Main notifications list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-sm">
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-[#f0f0ff]">Notifications</h1>
                  {unreadCount > 0 && <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{unreadCount} new</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition disabled:opacity-50"
                  >
                    <Check size={13} />
                    {markingAll ? 'Marking…' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(v => !v)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    showSettings
                      ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : 'bg-white dark:bg-[#0f1120] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  {showSettings ? <X size={16} /> : <Settings size={16} />}
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-white/10 mb-4">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    filter === t.key
                      ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {filteredNotifs.length === 0 ? (
              <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
                <EmptyState />
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredNotifs.map(notif => (
                    <NotifCard key={notif.id} notif={notif} onRead={markAsRead} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Settings sidebar */}
          <AnimatePresence>
            {showSettings && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-40 md:hidden"
                  onClick={() => setShowSettings(false)}
                />
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed right-4 top-20 bottom-24 z-50 w-[min(320px,90vw)] md:relative md:right-auto md:top-auto md:bottom-auto md:z-auto md:w-72 overflow-y-auto"
                >
                  <NotificationSettings />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}