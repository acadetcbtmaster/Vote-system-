import React from 'react';
import { Check, Home, Trophy, Shield, Share2, Eye, Users, Heart } from 'lucide-react';

export type PortalTab = 'public' | 'leaderboard' | 'admin';

interface HeaderProps {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  contestTitle?: string;
  isLive?: boolean;
  onOpenShare?: () => void;
  viewsCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
  onFollow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenShare,
  viewsCount = 0,
  followersCount = 0,
  isFollowing = false,
  onFollow,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B132B] border-b border-slate-800 text-white shadow-md w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        {/* TIER 1 (TOP): Voters Decide Branding + Views (Green), Followers (White), Follow (Red) */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-2 gap-2 sm:gap-4">
          <div 
            id="header-brand-logo"
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => setActiveTab('public')}
            title="Voters Decide Front Page"
          >
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 bg-amber-500/15 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Check className="w-4 h-4 text-amber-500 stroke-[3.5]" />
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-tight text-white whitespace-nowrap">
              Voters Decide
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Verified Public Voting
            </span>
          </div>

          {/* Social Proof & Follow Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
            {/* 1. Numbers of views slot (Green) */}
            <div 
              id="header-views-slot"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-xs select-none"
              title="Total Site Views"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-extrabold text-white tabular-nums">
                {viewsCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400">Views</span>
            </div>

            {/* 2. Followers views slot (White) */}
            <div 
              id="header-followers-slot"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-900 border border-slate-200 text-xs font-bold shadow-xs select-none"
              title="Official Channel Followers & Voters"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-extrabold text-slate-950 tabular-nums">
                {followersCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Followers</span>
            </div>

            {/* 3. Follow button (Red) */}
            {onFollow && (
              <button
                id="header-follow-btn"
                type="button"
                onClick={onFollow}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black transition-all shadow-xs cursor-pointer ${
                  isFollowing
                    ? 'bg-red-800 text-white border border-red-700'
                    : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white border border-red-500'
                }`}
                title={isFollowing ? 'You are following this contest channel' : 'Click to follow contest channel'}
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
          </div>
        </div>

        {/* TIER 2 (BOTTOM OF IT): Home, Leaderboard (Leadership), Admin & Share Buttons */}
        <div className="border-t border-slate-800/80 pt-2 flex items-center justify-center">
          <nav 
            id="header-nav-bottom"
            className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap"
            aria-label="Main Navigation"
          >
            {/* Home button with icon */}
            <button
              id="portal-tab-public"
              type="button"
              onClick={() => setActiveTab('public')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'public'
                  ? 'text-white bg-white/15 shadow-xs border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>Home</span>
            </button>

            {/* Leaderboard (Leadership) button with icon */}
            <button
              id="nav-leaderboard-btn"
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'text-white bg-white/15 shadow-xs border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            {/* Admin button with icon */}
            <button
              id="nav-admin-btn"
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-amber-400 bg-white/15 shadow-xs border border-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Admin</span>
            </button>

            {/* General Platform Shilling / Share button */}
            {onOpenShare && (
              <button
                id="nav-share-contest-btn"
                type="button"
                onClick={onOpenShare}
                className="px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 border border-slate-700/60"
                title="Share & Shill Contest"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                <span>Share</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
