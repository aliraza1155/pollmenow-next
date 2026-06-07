// lib/pollTypeConfig.ts
// No 'use client'

export const POLL_TYPE_CONFIGS = {
  quick: {
    icon: 'flash',
    color: '#ffcc00',
    gradient: ['#1a2a3a', '#2a3a4a'],
    badgeColor: '#ffcc00',
    accentColor: '#ffcc00',
    minOptions: 2,
    maxOptions: 6,
    requiresMedia: false,
    description: 'Standard poll with multiple choices',
  },
  yesno: {
    icon: 'checkmark-done',
    color: '#4cd964',
    gradient: ['#1a3a2a', '#2a4a3a'],
    badgeColor: '#4cd964',
    accentColor: '#4cd964',
    minOptions: 2,
    maxOptions: 2,
    requiresMedia: false,
    description: 'Simple Yes/No question',
  },
  rating: {
    icon: 'star',
    color: '#ff9500',
    gradient: ['#2a2a1a', '#3a3a2a'],
    badgeColor: '#ff9500',
    accentColor: '#ff9500',
    minOptions: 0,
    maxOptions: 0,
    requiresMedia: false,
    description: 'Rate something on a scale',
  },
  comparison: {
    icon: 'swap-horizontal',
    color: '#ff2d55',
    gradient: ['#3a1a2a', '#4a2a3a'],
    badgeColor: '#ff2d55',
    accentColor: '#ff2d55',
    minOptions: 2,
    maxOptions: 4,
    requiresMedia: true,
    description: 'Compare items side by side',
  },
  live: {
    icon: 'radio',
    color: '#ff3b30',
    gradient: ['#3a1a1a', '#5a2a2a'],
    badgeColor: '#ff3b30',
    accentColor: '#ff3b30',
    minOptions: 2,
    maxOptions: 6,
    requiresMedia: false,
    description: 'Live event with time pressure',
  },
} as const;

export type PollTypeKey = keyof typeof POLL_TYPE_CONFIGS;