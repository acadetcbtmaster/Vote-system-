import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenVote: () => void;
  onOpenLeaderboard: () => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenVote,
  onOpenLeaderboard,
  onOpenShare,
}) => {
  return (
    <footer className="bg-[#0D1015] border-t border-white/10 text-zinc-400 text-xs mt-auto w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-white/10">
          {/* Brand Col */}
          <div className="sm:col-span-2 space-y-4">
            <VotersDecideLogo size="md" showText={true} />
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md">
              <strong className="text-white">Real People. Real Votes. Real Winners.</strong> An authoritative, modern public participation platform built for transparent, verified ballots and fraud-resistant elections.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Cryptographically audited &amp; device rate-limited</span>
            </div>
          </div>

          {/* Platform Protocols */}
          <div>
            <span className="text-white font-black text-xs uppercase tracking-wider block mb-3.5">
              Election Protocol
            </span>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>1 Browser/Device = Max 2 Ballots</li>
              <li>Cryptographic Device Token Tracking</li>
              <li>Real-Time Dual-Path Sync</li>
              <li>Official Audited Public Results</li>
            </ul>
          </div>

          {/* Quick Navigation */}
          <div>
            <span className="text-white font-black text-xs uppercase tracking-wider block mb-3.5">
              Platform Links
            </span>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenVote}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Ballot Voting Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Live Leaderboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Administrator Portal
                </button>
              </li>
              {onOpenShare && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenShare}
                    className="hover:text-white transition-colors text-amber-400 font-bold cursor-pointer"
                  >
                    Share Contest Link
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Required Copyright & Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <p className="text-zinc-500 font-medium">
            © Voters Decide — Created by Menmex
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-500 text-[11px]">
            <span>Verified Voting System</span>
            <span>•</span>
            <span>Mobile-First Responsive</span>
            <span>•</span>
            <span>Secure Database Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
