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
    ? `Candidate #${contestant.contestant_number} (${contestant.name})`
    : 'my preferred candidate';

  const shareText = `I just cast my verified vote for ${candidateLabel} in ${contestTitle}! 🗳️ Every vote counts—cast yours now:`;

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
      } catch {}
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="w-full max-w-md mx-auto mb-6 p-5 rounded-xl bg-[#151921] text-white shadow-lg border border-white/10 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Share Your Vote &amp; Rally Support
            </h3>
            <p className="text-[11px] text-zinc-400">
              Encourage supporters to vote for {contestant ? contestant.name : 'your candidate'}!
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Verified Ballot
        </span>
      </div>

      {/* Share Message Preview Box */}
      <div className="p-3 rounded-lg bg-[#0C0F14] border border-white/10 mb-4 text-xs text-zinc-300">
        <p className="italic leading-relaxed font-sans text-[11px]">
          "{shareText}"
        </p>
      </div>

      {/* 1-Click Platform Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          id="share-whatsapp-btn"
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.98] text-black font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-black shrink-0" />
          <span>WhatsApp</span>
        </button>

        <button
          id="share-twitter-btn"
          type="button"
          onClick={handleShareTwitter}
          className="w-full py-2.5 px-3 rounded-lg bg-black hover:bg-zinc-900 active:scale-[0.98] border border-white/20 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          title="Post on X (Twitter)"
        >
          <Twitter className="w-4 h-4 fill-white shrink-0" />
          <span>X / Twitter</span>
        </button>

        <button
          id="share-facebook-btn"
          type="button"
          onClick={handleShareFacebook}
          className="w-full py-2.5 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4 fill-white shrink-0" />
          <span>Facebook</span>
        </button>
      </div>

      {/* Copy Link & Native Share */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
        <button
          id="copy-share-link-btn"
          type="button"
          onClick={handleCopyLink}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-[#1C232E] hover:bg-[#252E3D] text-zinc-300 hover:text-white border border-white/10'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Link &amp; Message Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy Direct Link</span>
            </>
          )}
        </button>

        {hasNativeShare && (
          <button
            id="native-share-btn"
            type="button"
            onClick={handleNativeShare}
            className="py-2 px-3 rounded-lg bg-[#1C232E] hover:bg-[#252E3D] text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
            title="More share options"
          >
            <Send className="w-3.5 h-3.5 text-zinc-400" />
            <span>More</span>
          </button>
        )}
      </div>
    </div>
  );
};
