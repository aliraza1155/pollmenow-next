'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Share2, Link as LinkIcon, MessageCircle, QrCode, X, Mail } from 'lucide-react';
import { recordShare } from '@/lib/shareTracker';

interface ShareWidgetProps {
  poll: any;
  onShare?: () => void;
  creator?: any;
}

export default function ShareWidget({ poll, onShare, creator }: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const pollUrl = `${window.location.origin}/poll/${poll.id}`;
  const encodedUrl = encodeURIComponent(pollUrl);

  const emailSubject = encodeURIComponent(poll.question);
  const emailBody = encodeURIComponent(
    poll.accessCode
      ? `🗳️ Vote on this poll: "${poll.question}"\n\nVote here: ${pollUrl}\n\nAccess code: ${poll.accessCode}\n\nThank you for participating!`
      : `🗳️ Vote on this poll: "${poll.question}"\n\nVote here: ${pollUrl}\n\nThank you for participating!`
  );
  const emailHref = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const shareLinks = [
    { name:'Twitter',  href:`https://twitter.com/intent/tweet?text=${encodeURIComponent(poll.question)}&url=${encodedUrl}`, color:'bg-[#1DA1F2] hover:bg-[#1a8cd8]',  label:'𝕏'  },
    { name:'LinkedIn', href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color:'bg-[#0A66C2] hover:bg-[#0956a8]',  label:'in' },
    { name:'WhatsApp', href:`https://wa.me/?text=${encodeURIComponent(poll.question + '\n' + pollUrl)}`, color:'bg-[#25D366] hover:bg-[#20b858]',  icon: MessageCircle },
    { name:'Email',    href: emailHref, color:'bg-gray-600 hover:bg-gray-700', icon: Mail },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(poll.accessCode ? `${pollUrl}\nAccess code: ${poll.accessCode}` : pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('[ShareWidget] Link copied to clipboard');
      onShare?.();
    } catch (err) {
      console.error('[ShareWidget] Copy failed:', err);
      alert('Failed to copy link');
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.question,
          text: poll.accessCode ? `Vote on "${poll.question}" (code: ${poll.accessCode})` : `Vote on "${poll.question}"`,
          url: pollUrl,
        });
        console.log('[ShareWidget] Native share completed');
        onShare?.();
      } catch (err) {
        console.log('[ShareWidget] Native share cancelled or failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const handleCopyWithRecord = async () => {
    console.log('[ShareWidget] Copy link – recording share');
    await recordShare(poll.id);
    await copyToClipboard();
  };

  const handleNativeShareWithRecord = async () => {
    console.log('[ShareWidget] Native share – recording share');
    await recordShare(poll.id);
    await shareNative();
  };

  const handleSocialShare = async (href: string) => {
    console.log(`[ShareWidget] Social share (${href}) – recording share`);
    await recordShare(poll.id);
    window.open(href, '_blank', 'noopener,noreferrer');
    onShare?.();
  };

  const creatorData = creator || poll.creator;

  return (
    <div className="bg-white dark:bg-[#0f1120] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="text-white font-semibold text-sm">PollMeNow</span>
        </div>
        <span className="text-white/70 text-[10px] uppercase tracking-wider">Share this poll</span>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f0ff] mb-3 line-clamp-2">
          "{poll.question}"
        </h3>

        {creatorData && (
          <Link
            href={`/profile/${creatorData.id}`}
            className="flex items-center gap-2 mb-4 group"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
              {creatorData.profileImage
                ? <img src={creatorData.profileImage} alt="" className="w-full h-full object-cover" />
                : (creatorData.name?.[0] || 'U').toUpperCase()
              }
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition">
                {creatorData.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Poll creator</p>
            </div>
          </Link>
        )}

        {poll.accessCode && (
          <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">🔑 Access code</span>
              <p className="text-lg font-mono font-bold text-amber-800 dark:text-amber-200 tracking-wider">{poll.accessCode}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(poll.accessCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition"
            >
              <Copy size={16} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyWithRecord}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium transition"
            >
              {copied ? <Check size={16} className="text-green-600 dark:text-green-400" /> : <LinkIcon size={16} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={handleNativeShareWithRecord}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow hover:opacity-90 transition"
            >
              <Share2 size={16} />
              Share via…
            </button>
          </div>

          <div className="flex justify-center gap-2 pt-2 border-t border-gray-100 dark:border-white/8">
            {shareLinks.map(social => (
              <button
                key={social.name}
                onClick={() => handleSocialShare(social.href)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 ${social.color} text-white shadow-sm font-bold text-sm`}
                aria-label={`Share on ${social.name}`}
              >
                {social.icon ? <social.icon size={16} /> : social.label}
              </button>
            ))}
            <button
              onClick={() => setShowQR(true)}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-600 dark:text-gray-400 flex items-center justify-center transition"
              aria-label="Show QR code"
            >
              <QrCode size={16} />
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-2 text-center border border-gray-100 dark:border-white/8">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {pollUrl}
              {poll.accessCode && <span className="text-amber-600 dark:text-amber-400 ml-1">(code: {poll.accessCode})</span>}
            </p>
          </div>
        </div>
      </div>

      {showQR && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white dark:bg-[#0f1120] rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl border border-gray-100 dark:border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-800 dark:text-[#f0f0ff]">QR Code</h4>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="bg-white p-2 rounded-xl inline-block mx-auto border border-gray-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pollUrl + (poll.accessCode ? `\nAccess code: ${poll.accessCode}` : ''))}`}
                alt="QR Code"
                className="w-32 h-32 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Scan to vote on this poll</p>
            <button
              onClick={handleCopyWithRecord}
              className="mt-4 w-full bg-primary/10 dark:bg-primary/15 text-primary rounded-lg py-2 text-sm font-medium hover:bg-primary/20 transition"
            >
              Copy link instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}