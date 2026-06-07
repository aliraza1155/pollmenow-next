'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { VerifiedBadge, PremiumBadge } from './UI';
import {
  BarChart3, Eye, Share2, Users, Clock,
  ChevronRight, ChevronLeft, Star, Zap,
  CheckCircle, BarChart2, Radio, Layers,
} from 'lucide-react';

const TYPE_CONFIG = {
  quick:      { label: 'Quick Poll',  Icon: Zap,         color: 'bg-amber-50 dark:bg-amber-400/12 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-400/20' },
  yesno:      { label: 'Yes / No',    Icon: CheckCircle, color: 'bg-emerald-50 dark:bg-emerald-400/12 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-400/20' },
  rating:     { label: 'Rating',      Icon: Star,        color: 'bg-orange-50 dark:bg-orange-400/12 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-400/20' },
  comparison: { label: 'Comparison',  Icon: Layers,      color: 'bg-blue-50 dark:bg-blue-400/12 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-400/20' },
  live:       { label: 'Live',        Icon: Radio,       color: 'bg-red-50 dark:bg-red-400/12 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-400/20' },
};

interface PollCardProps {
  poll: any;
  showDetailedStats?: boolean;
}

export default function PollCard({ poll, showDetailedStats = false }: PollCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalVotes = poll.totalVotes || 0;
  const totalViews = poll.totalViews || 0;
  const isExpired = poll.endsAt && new Date(poll.endsAt) < new Date();
  const isLive = poll.meta?.isLive;
  const getPercent = (votes: number) => (totalVotes > 0 ? (votes / totalVotes) * 100 : 0);

  let formattedDate = '';
  if (poll.createdAt) {
    const d = poll.createdAt instanceof Date ? poll.createdAt : new Date(poll.createdAt);
    if (!isNaN(d.getTime())) formattedDate = formatDate(d, 'short');
  }

  const typeConf = TYPE_CONFIG[poll.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.quick;
  const TypeIcon = typeConf.Icon;
  const hasOptMedia = poll.options?.some((o: any) => o.mediaUrl);
  const useCarousel = (poll.type === 'comparison' || poll.type === 'live') || hasOptMedia;

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  const renderOptions = () => {
    if (poll.type === 'rating') {
      const avg = poll.averageRating || 0;
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                size={16}
                className={i <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-white/15'}
              />
            ))}
          </div>
          {totalVotes > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {avg.toFixed(1)} · {totalVotes} votes
            </span>
          )}
        </div>
      );
    }

    if (useCarousel) {
      return (
        <div className="relative">
          {poll.options?.length > 1 && (
            <>
              <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-[#0f1120] rounded-full shadow-md flex items-center justify-center border border-gray-100 dark:border-white/10 hover:shadow-lg transition" aria-label="Previous">
                <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-[#0f1120] rounded-full shadow-md flex items-center justify-center border border-gray-100 dark:border-white/10 hover:shadow-lg transition" aria-label="Next">
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
          <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {poll.options?.map((opt: any) => {
              const pct = getPercent(opt.votes || 0);
              return (
                <div key={opt.id} className="flex-shrink-0 w-32 sm:w-36 rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden bg-white dark:bg-[#161829] shadow-sm">
                  {opt.mediaUrl ? (
                    <img src={opt.mediaUrl} alt={opt.text} className="w-full h-24 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-24 bg-gray-50 dark:bg-white/4 flex items-center justify-center text-gray-300 dark:text-white/15">
                      <Layers size={20} />
                    </div>
                  )}
                  <div className="p-2 text-center">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{opt.text}</p>
                    {totalVotes > 0 && (
                      <p className="text-xs font-bold text-primary mt-1">{pct.toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const topOptions = poll.options?.slice(0, 3) || [];
    const leading = topOptions.reduce((max: any, o: any) => (o.votes || 0) > (max.votes || 0) ? o : max, topOptions[0]);

    return (
      <div className="space-y-2">
        {topOptions.map((opt: any) => {
          const percent = getPercent(opt.votes || 0);
          const isLeading = opt.id === leading?.id && totalVotes > 0;
          return (
            <div key={opt.id}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className={`font-medium truncate flex-1 mr-2 ${isLeading ? 'text-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {opt.text}
                </span>
                {totalVotes > 0 && (
                  <span className={`font-bold flex-shrink-0 ${isLeading ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                    {percent.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-white/6 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isLeading
                      ? 'bg-gradient-to-r from-primary to-secondary'
                      : 'bg-gray-300 dark:bg-white/20'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        {(poll.options?.length || 0) > 3 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            +{poll.options.length - 3} more options
          </p>
        )}
      </div>
    );
  };

  return (
    <article className="group bg-white dark:bg-[#0f1120] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/40 hover:-translate-y-0.5 flex flex-col">

      {/* Type badge + status */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${typeConf.color}`}>
          <TypeIcon size={11} strokeWidth={2.5} />
          {typeConf.label}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isExpired && !isLive && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-white/6 px-2 py-0.5 rounded-full">Ended</span>
          )}
          {poll.accessCode && (
            <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">Private</span>
          )}
        </div>
      </div>

      {/* Question */}
      <Link href={`/poll/${poll.id}`} className="block px-4 pb-3">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#f0f0ff] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {poll.question}
        </h3>
      </Link>

      {/* Question media */}
      {poll.questionMedia && !useCarousel && (
        <div className="px-4 pb-3">
          <img
            src={poll.questionMedia.url}
            alt=""
            loading="lazy"
            className="w-full h-32 sm:h-40 object-cover rounded-xl border border-gray-100 dark:border-white/8"
          />
        </div>
      )}

      {/* Options */}
      <div className="px-4 pb-3 flex-1">
        {renderOptions()}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-white/6 bg-gray-50/50 dark:bg-white/2">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
          <span className="flex items-center gap-1 flex-shrink-0">
            <Users size={11} />
            <span className="font-medium">{totalVotes.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 hidden sm:flex">
            <Eye size={11} />
            <span>{(totalViews || 0).toLocaleString()}</span>
          </span>
          {formattedDate && (
            <span className="flex items-center gap-1 flex-shrink-0 hidden sm:flex">
              <Clock size={11} />
              <span>{formattedDate}</span>
            </span>
          )}
        </div>
        {showDetailedStats && (
          <Link href={`/poll/analytics/${poll.id}`} className="text-xs text-primary font-semibold hover:underline flex-shrink-0">
            Analytics
          </Link>
        )}
      </div>

      {/* Creator + actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/6 flex items-center gap-3">
        <Link href={`/profile/${poll.creator.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
            {poll.creator.profileImage
              ? <img src={poll.creator.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              : (poll.creator.name?.[0] || 'U').toUpperCase()
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{poll.creator.name}</span>
              {poll.creator.verified && <VerifiedBadge size={11} />}
              {(poll.creator.tier === 'premium' || poll.creator.tier === 'organization') && <PremiumBadge size={11} />}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ url: `${window.location.origin}/poll/${poll.id}`, title: poll.question });
              else navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.id}`);
            }}
            className="w-8 h-8 rounded-xl text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/8 flex items-center justify-center transition"
            aria-label="Share poll"
          >
            <Share2 size={14} />
          </button>
          <Link
            href={`/poll/${poll.id}`}
            className="flex items-center gap-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all"
          >
            Vote <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}