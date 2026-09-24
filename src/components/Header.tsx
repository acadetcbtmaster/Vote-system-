import React, { useState } from 'react';
import { Home, Trophy, Shield, Share2, Menu, X, Eye, Users, Check, Heart, ExternalLink } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';

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
  contestTitle,
  onOpenShare,
  viewsCount = 0,
  followersCount = 0,
  isFollowing = false,
  onFollow,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#12161D]/95 backdrop-blur-md border-b border-white/10 text-white shadow-xl transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo & Name */}
          <div
            id="header-brand-logo"
            className="cursor-pointer select-none transition-opacity hover:opacity-90 flex items-center"
            onClick={() => setActiveTab('public')}
            title="Voters Decide — Public Voting Portal"
          >
            <VotersDecideLogo size="md" showText={true} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/8 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${
                activeTab === 'public'
                  ? 'bg-white/15 text-white shadow-sm border border-white/15'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Ballot Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-white/15 text-white shadow-sm border border-white/15'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 text-zinc-400" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Desktop Right Side: Live Metrics + Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Views Counter */}
            <div
              id="header-views-slot"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1A202A] border border-white/10 text-xs text-zinc-300 font-bold select-none shadow-sm"
              title="Real-Time Portal Views"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-extrabold text-white tabular-nums">
                {viewsCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Views</span>
            </div>

            {/* Live Followers Counter */}
            <div
              id="header-followers-slot"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1A202A] border border-white/10 text-xs text-zinc-300 font-bold select-none shadow-sm"
              title="Verified Followers"
            >
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-extrabold text-white tabular-nums">
                {followersCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Followers</span>
            </div>

            {/* Follow Button */}
            {onFollow && (
              <button
                id="header-follow-btn"
                type="button"
                onClick={onFollow}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all shadow-md cursor-pointer ${
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold shadow-amber-500/20'
                }`}
                title={isFollowing ? 'You are following Voters Decide' : 'Follow Voters Decide Channel'}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-black" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            {/* Share Platform Button */}
            {onOpenShare && (
              <button
                type="button"
                onClick={onOpenShare}
                className="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Share Voters Decide"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Right: Hamburger Menu & Mobile Follow Quick Action */}
          <div className="flex lg:hidden items-center gap-2">
            {onFollow && (
              <button
                type="button"
                onClick={onFollow}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-amber-500 text-black font-black hover:bg-amber-400'
                }`}
              >
                {isFollowing ? '✓ Following' : 'Follow'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-[#1A202A] border border-white/10 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2 space-y-3">
            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-[#181D24] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Views</span>
                </span>
                <span className="font-extrabold text-white tabular-nums">
                  {viewsCount.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#181D24] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Followers</span>
                </span>
                <span className="font-extrabold text-white tabular-nums">
                  {followersCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('public');
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'public'
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-[#181D24] text-zinc-300 border border-white/10'
                }`}
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span>Ballots</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('leaderboard');
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-[#181D24] text-zinc-300 border border-white/10'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-[#181D24] text-zinc-300 border border-white/10'
                }`}
              >
                <Shield className="w-4 h-4 text-zinc-400" />
                <span>Admin</span>
              </button>
            </div>

            {onOpenShare && (
              <button
                type="button"
                onClick={() => {
                  onOpenShare();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1A202A] hover:bg-[#222834] border border-white/10 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share Contest Link</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
