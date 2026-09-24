import React from 'react';
import { Contest } from '../types';
import { Search, ShieldCheck, Smartphone, Check, Heart, Eye, Users, Calendar, AlertCircle } from 'lucide-react';
import { ContestCountdown } from './ContestCountdown';
import { VotersDecideLogo } from './VotersDecideLogo';

interface ContestHeroProps {
  contest: Contest;
  deviceStatus: {
    submissionsUsed: number;
    remainingSubmissions: number;
    maxAllowed: number;
    canVote: boolean;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh: () => void;
  onOpenShare?: () => void;
  viewsCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
  onFollow?: () => void;
}

export const ContestHero: React.FC<ContestHeroProps> = ({
  contest,
  deviceStatus,
  searchTerm,
  setSearchTerm,
  viewsCount = 0,
  followersCount = 0,
  isFollowing = false,
  onFollow,
}) => {
  const isVotingOpen = contest.status === 'active';

  // Format end date cleanly
  const formattedEndDate = contest.end_time
    ? new Date(contest.end_time).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Ongoing';

  return (
    <section className="relative w-full bg-gradient-to-b from-[#13171F] via-[#10141A] to-[#0F1216] border-b border-white/10 text-white pt-8 sm:pt-12 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle depth lighting overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none blur-3xl" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Main Hero Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          {/* Official Verification Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1C232E] border border-white/10 text-xs font-bold text-zinc-300 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isVotingOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="uppercase tracking-widest text-[11px] text-zinc-400">Official Ballot</span>
            <span className="text-zinc-600">|</span>
            <span className="font-extrabold text-white">
              {isVotingOpen ? 'Active Voting' : contest.status.toUpperCase()}
            </span>
          </div>

          {/* Official Logo Display */}
          <div className="flex justify-center pt-1 pb-1">
            <VotersDecideLogo size="lg" showText={false} preferImage={false} />
          </div>

          {/* Main Platform Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white font-sans leading-none">
            {contest.title || 'Voters Decide'}
          </h1>

          {/* Official Slogan from Logo */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-zinc-200 max-w-2xl mx-auto leading-relaxed tracking-wide">
            Real People. <span className="text-[#1D7BF2]">Real Votes.</span> Real Winners.
          </p>

          {/* Subtle contest description if provided */}
          {contest.description && (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed pt-1">
              {contest.description}
            </p>
          )}
        </div>

        {/* Live Countdown Timer (Visible only when enabled by Admin) */}
        {contest.show_countdown && (
          <div className="mt-8 max-w-xl mx-auto">
            <ContestCountdown
              endTime={contest.end_time}
              status={contest.status}
              title="Official Voting Deadline"
            />
          </div>
        )}

        {/* Informational Cards & Device Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 sm:mt-10">
          {/* Card 1: Official Voting Rules */}
          <div className="bg-[#161B23]/90 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-white font-bold text-sm mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="uppercase tracking-wide text-xs">Participation Protocol</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Maximum <strong>{contest.max_submissions_per_device || 2} submissions</strong> allowed per browser/device. 
                Every vote is cryptographically logged and locked to maintain 100% integrity.
              </p>
            </div>

            {/* Device Submissions Status Indicator */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Your Device Ballots:</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#1F2733] text-white font-black border border-white/10 tabular-nums">
                  {deviceStatus.submissionsUsed} / {deviceStatus.maxAllowed} Used
                </span>
                {deviceStatus.remainingSubmissions > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-400">
                    ({deviceStatus.remainingSubmissions} left)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400">
                    (Limit reached)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Official Channel & Follow Confirmation */}
          <div className="bg-[#161B23]/90 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <VotersDecideLogo size="sm" showText={false} />
                  <span className="uppercase tracking-wide text-xs">Voters Decide Channel</span>
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold tabular-nums">
                  {followersCount.toLocaleString()} Followers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Follow the official Voters Decide channel to authenticate your choice, receive real-time results, and verify contest updates.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              {onFollow && (
                <button
                  id="hero-follow-cta"
                  type="button"
                  onClick={onFollow}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    isFollowing
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      : 'bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-extrabold shadow-amber-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
                      <span>Following Official Channel</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-black" />
                      <span>Follow Official Channel</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contestant Search Bar */}
        <div className="w-full max-w-2xl mx-auto mt-8 sm:mt-10">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="contestant-search-input"
              type="text"
              placeholder="Search contestants by name, candidate number, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#171C24] border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all shadow-md"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
