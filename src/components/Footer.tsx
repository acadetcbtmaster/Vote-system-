import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenVote: () => void;
  onOpenLeaderboard: () => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenVote, onOpenLeaderboard, onOpenShare }) => {
  return (
    <footer className="bg-[#0B132B] border-t border-slate-800 text-slate-400 text-xs mt-auto w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 pb-8 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-amber-500 bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-black">
                ✓
              </div>
              <span className="text-white font-extrabold text-base sm:text-lg tracking-tight">
                Voters Decide
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              An authoritative public participation and voting platform built for transparent, verified contests. Certified server-side validation and atomic database counts.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Anti-abuse and duplicate submission protected</span>
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <span className="text-white font-bold text-xs uppercase tracking-wider block mb-3">
              Platform Rules
            </span>
            <ul className="space-y-2 text-xs">
              <li>1 Browser/Device = Max 2 Submissions</li>
              <li>Server-Authoritative Vote Verification</li>
              <li>Real-Time Supabase Synchronization</li>
              <li>Official Web Results Source of Truth</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <span className="text-white font-bold text-xs uppercase tracking-wider block mb-3">
              Navigation
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenVote}
                  className="hover:text-white transition-colors"
                >
                  Public Voting Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="hover:text-white transition-colors"
                >
                  Live Leaderboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hover:text-white transition-colors"
                >
                  Administrator Portal
                </button>
              </li>
              {onOpenShare && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenShare}
                    className="hover:text-white transition-colors text-emerald-400 font-semibold"
                  >
                    Rally &amp; Share Contest
                  </button>
                </li>
              )}
              <li>
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Official WhatsApp Channel
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Required Copyright & Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-center sm:text-left">
          <p className="text-slate-400 font-medium">
            © Voters Decide — Created by Menmex
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-slate-500">
            <span>Server-Verified</span>
            <span>•</span>
            <span>Mobile-First Responsive</span>
            <span>•</span>
            <span>Supabase Cloud Integration</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
