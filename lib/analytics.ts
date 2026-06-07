// lib/analytics.ts
'use client';

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { canViewAnalytics } from './permissions';

export async function getPollAnalytics(pollId: string, userTier: string, userId: string | null = null) {
  try {
    const pollDoc = await getDoc(doc(db, 'polls', pollId));
    if (!pollDoc.exists()) {
      console.error('Poll not found:', pollId);
      return null;
    }
    const pollData = pollDoc.data();
    const user = userId ? { uid: userId, tier: userTier } : null;

    if (!canViewAnalytics(user, pollData)) {
      return {
        totalVotes: 0,
        totalViews: pollData.totalViews || 0,
        shares: 0,
        voteDistribution: {},
        participationRate: 0,
      };
    }

    const analyticsDoc = await getDoc(doc(db, 'pollAnalytics', pollId));
    if (!analyticsDoc.exists()) {
      return {
        totalVotes: 0,
        totalViews: pollData.totalViews || 0,
        shares: 0,
        voteDistribution: {},
        participationRate: 0,
        demographics: null,
      };
    }

    const analytics = analyticsDoc.data();
    const totalVotes = analytics.totalVotes || 0;
    const totalViews = analytics.totalViews || pollData.totalViews || 0;
    const shares = analytics.shares || 0;

    const voteDistribution: Record<string, number> = {};
    if (pollData.options) {
      for (const opt of pollData.options) {
        let votes = 0;
        if (analytics.optionDemographics?.[opt.id]?.totalVotes) {
          votes = analytics.optionDemographics[opt.id].totalVotes;
        } else if (opt.votes !== undefined) {
          votes = opt.votes;
        }
        voteDistribution[opt.id] = votes;
      }
    }

    const basic = {
      totalVotes,
      totalViews,
      shares,
      voteDistribution,
      participationRate: totalViews ? totalVotes / totalViews : 0,
    };

    return {
      ...basic,
      genderCounts: analytics.genderCounts || { male: 0, female: 0, other: 0 },
      ageBuckets: analytics.ageBuckets || {
        '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0,
      },
      countryCounts: analytics.countryCounts || {},
      regionCounts: analytics.regionCounts || {},
      votesByHour: analytics.votesByHour || {},
      votesByDay: analytics.votesByDay || {},
      optionDemographics: analytics.optionDemographics || {},
      aiInsight: analytics.aiInsight || null,
    };
  } catch (error) {
    console.error('getPollAnalytics error:', error);
    return null;
  }
}

export async function trackUserInteraction(userId: string, action: string, data: any) {
  try {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'userInteractions'), {
      userId,
      action,
      ...data,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.error('Analytics error:', err);
  }
}