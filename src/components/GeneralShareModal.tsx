import React, { useState } from 'react';
import { Contest } from '../types';
import { X, Check, Copy, Share2, Sparkles, Send } from 'lucide-react';

interface GeneralShareModalProps {
  contest: Contest | null;
  onClose: () => void;
}

export const GeneralShareModal: React.FC<GeneralShareModalProps> = ({
  contest,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const contestUrl = `${window.location.origin}${window.location.pathname}`;
  const contestTitle = contest?.title || 'Voters Decide — Official Public Contest';
  const shareText = `🗳️ Check out the candidates and cast your verified vote in ${contestTitle}! Make your voice count:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(contestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${contestUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(contestUrl)}&hashtags=VotersDecide,VoteNow,PublicElection`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(contestUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(contestUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: contestTitle,
          text: shareText,
          url: contestUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      id="general-share-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        id="general-share-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              Rally &amp; Share Contest
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-xl shadow-xs">
              🗳️
            </div>
            <h3 className="text-base font-extrabold text-slate-950">
              Invite Friends &amp; Spread the Word
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Share the official Voters Decide contest link to bring in voters and support candidates across communities.
            </p>
          </div>

          {/* Social Channels 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform"
            >
              <span className="text-lg">💬</span>
              <span>WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={handleTwitterShare}
              className="p-3 rounded-2xl bg-[#0F1419] hover:bg-black active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform"
            >
              <span className="text-base font-black">𝕏</span>
              <span>X (Twitter)</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookShare}
              className="p-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform"
            >
              <span className="text-base font-black">f</span>
              <span>Facebook</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleTelegramShare}
              className="p-3 rounded-2xl bg-[#229ED9] hover:bg-[#1c8ec4] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </button>
          </div>

          {/* Copy Contest URL Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Official Contest Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={contestUrl}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#0B132B] hover:bg-slate-900 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Share */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>More Share Options</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
