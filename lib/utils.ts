// lib/utils.ts
'use client';

import { Timestamp } from 'firebase/firestore';

export function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return null;
}

export function formatDate(date: any, type: 'full' | 'short' = 'full'): string {
  const d = toDate(date);
  if (!d) return 'Unknown date';
  if (type === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatRelativeTime(date: any): string {
  const d = toDate(date);
  if (!d) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function getTimeLeftInHours(endsAt: any): number | null {
  const end = toDate(endsAt);
  if (!end) return null;
  const left = Math.max(0, end.getTime() - Date.now());
  return Math.ceil(left / (1000 * 60 * 60));
}

export function convertOptionsToArray(options: any): any[] {
  if (Array.isArray(options)) return options;
  if (options && typeof options === 'object') {
    return Object.entries(options).map(([id, opt]: [string, any]) => ({
      id,
      text: opt.text || 'Unnamed',
      votes: opt.votes || 0,
      mediaUrl: opt.mediaUrl,
      mediaType: opt.mediaType,
    }));
  }
  return [];
}

export async function generateAccessCode(): Promise<string> {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(random + Date.now());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 6).toUpperCase();
}

export function calculateCategoryPreferences(interactions: Array<{ category: string; action: string }>): Record<string, number> {
  const prefs: Record<string, number> = {};
  interactions.forEach(({ category, action }) => {
    const weight = action === 'vote' ? 2 : action === 'share' ? 3 : 1;
    prefs[category] = (prefs[category] || 0) + weight;
  });
  return prefs;
}