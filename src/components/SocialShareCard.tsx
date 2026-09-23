import React, { useState } from 'react';
import { 
  MessageCircle, 
  Twitter, 
  Facebook, 
  Share2, 
  Copy, 
  Check, 
  Send
} from 'lucide-react';
import { Contestant } from '../types';

interface SocialShareCardProps {
  contestant?: {
    contestant_number?: string;
    name?: string;
  } | null;
  contestTitle?: string;
}

export const SocialShareCard: React.FC<SocialShareCardProps> = ({
  contestant,
  contestTitle = 'Voters Decide',
}) => {
  const [copied, setCopied] = useState(false);

  // Dynamic share text and URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = currentOrigin || (typeof window !== 'undefined' ? window.location.href : '');

  const candidateLabel = contestant
    ? `Contestant ${contestant.contestant_number} (${contestant.name})`
    : 'my preferred candidate';

  const shareText = `I just cast my verified vote for ${candidateLabel} in the official ${contestTitle} contest! 🗳️ Every vote counts—cast yours now before voting closes:`;

  const handleShareWhatsApp = () => {
    const fullMsg = `${shareText}\n${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    const textToCopy = `${shareText} ${shareUrl}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${candidateLabel} — ${contestTitle}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User dismissed share dialog
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="w-full max-w-md mx-auto mb-6 p-5 sm:p-6 rounded-2xl bg-[#0B132B] text-white shadow-md border border-slate-800 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/10">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Share Your Vote & Rally Support
            </h3>
            <p className="text-[11px] text-slate-400">
              Rally friends to vote for {contestant ? contestant.name : 'your candidate'}!
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Verified Vote
        </span>
      </div>

      {/* Share Message Preview Box */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 text-xs text-slate-300 relative group">
        <p className="italic leading-relaxed font-sans text-[11px]">
          "{shareText}"
        </p>
      </div>

      {/* 1-Click Platform Buttons: WhatsApp, X (Twitter), Facebook */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* WhatsApp Button */}
        <button
          id="share-whatsapp-btn"
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          title="Share directly to WhatsApp chat or status"
        >
          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
          <span>WhatsApp</span>
        </button>

        {/* X (Twitter) Button */}
        <button
          id="share-twitter-btn"
          type="button"
          onClick={handleShareTwitter}
          className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-slate-900 active:scale-[0.98] border border-white/20 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          title="Post on X (Twitter)"
        >
          <Twitter className="w-4 h-4 fill-white shrink-0" />
          <span>X (Twitter)</span>
        </button>

        {/* Facebook Button */}
        <button
          id="share-facebook-btn"
          type="button"
          onClick={handleShareFacebook}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          title="Share to Facebook Feed or Groups"
        >
          <Facebook className="w-4 h-4 fill-white shrink-0" />
          <span>Facebook</span>
        </button>
      </div>

      {/* Secondary Actions: Copy Link & Native Share */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
        <button
          id="copy-share-link-btn"
          type="button"
          onClick={handleCopyLink}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Link & Message Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Link & Message</span>
            </>
          )}
        </button>

        {hasNativeShare && (
          <button
            id="native-share-btn"
            type="button"
            onClick={handleNativeShare}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
            title="More share options (Telegram, Instagram, SMS)"
          >
            <Send className="w-3.5 h-3.5 text-slate-400" />
            <span>More</span>
          </button>
        )}
      </div>
    </div>
  );
};
