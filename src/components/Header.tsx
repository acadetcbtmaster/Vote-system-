import React, { useState } from 'react';
import { Home, Trophy, Shield, Share2, Menu, X, Eye, Users, Check, Heart } from 'lucide-react';

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
  contestTitle = 'Federal University of Health Sciences Otukpo',
  onOpenShare,
  viewsCount = 0,
  followersCount = 0,
  isFollowing = false,
  onFollow,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-xs w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* TOP BAR: University Seal + Title + Clean Menu Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Institutional Brand Logo & Title (matching screenshot) */}
          <div 
            id="header-brand-logo"
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setActiveTab('public')}
            title="Return to Public Portal"
          >
            {/* University / Institutional Crest Seal */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-700 bg-emerald-50 p-1 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-full h-full text-emerald-800" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.14-2.73 8.01-6 9.08-3.27-1.07-6-4.94-6-9.08V6.43l6-2.25zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
              </svg>
            </div>

            <div>
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 leading-tight tracking-tight">
                {contestTitle || 'Federal University of Health Sciences Otukpo'}
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                Official Electoral &amp; Decision System
              </p>
            </div>
          </div>

          {/* Desktop Right Actions: Views, Followers, Follow & Nav */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Numbers of views slot (Green) */}
            <div 
              id="header-views-slot"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs select-none"
              title="Total Site Views"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-extrabold tabular-nums">
                {viewsCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-700">Views</span>
            </div>

            {/* Followers views slot (White/Border) */}
            <div 
              id="header-followers-slot"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs select-none"
              title="Official Channel Followers &amp; Voters"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-extrabold tabular-nums">
                {followersCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Followers</span>
            </div>

            {/* Follow button (Red/Maroon) */}
            {onFollow && (
              <button
                id="header-follow-btn"
                type="button"
                onClick={onFollow}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black transition-all shadow-2xs cursor-pointer ${
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

            {/* Desktop Navigation Links */}
            <nav className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('public')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'public'
                    ? 'bg-[#0d3f26] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'leaderboard'
                    ? 'bg-[#0d3f26] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-[#0d3f26] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              {onOpenShare && (
                <button
                  type="button"
                  onClick={onOpenShare}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 border border-slate-200"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share</span>
                </button>
              )}
            </nav>
          </div>

          {/* Mobile Clean Hamburger Button (matching screenshot icon) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 transition-colors shadow-2xs"
              aria-label="Toggle Portal Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (matching university portal style) */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              {/* Views */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                <Eye className="w-3 h-3 text-emerald-700" />
                <span>{viewsCount.toLocaleString()} Views</span>
              </div>

              {/* Followers */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-800 text-xs font-bold">
                <Users className="w-3 h-3 text-slate-600" />
                <span>{followersCount.toLocaleString()} Followers</span>
              </div>

              {/* Follow button */}
              {onFollow && (
                <button
                  type="button"
                  onClick={onFollow}
                  className={`px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                    isFollowing
                      ? 'bg-red-800 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isFollowing ? '✓ Following' : 'Follow'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('public');
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  activeTab === 'public'
                    ? 'bg-[#0d3f26] text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('leaderboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  activeTab === 'leaderboard'
                    ? 'bg-[#0d3f26] text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-[#0d3f26] text-white'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>

              {onOpenShare && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShare();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-50 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
