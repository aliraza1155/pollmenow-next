// lib/viewTracker.ts
'use client';

import { db } from './firebase';
import { doc, runTransaction, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { getVoterKey } from './voterKey';
import { trackUserInteraction } from './analytics';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log('[ViewTracker]', ...args);
}

function error(...args: any[]) {
  if (DEBUG) console.error('[ViewTracker]', ...args);
}

export async function trackPollView(pollId: string, userId?: string): Promise<boolean> {
  const viewerKey = await getVoterKey();
  const viewId = `${pollId}_${viewerKey}`;
  log(`Tracking view for poll ${pollId}, viewerKey: ${viewerKey.substring(0, 8)}..., viewId: ${viewId}`);

  try {
    await runTransaction(db, async (transaction) => {
      const viewRef = doc(db, 'pollViews', viewId);
      const viewSnap = await transaction.get(viewRef);
      if (!viewSnap.exists()) {
        log('First view from this device – creating pollViews document and incrementing totalViews');
        transaction.set(viewRef, {
          pollId,
          viewerId: viewerKey,
          userId: userId || null,
          firstViewedAt: serverTimestamp(),
          lastViewedAt: serverTimestamp(),
          viewCount: 1,
        });
        transaction.update(doc(db, 'polls', pollId), {
          totalViews: increment(1),
          lastViewedAt: serverTimestamp(),
        });
      } else {
        const data = viewSnap.data();
        log(`Repeat view – viewCount was ${data.viewCount}, not incrementing totalViews`);
        transaction.update(viewRef, {
          lastViewedAt: serverTimestamp(),
          viewCount: increment(1),
        });
      }
    });
    log('View tracking transaction completed successfully');
    await trackUserInteraction(userId || viewerKey, 'view', { pollId, category: 'poll_view' });
    return true;
  } catch (err) {
    error('View tracking transaction failed:', (err as any).code, (err as any).message);
    return false;
  }
}

export async function hasUserViewedPoll(pollId: string, userId?: string): Promise<boolean> {
  const viewerKey = await getVoterKey();
  const viewId = `${pollId}_${userId || viewerKey}`;
  try {
    const snap = await getDoc(doc(db, 'pollViews', viewId));
    const exists = snap.exists();
    log(`hasUserViewedPoll(${pollId}) -> ${exists}`);
    return exists;
  } catch (err) {
    error('hasUserViewedPoll error:', err);
    return false;
  }
}