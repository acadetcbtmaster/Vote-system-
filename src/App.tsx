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
import { InteractionToast, ToastMessage } from './components/InteractionToast';
import { VotersDecideLogo } from './components/VotersDecideLogo';
import { Contest, Contestant, VoteSubmissionResult, DeviceStatusResult } from './types';
import { getOrCreateDeviceToken } from './lib/deviceToken';
import { supabaseClient } from './lib/supabase';
import { dataService } from './services/dataService';
import { Loader2, Shield, Search } from 'lucide-react';

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

  // Toast notification for voting and follow interactions (2s auto-dismiss)
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  // Instruction 3: And once a voter clicks on follow, the follower number should add and show smooth 2-second confirmation
  const handleFollow = async () => {
    if (isFollowing) {
      setToast({
        id: Date.now().toString(),
        type: 'follow',
        text: '✓ You are already following Voters Decide',
      });
      return;
    }

    setIsFollowing(true);
    try {
      localStorage.setItem('vd_is_following', 'true');
    } catch {}

    setFollowersCount((prev) => prev + 1);

    // Requirement 9: Smooth 2-second auto-disappearing confirmation notification
    setToast({
      id: Date.now().toString(),
      type: 'follow',
      text: '✓ You are now following Voters Decide',
    });

    try {
      const newCount = await dataService.followChannel(contest?.slug || 'official-contest');
      if (typeof newCount === 'number') {
        setFollowersCount(newCount);
      }
    } catch (err) {
      console.warn('Could not record follow', err);
    }
  };

  // 1. Fetch Contest & Contestants
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
  const fetchDeviceStatus = useCallback(
    async (slug = 'official-contest') => {
      if (!deviceToken) return;
      try {
        const data = await dataService.getDeviceStatus(slug, deviceToken);
        setDeviceStatus(data as any);
      } catch (e) {
        console.warn('Failed to fetch device participation status', e);
      }
    },
    [deviceToken]
  );

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

      // The voter clicked confirm -> Do not show success toast yet!
      // Only bring out the Follow Channel interface.
      const currentSelected = selectedContestant;
      setSelectedContestant(null);
      setPendingFollowData({
        contestant: currentSelected,
        voteResult: data as any,
      });

      // Once a voter casts their vote the follows numbers should add
      if (typeof data.followers_count === 'number') {
        setFollowersCount(data.followers_count);
      } else {
        setFollowersCount((prev) => prev + 1);
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

  // Called when the voter returns back to the link after following the channel
  const handleVoterReturnedFromChannel = () => {
    if (!pendingFollowData) return;
    const res = pendingFollowData.voteResult;
    setPendingFollowData(null);
    setVoteSuccessResult(res);

    // User requirement: once the voter returns back to the link, tell them you have successfully voted and your record has been saved
    setToast({
      id: Date.now().toString(),
      type: 'vote',
      text: '✓ You have successfully voted and your record has been saved',
    });
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
      <div className="min-h-screen bg-[#0F1216] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <VotersDecideLogo size="lg" showText={true} />
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-bold uppercase tracking-widest mt-2">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Loading Ballot System...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0F1216] text-white flex flex-col font-sans antialiased relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* 
        Requirements 3 & 4: LARGE SUBTLE BACKGROUND TYPOGRAPHY WATERMARK
        "VOTERS DECIDE" placed in the middle/center of the background with 
        vertical/elongated presentation, generous spacing, and sophisticated depth.
      */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none flex items-center justify-center"
      >
        <div className="watermark-text-vertical text-[10vw] sm:text-[12vw] font-black uppercase tracking-[0.35em] text-white opacity-[0.03] select-none">
          VOTERS DECIDE
        </div>
      </div>

      {/* Subtle depth lighting overlay across the canvas */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.035),transparent_60%)]"
      />

      {/* Toast Notification (2s auto-dismiss) */}
      <InteractionToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Professional Header */}
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
      <main className="relative z-10 flex-1 w-full max-w-full">
        {activeTab === 'admin' ? (
          <AdminDashboard
            onBackToApp={() => setActiveTab('public')}
            onRefreshPublicData={() => {
              fetchContestData();
              fetchDeviceStatus();
            }}
            currentDeviceToken={deviceToken}
            initialContest={contest}
          />
        ) : voteSuccessResult ? (
          /* SUCCESS SCREEN AFTER VOTING */
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
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Official Ballot Candidates
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Select a candidate below to review profile and cast your official vote (Max{' '}
                    {contest?.max_submissions_per_device || 2} submissions per browser/device).
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400">
                  <span className="tabular-nums text-white font-black">{filteredContestants.length}</span>
                  <span>Candidates Listed</span>
                </div>
              </div>

              {/* Contestants List or Empty State */}
              {contestants.length === 0 ? (
                <div className="bg-[#151921] rounded-2xl border border-white/10 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl my-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#1D2430] text-amber-400 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Candidates Added Yet</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    Official contestants will appear here once registered and approved by the platform
                    administrator.
                  </p>
                  <button
                    id="btn-goto-admin-login"
                    onClick={() => setActiveTab('admin')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-black" />
                    <span>Admin Login to Add Contestants</span>
                  </button>
                </div>
              ) : filteredContestants.length === 0 ? (
                <div className="bg-[#151921] rounded-xl border border-white/10 p-10 sm:p-12 text-center max-w-lg mx-auto">
                  <Search className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white mb-1">
                    No candidates found matching &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-xs text-zinc-400 mb-4">
                    Try searching with another candidate name, number, or keyword.
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-[#1F2733] hover:bg-[#283241] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-white/10"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

      {/* STEP 2: POST-VOTE POP-UP */}
      {pendingFollowData && (
        <FollowChannelModal
          contestant={pendingFollowData.contestant}
          voteResult={pendingFollowData.voteResult}
          whatsappChannelUrl={contest?.whatsapp_channel_url || 'https://whatsapp.com'}
          onFollow={handleFollow}
          onVoterReturned={handleVoterReturnedFromChannel}
          onClose={handleVoterReturnedFromChannel}
        />
      )}

      {/* STEP 3: CONTESTANT PERSONAL SHARING MODAL */}
      {sharingContestant && (
        <CandidateShareModal
          contestant={sharingContestant}
          onClose={() => setSharingContestant(null)}
        />
      )}

      {/* STEP 4: GENERAL PLATFORM SHARE MODAL */}
      {showGeneralShareModal && (
        <GeneralShareModal contest={contest} onClose={() => setShowGeneralShareModal(false)} />
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
