import React, { useState } from 'react';
import { Contestant, VoteSubmissionResult } from '../types';
import { ExternalLink, Check, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface FollowChannelModalProps {
  contestant: Contestant;
  voteResult: VoteSubmissionResult;
  whatsappChannelUrl: string;
  onContinueToReceipt: () => void;
  onFollow?: () => void;
}

export const FollowChannelModal: React.FC<FollowChannelModalProps> = ({
  contestant,
  voteResult,
  whatsappChannelUrl,
  onContinueToReceipt,
  onFollow,
}) => {
  const [hasClickedChannel, setHasClickedChannel] = useState(false);

  // Normalize channel URL
  const channelUrl = whatsappChannelUrl || 'https://whatsapp.com';

  const handleOpenChannel = () => {
    setHasClickedChannel(true);
    if (onFollow) {
      onFollow();
    }
    window.open(channelUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      id="follow-channel-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        id="follow-channel-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Branding Strip */}
        <div className="bg-gradient-to-r from-[#0B132B] via-slate-900 to-[#0B132B] px-6 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-amber-400 bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs font-black">
              ✓
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Voters Decide Official Verification
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Final Step
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Attention Icon & Main Heading */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <span className="text-3xl">📢</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
              Last Step: Follow This Channel For Your Vote To Count!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your submission for <span className="font-bold text-slate-900">{contestant.name}</span> has been processed. To prevent automated bot fraud and validate your vote in the official results, you must follow the contest channel.
            </p>
          </div>

          {/* Verification Callout Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-900">
                  Official Verification Notice
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Votes are audited against channel members to ensure fair and tamper-proof elections. Final tally updates and winner declarations are announced exclusively on this channel.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Follow Channel */}
          <div className="space-y-3 pt-1">
            <a
              id="follow-official-channel-btn"
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenChannel}
              className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 text-center"
            >
              <span className="text-lg">👉</span>
              <span>Follow Official WhatsApp Channel</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            {/* Confirmation / Continue Button */}
            <button
              id="confirm-followed-channel-btn"
              type="button"
              onClick={onContinueToReceipt}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                hasClickedChannel
                  ? 'bg-[#0B132B] hover:bg-slate-950 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {hasClickedChannel ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>I Have Followed The Channel — View My Vote Receipt</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>I Have Followed The Channel — Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Privacy & Quota status footer */}
          <div className="pt-1 text-center text-[11px] text-slate-400">
            <span>Quota balance: {voteResult.remaining_submissions} votes remaining on this browser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
