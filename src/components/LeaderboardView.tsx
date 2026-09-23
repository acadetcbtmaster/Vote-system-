import React from 'react';
import { Contestant, Contest } from '../types';
import { Trophy, RefreshCw, ArrowLeft, X, CheckCircle2, Share2 } from 'lucide-react';
import { ContestCountdown } from './ContestCountdown';

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
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Navigation: Back Button & Side Cancel Button */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {onBackToVoting && (
          <button
            id="leaderboard-back-to-vote-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Contest Voting</span>
          </button>
        )}

        {onBackToVoting && (
          <button
            id="leaderboard-cancel-btn"
            type="button"
            onClick={onBackToVoting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-semibold transition-colors ml-auto"
            title="Cancel and return to front page"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close / Front Page</span>
          </button>
        )}
      </div>

      {/* Title & Live Status Bar matching Screen 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Live Leaderboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Updated in real time
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
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Verified Votes
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {totalVotes.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Active Candidates
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {sortedContestants.length}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Leading Candidate
          </span>
          <span className="text-sm font-bold text-emerald-700 truncate block mt-1">
            {sortedContestants[0]?.name || '—'}
          </span>
        </div>
      </div>

      {/* LEADERBOARD TABLE FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {sortedContestants.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              No Contestants on the Leaderboard Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Contestant profiles and vote counts will appear here once candidates are added and published by the administrator.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th scope="col" className="py-3.5 px-4">Contestant</th>
                  <th scope="col" className="py-3.5 px-4 text-right w-36">Verified Votes</th>
                  <th scope="col" className="py-3.5 px-4 text-center w-36">Vote Share</th>
                  {canVote && <th scope="col" className="py-3.5 px-4 text-center w-28">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedContestants.map((contestant, index) => {
                  const rank = index + 1;
                  const rawPct = totalVotes > 0 ? (contestant.vote_count / totalVotes) * 100 : 0;
                  const percentage = rawPct.toFixed(1);

                  return (
                    <tr 
                      key={contestant.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      {/* Column 1: Rank Badge matching Screen 5 */}
                      <td className="py-4 px-4 text-center align-middle">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAB308] text-slate-950 font-black text-xs shadow-xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#94A3B8] text-white font-black text-xs shadow-xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D97706] text-white font-black text-xs shadow-xs">
                            3
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            {rank}
                          </span>
                        )}
                      </td>

                      {/* Column 2: Candidate Info (Photo, Number, Name, Bio) */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail with sand/beige background */}
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F5EFEB] border border-slate-200 shrink-0 flex items-center justify-center text-slate-800">
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
                              <span className="font-extrabold text-xs text-slate-700">
                                {contestant.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#0B132B] text-white shrink-0">
                                No. {contestant.contestant_number}
                              </span>
                              <h2 className="text-sm font-extrabold text-slate-950 truncate">
                                {contestant.name}
                              </h2>
                            </div>
                            {contestant.bio && (
                              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5">
                                {contestant.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Verified Votes matching Screen 5 */}
                      <td className="py-4 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-base font-extrabold text-slate-950 tabular-nums">
                            {contestant.vote_count.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            votes
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Vote Share Percentage & Progress Bar */}
                      <td className="py-4 px-4 align-middle">
                        <div className="w-full max-w-[120px] mx-auto">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rank === 1 ? 'bg-[#EAB308]' : 'bg-[#0B132B]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, rawPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Action Button & Personal Share */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {canVote && (
                            <button
                              id={`leaderboard-vote-btn-${contestant.id}`}
                              type="button"
                              onClick={() => onSelectToVote(contestant)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#0B132B] hover:bg-slate-950 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1"
                            >
                              <span>Vote</span>
                            </button>
                          )}
                          {onShareContestant && (
                            <button
                              id={`leaderboard-share-btn-${contestant.id}`}
                              type="button"
                              onClick={() => onShareContestant(contestant)}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 transition-colors shadow-2xs"
                              title={`Share link for ${contestant.name}`}
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* Tie-Breaking & Transparency Note */}
      <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">
          Official Tie-Breaking Rule
        </p>
        <p>
          In the event of an exact tie in vote totals, rankings are ordered by earliest contestant registration number and verified transaction timestamp in the database.
        </p>
      </div>
    </div>
  );
};
