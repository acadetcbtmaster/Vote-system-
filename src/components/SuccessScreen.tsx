import React from 'react';
import {
  Trophy,
  Smartphone,
  ArrowLeft,
  X,
  MessageCircle,
  Check,
} from 'lucide-react';
import { VoteSubmissionResult } from '../types';
import { SocialShareCard } from './SocialShareCard';

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
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-14">
      {/* Top Navigation: Back button & Side Cancel button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {onBackToVoting && (
          <button
            id="success-back-to-vote-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Contest Voting</span>
          </button>
        )}

        {onBackToVoting && (
          <button
            id="success-cancel-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 text-xs font-semibold transition-colors ml-auto"
            title="Return to front page"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
        {/* Verified Badge - Solid Green Circle with Checkmark matching Screen 4 */}
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center mb-5 shadow-md">
          <Check className="w-8 h-8 stroke-[3.5]" />
        </div>

        {/* Primary Success Message matching Screen 4 */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-2">
          Your choice has been recorded!
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mb-6">
          Thank you for participating in Voters Decide.
        </p>

        {/* Recorded Vote Summary Card */}
        {contestant && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Verified Submission
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {contestant.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate #{contestant.contestant_number} • <strong className="text-slate-800 tabular-nums">{contestant.vote_count.toLocaleString()}</strong> votes
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Recorded
              </span>
            </div>
          </div>
        )}

        {/* ONE MORE STEP: WhatsApp Channel Card matching Screen 4 */}
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-7 h-7 fill-[#25D366] text-[#25D366]" />
          </div>

          <h2 className="text-base font-extrabold text-slate-950 mb-1">
            One more step
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
            Follow the official Voters Decide WhatsApp Channel to stay updated.
          </p>

          <button
            id="follow-whatsapp-channel-btn"
            type="button"
            onClick={handleFollowChannel}
            className="w-full py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Follow WhatsApp Channel</span>
          </button>
        </div>

        {/* Device Quota Status */}
        <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span>Device Voting Quota:</span>
          </div>
          <span className="font-bold text-slate-900">
            {used} of 2 used {remaining > 0 ? `(${remaining} remaining)` : '(Maximum limit reached)'}
          </span>
        </div>

        {/* SOCIAL MEDIA SHARING COMPONENT */}
        <SocialShareCard contestant={contestant} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="success-view-leaderboard-btn"
            type="button"
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>View Live Leaderboard</span>
          </button>

          {remaining > 0 && onVoteAgain && (
            <button
              id="success-vote-again-btn"
              type="button"
              onClick={onVoteAgain}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-950 text-white font-bold text-sm transition-colors"
            >
              Cast Your 2nd Vote
            </button>
          )}

          {onBackToVoting && (
            <button
              id="success-return-front-page-btn"
              type="button"
              onClick={onBackToVoting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Back to Contest Front Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
