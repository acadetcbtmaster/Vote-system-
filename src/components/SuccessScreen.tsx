import React from 'react';
import {
  Trophy,
  Smartphone,
  ArrowLeft,
  X,
  MessageCircle,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { VoteSubmissionResult } from '../types';
import { SocialShareCard } from './SocialShareCard';
import { VotersDecideLogo } from './VotersDecideLogo';

interface SuccessScreenProps {
  result: VoteSubmissionResult;
  whatsappChannelUrl: string;
  onViewLeaderboard: () => void;
  onVoteAgain?: () => void;
  onBackToVoting?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  result,
  whatsappChannelUrl,
  onViewLeaderboard,
  onVoteAgain,
  onBackToVoting,
}) => {
  const remaining = result.remaining_submissions ?? 0;
  const used = result.submissions_used ?? 1;
  const contestant = result.contestant;

  const handleFollowChannel = () => {
    if (whatsappChannelUrl) {
      window.open(whatsappChannelUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 text-white animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {onBackToVoting && (
          <button
            id="success-back-to-vote-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#171C24] hover:bg-[#1E2532] border border-white/10 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Ballots</span>
          </button>
        )}

        {onBackToVoting && (
          <button
            id="success-cancel-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171C24] hover:bg-[#1E2532] border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-colors ml-auto cursor-pointer"
            title="Cancel and return to ballots"
          >
            <X className="w-4 h-4 text-zinc-400" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      <div className="bg-[#151921] rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-10 text-center">
        {/* Verified Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          <Check className="w-8 h-8 stroke-[3.5]" />
        </div>

        {/* Primary Confirmation Headline */}
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-3">
          ✓ Vote Confirmed &amp; Sealed
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          You Have Successfully Voted and Your Record Has Been Saved
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 mb-6 max-w-lg mx-auto leading-relaxed">
          Your channel follow has been verified and your official vote is safely counted and logged in the election registry.
        </p>

        {/* Recorded Vote Summary Card */}
        {contestant && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-[#1A202A] border border-white/10 text-left shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">
              Verified Ballot Selection
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-extrabold text-white">
                  {contestant.name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Candidate #{contestant.contestant_number} • <strong className="text-amber-400 tabular-nums">{contestant.vote_count.toLocaleString()}</strong> votes
                </p>
              </div>
              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                Confirmed
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp Channel Follow Card */}
        <div className="max-w-md mx-auto p-5 sm:p-6 rounded-xl bg-[#181E27] border border-white/10 shadow-md text-center mb-6">
          <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-5 h-5 fill-[#25D366]" />
          </div>

          <h2 className="text-sm sm:text-base font-extrabold text-white mb-1">
            Follow Official Channel
          </h2>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Follow the official Voters Decide channel to authenticate your submission and track election results.
          </p>

          <button
            id="follow-whatsapp-channel-btn"
            type="button"
            onClick={handleFollowChannel}
            className="w-full py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.99] text-black font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>Follow WhatsApp Channel</span>
          </button>
        </div>

        {/* Device Quota Status */}
        <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-[#181E27] border border-white/10 text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <span className="font-medium">Device Voting Quota:</span>
          </div>
          <span className="font-extrabold text-white tabular-nums">
            {used} of 2 used {remaining > 0 ? `(${remaining} remaining)` : '(Maximum limit reached)'}
          </span>
        </div>

        {/* SOCIAL MEDIA SHARING COMPONENT */}
        <div className="mb-6">
          <SocialShareCard contestant={contestant} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="success-view-leaderboard-btn"
            type="button"
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-200 hover:text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>View Live Leaderboard</span>
          </button>

          {remaining > 0 && onVoteAgain && (
            <button
              id="success-vote-again-btn"
              type="button"
              onClick={onVoteAgain}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              Cast Your 2nd Vote
            </button>
          )}

          {onBackToVoting && (
            <button
              id="success-return-front-page-btn"
              type="button"
              onClick={onBackToVoting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1F2733] hover:bg-[#283241] text-zinc-200 hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span>Back to Ballot Portal</span>
            </button>
          )}

          {onBackToVoting && (
            <button
              id="success-cancel-bottom-btn"
              type="button"
              onClick={onBackToVoting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
