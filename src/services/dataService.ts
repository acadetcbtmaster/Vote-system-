import { Contest, Contestant } from '../types';
import { supabaseClient } from '../lib/supabase';

// Local storage keys for client-side fallback (GitHub Pages mode)
const LOCAL_CONTEST_KEY = 'vd_ghpages_contest_data';
const LOCAL_CONTESTANTS_KEY = 'vd_ghpages_contestants_data';
const LOCAL_PARTICIPATIONS_KEY = 'vd_ghpages_participations_data';
const LOCAL_FOLLOWERS_KEY = 'vd_ghpages_followers_count';

// Default initial state mirroring official contest
const DEFAULT_CONTEST: Contest = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  slug: 'official-contest',
  title: 'Voters Decide — Official Public Contest',
  description: 'Vote for your preferred candidate. Maximum 2 submissions per browser. Official real-time results powered by Supabase.',
  category: 'Public Contest',
  status: 'active',
  start_time: new Date(Date.now() - 86400000).toISOString(),
  end_time: new Date(Date.now() + 86400000 * 30).toISOString(),
  max_submissions_per_device: 2,
  whatsapp_channel_url: 'https://whatsapp.com',
  whatsapp_channel_name: 'Voters Decide Official Channel',
  is_public_leaderboard_visible: true,
  allow_contestant_registration: true,
  show_countdown: false,
  views_count: 3482,
  followers_count: 1250,
  created_at: new Date().toISOString(),
};

function getLocalContest(): Contest {
  try {
    const saved = localStorage.getItem(LOCAL_CONTEST_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONTEST;
}

function saveLocalContest(contest: Contest) {
  try {
    localStorage.setItem(LOCAL_CONTEST_KEY, JSON.stringify(contest));
  } catch {}
}

function getLocalContestants(): Contestant[] {
  try {
    const saved = localStorage.getItem(LOCAL_CONTESTANTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveLocalContestants(contestants: Contestant[]) {
  try {
    localStorage.setItem(LOCAL_CONTESTANTS_KEY, JSON.stringify(contestants));
  } catch {}
}

interface LocalVoteRecord {
  contestId: string;
  contestantId: string;
  deviceToken: string;
  voterName: string;
  voterWhatsapp: string;
  timestamp: string;
}

function getLocalParticipations(): LocalVoteRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_PARTICIPATIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveLocalParticipations(records: LocalVoteRecord[]) {
  try {
    localStorage.setItem(LOCAL_PARTICIPATIONS_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Universal Data Service
 * Seamlessly bridges between Server API (Node.js/Express) and Client-Side Supabase/LocalStorage
 * (ensuring flawless live functionality on GitHub Pages).
 */
export const dataService = {
  // 1. Fetch Contest & Approved Contestants
  async getContest(slug = 'official-contest'): Promise<{ contest: Contest; contestants: Contestant[]; totalVotes: number }> {
    // Attempt 1: Call Express Server API
    try {
      const res = await fetch(`/api/contests/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.contest) {
          // Cache locally for offline/GitHub Pages resilience
          saveLocalContest(data.contest);
          if (data.contestants) saveLocalContestants(data.contestants);
          return data;
        }
      }
    } catch {}

    // Attempt 2: Direct Supabase Cloud (GitHub Pages mode)
    if (supabaseClient) {
      try {
        const { data: cData, error: cErr } = await supabaseClient
          .from('contests')
          .select('*')
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single();

        if (!cErr && cData) {
          const { data: ctData } = await supabaseClient
            .from('contestants')
            .select('*')
            .eq('contest_id', cData.id)
            .eq('status', 'approved')
            .order('vote_count', { ascending: false });

          const contestants = (ctData as Contestant[]) || [];
          const totalVotes = contestants.reduce((acc, c) => acc + (c.vote_count || 0), 0);
          return { contest: cData, contestants, totalVotes };
        }
      } catch (sbErr) {
        console.warn('[DataService] Direct Supabase read failed or schema pending:', sbErr);
      }
    }

    // Attempt 3: Local Storage Fallback
    const contest = getLocalContest();
    const contestants = getLocalContestants().filter(c => c.status === 'approved');
    const totalVotes = contestants.reduce((acc, c) => acc + (c.vote_count || 0), 0);
    return { contest, contestants, totalVotes };
  },

  // 2. Fetch Device Status (2-Vote Limit)
  async getDeviceStatus(slug: string, token: string): Promise<{
    submissionsUsed: number;
    remainingSubmissions: number;
    maxAllowed: number;
    canVote: boolean;
    contestStatus: string;
    isExpired: boolean;
  }> {
    // Attempt Server API
    try {
      const res = await fetch(`/api/contests/${slug}/device-status?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // GitHub Pages / Direct Supabase / Local Fallback
    const contest = getLocalContest();
    const maxAllowed = contest.max_submissions_per_device || 2;
    let count = 0;

    if (supabaseClient) {
      try {
        const { count: sbCount, error } = await supabaseClient
          .from('participations')
          .select('*', { count: 'exact', head: true })
          .eq('device_token', token);
        if (!error && sbCount !== null) {
          count = sbCount;
        }
      } catch {}
    }

    if (count === 0) {
      const records = getLocalParticipations();
      count = records.filter(r => r.deviceToken === token).length;
    }

    const remaining = Math.max(0, maxAllowed - count);
    const isExpired = contest.end_time ? new Date() > new Date(contest.end_time) : false;

    return {
      submissionsUsed: count,
      remainingSubmissions: remaining,
      maxAllowed,
      canVote: count < maxAllowed && contest.status === 'active' && !isExpired,
      contestStatus: contest.status,
      isExpired,
    };
  },

  // 3. Submit Vote
  async submitVote(slug: string, payload: {
    contestantId: string;
    deviceToken: string;
    voterName: string;
    voterWhatsapp: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    submissions_used?: number;
    remaining_submissions?: number;
    followers_count?: number;
    contestant?: any;
  }> {
    // Attempt Server API
    try {
      const res = await fetch(`/api/contests/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 400 || res.status === 404) {
        return await res.json();
      }
    } catch {}

    // GitHub Pages / Client Fallback Execution
    const contest = getLocalContest();
    const contestants = getLocalContestants();
    const maxAllowed = contest.max_submissions_per_device || 2;

    const records = getLocalParticipations();
    const userVotes = records.filter(r => r.deviceToken === payload.deviceToken);

    if (userVotes.length >= maxAllowed) {
      return {
        success: false,
        error: 'PARTICIPATION_LIMIT_REACHED',
        message: `You have reached the maximum allowed submissions (${maxAllowed}) for this contest.`,
        submissions_used: userVotes.length,
        remaining_submissions: 0,
      };
    }

    const targetContestant = contestants.find(c => c.id === payload.contestantId);
    if (!targetContestant) {
      return { success: false, error: 'Contestant not found' };
    }

    // Increment vote
    targetContestant.vote_count = (targetContestant.vote_count || 0) + 1;
    saveLocalContestants(contestants);

    // Record participation
    const newRecord: LocalVoteRecord = {
      contestId: contest.id,
      contestantId: payload.contestantId,
      deviceToken: payload.deviceToken,
      voterName: payload.voterName,
      voterWhatsapp: payload.voterWhatsapp,
      timestamp: new Date().toISOString(),
    };
    records.push(newRecord);
    saveLocalParticipations(records);

    // Increment followers count
    contest.followers_count = (contest.followers_count || 1250) + 1;
    saveLocalContest(contest);

    // Also attempt direct sync to Supabase if connected
    if (supabaseClient) {
      try {
        await supabaseClient.from('participations').insert({
          contest_id: contest.id,
          contestant_id: payload.contestantId,
          device_token: payload.deviceToken,
          voter_name: payload.voterName,
          voter_whatsapp: payload.voterWhatsapp,
        });
        await supabaseClient.from('contestants').update({
          vote_count: targetContestant.vote_count,
        }).eq('id', targetContestant.id);
      } catch (e) {
        console.warn('[DataService] Direct Supabase vote insert warning:', e);
      }
    }

    const used = userVotes.length + 1;
    return {
      success: true,
      message: 'Your choice has been recorded successfully.',
      contestant: targetContestant,
      submissions_used: used,
      remaining_submissions: Math.max(0, maxAllowed - used),
      followers_count: contest.followers_count,
    };
  },

  // 4. Record Channel Follow
  async followChannel(slug = 'official-contest'): Promise<number> {
    try {
      const res = await fetch(`/api/contests/${slug}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.followers_count === 'number') {
          return data.followers_count;
        }
      }
    } catch {}

    const contest = getLocalContest();
    contest.followers_count = (contest.followers_count || 1250) + 1;
    saveLocalContest(contest);
    return contest.followers_count;
  },

  // 5. Submit Contestant Registration
  async registerContestant(slug: string, payload: {
    name: string;
    whatsappNumber: string;
    bio: string;
    photoUrl?: string;
  }): Promise<{ success: boolean; message: string; contestant?: Contestant }> {
    try {
      const res = await fetch(`/api/contests/${slug}/register-contestant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 400) {
        return await res.json();
      }
    } catch {}

    const contest = getLocalContest();
    const contestants = getLocalContestants();
    const nextNum = (contestants.length + 1).toString().padStart(2, '0');

    const newC: Contestant = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'c_' + Date.now(),
      contest_id: contest.id,
      contestant_number: nextNum,
      name: payload.name.trim(),
      bio: payload.bio.trim(),
      photo_url: payload.photoUrl ? payload.photoUrl.trim() : null,
      status: 'approved',
      whatsapp_number: payload.whatsappNumber.trim(),
      vote_count: 0,
      created_at: new Date().toISOString(),
    };

    contestants.push(newC);
    saveLocalContestants(contestants);

    if (supabaseClient) {
      try {
        await supabaseClient.from('contestants').insert({
          id: newC.id,
          contest_id: newC.contest_id,
          contestant_number: newC.contestant_number,
          name: newC.name,
          bio: newC.bio,
          photo_url: newC.photo_url,
          status: newC.status,
          whatsapp_number: newC.whatsapp_number,
          vote_count: 0,
        });
      } catch (e) {
        console.warn('[DataService] Direct Supabase contestant insert warning:', e);
      }
    }

    return {
      success: true,
      message: `Contestant No. ${nextNum} (${newC.name}) successfully registered!`,
      contestant: newC,
    };
  },

  // 6. Admin Authentication
  async adminLogin(key: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: key }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback authentication for GitHub Pages
    const trimmed = key.trim();
    if (trimmed === 'verifiedmenmex' || trimmed === 'voters-decide-admin-2026') {
      return { success: true, token: trimmed };
    }
    return { success: false, error: 'Invalid admin credentials.' };
  },

  // 7. Clear All Devices for New Contest
  async resetAllDevices(token: string, options: { resetVoteCounts: boolean; resetContestStatus: boolean }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/reset-all-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(options),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // GitHub Pages Local Fallback
    saveLocalParticipations([]);
    if (options.resetVoteCounts) {
      const contestants = getLocalContestants();
      contestants.forEach(c => { c.vote_count = 0; });
      saveLocalContestants(contestants);
    }
    const contest = getLocalContest();
    if (options.resetContestStatus) {
      contest.status = 'active';
    }
    contest.last_devices_reset_at = new Date().toISOString();
    saveLocalContest(contest);

    return {
      success: true,
      message: 'All device restrictions have been refreshed successfully for the new contest!',
    };
  },

  // 8. Update Contest Settings (Supports show_countdown toggle)
  async updateContestSettings(token: string, updates: Partial<Contest>): Promise<{ success: boolean; contest?: Contest; error?: string }> {
    try {
      const res = await fetch('/api/admin/contests/official-contest', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contest) {
          saveLocalContest(data.contest);
          return { success: true, contest: data.contest };
        }
      }
    } catch {}

    const contest = getLocalContest();
    Object.assign(contest, updates);
    saveLocalContest(contest);
    return { success: true, contest };
  }
};
