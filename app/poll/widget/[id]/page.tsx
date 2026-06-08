// app/poll/widget/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { submitVote, hasUserVoted } from '@/lib/vote';
import { X, Check, Share2, ExternalLink } from 'lucide-react';

export default function PollWidget() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const pollRef = doc(db, 'polls', id);
    const unsubscribe = onSnapshot(pollRef, (docSnap) => {
      if (docSnap.exists()) {
        setPoll({ id: docSnap.id, ...docSnap.data() });
        setLoading(false);
      } else {
        setError('Poll not found');
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setError('Failed to load poll');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (poll && !voted) {
      const checkVoted = async () => {
        try {
          const already = await hasUserVoted(poll.id, undefined, true);
          setVoted(already);
        } catch (err) {
          console.error('Vote check error:', err);
        }
      };
      checkVoted();
    }
  }, [poll, voted]);

  const handleVote = async () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // ✅ Pass undefined instead of null for userId
      await submitVote(
        poll.id,
        selectedOption,
        undefined,
        true,
        undefined
      );
      setVoted(true);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Vote failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/poll/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.question || 'Vote on this poll',
          url: url,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeWidget = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0f1120] rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-3 border-gray-200 dark:border-white/15 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0f1120] rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={closeWidget}
            className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold shadow hover:shadow-md transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.totalVotes || 0;
  const isExpired = poll.endsAt && new Date(poll.endsAt) < new Date();
  const canVote = !voted && !isExpired;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closeWidget}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-[#0f1120] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/8">
            <button
              onClick={closeWidget}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                P
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">PollMeNow</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
              {poll.question}
            </h2>
            {poll.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-5">{poll.description}</p>
            )}

            {isExpired && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 mb-5 flex items-center gap-2">
                <span className="text-amber-600">⏰</span>
                <span className="text-sm text-amber-800 dark:text-amber-300 font-medium">This poll has ended</span>
              </div>
            )}

            {!canVote ? (
              // Results view
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Results</p>
                  <p className="text-xs text-gray-500">{totalVotes.toLocaleString()} votes</p>
                </div>
                <div className="space-y-3">
                  {poll.options.map((opt: any) => {
                    const percent = totalVotes > 0 ? ((opt.votes || 0) / totalVotes) * 100 : 0;
                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-800 dark:text-gray-200">{opt.text}</span>
                          <span className="font-semibold text-primary">{Math.round(percent)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {voted && !isExpired && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-2 text-green-700 dark:text-green-300 text-sm">
                    <Check size={16} />
                    Thank you for voting!
                  </div>
                )}
              </div>
            ) : (
              // Voting form – using option.id
              <>
                <div className="space-y-3 mb-6">
                  {poll.options.map((opt: any) => (
                    <label
                      key={opt.id}
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedOption === opt.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="option"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                        className="w-4 h-4 text-primary focus:ring-primary mr-3"
                      />
                      <span className="text-gray-800 dark:text-gray-200">{opt.text}</span>
                    </label>
                  ))}
                </div>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button
                  onClick={handleVote}
                  disabled={submitting || !selectedOption}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Voting...
                    </>
                  ) : (
                    'Cast Vote'
                  )}
                </button>
              </>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/8 flex flex-wrap gap-3 justify-between items-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition"
              >
                {copied ? (
                  <><Check size={16} /> Copied!</>
                ) : (
                  <><Share2 size={16} /> Share this poll</>
                )}
              </button>
              <Link
                href={`/poll/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open in app <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}