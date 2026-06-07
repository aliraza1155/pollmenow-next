// lib/types.ts
export const UserTier = {
  FREE: 'free',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
  ORGANIZATION: 'organization',
} as const;

export const UserType = {
  INDIVIDUAL: 'individual',
  ORGANIZATION: 'organization',
} as const;

export const PollType = {
  QUICK: 'quick',
  YESNO: 'yesno',
  RATING: 'rating',
  COMPARISON: 'comparison',
  LIVE: 'live',
} as const;

export const PollVisibility = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
} as const;

export const TeamRole = {
  ADMIN: 'admin',
  POLL_MANAGER: 'poll_manager',
  ANALYST: 'analyst',
  MEMBER: 'member',
} as const;

export type UserTierType = typeof UserTier[keyof typeof UserTier];
export type UserTypeType = typeof UserType[keyof typeof UserType];
export type PollTypeType = typeof PollType[keyof typeof PollType];
export type PollVisibilityType = typeof PollVisibility[keyof typeof PollVisibility];
export type TeamRoleType = typeof TeamRole[keyof typeof TeamRole];