'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotificationSettings, updateUserNotificationSettings, requestWebNotificationPermission } from '@/lib/notifications';
import {
  Bell, Volume2, CheckCircle, Star, Users, Trophy,
  MessageCircle, AlertCircle,
} from 'lucide-react';

const SETTINGS_CATEGORIES = [
  { key:'important',   label:'Important updates',   Icon:AlertCircle,   color:'#f59e0b' },
  { key:'votes',       label:'New votes',           Icon:CheckCircle,   color:'#22c55e' },
  { key:'followers',   label:'New followers',       Icon:Users,         color:'#3b82f6' },
  { key:'achievements',label:'Achievements',        Icon:Trophy,        color:'#f59e0b' },
  { key:'discussions', label:'Discussions',         Icon:MessageCircle, color:'#6C5CE7' },
];

const DELIVERY_SETTINGS = [
  { key:'sound', label:'Sound notifications', Icon:Volume2 },
  { key:'popup', label:'Browser pop-ups',     Icon:Bell    },
];

function Toggle({ enabled, onToggle, saving }: { enabled: boolean; onToggle: () => void; saving: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
        enabled ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gray-200 dark:bg-white/15'
      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const s = await getUserNotificationSettings(user.uid);
      setSettings(s);
      setLoading(false);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionGranted(Notification.permission === 'granted');
      }
    };
    load();
  }, [user]);

  const toggleSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(key);
    try {
      await updateUserNotificationSettings(user.uid, newSettings);
    } catch {
      setSettings(settings);
    } finally { setSaving(null); }
  };

  const handleRequestPermission = async () => {
    const granted = await requestWebNotificationPermission();
    setPermissionGranted(granted);
    if (granted && !settings.popup) toggleSetting('popup', true);
  };

  if (!user) return null;
  if (loading) return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-gray-100 dark:bg-white/6 rounded w-1/2" />
        {[...Array(5)].map((_,i) => <div key={i} className="h-10 bg-gray-100 dark:bg-white/6 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
          <Bell size={17} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff]">Notification Settings</h3>
      </div>

      {typeof window !== 'undefined' && 'Notification' in window && !permissionGranted && (
        <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-400/10 rounded-xl border border-amber-100 dark:border-amber-400/20">
          <p className="text-xs text-amber-800 dark:text-amber-300 mb-2.5 leading-relaxed">
            Enable browser notifications to never miss important updates from your polls.
          </p>
          <button
            onClick={handleRequestPermission}
            className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition"
          >
            Enable Notifications
          </button>
        </div>
      )}

      <div className="mb-5">
        <p className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Notify me about
        </p>
        <div className="space-y-2.5">
          {SETTINGS_CATEGORIES.map(cat => {
            const Icon = cat.Icon;
            const isEnabled = settings[cat.key] !== false;
            return (
              <div key={cat.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${cat.color}18` }}>
                    <Icon size={15} style={{ color:cat.color }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{cat.label}</span>
                </div>
                <Toggle
                  enabled={isEnabled}
                  onToggle={() => toggleSetting(cat.key, !isEnabled)}
                  saving={saving === cat.key}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-white/8 mb-5" />

      <div>
        <p className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Delivery method
        </p>
        <div className="space-y-2.5">
          {DELIVERY_SETTINGS.map(item => {
            const Icon = item.Icon;
            const isEnabled = settings[item.key] !== false;
            return (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
                <Toggle
                  enabled={isEnabled}
                  onToggle={() => toggleSetting(item.key, !isEnabled)}
                  saving={saving === item.key}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}