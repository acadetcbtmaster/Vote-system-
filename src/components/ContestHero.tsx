import React from 'react';
import { Contest } from '../types';
import { Search, Check, Heart, Eye, Users, Smartphone, ShieldCheck } from 'lucide-react';
import { ContestCountdown } from './ContestCountdown';

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

  // Format end date nicely
  const formattedEndDate = contest.end_time
    ? new Date(contest.end_time).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '2 October, 2026';

  return (
    <div className="w-full bg-[#0d3f26] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b-4 border-[#125835] shadow-inner">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Main University Portal Heading (matching Screenshot) */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
          {contest.title || 'Official Contest Voting Portal'}
        </h1>

        {/* Subtitle (matching screenshot) */}
        <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 font-medium mt-2 max-w-2xl leading-snug">
          {contest.description || 'Verified electoral ballot system. One person, one choice.'}
        </p>

        {/* Pill Badges Row (matching screenshot APPLICATION PERIOD / APPLICATION FEE style) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a5a37] border border-[#2e7a4d] text-xs font-bold text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200 uppercase font-semibold">CONTEST STATUS:</span>
            <span className="font-extrabold">{isVotingOpen ? 'ONGOING' : contest.status.toUpperCase()}</span>
          </div>

          {/* Voting Period / Deadline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a5a37] border border-[#2e7a4d] text-xs font-bold text-white shadow-xs">
            <span>📅</span>
            <span className="text-emerald-200 uppercase font-semibold">APPLICATION / VOTING PERIOD:</span>
            <span className="font-extrabold">{formattedEndDate}</span>
          </div>

          {/* Total Views Badge */}
          <div 
            id="hero-views-badge"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a5a37] border border-[#2e7a4d] text-xs font-bold text-white shadow-xs"
            title="Total Portal Page Views (increments automatically when voters visit)"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-200 uppercase font-semibold">VIEWS:</span>
            <span className="font-black text-white tabular-nums">{viewsCount.toLocaleString()}</span>
          </div>

          {/* Total Followers Badge */}
          <div 
            id="hero-followers-badge"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a5a37] border border-[#2e7a4d] text-xs font-bold text-white shadow-xs"
            title="Total Channel Followers (increments when a voter clicks follow or casts a ballot)"
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-200 uppercase font-semibold">FOLLOWERS:</span>
            <span className="font-black text-white tabular-nums">{followersCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Live Countdown Timer (Visible when enabled by Admin in Admin Panel) */}
        {contest.show_countdown && (
          <div className="w-full mt-6 max-w-xl">
            <ContestCountdown
              endTime={contest.end_time}
              status={contest.status}
              title="Official Voting Countdown"
            />
          </div>
        )}

        {/* Informational Cards (Exact replica of the two green cards in the screenshot) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
          {/* Card 1: Voting Guidelines & Eligibility */}
          <div className="bg-[#082717] border border-[#1b5e39] rounded-2xl p-4 sm:p-5 text-emerald-100 text-xs sm:text-sm leading-relaxed shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                <span>📎</span>
                <span>Official Voting Guidelines</span>
              </div>
              <p>
                Voters should select their preferred candidate from the official verified ballot below. 
                Each browser/device is strictly allocated <strong>{contest.max_submissions_per_device || 2} submissions</strong>. 
                You do <strong>not</strong> need an account to complete this vote.
              </p>
            </div>

            {/* Device Status sub-indicator */}
            <div className="mt-4 pt-3 border-t border-[#1b5e39]/60 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Your Device Ballots:</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#134d2e] text-white font-bold border border-[#236742]">
                {deviceStatus.submissionsUsed} / {deviceStatus.maxAllowed} Used
              </span>
            </div>
          </div>

          {/* Card 2: Official Channel & Verification */}
          <div className="bg-[#082717] border border-[#1b5e39] rounded-2xl p-4 sm:p-5 text-emerald-100 text-xs sm:text-sm leading-relaxed shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                <span>💳</span>
                <span>Official Contest Channel &amp; Updates</span>
              </div>
              <p>
                Follow the official channel to authenticate your ballot and receive real-time electoral results. 
                Joining the channel confirms your choice for this contest.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1b5e39]/60 flex items-center justify-between gap-3">
              {onFollow && (
                <button
                  id="hero-card-follow-btn"
                  type="button"
                  onClick={onFollow}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    isFollowing
                      ? 'bg-emerald-800 text-white border border-emerald-600'
                      : 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Following Official Channel</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-slate-950" />
                      <span>Click here to Follow Official Channel</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contestant Search Bar (Styled with matching clean container) */}
        <div className="w-full max-w-xl mt-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300" />
            <input
              id="contestant-search-input"
              type="text"
              placeholder="Search candidates by name or candidate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#082717] border border-[#1d643d] focus:border-emerald-400 rounded-xl text-sm text-white placeholder-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
