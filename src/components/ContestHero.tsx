import React from 'react';
import { Contest } from '../types';
import { ShieldCheck, Calendar, Info, Search, Smartphone, Check, Share2, Eye, Users, Heart } from 'lucide-react';
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
  onOpenShare,
  viewsCount = 0,
  followersCount = 0,
  isFollowing = false,
  onFollow,
}) => {
  const isVotingOpen = contest.status === 'active';

  // Format end date nicely
  const formattedEndDate = contest.end_time
    ? new Date(contest.end_time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'May 31, 2025';

  return (
    <div className="bg-white border-b border-slate-200 text-slate-900 pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Hero Section: Left Text/Badges/Countdown, Right Ballot Illustration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
          {/* Left Hero Column */}
          <div className="lg:col-span-7">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Voters Decide
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mt-1.5">
              Your Voice. Their Future.
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3 max-w-xl leading-relaxed">
              Support your favourite contestant and help them win. One person. One choice.
            </p>

            {/* Status & Deadline Pills (Matching Screen 1) */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {/* Contest Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                <span className="text-slate-400 font-medium">Contest Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVotingOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isVotingOpen ? 'Ongoing' : contest.status.toUpperCase()}
                </span>
              </div>

              {/* Voting Ends Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Voting Ends</span>
                <span className="text-slate-900 font-bold">{formattedEndDate}</span>
              </div>

              {/* 1. GREEN SLOT: Numbers of views slot */}
              <div 
                id="hero-views-slot"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-400 text-xs font-bold text-emerald-900 shadow-2xs select-none"
                title="Total Site Views"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-black text-emerald-950 tabular-nums">
                  {viewsCount.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Views</span>
              </div>

              {/* 2. WHITE SLOT: Followers views slot */}
              <div 
                id="hero-followers-slot"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs select-none"
                title="Official Channel Followers &amp; Voters"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-black text-slate-950 tabular-nums">
                  {followersCount.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-slate-600">Followers</span>
              </div>

              {/* 3. RED BUTTON: Follow button */}
              {onFollow && (
                <button
                  id="hero-follow-btn"
                  type="button"
                  onClick={onFollow}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-xs cursor-pointer ${
                    isFollowing
                      ? 'bg-red-800 text-white border border-red-700'
                      : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white border border-red-500'
                  }`}
                  title={isFollowing ? 'You are following this contest channel' : 'Follow contest channel'}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

              {/* General Shill / Share Contest Button */}
              {onOpenShare && (
                <button
                  id="hero-share-contest-btn"
                  type="button"
                  onClick={onOpenShare}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share &amp; Shill Contest</span>
                </button>
              )}
            </div>

            {/* Live Countdown Timer */}
            <div className="mt-6 max-w-xl">
              <ContestCountdown
                endTime={contest.end_time}
                status={contest.status}
                title="Official Contest Countdown"
              />
            </div>
          </div>

          {/* Right Hero Column: Official Ballot Visual Card (Matching Screen 1) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] p-6 sm:p-8 text-white shadow-xl border border-slate-800">
              {/* Warm decorative background glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

              {/* Graphic Ballot Mockup */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Simulated Ballot Box & Casting Ballot */}
                <div className="relative mb-6">
                  {/* The Ballot Box Slot */}
                  <div className="w-44 h-28 sm:w-52 sm:h-32 rounded-2xl bg-slate-800/90 border-2 border-slate-700 shadow-inner flex flex-col items-center justify-end p-4 relative overflow-hidden">
                    <div className="w-28 h-2.5 rounded-full bg-slate-950 border border-slate-600 mb-2 shadow-inner" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      OFFICIAL BALLOT BOX
                    </span>
                  </div>

                  {/* The Voting Ballot Paper Being Inserted */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 sm:w-36 bg-white text-slate-900 rounded-xl shadow-2xl p-3 border border-slate-200 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                      <span className="text-[9px] font-black uppercase text-slate-400">Official Ballot</span>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-16 bg-slate-200 rounded-full" />
                      <div className="h-1.5 w-20 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Verified Digital Ballots
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Every submission is verified and locked to your device for 100% fair and transparent results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Rules & Device Status Notification Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {/* Rule Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white text-slate-700 shrink-0 border border-slate-200 shadow-2xs">
              <Info className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Participation Rule</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Maximum <strong>{contest.max_submissions_per_device || 2} submissions</strong> allowed per browser/device. You can vote for the same or different contestants. Real-time updates are synced with Supabase.
              </p>
            </div>
          </div>

          {/* Device Participation Status Card */}
          <div className={`border rounded-xl p-4 flex items-start gap-3 ${
            deviceStatus.remainingSubmissions > 0
              ? 'bg-slate-50 border-slate-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`p-2 rounded-lg shrink-0 ${
              deviceStatus.remainingSubmissions > 0
                ? 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Your Device Status</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800 shadow-2xs">
                  {deviceStatus.submissionsUsed} / {deviceStatus.maxAllowed} Used
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {deviceStatus.remainingSubmissions > 0 ? (
                  <>You have <strong className="text-emerald-700 font-semibold">{deviceStatus.remainingSubmissions}</strong> {deviceStatus.remainingSubmissions === 1 ? 'submission' : 'submissions'} remaining on this device.</>
                ) : (
                  <span className="text-amber-800 font-medium">You have reached the maximum 2 submissions limit for this contest.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Meet the Contestants Header & Search Bar (Matching Screen 1) */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mb-4">
            Meet the Contestants
          </h2>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="contestant-search-input"
              type="text"
              placeholder="Search contestants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
