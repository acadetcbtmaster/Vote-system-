import React, { useState } from 'react';
import { Contestant } from '../types';
import { X, Check, Copy, Share2, ExternalLink } from 'lucide-react';

interface CandidateShareModalProps {
  contestant: Contestant;
  onClose: () => void;
}

export const CandidateShareModal: React.FC<CandidateShareModalProps> = ({
  contestant,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate direct link pointing straight to this contestant
  const directUrl = `${window.location.origin}${window.location.pathname}?contestant=${encodeURIComponent(contestant.id)}`;

  const candidateNumber = String(contestant.contestant_number || 1).padStart(2, '0');
  const shareText = `🗳️ Vote for ${contestant.name} (Candidate No. ${candidateNumber}) in Voters Decide! Click this direct link to cast your verified vote:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${directUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(directUrl)}&hashtags=VotersDecide,VoteNow,Elections`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${contestant.name} — Voters Decide`,
          text: shareText,
          url: directUrl,
        });
      } catch {
        // Share cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      id="candidate-share-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        id="candidate-share-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              Personal Sharing Link
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Candidate Card Snippet */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F5EFEB] border border-slate-200 flex items-center justify-center">
                {contestant.photo_url ? (
                  <img
                    src={contestant.photo_url}
                    alt={contestant.name}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-extrabold text-slate-700 text-sm">
                    {contestant.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#0B132B] text-white">
                  #{candidateNumber}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-extrabold text-slate-900 truncate">
                {contestant.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {contestant.bio || 'Official Contestant on Voters Decide'}
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-1">
                Direct link takes voters straight to this candidate!
              </span>
            </div>
          </div>

          {/* 1-Click Social Share Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Share Direct To:
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-transform"
              >
                <span className="text-base">💬</span>
                <span>WhatsApp</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2.5 px-3 rounded-xl bg-[#0F1419] hover:bg-black active:scale-[0.98] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-transform"
              >
                <span className="text-base">𝕏</span>
                <span>X (Twitter)</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebookShare}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-transform"
              >
                <span className="text-base">f</span>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Copy Direct URL Bar */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 block">
              Direct Candidate Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B132B] hover:bg-slate-900 text-white'
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

          {/* Mobile Native Share option */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>More Sharing Options (Mobile)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
