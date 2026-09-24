import React, { useState } from 'react';
import { Contestant } from '../types';
import { X, Check, Copy, Share2, MessageCircle, Twitter, Facebook, ArrowLeft } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';

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
  const shareText = `🗳️ Vote for ${contestant.name} (Candidate #${candidateNumber}) in Voters Decide! Click this direct link to cast your verified vote:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${directUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(directUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="candidate-share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="candidate-share-modal"
        className="relative w-full max-w-md bg-[#141820] text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-[#11141A]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-sm tracking-tight text-white">
              Candidate Voting Link
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
              title="Return to candidates"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              id="close-candidate-share-modal-btn"
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
              title="Cancel and close share"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Candidate Card Snippet */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#181E27] border border-white/10">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#0A0D12] border border-white/10 flex items-center justify-center">
                {contestant.photo_url ? (
                  <img
                    src={contestant.photo_url}
                    alt={contestant.name}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-extrabold text-sm text-zinc-400">
                    {contestant.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/60 text-zinc-300 border border-white/10">
                Candidate #{candidateNumber}
              </span>
              <h4 className="text-sm font-bold text-white mt-1 truncate">
                {contestant.name}
              </h4>
              <p className="text-xs text-zinc-400 tabular-nums">
                {contestant.vote_count.toLocaleString()} verified votes
              </p>
            </div>
          </div>

          {/* Share Channels */}
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Share On Social Networks
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2.5 px-3 rounded-lg bg-black hover:bg-zinc-900 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Twitter className="w-4 h-4 fill-white" />
                <span>X / Twitter</span>
              </button>

              <button
                type="button"
                onClick={handleFacebookShare}
                className="py-2.5 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Facebook className="w-4 h-4 fill-white" />
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Copy Direct Link Box */}
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Direct Candidate Ballot Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="flex-1 px-3 py-2.5 bg-[#0C0F14] border border-white/10 rounded-lg text-xs font-mono text-zinc-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-black'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Footer Back & Cancel Actions */}
          <div className="pt-2 flex items-center gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
