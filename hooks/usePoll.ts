// hooks/usePoll.ts
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertOptionsToArray, toDate } from '@/lib/utils';

interface PollData {
  id: string;
  question: string;
  type: string;
  options: any[];
  totalVotes: number;
  creator: any;
  createdAt: Date | null;
  endsAt: Date | null;
  [key: string]: any;
}

export function usePoll(pollId: string | undefined) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, 'polls', pollId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const creator = data.creator || {};
          const safeCreator = {
            id: creator.id || '',
            name: creator.name || 'Anonymous',
            username: creator.username,
            type: creator.type || 'individual',
            verified: creator.verified || false,
            profileImage: creator.profileImage,
            tier: creator.tier || 'free',
          };
          const pollData: PollData = {
            id: docSnap.id,
            question: data.question || '',
            type: data.type || 'quick',
            totalVotes: data.totalVotes || 0,
            ...data,
            creator: safeCreator,
            options: convertOptionsToArray(data.options),
            createdAt: toDate(data.createdAt),
            endsAt: toDate(data.endsAt),
          };
          setPoll(pollData);
        } else {
          setError('Poll not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Poll snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [pollId]);

  return { poll, loading, error };
}