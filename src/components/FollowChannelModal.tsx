import React, { useState, useEffect, useRef } from 'react';
import { Contestant, VoteSubmissionResult } from '../types';
import { ExternalLink, Check, ShieldAlert, ArrowLeft, X, Loader2, ArrowRight } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';
import { safeOpenUrl } from '../lib/safeOpen';

interface FollowChannelModalProps {
  contestant: Contestant;
  voteResult: VoteSubmissionResult;
  whatsappChannelUrl: string;
  onVoterReturned: () => void;
  onFollow?: () => void;
  onClose?: () => void;
}

export const FollowChannelModal: React.FC<FollowChannelModalProps> = ({
  contestant,
  voteResult,
  whatsappChannelUrl,
  onVoterReturned,
  onFollow,
  onClose,
}) => {
  const [hasOpenedChannel, setHasOpenedChannel] = useState(false);
  const [isWaitingForReturn, setIsWaitingForReturn] = useState(false);
  const channelOpenTimeRef = useRef<number>(0);

  // Normalize channel URL
  const channelUrl = whatsappChannelUrl || 'https://whatsapp.com';
  const formattedNumber = String(contestant.contestant_number || 1).padStart(2, '0');

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      // If closing without following, still allow the voter to return to ballot
      onVoterReturned();
    }
  };

  const handleOpenChannel = () => {
    setHasOpenedChannel(true);
    setIsWaitingForReturn(true);
    channelOpenTimeRef.current = Date.now();
    if (onFollow) {
      onFollow();
    }
    safeOpenUrl(channelUrl, '_blank');
  };

  // Listen for the voter returning back to this link/page after following the channel
  useEffect(() => {
    if (!isWaitingForReturn) return;

    const checkAndComplete = () => {
      // Ensure at least 1.2 seconds have passed since opening channel
      // so it's a genuine return from the external app/tab
      if (Date.now() - channelOpenTimeRef.current > 1200) {
        onVoterReturned();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndComplete();
      }
    };

    const handleFocus = () => {
      checkAndComplete();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isWaitingForReturn, onVoterReturned]);

  return (
    <div
      id="follow-channel-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="follow-channel-modal"
        className="relative w-full max-w-lg bg-[#141820] text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        {/* Top Header */}
        <div className="shrink-0 bg-[#11141A] px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <VotersDecideLogo size="sm" showText={true} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
              title="Return to Ballots"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              id="close-follow-modal-btn"
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Prominent Mandatory Instruction Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 text-center space-y-2.5 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black inline-block shadow-sm">
              Required Step
            </span>

            <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              One Last Step For Your Vote To Be Recorded
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-amber-200 leading-relaxed max-w-md mx-auto">
              Follow channel and click back on the link for your vote to be recorded.
            </p>
          </div>

          {/* Candidate Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#181E27] border border-white/10 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A0D12] border border-white/10 shrink-0 flex items-center justify-center shadow-md">
              {contestant.photo_url ? (
                <img
                  src={contestant.photo_url}
                  alt={contestant.name}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-black text-zinc-300">
                  {contestant.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                Pending Vote For
              </span>
              <p className="text-sm font-extrabold text-white truncate">
                {contestant.name}
              </p>
              <p className="text-xs text-amber-400 font-bold tabular-nums">
                Candidate #{formattedNumber}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Step 1 of 2
              </span>
            </div>
          </div>

          {/* Step 1: Follow Official Channel */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs font-black flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-xs font-bold text-zinc-200">
                Follow the Official WhatsApp Channel:
              </span>
            </div>

            <button
              id="follow-official-channel-btn"
              type="button"
              onClick={handleOpenChannel}
              className={`w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer ${
                hasOpenedChannel
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                  : 'bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.99] text-black shadow-emerald-500/20'
              }`}
            >
              {hasOpenedChannel ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Channel Opened — Follow Done</span>
                </>
              ) : (
                <>
                  <span>Follow Official WhatsApp Channel</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>

          {/* Step 2: Return Back to the Link */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-xs font-bold text-zinc-200">
                Return Back to This Link:
              </span>
            </div>

            {isWaitingForReturn ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1.5 animate-pulse">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Waiting for you to return back to this link...</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Switch back to this tab or click the button below to complete your vote.
                </p>
              </div>
            ) : null}

            <button
              id="return-to-link-record-vote-btn"
              type="button"
              onClick={onVoterReturned}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                hasOpenedChannel
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25 active:scale-[0.99]'
                  : 'bg-[#1C232E] hover:bg-[#252E3D] text-zinc-300 hover:text-white border border-white/10'
              }`}
            >
              {hasOpenedChannel ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Click Back on This Link to Record Vote</span>
                </>
              ) : (
                <>
                  <span>Click Back on the Link for Your Vote to Be Recorded</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Bottom Back and Cancel Navigation */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
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
