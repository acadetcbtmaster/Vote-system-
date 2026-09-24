import React, { useState } from 'react';
import { Contest } from '../types';
import { X, Check, Copy, Share2, Sparkles, MessageCircle, Twitter, Facebook, Send, ArrowLeft } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';

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

  return (
    <div
      id="general-share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="general-share-modal"
        className="relative w-full max-w-md bg-[#141820] text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-[#11141A]">
          <div className="flex items-center gap-2">
            <VotersDecideLogo size="sm" showText={false} />
            <span className="font-extrabold text-sm tracking-tight text-white">
              Share Contest
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
              title="Return to contest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              id="close-general-share-modal-btn"
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
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Invite Voters &amp; Spread the Word
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Share this official contest portal link to invite voters to review candidates and submit their verified ballots.
            </p>
          </div>

          {/* Social Channels */}
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Share On Social Platforms
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-black font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2.5 px-3 rounded-lg bg-black hover:bg-zinc-900 border border-white/20 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Twitter className="w-4 h-4 fill-white" />
                <span>X (Twitter)</span>
              </button>

              <button
                type="button"
                onClick={handleFacebookShare}
                className="py-2.5 px-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Facebook className="w-4 h-4 fill-white" />
                <span>Facebook</span>
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="py-2.5 px-3 rounded-lg bg-[#0088CC] hover:bg-[#0077b3] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Copy Contest URL Box */}
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Contest Portal Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={contestUrl}
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
