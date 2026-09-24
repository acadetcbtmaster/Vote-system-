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
      className={`group relative bg-[#151921]/95 backdrop-blur-md rounded-xl border transition-all duration-200 flex flex-col p-3.5 sm:p-4 shadow-lg hover:shadow-2xl ${
        isTargeted
          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-[#1A202A]'
          : isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/20 bg-[#1A202A]'
          : 'border-white/10 hover:border-white/20 hover:bg-[#181E27]'
      }`}
    >
      {/* Targeted candidate banner when arriving via direct personal share link */}
      {isTargeted && (
        <div className="mb-2.5 px-3 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-black uppercase tracking-wider flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Invited Candidate</span>
          </div>
          <span className="text-[10px] font-extrabold opacity-80">Direct Link</span>
        </div>
      )}

      {/* Photo Frame Container */}
      <div className="relative aspect-4/3 w-full bg-[#0D1015] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
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
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4">
            <div className="w-14 h-14 rounded-full bg-[#1A212B] border border-white/15 flex items-center justify-center text-zinc-200 font-extrabold text-lg shadow-inner">
              {getInitials(contestant.name)}
            </div>
          </div>
        )}

        {/* Candidate Number Pill Badge */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-md text-xs font-black tracking-wider bg-black/80 backdrop-blur-md text-zinc-200 shadow-md border border-white/15 uppercase">
            Candidate {formattedNumber}
          </span>
        </div>

        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-black shadow-md uppercase tracking-wider ${
                rank === 1
                  ? 'bg-amber-400 text-black'
                  : rank === 2
                  ? 'bg-zinc-300 text-black'
                  : rank === 3
                  ? 'bg-amber-700 text-white'
                  : 'bg-black/70 text-zinc-300 border border-white/10'
              }`}
            >
              Rank #{rank}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-3.5 pb-1 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-amber-300 transition-colors line-clamp-1">
            {contestant.name}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-1 min-h-[34px]">
            {contestant.bio || 'Official ballot candidate for Voters Decide.'}
          </p>
        </div>

        {/* Footer: Vote Count & Action Buttons */}
        <div className="pt-3 mt-auto">
          {showVoteCount && (
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-3 pb-2 border-b border-white/10">
              <span className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold">
                Verified Votes
              </span>
              <span className="text-white font-extrabold tabular-nums text-sm">
                {contestant.vote_count.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Main Vote Button */}
            <button
              id={`vote-btn-${contestant.id}`}
              type="button"
              onClick={() => onSelect(contestant)}
              disabled={!canVote}
              className={`flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm ${
                !canVote
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : isSelected
                  ? 'bg-emerald-500 text-black'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black shadow-amber-500/20'
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
                <span>Vote Candidate</span>
              )}
            </button>

            {/* Candidate Share Button */}
            {onShare && (
              <button
                id={`share-contestant-${contestant.id}-btn`}
                type="button"
                onClick={() => onShare(contestant)}
                className="py-2.5 px-3 rounded-lg border border-white/10 bg-[#1C232E] hover:bg-[#252E3D] active:scale-[0.98] text-zinc-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                title={`Share direct link to vote for ${contestant.name}`}
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
