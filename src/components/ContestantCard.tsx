import React from 'react';
import { Contestant } from '../types';
import { CheckCircle2, Share2, Sparkles } from 'lucide-react';

interface ContestantCardProps {
  contestant: Contestant;
  rank?: number;
  isSelected?: boolean;
  canVote: boolean;
  onSelect: (contestant: Contestant) => void;
  showVoteCount?: boolean;
  isTargeted?: boolean;
  onShare?: (contestant: Contestant) => void;
}

export const ContestantCard: React.FC<ContestantCardProps> = ({
  contestant,
  rank,
  isSelected,
  canVote,
  onSelect,
  showVoteCount = true,
  isTargeted = false,
  onShare,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const formattedNumber = String(contestant.contestant_number || 1).padStart(2, '0');

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (fullName.slice(0, 2) || 'VD').toUpperCase();
  };

  return (
    <div 
      id={`contestant-card-${contestant.id}`}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col p-3 sm:p-3.5 shadow-2xs hover:shadow-md ${
        isTargeted
          ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/10'
          : isSelected 
          ? 'border-slate-900 ring-2 ring-slate-900/10' 
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Targeted candidate banner when arriving via direct personal share link */}
      {isTargeted && (
        <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-between shadow-xs animate-pulse">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invited Candidate</span>
          </div>
          <span className="text-[10px] uppercase opacity-90">Direct Link</span>
        </div>
      )}

      {/* Photo Container with Warm Beige/Sand Background */}
      <div className="relative aspect-4/3 w-full bg-[#F5EFEB] rounded-xl overflow-hidden flex items-center justify-center">
        {contestant.photo_url && !imageError ? (
          <img
            src={contestant.photo_url}
            alt={contestant.name}
            className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 p-4">
            <div className="w-14 h-14 rounded-full bg-slate-200/80 border border-slate-300 flex items-center justify-center text-slate-800 font-extrabold text-lg shadow-2xs">
              {getInitials(contestant.name)}
            </div>
          </div>
        )}

        {/* Contestant Number Pill Badge */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-[#0B132B] text-white shadow-md border border-slate-700">
            {formattedNumber}
          </span>
        </div>

        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-2.5 right-2.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
              rank === 1 ? 'bg-amber-400 text-slate-950' :
              rank === 2 ? 'bg-slate-300 text-slate-900' :
              rank === 3 ? 'bg-amber-600 text-white' :
              'bg-slate-900/80 text-white'
            }`}>
              #{rank}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-3 pb-1 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950 leading-snug group-hover:text-slate-800 transition-colors line-clamp-1">
            {contestant.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 min-h-[32px]">
            {contestant.bio || 'Candidate for the official Voters Decide contest.'}
          </p>
        </div>

        {/* Footer: Vote Count & Action Buttons */}
        <div className="pt-2 mt-auto">
          {showVoteCount && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2.5">
              <span className="text-sm">🗳️</span>
              <span className="text-slate-900 font-bold tabular-nums">
                {contestant.vote_count.toLocaleString()}
              </span>
              <span>votes</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Main Vote Button */}
            <button
              id={`vote-btn-${contestant.id}`}
              type="button"
              onClick={() => onSelect(contestant)}
              disabled={!canVote}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                !canVote
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#0B132B] hover:bg-slate-950 active:scale-[0.99] text-white shadow-xs'
              }`}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selected</span>
                </>
              ) : !canVote ? (
                <span>Limit Reached</span>
              ) : (
                <span>Vote</span>
              )}
            </button>

            {/* Personal Sharing Button */}
            {onShare && (
              <button
                id={`share-contestant-${contestant.id}-btn`}
                type="button"
                onClick={() => onShare(contestant)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                title={`Share direct link to vote for ${contestant.name}`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
