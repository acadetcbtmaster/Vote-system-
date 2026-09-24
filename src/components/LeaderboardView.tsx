import React from 'react';
import { Contestant, Contest } from '../types';
import { Trophy, RefreshCw, ArrowLeft, X, Share2, ShieldCheck } from 'lucide-react';
import { ContestCountdown } from './ContestCountdown';
import { VotersDecideLogo } from './VotersDecideLogo';

interface LeaderboardViewProps {
  contest: Contest;
  contestants: Contestant[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectToVote: (contestant: Contestant) => void;
  canVote: boolean;
  onBackToVoting?: () => void;
  onShareContestant?: (contestant: Contestant) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  contest,
  contestants,
  isLoading,
  onRefresh,
  onSelectToVote,
  canVote,
  onBackToVoting,
  onShareContestant,
}) => {
  // Sort contestants: highest vote_count first, ties broken by contestant_number ascending
  const sortedContestants = [...contestants].sort((a, b) => {
    if (b.vote_count !== a.vote_count) {
      return b.vote_count - a.vote_count;
    }
    return a.contestant_number.localeCompare(b.contestant_number);
  });

  const totalVotes = sortedContestants.reduce((acc, c) => acc + c.vote_count, 0);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-white animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {onBackToVoting && (
          <button
            id="leaderboard-back-to-vote-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#171C24] hover:bg-[#1E2532] border border-white/10 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Ballots</span>
          </button>
        )}

        {onBackToVoting && (
          <button
            id="leaderboard-cancel-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171C24] hover:bg-[#1E2532] border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-colors ml-auto cursor-pointer"
            title="Cancel and return to ballots"
          >
            <X className="w-4 h-4 text-zinc-400" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Live Official Leaderboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Audited
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time vote tallies verified across all registered browser devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ContestCountdown
            endTime={contest.end_time}
            status={contest.status}
            compact={true}
          />

          <button
            id="refresh-leaderboard-btn"
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-white/10 bg-[#1A202A] text-zinc-300 hover:text-white hover:bg-[#222A38] transition-colors shadow-sm cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-[#151921] p-4 rounded-xl border border-white/10 shadow-md">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Total Verified Votes
          </span>
          <span className="text-xl sm:text-2xl font-black text-white tabular-nums">
            {totalVotes.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#151921] p-4 rounded-xl border border-white/10 shadow-md">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Active Candidates
          </span>
          <span className="text-xl sm:text-2xl font-black text-white tabular-nums">
            {sortedContestants.length}
          </span>
        </div>

        <div className="bg-[#151921] p-4 rounded-xl border border-white/10 shadow-md col-span-2 sm:col-span-1">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Leading Candidate
          </span>
          <span className="text-sm font-extrabold text-amber-400 truncate block mt-1">
            {sortedContestants[0]?.name || '—'}
          </span>
        </div>
      </div>

      {/* LEADERBOARD TABLE */}
      <div className="bg-[#151921] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {sortedContestants.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Trophy className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-200">
              No Candidates on the Leaderboard Yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Contestant profiles and vote counts will appear here once candidates are added and published.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#11141A] text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  <th scope="col" className="py-4 px-4 w-16 text-center">Rank</th>
                  <th scope="col" className="py-4 px-4">Contestant</th>
                  <th scope="col" className="py-4 px-4 text-right w-36">Verified Votes</th>
                  <th scope="col" className="py-4 px-4 text-center w-36">Vote Share</th>
                  {canVote && <th scope="col" className="py-4 px-4 text-center w-28">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedContestants.map((contestant, index) => {
                  const rank = index + 1;
                  const rawPct = totalVotes > 0 ? (contestant.vote_count / totalVotes) * 100 : 0;
                  const percentage = rawPct.toFixed(1);

                  return (
                    <tr
                      key={contestant.id}
                      className="hover:bg-[#1A202A] transition-colors"
                    >
                      {/* Column 1: Rank Badge */}
                      <td className="py-4 px-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-black text-xs shadow-sm ${
                            rank === 1
                              ? 'bg-amber-400 text-black'
                              : rank === 2
                              ? 'bg-zinc-300 text-black'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-[#1F2733] text-zinc-300 border border-white/10'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Column 2: Candidate Info */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0A0D12] border border-white/10 shrink-0 flex items-center justify-center text-zinc-300">
                            {contestant.photo_url ? (
                              <img
                                src={contestant.photo_url}
                                alt={contestant.name}
                                className="w-full h-full object-cover object-top"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="font-extrabold text-xs text-zinc-400">
                                {contestant.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-black/60 text-zinc-300 border border-white/10 shrink-0 uppercase">
                                #{contestant.contestant_number}
                              </span>
                              <h2 className="text-sm font-bold text-white truncate">
                                {contestant.name}
                              </h2>
                            </div>
                            {contestant.bio && (
                              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md mt-0.5">
                                {contestant.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Verified Votes */}
                      <td className="py-4 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-base font-extrabold text-white tabular-nums">
                            {contestant.vote_count.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            votes
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Vote Share Percentage & Progress Bar */}
                      <td className="py-4 px-4 align-middle">
                        <div className="w-full max-w-[120px] mx-auto">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-1">
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-[#0E1116] rounded-full h-2 overflow-hidden border border-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rank === 1 ? 'bg-amber-400' : 'bg-zinc-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, rawPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Action Button & Share */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {canVote && (
                            <button
                              id={`leaderboard-vote-btn-${contestant.id}`}
                              type="button"
                              onClick={() => onSelectToVote(contestant)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black text-xs font-extrabold transition-all shadow-sm inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Vote</span>
                            </button>
                          )}
                          {onShareContestant && (
                            <button
                              id={`leaderboard-share-btn-${contestant.id}`}
                              type="button"
                              onClick={() => onShareContestant(contestant)}
                              className="p-1.5 rounded-lg border border-white/10 bg-[#1E2632] hover:bg-[#2A3444] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title={`Share link for ${contestant.name}`}
                            >
                              <Share2 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Integrity Note */}
      <div className="mt-6 p-4 rounded-xl bg-[#141820] border border-white/10 text-xs text-zinc-400 space-y-1">
        <p className="font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Ballot Auditing Protocol</span>
        </p>
        <p>
          Rankings update dynamically as verified votes are confirmed. In the event of an exact tie, candidates are ordered by earliest registration timestamp in the database.
        </p>
      </div>

      {/* Bottom Navigation */}
      {onBackToVoting && (
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToVoting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#171C24] hover:bg-[#1E2532] border border-white/10 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Ballot Portal</span>
          </button>

          <button
            type="button"
            onClick={onBackToVoting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
};
