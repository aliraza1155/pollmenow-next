// lib/notifications.ts
'use client';

import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { NOTIFICATION_TEMPLATES } from './constants';

export async function requestWebNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showBrowserNotification(title: string, body: string, options: { icon?: string; tag?: string; url?: string; data?: any } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: options.icon || '/logo192.png',
    tag: options.tag || 'default',
    data: options.data || {},
  });
  if (options.url) {
    const url = options.url;
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

export async function sendNotification(notification: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  data?: any;
  priority?: string;
}) {
  try {
    const userDoc = await getDoc(doc(db, 'users', notification.userId));
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    const userSettings = userData.notificationSettings || {};

    if (userSettings[notification.type] === false) return;

    const cleanNotification = Object.fromEntries(
      Object.entries(notification).filter(([_, v]) => v !== undefined)
    );

    await addDoc(collection(db, 'notifications'), {
      ...cleanNotification,
      read: false,
      createdAt: serverTimestamp(),
    });

    if (typeof window !== 'undefined' && Notification.permission === 'granted' && userSettings.popup !== false) {
      let targetUrl: string | null = null;
      if (notification.relatedId) {
        if (notification.type.includes('poll')) {
          targetUrl = `${window.location.origin}/poll/${notification.relatedId}`;
        } else if (notification.type === 'follower_added') {
          targetUrl = `${window.location.origin}/profile/${notification.data?.followerId || notification.relatedId}`;
        } else {
          targetUrl = `${window.location.origin}/notifications`;
        }
      }
      showBrowserNotification(notification.title, notification.message, {
        tag: notification.type,
        url: targetUrl || undefined,
      });
    }
  } catch (err) {
    console.warn('Send notification error:', (err as Error).message);
  }
}

export async function sendBatchNotifications(notifications: Array<any>) {
  try {
    const batch = writeBatch(db);
    for (const note of notifications) {
      const userDoc = await getDoc(doc(db, 'users', note.userId));
      if (!userDoc.exists()) continue;
      const userSettings = userDoc.data().notificationSettings || {};
      if (userSettings[note.type] === false) continue;

      const cleanNote = Object.fromEntries(Object.entries(note).filter(([_, v]) => v !== undefined));
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        ...cleanNote,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Send batch notifications error:', (err as Error).message);
  }
}

export async function sendTemplateNotification(
  userId: string,
  type: string,
  replacements: Record<string, string> = {},
  relatedId?: string,
  data?: any,
  priority: string = 'normal'
) {
  const template = (NOTIFICATION_TEMPLATES as any)[type];
  if (!template) {
    console.warn(`Notification template not found for type: ${type}`);
    return;
  }
  let title = template.title;
  let message = template.message;
  for (const [key, val] of Object.entries(replacements)) {
    title = title.replace(`{${key}}`, val);
    message = message.replace(`{${key}}`, val);
  }
  await sendNotification({
    userId,
    type,
    title,
    message,
    relatedId,
    data,
    priority,
  });
}

export async function sendVoteNotification(pollId: string, voterId: string, pollCreatorId: string, pollTitle?: string) {
  if (voterId === pollCreatorId) return;
  const voterDoc = await getDoc(doc(db, 'users', voterId));
  const voterName = voterDoc.exists() ? voterDoc.data().name || 'Someone' : 'Someone';
  await sendTemplateNotification(
    pollCreatorId,
    'vote_received',
    { pollTitle: pollTitle || 'Your poll', username: voterName },
    pollId,
    { voterId },
    'normal'
  );
}

export async function markAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    console.warn('Mark as read error:', (err as Error).message);
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Mark all as read error:', (err as Error).message);
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (err) {
    console.warn('Get unread count error:', (err as Error).message);
    return 0;
  }
}

export async function updateUserNotificationSettings(userId: string, settings: Record<string, any>) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationSettings: settings,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Update notification settings error:', (err as Error).message);
    throw new Error('Failed to save notification settings');
  }
}

export async function getUserNotificationSettings(userId: string): Promise<Record<string, any>> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return getDefaultSettings();
    }
    const userData = userDoc.data();
    const settings = userData.notificationSettings || {};
    return { ...getDefaultSettings(), ...settings };
  } catch (err) {
    console.warn('Get notification settings error:', (err as Error).message);
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    important: true,
    votes: true,
    followers: true,
    achievements: true,
    discussions: true,
    sound: true,
    popup: true,
    vibration: true,
  };
}