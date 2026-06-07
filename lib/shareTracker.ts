// lib/shareTracker.ts
// Works on both client and server (no browser APIs)
import { db } from './firebase';
import { doc, runTransaction, increment, setDoc } from 'firebase/firestore';

export async function recordShare(pollId: string, userId: string | null = null): Promise<boolean> {
  if (!pollId) {
    console.error('[shareTracker] No pollId provided');
    return false;
  }

  console.log(`[shareTracker] Attempting to record share for poll ${pollId}${userId ? ` (user: ${userId})` : ''}`);

  const analyticsRef = doc(db, 'pollAnalytics', pollId);
  const pollRef = doc(db, 'polls', pollId);

  try {
    await runTransaction(db, async (transaction) => {
      const analyticsSnap = await transaction.get(analyticsRef);
      if (analyticsSnap.exists()) {
        transaction.update(analyticsRef, { shares: increment(1) });
      } else {
        transaction.set(analyticsRef, { shares: 1 });
      }
      transaction.update(pollRef, { totalShares: increment(1) });
    });
    console.log(`[shareTracker] ✅ Share recorded successfully (transaction) for poll ${pollId}`);
    return true;
  } catch (err) {
    console.warn('[shareTracker] Transaction failed, trying fallback:', (err as Error).message);
    try {
      await setDoc(analyticsRef, { shares: increment(1) }, { merge: true });
      await setDoc(pollRef, { totalShares: increment(1) }, { merge: true });
      console.log(`[shareTracker] ✅ Share recorded successfully (fallback) for poll ${pollId}`);
      return true;
    } catch (fallbackErr) {
      console.error('[shareTracker] ❌ All share recording methods failed:', fallbackErr);
      return false;
    }
  }
}