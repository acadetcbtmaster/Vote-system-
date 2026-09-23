import React, { useState, useEffect, useCallback } from 'react';
import { Header, PortalTab } from './components/Header';
import { ContestHero } from './components/ContestHero';
import { ContestantCard } from './components/ContestantCard';
import { VoteModal } from './components/VoteModal';
import { FollowChannelModal } from './components/FollowChannelModal';
import { SuccessScreen } from './components/SuccessScreen';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { CandidateShareModal } from './components/CandidateShareModal';
import { GeneralShareModal } from './components/GeneralShareModal';
import { Contest, Contestant, VoteSubmissionResult, DeviceStatusResult } from './types';
import { getOrCreateDeviceToken } from './lib/deviceToken';
import { supabaseClient } from './lib/supabase';
import { dataService } from './services/dataService';
import { AlertCircle, Loader2, CheckCircle2, Shield, Trophy, Users } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<PortalTab>('public');
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Device participation status
  const [deviceToken] = useState<string>(() => getOrCreateDeviceToken());
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusResult>({
    submissionsUsed: 0,
    remainingSubmissions: 2,
    maxAllowed: 2,
    canVote: true,
    contestStatus: 'active',
  });

  // Modal and submission state
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccessResult, setVoteSuccessResult] = useState<VoteSubmissionResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Post-vote popup modal: "Last step: follow this channel for your vote to count"
  const [pendingFollowData, setPendingFollowData] = useState<{
    contestant: Contestant;
    voteResult: VoteSubmissionResult;
  } | null>(null);

  // Sharing modals
  const [showGeneralShareModal, setShowGeneralShareModal] = useState(false);
  const [sharingContestant, setSharingContestant] = useState<Contestant | null>(null);
  const [targetedContestantId, setTargetedContestantId] = useState<string | null>(null);

  // Views and Followers metric counts
  const [viewsCount, setViewsCount] = useState<number>(3482);
  const [followersCount, setFollowersCount] = useState<number>(1250);
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vd_is_following') === 'true';
    } catch {
      return false;
    }
  });

  // Instruction 1: Once a voter clicks on the link and enters the website, the views number should add
  useEffect(() => {
    const recordPageView = async () => {
      try {
        const data = await dataService.recordView(contest?.slug || 'official-contest');
        if (typeof data.views_count === 'number') {
          setViewsCount(data.views_count);
        }
        if (typeof data.followers_count === 'number') {
          setFollowersCount(data.followers_count);
        }
      } catch (err) {
        console.warn('Could not record entry view', err);
      }
    };
    recordPageView();
  }, []);

  // Instruction 3: And once a voter clicks on follow, the follower number should add and say following
  const handleFollow = async () => {
    if (isFollowing) {
      setToastMessage('You are already following Voters Decide!');
      return;
    }

    setIsFollowing(true);
    try {
      localStorage.setItem('vd_is_following', 'true');
    } catch {}

    setFollowersCount(prev => prev + 1);
    setToastMessage('Thank you! You are now following the official contest channel.');

    try {
      const newCount = await dataService.followChannel(contest?.slug || 'official-contest');
      if (typeof newCount === 'number') {
        setFollowersCount(newCount);
      }
    } catch (err) {
      console.warn('Could not record follow', err);
    }
  };

  // 1. Fetch Contest & Contestants from server or direct client service (GitHub Pages ready)
  const fetchContestData = useCallback(async (slug = 'official-contest') => {
    try {
      const data = await dataService.getContest(slug);
      setContest(data.contest);
      if (data.contest) {
        if (typeof data.contest.views_count === 'number') {
          setViewsCount(data.contest.views_count);
        }
        if (typeof data.contest.followers_count === 'number') {
          setFollowersCount(data.contest.followers_count);
        }
      }
      setContestants(data.contestants || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Network error fetching contest data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch Device Participation Status
  const fetchDeviceStatus = useCallback(async (slug = 'official-contest') => {
    if (!deviceToken) return;
    try {
      const data = await dataService.getDeviceStatus(slug, deviceToken);
      setDeviceStatus(data as any);
    } catch (e) {
      console.warn('Failed to fetch device participation status', e);
    }
  }, [deviceToken]);

  // Initial load
  useEffect(() => {
    fetchContestData();
    fetchDeviceStatus();
  }, [fetchContestData, fetchDeviceStatus]);

  // Scroll to top on tab or result change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, voteSuccessResult]);

  // Real-time updates: Supabase Realtime channel + Periodic polling fallback
  useEffect(() => {
    let intervalId: any;

    if (supabaseClient) {
      const client = supabaseClient;
      const channel = client
        .channel('public:contestants')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contestants' },
          () => {
            fetchContestData();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } else {
      intervalId = setInterval(() => {
        fetchContestData();
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [fetchContestData]);

  // Detect direct contestant link in URL (?contestant=ID or ?c=ID)
  // Takes the voter directly to that contestant!
  useEffect(() => {
    if (contestants.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const targetParam = params.get('contestant') || params.get('c');
      if (targetParam) {
        const found = contestants.find(
          (c) =>
            c.id === targetParam ||
            c.contestant_number === targetParam ||
            c.contestant_number === targetParam.padStart(2, '0')
        );
        if (found) {
          setTargetedContestantId(found.id);
          setActiveTab('public');
          setVoteSuccessResult(null);

          // Smooth scroll straight to that contestant's card
          setTimeout(() => {
            const el = document.getElementById(`contestant-card-${found.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 400);
        }
      }
    } catch (e) {
      console.warn('URL parsing error', e);
    }
  }, [contestants]);

  // Handle Vote Submission
  const handleVoteSubmit = async (voterData: { fullName: string; whatsappNumber: string }) => {
    if (!selectedContestant || !contest) return;

    setIsSubmittingVote(true);
    setVoteError(null);

    try {
      const data = await dataService.submitVote(contest.slug, {
        contestantId: selectedContestant.id,
        deviceToken,
        voterName: voterData.fullName,
        voterWhatsapp: voterData.whatsappNumber,
      });

      if (!data.success) {
        const errMessage = data.message || data.error || 'Vote could not be processed.';
        setVoteError(errMessage);
        fetchDeviceStatus(contest.slug);
        return;
      }

      // Vote accepted! Close vote modal and IMMEDIATELY trigger the Follow Channel pop-up!
      const currentSelected = selectedContestant;
      setSelectedContestant(null);
      setPendingFollowData({
        contestant: currentSelected,
        voteResult: data as any,
      });

      // Once a voter cast their vote the follows numbers should add
      if (typeof data.followers_count === 'number') {
        setFollowersCount(data.followers_count);
      } else {
        setFollowersCount(prev => prev + 1);
      }

      // Refresh contest and device counts in background
      await fetchContestData(contest.slug);
      await fetchDeviceStatus(contest.slug);
    } catch (err: any) {
      setVoteError('Network connection failed. Please check your connection and try again.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Filter contestants based on search term
  const filteredContestants = contestants.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.contestant_number.includes(q) ||
      (c.bio && c.bio.toLowerCase().includes(q))
    );
  });

  if (isLoading && !contest) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading Voters Decide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header: "Voters Decide" at the top; Home, Leaderboard (leadership), Admin & Share buttons at the bottom of it */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setVoteSuccessResult(null);
        }}
        contestTitle={contest?.title}
        onOpenShare={() => setShowGeneralShareModal(true)}
        viewsCount={viewsCount}
        followersCount={followersCount}
        isFollowing={isFollowing}
        onFollow={handleFollow}
      />

      {/* Main Content Areas */}
      <main className="flex-1 w-full max-w-full">
        {activeTab === 'admin' ? (
          <AdminDashboard
            onBackToApp={() => setActiveTab('public')}
            onRefreshPublicData={() => {
              fetchContestData();
              fetchDeviceStatus();
            }}
            currentDeviceToken={deviceToken}
          />
        ) : voteSuccessResult ? (
          /* SUCCESS SCREEN AFTER VOTING (Shows Receipt & Social Sharing) */
          <SuccessScreen
            result={voteSuccessResult}
            whatsappChannelUrl={contest?.whatsapp_channel_url || 'https://whatsapp.com'}
            onViewLeaderboard={() => {
              setVoteSuccessResult(null);
              setActiveTab('leaderboard');
            }}
            onVoteAgain={
              deviceStatus.remainingSubmissions > 0
                ? () => {
                    setVoteSuccessResult(null);
                    setActiveTab('public');
                  }
                : undefined
            }
            onBackToVoting={() => {
              setVoteSuccessResult(null);
              setActiveTab('public');
            }}
          />
        ) : activeTab === 'leaderboard' ? (
          /* LEADERBOARD VIEW */
          contest && (
            <LeaderboardView
              contest={contest}
              contestants={contestants}
              isLoading={isLoading}
              onRefresh={() => fetchContestData(contest.slug)}
              onSelectToVote={(c) => {
                setSelectedContestant(c);
                setVoteError(null);
              }}
              canVote={deviceStatus.canVote}
              onBackToVoting={() => setActiveTab('public')}
              onShareContestant={(c) => setSharingContestant(c)}
            />
          )
        ) : (
          /* PUBLIC VIEW (PUBLIC VOTING PAGE) */
          <div className="w-full max-w-full">
            {contest && (
              <ContestHero
                contest={contest}
                deviceStatus={deviceStatus}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onRefresh={() => {
                  fetchContestData(contest.slug);
                  fetchDeviceStatus(contest.slug);
                }}
                onOpenShare={() => setShowGeneralShareModal(true)}
                viewsCount={viewsCount}
                followersCount={followersCount}
                isFollowing={isFollowing}
                onFollow={handleFollow}
              />
            )}

            {/* Contestants Grid & Empty State Section */}
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Official Contest Voting
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Verified candidate entries. Select a candidate below to cast your vote (Max {contest?.max_submissions_per_device || 2} votes per device).
                  </p>
                </div>
              </div>

              {/* Contestants List or Empty State */}
              {contestants.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs my-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    No Contestants Added Yet
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Official contestants will appear here once added and approved by the platform administrator.
                  </p>
                  <button
                    id="btn-goto-admin-login"
                    onClick={() => setActiveTab('admin')}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Admin Login to Add Contestants</span>
                  </button>
                </div>
              ) : filteredContestants.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 sm:p-12 text-center max-w-lg mx-auto">
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    No contestants found matching &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Try searching with another keyword or clear the search input.
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredContestants.map((contestant) => (
                    <ContestantCard
                      key={contestant.id}
                      contestant={contestant}
                      canVote={deviceStatus.canVote}
                      isSelected={selectedContestant?.id === contestant.id}
                      isTargeted={targetedContestantId === contestant.id}
                      onSelect={(c) => {
                        setSelectedContestant(c);
                        setVoteError(null);
                      }}
                      onShare={(c) => setSharingContestant(c)}
                      showVoteCount={contest?.is_public_leaderboard_visible ?? true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* STEP 1: VOTER DETAILS & CONFIRMATION MODAL */}
      {selectedContestant && (
        <VoteModal
          contestant={selectedContestant}
          onClose={() => {
            setSelectedContestant(null);
            setVoteError(null);
          }}
          onSubmit={handleVoteSubmit}
          isSubmitting={isSubmittingVote}
          errorMessage={voteError}
          remainingSubmissions={deviceStatus.remainingSubmissions}
        />
      )}

      {/* STEP 2: POST-VOTE POP-UP ("Last step follow this channel for your vote to count") */}
      {pendingFollowData && (
        <FollowChannelModal
          contestant={pendingFollowData.contestant}
          voteResult={pendingFollowData.voteResult}
          whatsappChannelUrl={contest?.whatsapp_channel_url || 'https://whatsapp.com'}
          onFollow={handleFollow}
          onContinueToReceipt={() => {
            const res = pendingFollowData.voteResult;
            setPendingFollowData(null);
            setVoteSuccessResult(res);
          }}
        />
      )}

      {/* STEP 3: CONTESTANT PERSONAL SHARING MODAL */}
      {sharingContestant && (
        <CandidateShareModal
          contestant={sharingContestant}
          onClose={() => setSharingContestant(null)}
        />
      )}

      {/* STEP 4: GENERAL PLATFORM SHILLING / SHARE MODAL */}
      {showGeneralShareModal && (
        <GeneralShareModal
          contest={contest}
          onClose={() => setShowGeneralShareModal(false)}
        />
      )}

      {/* Global Footer */}
      <Footer
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenVote={() => {
          setActiveTab('public');
          setVoteSuccessResult(null);
        }}
        onOpenLeaderboard={() => {
          setActiveTab('leaderboard');
          setVoteSuccessResult(null);
        }}
        onOpenShare={() => setShowGeneralShareModal(true)}
      />
    </div>
  );
}
