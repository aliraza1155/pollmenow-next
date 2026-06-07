// lib/tierUtils.ts
export const TIER_LIMITS = {
  free: {
    maxPollsPerMonth: Infinity,
    maxOptionsPerPoll: 10,
    allowedPollTypes: ['quick', 'rating', 'yesno', 'comparison', 'live'],
    allowedVisibility: ['public'],
    requiresLoginToVote: false,
    analyticsLevel: 'basic',
    branding: 'standard',
    teamManagement: false,
    targeting: false,
    prizeEligibility: false,
    prioritySupport: false,
    aiFeatures: false,
    aiPollGeneration: false,
    aiRephrasing: false,
    features: [
      'Unlimited polls forever',
      'All poll types (Quick, Yes/No, Rating, Comparison, Live)',
      'Up to 10 options per poll',
      'Public polls',
      'No login required for voters',
      'Basic vote counts & results',
    ],
  },
  verified: {
    maxPollsPerMonth: Infinity,
    maxOptionsPerPoll: 10,
    allowedPollTypes: ['quick', 'rating', 'yesno', 'comparison', 'live'],
    allowedVisibility: ['public'],
    requiresLoginToVote: false,
    analyticsLevel: 'basic',
    branding: 'standard',
    teamManagement: false,
    targeting: false,
    prizeEligibility: false,
    prioritySupport: false,
    aiFeatures: false,
    aiPollGeneration: false,
    aiRephrasing: false,
    features: [
      'All Free features',
      'Verified badge',
      'Higher search placement',
    ],
  },
  premium: {
    maxPollsPerMonth: Infinity,
    maxOptionsPerPoll: 10,
    allowedPollTypes: ['quick', 'rating', 'yesno', 'comparison', 'live'],
    allowedVisibility: ['public', 'friends', 'private'],
    requiresLoginToVote: false,
    analyticsLevel: 'premium',
    branding: 'premium',
    teamManagement: false,
    targeting: true,
    prizeEligibility: true,
    prioritySupport: true,
    aiFeatures: true,
    aiPollGeneration: true,
    aiRephrasing: true,
    features: [
      'Everything in Free',
      '✨ AI poll generation & AI images',
      '🎯 Audience targeting (age, gender, country)',
      '📊 Advanced analytics & demographic breakdowns',
      '💡 AI insights on poll results',
      '🔒 Private & friends-only polls',
      'Priority support',
      'Custom branding',
    ],
  },
  organization: {
    maxPollsPerMonth: Infinity,
    maxOptionsPerPoll: 10,
    allowedPollTypes: ['quick', 'rating', 'yesno', 'comparison', 'live'],
    allowedVisibility: ['public', 'friends', 'private'],
    requiresLoginToVote: false,
    analyticsLevel: 'premium',
    branding: 'custom',
    teamManagement: true,
    targeting: true,
    prizeEligibility: true,
    prioritySupport: true,
    aiFeatures: true,
    aiPollGeneration: true,
    aiRephrasing: true,
    features: [
      'All Premium features',
      'Team management (admins, poll managers, analysts)',
      'Organization branding & white-label',
      'Priority placement & custom domain',
      'API access & webhooks',
      'Dedicated account manager',
      '99.9% SLA guarantee',
    ],
  },
};

function getLimits(tier: keyof typeof TIER_LIMITS) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canCreatePollType(tier: string, pollType: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).allowedPollTypes.includes(pollType);
}

export function canUseVisibility(tier: string, visibility: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).allowedVisibility.includes(visibility);
}

export function getMaxOptions(tier: string): number {
  return getLimits(tier as keyof typeof TIER_LIMITS).maxOptionsPerPoll;
}

export function getMonthlyPollLimit(tier: string): number {
  return getLimits(tier as keyof typeof TIER_LIMITS).maxPollsPerMonth;
}

export function requiresLoginToVote(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).requiresLoginToVote;
}

export function hasPremiumAnalytics(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).analyticsLevel === 'premium';
}

export function hasTeamManagement(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).teamManagement;
}

export function hasTargeting(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).targeting;
}

export function canUseAIFeatures(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).aiFeatures;
}

export function canUseAIPollGeneration(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).aiPollGeneration;
}

export function canUseAIRephrasing(tier: string): boolean {
  return getLimits(tier as keyof typeof TIER_LIMITS).aiRephrasing;
}