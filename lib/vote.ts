// lib/vote.ts
'use client';

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getVoterKey } from './voterKey';
import { sendVoteNotification } from './notifications';
import { getCountryFromIP } from './location';

export async function submitVote(
  pollId: string,
  optionId: string,
  userId: string | undefined,
  anonymous: boolean = false,
  accessCode: string | null = null,
  demographics: any = null
) {
  const voterKey = await getVoterKey();
  const voteId = anonymous ? `${pollId}_${voterKey}` : `${pollId}_${userId}`;
  const isTrulyAnonymous = anonymous && !userId;

  let country: string | null = null;
  try {
    const location = await getCountryFromIP();
    country = location?.country || null;
  } catch (err) {
    console.warn('[vote] IP geolocation failed:', err);
  }

  if (isTrulyAnonymous) {
    console.log('[vote] Anonymous path – starting');

    const existingVoteSnap = await getDoc(doc(db, 'votes', voteId));
    if (existingVoteSnap.exists()) throw new Error('You have already voted');

    const pollSnap = await getDoc(doc(db, 'polls', pollId));
    if (!pollSnap.exists()) throw new Error('Poll not found');
    const pollData = pollSnap.data();
    console.log('[vote] Poll:', { anonymous: pollData.anonymous, type: pollData.type });

    if (!pollData.anonymous) throw new Error('Login required to vote in this poll');

    if (pollData.type === 'rating') {
      const rating = parseInt(optionId);
      const scale = pollData.scale || { min: 1, max: 5 };
      if (isNaN(rating) || rating < scale.min || rating > scale.max) throw new Error('Invalid rating');
    } else {
      if (!pollData.options?.some((opt: any) => opt.id === optionId)) throw new Error('Invalid option');
    }

    const voteData: any = {
      pollId,
      optionId,
      createdAt: serverTimestamp(),
      deviceId: voterKey,
      userId: null,
      metadata: {
        ip: 'client-side',
        userAgent: navigator.userAgent,
        location: country,
        category: pollData.category,
      },
    };
    if (demographics) voteData.demographics = demographics;

    const pollRef = doc(db, 'polls', pollId);
    let pollUpdate: any;
    if (pollData.type === 'rating') {
      const rating = parseInt(optionId);
      const ratingCounts: Record<string, number> = { ...(pollData.ratingCounts || {}) };
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
      const sumRatings = Object.entries(ratingCounts).reduce((s, [r, c]) => s + parseInt(r) * c, 0);
      pollUpdate = {
        ratingCounts,
        averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
        totalVotes: increment(1),
      };
    } else {
      const updatedOptions = pollData.options.map((opt: any) =>
        opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      );
      pollUpdate = { options: updatedOptions, totalVotes: increment(1) };
    }

    console.log('[vote] Writing vote document to votes/' + voteId);
    try {
      await setDoc(doc(db, 'votes', voteId), voteData);
      console.log('[vote] Vote document written OK');
    } catch (err) {
      console.error('[vote] VOTE WRITE FAILED - code:', (err as any).code, '- message:', (err as any).message);
      throw new Error('Vote write failed: ' + (err as any).message);
    }

    console.log('[vote] Updating polls/' + pollId);
    try {
      await updateDoc(pollRef, pollUpdate);
      console.log('[vote] Poll updated OK');
    } catch (err) {
      console.error('[vote] POLL UPDATE FAILED - code:', (err as any).code, '- message:', (err as any).message);
      throw new Error('Poll update failed: ' + (err as any).message);
    }

    console.log('[vote] Anonymous vote complete');
    return true;
  } else {
    return runTransaction(db, async (transaction) => {
      const existingVote = await transaction.get(doc(db, 'votes', voteId));
      if (existingVote.exists()) throw new Error('You have already voted');

      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await transaction.get(pollRef);
      if (!pollSnap.exists()) throw new Error('Poll not found');
      const pollData = pollSnap.data();

      if (!pollData.anonymous && !userId) throw new Error('Login required to vote in this poll');

      // Targeting checks – userId is guaranteed to be defined after the above check
      if (pollData.meta?.targetDemographics) {
        const target = pollData.meta.targetDemographics;
        if (!userId) throw new Error('This poll is targeted to a specific audience. Please log in to vote.');
        const userDoc = await transaction.get(doc(db, 'users', userId));
        if (!userDoc.exists()) throw new Error('User data not found');
        const userData = userDoc.data();

        if (target.ageRange && userData.age) {
          const age = parseInt(userData.age);
          if (age < target.ageRange[0] || age > target.ageRange[1])
            throw new Error(`This poll is only for users aged ${target.ageRange[0]}–${target.ageRange[1]}.`);
        } else if (target.ageRange) {
          throw new Error(`This poll requires you to set your age in profile (${target.ageRange[0]}–${target.ageRange[1]}).`);
        }
        if (target.genders?.length > 0) {
          if (!userData.gender) throw new Error('This poll requires you to specify your gender in your profile.');
          if (!target.genders.includes(userData.gender)) throw new Error('Your gender does not match the target audience for this poll.');
        }
        if (target.locations?.length > 0) {
          const userCountry = userData.location?.country;
          if (!userCountry) throw new Error('This poll requires you to set your country in your profile.');
          if (!target.locations.includes(userCountry))
            throw new Error(`This poll is only available in specific countries (${target.locations.join(', ')}).`);
        }
      }

      if (pollData.type === 'rating') {
        const rating = parseInt(optionId);
        const scale = pollData.scale || { min: 1, max: 5 };
        if (isNaN(rating) || rating < scale.min || rating > scale.max) throw new Error('Invalid rating');
      } else {
        if (!pollData.options?.some((opt: any) => opt.id === optionId)) throw new Error('Invalid option');
      }

      const voteData: any = {
        pollId,
        optionId,
        createdAt: serverTimestamp(),
        metadata: {
          ip: 'client-side',
          userAgent: navigator.userAgent,
          location: country,
          category: pollData.category,
        },
      };

      if (anonymous) {
        voteData.deviceId = voterKey;
        if (userId) {
          const userDoc = await transaction.get(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const ud = userDoc.data();
            voteData.demographics = {
              age: ud.age || null,
              gender: ud.gender || null,
              country: ud.location?.country || null,
            };
          }
        }
      } else {
        // userId must be defined here because we're in non-anonymous path and we have the earlier check
        const currentUserId = userId!;
        voteData.userId = currentUserId;
        const userDoc = await transaction.get(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          voteData.user = {
            id: currentUserId,
            name: ud.name || 'Anonymous',
            profileImage: ud.profileImage || null,
            username: ud.username,
            age: ud.age || null,
            gender: ud.gender || null,
            location: ud.location || null,
          };
        }
      }

      if (accessCode) voteData.accessCode = accessCode;
      transaction.set(doc(db, 'votes', voteId), voteData);

      if (pollData.type === 'rating') {
        const rating = parseInt(optionId);
        const ratingCounts: Record<string, number> = pollData.ratingCounts || {};
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
        const sumRatings = Object.entries(ratingCounts).reduce((s, [r, c]) => s + parseInt(r) * c, 0);
        transaction.update(pollRef, {
          ratingCounts,
          averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
          totalVotes: increment(1),
        });
      } else {
        const options = pollData.options.map((opt: any) =>
          opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
        );
        transaction.update(pollRef, { options, totalVotes: increment(1) });
      }

      if (userId && !anonymous && pollData.creator?.id !== userId) {
        sendVoteNotification(pollId, userId, pollData.creator?.id, pollData.question).catch(console.error);
      }

      return true;
    });
  }
}

export async function hasUserVoted(pollId: string, userId?: string, checkAnonymous: boolean = true): Promise<boolean> {
  if (userId) {
    const snap = await getDoc(doc(db, 'votes', `${pollId}_${userId}`));
    if (snap.exists()) return true;
  }
  if (checkAnonymous) {
    const voterKey = await getVoterKey();
    const snap = await getDoc(doc(db, 'votes', `${pollId}_${voterKey}`));
    if (snap.exists()) return true;
  }
  return false;
}

export async function getPollVotes(pollId: string): Promise<any[]> {
  const votesQuery = query(collection(db, 'votes'), where('pollId', '==', pollId), where('userId', '!=', null));
  const snapshot = await getDocs(votesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAnalyticsVotes(pollId: string): Promise<any[]> {
  const votesQuery = query(collection(db, 'votes'), where('pollId', '==', pollId));
  const snapshot = await getDocs(votesQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      optionId: data.optionId,
      demographics: data.demographics || null,
      userId: data.userId || null,
      metadata: data.metadata || null,
    };
  });
}

export async function getUserVotes(userId: string): Promise<any[]> {
  try {
    const votesSnapshot = await getDocs(query(collection(db, 'votes'), where('userId', '==', userId)));
    const userVotes = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isAnonymous: false }));
    const voterKey = await getVoterKey();
    const anonSnapshot = await getDocs(query(collection(db, 'votes'), where('deviceId', '==', voterKey)));
    const anonymousVotes = anonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isAnonymous: true }));
    return [...userVotes, ...anonymousVotes];
  } catch (error) {
    console.error('Error getting user votes:', error);
    return [];
  }
}