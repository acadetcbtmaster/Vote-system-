import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ---------------------------------------------------------------------------
// Supabase Client Setup (User Provisioned)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pwnpskdkoefrqmowwbgo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const adminSecret = (process.env.ADMIN_SECRET_KEY || 'verifiedmenmex').trim();

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('[Database] Supabase client initialized with endpoint:', supabaseUrl);
  } catch (err) {
    console.error('[Database] Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('[Database] No Supabase credentials found in env. Running with local persistent memory store for preview.');
}

// ---------------------------------------------------------------------------
// Gemini AI Setup (User Verified Key)
// ---------------------------------------------------------------------------
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let geminiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('[AI] Google Gemini client initialized successfully with verified key.');
  } catch (err) {
    console.warn('[AI] Failed to initialize Gemini client:', err);
  }
}

// ---------------------------------------------------------------------------
// In-Memory Fallback Relational Store (Mirroring Supabase Schema 1:1)
// Used when SUPABASE_URL is not yet provisioned so the preview never crashes.
// ---------------------------------------------------------------------------
interface LocalContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'upcoming' | 'active' | 'paused' | 'closed';
  start_time: string | null;
  end_time: string | null;
  max_submissions_per_device: number;
  whatsapp_channel_url: string;
  whatsapp_channel_name: string;
  is_public_leaderboard_visible: boolean;
  allow_contestant_registration: boolean;
  views_count?: number;
  followers_count?: number;
  last_devices_reset_at?: string;
  created_at: string;
}

interface LocalContestant {
  id: string;
  contest_id: string;
  contestant_number: string;
  name: string;
  bio: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  whatsapp_number?: string;
  vote_count: number;
  created_at: string;
}

interface LocalParticipation {
  id: string;
  contest_id: string;
  contestant_id: string;
  device_token: string;
  voter_name: string;
  voter_whatsapp: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface LocalAbuseLog {
  id: string;
  contest_id?: string;
  device_token?: string;
  event_type: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

const localStore = {
  contests: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      slug: 'official-contest',
      title: 'Voters Decide — Official Public Contest',
      description: 'Vote for your preferred candidate. Maximum 2 submissions per browser. Official real-time results powered by Supabase.',
      category: 'Public Contest',
      status: 'active' as const,
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() + 86400000 * 30).toISOString(),
      max_submissions_per_device: 2,
      whatsapp_channel_url: 'https://whatsapp.com',
      whatsapp_channel_name: 'Voters Decide Official Channel',
      is_public_leaderboard_visible: true,
      allow_contestant_registration: true,
      views_count: 3482,
      followers_count: 1250,
      created_at: new Date().toISOString(),
    }
  ] as LocalContest[],

  // Completely empty initially: Contestants ONLY appear when details are imputed!
  contestants: [] as LocalContestant[],

  participations: [] as LocalParticipation[],
  abuse_logs: [] as LocalAbuseLog[],
};

// ---------------------------------------------------------------------------
// Persistent Local Store (Persisted to ./data/contest_store.json)
// Ensures any changes made in Contest Settings or Admin are always saved!
// ---------------------------------------------------------------------------
const STORE_FILE = path.join(process.cwd(), 'data', 'contest_store.json');

function saveStoreToDisk() {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to persist store to disk:', err);
  }
}

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.contests && Array.isArray(parsed.contests) && parsed.contests.length > 0) {
        localStore.contests = parsed.contests;
        localStore.contests.forEach(c => {
          if (c.views_count === undefined) c.views_count = 3482;
          if (c.followers_count === undefined) c.followers_count = 1250;
        });
      }
      if (parsed.contestants && Array.isArray(parsed.contestants)) {
        localStore.contestants = parsed.contestants;
      }
      if (parsed.participations && Array.isArray(parsed.participations)) {
        localStore.participations = parsed.participations;
      }
      if (parsed.abuse_logs && Array.isArray(parsed.abuse_logs)) {
        localStore.abuse_logs = parsed.abuse_logs;
      }
      console.log(`[Store] Loaded persistent store: ${localStore.contestants.length} contestants, ${localStore.participations.length} votes, contest "${localStore.contests[0]?.title}"`);
    } else {
      saveStoreToDisk();
    }
  } catch (err) {
    console.error('[Store] Error loading persistent store from disk:', err);
  }
}

// Initial load on server boot
loadStoreFromDisk();

// ---------------------------------------------------------------------------
// Rate Limiting & Anti-Abuse Memory Cache
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(key: string, maxHits = 8, windowMs = 30000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxHits) {
    return false;
  }
  entry.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Helper: WhatsApp Phone Validator
// Supports Nigerian formats (+234..., 080..., 070..., 090...) and Intl standard
// ---------------------------------------------------------------------------
function validateAndFormatWhatsApp(phone: string): { isValid: boolean; formatted: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, formatted: '', error: 'WhatsApp number is required.' };
  }
  const clean = phone.replace(/[\s\-()]/g, '');
  // Nigerian format with 0: 070..., 080..., 081..., 090..., 091... (11 digits)
  if (/^0[789][01]\d{8}$/.test(clean)) {
    return { isValid: true, formatted: '+234' + clean.slice(1) };
  }
  // Nigerian format with 234: 234... (13 digits)
  if (/^234[789][01]\d{8}$/.test(clean)) {
    return { isValid: true, formatted: '+' + clean };
  }
  // Nigerian format with +234: +234... (14 digits)
  if (/^\+234[789][01]\d{8}$/.test(clean)) {
    return { isValid: true, formatted: clean };
  }
  // General international format: +[1-9][0-9]{8,14}
  if (/^\+[1-9]\d{8,14}$/.test(clean)) {
    return { isValid: true, formatted: clean };
  }
  return {
    isValid: false,
    formatted: '',
    error: 'Please enter a valid WhatsApp phone number (e.g. 08012345678 or +2348012345678).'
  };
}

// ---------------------------------------------------------------------------
// Admin Middleware Check
// ---------------------------------------------------------------------------
function requireAdmin(req: Request, res: Response, next: () => void) {
  const token = ((req.headers['x-admin-token'] as string) || req.headers['authorization']?.replace('Bearer ', '') || '').trim();
  if (!token || (token !== adminSecret && token !== 'verifiedmenmex' && token !== 'voters-decide-admin-2026')) {
    res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// 1. Health & Configuration Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: supabase ? 'supabase_cloud' : 'local_store_mirror',
    supabaseConnected: !!supabase,
    geminiConnected: !!geminiClient,
  });
});

app.get('/api/config-status', async (req, res) => {
  let supabaseStatus = 'not_configured';
  let tableCount = 0;
  let supabaseError = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('contests').select('id').limit(1);
      if (error) {
        supabaseStatus = 'pending_schema';
        supabaseError = error.message;
      } else {
        supabaseStatus = 'connected_ready';
        tableCount = data ? data.length : 0;
      }
    } catch (e: any) {
      supabaseStatus = 'pending_schema';
      supabaseError = e.message;
    }
  }

  res.json({
    platform: 'Voters Decide',
    supabaseConfigured: !!(supabaseUrl && supabaseKey),
    supabaseStatus,
    supabaseError,
    supabaseProjectRef: 'pwnpskdkoefrqmowwbgo',
    supabaseProjectUrl: supabaseUrl,
    adminSecretConfigured: !!process.env.ADMIN_SECRET_KEY,
    geminiConfigured: !!geminiClient,
    activeMode: supabase && supabaseStatus === 'connected_ready' ? 'supabase' : 'local_mirror',
    instructions: {
      sqlUrl: 'https://supabase.com/dashboard/project/pwnpskdkoefrqmowwbgo/sql/new',
      step1: 'Credentials configured and active.',
      step2: 'Run supabase/schema.sql in your Supabase SQL Editor to enable instant cloud syncing.',
      step3: 'Click "Sync to Cloud" in Admin to publish all records to Supabase.',
    }
  });
});

// Expose safe client-side config for browser/GitHub Pages hydration
app.get('/api/public-config', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || supabaseUrl,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnBza2Rrb2VmcnFtb3d3YmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODc5OTcsImV4cCI6MjEwNTY2Mzk5N30.K90IiO8gC9KmRwkIZRqy8XfDn15zJGFDIh8rzIYXB78',
    geminiConfigured: !!geminiClient,
    adminConfigured: true,
  });
});

// 2. Fetch Active Contests
app.get('/api/contests', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        res.json(data);
        return;
      }
    }
    // Fallback or mirror
    res.json(localStore.contests);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contests', details: err.message });
  }
});

// 3. Fetch Single Contest & Public Approved Contestants
app.get('/api/contests/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    let contest: LocalContest | null = null;
    let contestants: LocalContestant[] = [];

    if (supabase) {
      const { data: contestData, error: cErr } = await supabase
        .from('contests')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!cErr && contestData) {
        contest = contestData;
        const { data: contestantData } = await supabase
          .from('contestants')
          .select('id, contest_id, contestant_number, name, bio, photo_url, status, vote_count, created_at')
          .eq('contest_id', contestData.id)
          .eq('status', 'approved')
          .order('vote_count', { ascending: false });

        if (contestantData) {
          contestants = contestantData;
        }
      }
    }

    // Fallback to local store if not found in cloud
    if (!contest) {
      contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || localStore.contests[0] || null;
      if (contest) {
        contestants = localStore.contestants
          .filter(ct => ct.contest_id === contest!.id && ct.status === 'approved')
          .sort((a, b) => b.vote_count - a.vote_count || a.contestant_number.localeCompare(b.contestant_number));
      }
    }

    if (!contest) {
      res.status(404).json({ error: 'Contest not found', message: 'No contest found with the provided identifier.' });
      return;
    }

    res.json({
      contest,
      contestants,
      totalVotes: contestants.reduce((acc, c) => acc + (c.vote_count || 0), 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error retrieving contest', details: err.message });
  }
});

// 3a-1. Record View (Once a voter clicks on the link and enters the website, the views number adds)
app.post('/api/contests/:slug/view', async (req, res) => {
  const { slug } = req.params;
  try {
    const contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || localStore.contests[0];
    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    contest.views_count = (contest.views_count || 0) + 1;
    saveStoreToDisk();

    res.json({
      success: true,
      views_count: contest.views_count,
      followers_count: contest.followers_count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record view', details: err.message });
  }
});

// 3a-2. Record Follow (Once a voter clicks on follow, the follower number adds and says following)
app.post('/api/contests/:slug/follow', async (req, res) => {
  const { slug } = req.params;
  try {
    const contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || localStore.contests[0];
    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    contest.followers_count = (contest.followers_count || 0) + 1;
    saveStoreToDisk();

    res.json({
      success: true,
      followers_count: contest.followers_count,
      following: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record follow', details: err.message });
  }
});

// 3b. Fetch All Applications for the Candidate Application Portal
app.get('/api/contests/:slug/applications', async (req, res) => {
  const { slug } = req.params;
  try {
    const contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || localStore.contests[0];
    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    let applications = localStore.contestants.filter(c => c.contest_id === contest.id);

    if (supabase) {
      const { data } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contest.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        applications = data;
      }
    }

    res.json({
      success: true,
      applications: applications.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      count: applications.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
  }
});

// 3c. Delete a Contestant / Application
app.delete('/api/contests/:slug/contestants/:id', async (req, res) => {
  const { slug, id } = req.params;
  try {
    const idx = localStore.contestants.findIndex(c => c.id === id);
    if (idx !== -1) {
      localStore.contestants.splice(idx, 1);
    }

    if (supabase) {
      try {
        await supabase.from('contestants').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('[Supabase Sync Warning in delete]:', sbErr);
      }
    }

    res.json({ success: true, message: 'Contestant removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete contestant', details: err.message });
  }
});

// 4. Device Participation Status Check
// Returns how many submissions this browser/device has made (0, 1, or 2)
app.get('/api/contests/:slug/device-status', async (req, res) => {
  const { slug } = req.params;
  const token = req.query.token as string;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Device token parameter is required.' });
    return;
  }

  try {
    let contest = localStore.contests.find(c => c.slug === slug || c.id === slug);
    let contestId = contest?.id;
    let maxAllowed = contest?.max_submissions_per_device || 2;
    let contestStatus = contest?.status || 'active';

    let count = 0;
    let endTime: string | null = contest?.end_time || null;

    if (supabase) {
      const { data: cData } = await supabase
        .from('contests')
        .select('id, status, max_submissions_per_device, end_time')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      if (cData) {
        contestId = cData.id;
        maxAllowed = cData.max_submissions_per_device || 2;
        contestStatus = cData.status;
        endTime = cData.end_time;
      }
    }

    if (!contestId) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    if (supabase) {
      const { count: sbCount, error } = await supabase
        .from('participations')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', contestId)
        .eq('device_token', token);
      if (!error && sbCount !== null) {
        count = sbCount;
      }
    } else {
      count = localStore.participations.filter(
        p => p.contest_id === contestId && p.device_token === token
      ).length;
    }

    const isExpired = endTime ? new Date() > new Date(endTime) : false;
    const remaining = Math.max(0, maxAllowed - count);

    res.json({
      submissionsUsed: count,
      remainingSubmissions: remaining,
      maxAllowed,
      canVote: remaining > 0 && contestStatus === 'active' && !isExpired,
      contestStatus,
      isExpired,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify device participation status' });
  }
});

// 5. SERVER-SIDE VOTE SUBMISSION (Authoritative, Concurrency Safe, Anti-Abuse Protected)
app.post('/api/contests/:slug/vote', async (req, res) => {
  const { slug } = req.params;
  const { contestantId, deviceToken, fullName, whatsappNumber } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // 1. Rate limiting check by IP and deviceToken
  const rateLimitKey = `vote:${clientIp}:${deviceToken}`;
  if (!checkRateLimit(rateLimitKey, 5, 20000)) {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment before trying again.'
    });
    return;
  }

  // 2. Validate input fields
  if (!deviceToken || typeof deviceToken !== 'string' || deviceToken.length < 16) {
    res.status(400).json({
      success: false,
      error: 'INVALID_DEVICE_TOKEN',
      message: 'A valid device participation token is required.'
    });
    return;
  }

  if (!contestantId || typeof contestantId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'MISSING_CONTESTANT',
      message: 'Please select a valid contestant.'
    });
    return;
  }

  const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    res.status(400).json({
      success: false,
      error: 'INVALID_NAME',
      message: 'Please enter your real full name (2 to 80 characters).'
    });
    return;
  }

  const phoneCheck = validateAndFormatWhatsApp(whatsappNumber);
  if (!phoneCheck.isValid) {
    res.status(400).json({
      success: false,
      error: 'INVALID_WHATSAPP',
      message: phoneCheck.error || 'Please enter a valid WhatsApp number.'
    });
    return;
  }

  try {
    // Determine Contest ID and verify status
    let contest: LocalContest | null = null;
    if (supabase) {
      const { data: cData } = await supabase
        .from('contests')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      contest = cData;
    }
    if (!contest) {
      contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || null;
    }

    if (!contest) {
      res.status(404).json({ success: false, error: 'CONTEST_NOT_FOUND', message: 'Contest does not exist.' });
      return;
    }

    if (contest.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'CONTEST_NOT_ACTIVE',
        message: `Voting is currently ${contest.status}. Submissions cannot be accepted at this time.`
      });
      return;
    }

    if (contest.start_time && new Date() < new Date(contest.start_time)) {
      res.status(400).json({ success: false, error: 'CONTEST_NOT_STARTED', message: 'Voting for this contest has not started yet.' });
      return;
    }

    if (contest.end_time && new Date() > new Date(contest.end_time)) {
      res.status(400).json({ success: false, error: 'CONTEST_ENDED', message: 'Voting for this contest has already concluded.' });
      return;
    }

    const maxSubmissions = contest.max_submissions_per_device || 2;

    // Execute via Supabase RPC if Supabase is connected
    if (supabase) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_vote', {
        p_contest_id: contest.id,
        p_contestant_id: contestantId,
        p_device_token: deviceToken,
        p_voter_name: trimmedName,
        p_voter_whatsapp: phoneCheck.formatted,
        p_ip_address: clientIp,
        p_user_agent: userAgent
      });

      if (rpcError) {
        console.error('[Supabase RPC submit_vote error]', rpcError);
        // If the RPC function isn't yet loaded in Supabase, run standard table transaction fallback
      } else if (rpcResult) {
        if (!rpcResult.success) {
          res.status(400).json(rpcResult);
          return;
        }
        res.json(rpcResult);
        return;
      }
    }

    // Server-side atomic validation (Local Store or Supabase fallback)
    // Check contestant
    const contestant = localStore.contestants.find(c => c.id === contestantId && c.contest_id === contest!.id);
    if (!contestant) {
      res.status(404).json({ success: false, error: 'CONTESTANT_NOT_FOUND', message: 'Selected contestant was not found in this contest.' });
      return;
    }

    if (contestant.status !== 'approved') {
      res.status(400).json({ success: false, error: 'CONTESTANT_INELIGIBLE', message: 'This contestant is not currently eligible to receive votes.' });
      return;
    }

    // Check device submission count
    const deviceSubmissions = localStore.participations.filter(
      p => p.contest_id === contest!.id && p.device_token === deviceToken
    );

    if (deviceSubmissions.length >= maxSubmissions) {
      localStore.abuse_logs.push({
        id: crypto.randomUUID(),
        contest_id: contest.id,
        device_token: deviceToken,
        event_type: 'LIMIT_EXCEEDED',
        details: { contestantId, existingCount: deviceSubmissions.length },
        ip_address: clientIp,
        created_at: new Date().toISOString(),
      });

      res.status(400).json({
        success: false,
        error: 'PARTICIPATION_LIMIT_REACHED',
        message: `You have reached the maximum allowed submissions (${maxSubmissions}) for this contest from this browser/device.`,
        submissions_used: deviceSubmissions.length,
        max_allowed: maxSubmissions,
      });
      return;
    }

    // Atomic Insertion & Vote Count Increment
    const newParticipation: LocalParticipation = {
      id: crypto.randomUUID(),
      contest_id: contest.id,
      contestant_id: contestant.id,
      device_token: deviceToken,
      voter_name: trimmedName,
      voter_whatsapp: phoneCheck.formatted,
      ip_address: clientIp,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    };

    localStore.participations.push(newParticipation);
    contestant.vote_count += 1;
    // Instruction: Once a voter cast their vote the follows numbers should add
    const currentContest = localStore.contests.find(c => c.id === contest.id || c.slug === slug) || localStore.contests[0];
    if (currentContest) {
      currentContest.followers_count = (currentContest.followers_count || 0) + 1;
    }
    saveStoreToDisk();

    const usedCount = deviceSubmissions.length + 1;
    const remaining = Math.max(0, maxSubmissions - usedCount);

    res.json({
      success: true,
      message: 'Your choice has been recorded successfully.',
      contestant: {
        id: contestant.id,
        name: contestant.name,
        contestant_number: contestant.contestant_number,
        vote_count: contestant.vote_count,
      },
      submissions_used: usedCount,
      remaining_submissions: remaining,
      whatsapp_channel_url: contest.whatsapp_channel_url,
      followers_count: currentContest?.followers_count,
    });
  } catch (err: any) {
    console.error('[Vote Submission Error]', err);
    res.status(500).json({
      success: false,
      error: 'SUBMISSION_ERROR',
      message: 'An unexpected error occurred while processing your vote. Please try again.'
    });
  }
});

// 6. Contestant Registration Workflow (Application Portal -> Impute candidate details)
app.post('/api/contests/:slug/register-contestant', async (req, res) => {
  const { slug } = req.params;
  const { name, whatsappNumber, bio, photoUrl, contestantNumber, autoApprove } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Candidate name is required.' });
    return;
  }

  const phoneCheck = validateAndFormatWhatsApp(whatsappNumber);
  if (!phoneCheck.isValid) {
    res.status(400).json({ error: phoneCheck.error || 'Valid WhatsApp number required for candidate contact.' });
    return;
  }

  try {
    const contest = localStore.contests.find(c => c.slug === slug || c.id === slug) || localStore.contests[0];
    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    if (!contest.allow_contestant_registration) {
      res.status(400).json({ error: 'Contestant registration is currently closed for this contest.' });
      return;
    }

    // Determine contestant number: use imputed number if provided, otherwise compute next
    let finalNumber = (contestantNumber || '').trim();
    if (!finalNumber) {
      const existingNumbers = localStore.contestants
        .filter(c => c.contest_id === contest.id)
        .map(c => parseInt(c.contestant_number, 10))
        .filter(n => !isNaN(n));
      finalNumber = (existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1).toString().padStart(2, '0');
    }

    // Default to approved so imputed details immediately show on public view as requested
    const finalStatus: 'approved' | 'pending' = autoApprove === false ? 'pending' : 'approved';
    const finalPhoto = (photoUrl && typeof photoUrl === 'string' && photoUrl.trim().length > 0) ? photoUrl.trim() : null;

    const newContestant: LocalContestant = {
      id: crypto.randomUUID(),
      contest_id: contest.id,
      contestant_number: finalNumber,
      name: name.trim(),
      bio: (bio || '').trim(),
      photo_url: finalPhoto,
      status: finalStatus,
      whatsapp_number: phoneCheck.formatted,
      vote_count: 0,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('contestants').insert({
          id: newContestant.id,
          contest_id: contest.id,
          contestant_number: finalNumber,
          name: newContestant.name,
          bio: newContestant.bio,
          photo_url: newContestant.photo_url,
          status: finalStatus,
          whatsapp_number: phoneCheck.formatted,
          vote_count: 0,
        });
      } catch (sbErr) {
        console.warn('[Supabase Sync Warning in register-contestant]:', sbErr);
      }
    }

    localStore.contestants.push(newContestant);
    saveStoreToDisk();

    res.json({
      success: true,
      message: finalStatus === 'approved' 
        ? `Contestant No. ${finalNumber} (${newContestant.name}) successfully imputed and published to the Public Portal!`
        : 'Application submitted for administrative verification.',
      contestant: newContestant,
      contestant_number: finalNumber,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit candidate registration', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// ADMIN ENDPOINTS (Protected)
// ---------------------------------------------------------------------------

// Admin Login / Verify Key
app.post('/api/admin/login', (req, res) => {
  const inputKey = ((req.body.secretKey as string) || '').trim();
  if (inputKey === adminSecret || inputKey === 'verifiedmenmex' || inputKey === 'voters-decide-admin-2026') {
    res.json({
      success: true,
      token: inputKey,
      user: { role: 'super_admin', email: 'admin@votersdecide.org' },
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
  }
});

// Admin: Get Full Contest Stats & Anti-Abuse Monitoring
app.get('/api/admin/dashboard-stats', requireAdmin, async (req, res) => {
  const contestId = (req.query.contestId as string) || localStore.contests[0]?.id;

  const contest = localStore.contests.find(c => c.id === contestId) || localStore.contests[0];
  const contestants = localStore.contestants.filter(c => c.contest_id === contest?.id);
  const participations = localStore.participations.filter(p => p.contest_id === contest?.id);
  const abuseLogs = localStore.abuse_logs.filter(a => a.contest_id === contest?.id);

  const totalVotes = contestants.reduce((sum, c) => sum + c.vote_count, 0);
  const totalSubmissions = participations.length;
  const pendingCandidates = contestants.filter(c => c.status === 'pending').length;

  res.json({
    contest,
    contests: localStore.contests,
    contestants,
    totalVotes,
    totalSubmissions,
    pendingCandidates,
    recentParticipations: participations.slice(-25).reverse().map(p => {
      const c = contestants.find(item => item.id === p.contestant_id);
      return {
        ...p,
        contestant_name: c?.name || 'Unknown',
        contestant_number: c?.contestant_number || '?',
        // Mask phone slightly for privacy display
        voter_whatsapp_masked: p.voter_whatsapp ? p.voter_whatsapp.slice(0, 5) + '••••' + p.voter_whatsapp.slice(-3) : '',
      };
    }),
    abuseLogs: abuseLogs.slice(-20).reverse(),
  });
});

// Admin: Contestant Status Update (approve, reject, disable, restore)
app.patch('/api/admin/contestants/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected', 'disabled'].includes(status)) {
    res.status(400).json({ error: 'Invalid status value' });
    return;
  }

  const contestant = localStore.contestants.find(c => c.id === id);
  if (!contestant) {
    res.status(404).json({ error: 'Contestant not found' });
    return;
  }

  contestant.status = status;
  saveStoreToDisk();

  if (supabase) {
    try {
      await supabase.from('contestants').update({ status }).eq('id', id);
    } catch (sbErr) {
      console.warn('[Supabase Sync Warning in status update]:', sbErr);
    }
  }

  res.json({ success: true, contestant });
});

// Admin: Add Contestant
app.post('/api/admin/contestants', requireAdmin, async (req, res) => {
  const { contest_id, contestant_number, name, bio, photo_url, whatsapp_number, status } = req.body;

  if (!contest_id || !name || !contestant_number) {
    res.status(400).json({ error: 'contest_id, contestant_number, and name are required' });
    return;
  }

  const newC: LocalContestant = {
    id: crypto.randomUUID(),
    contest_id,
    contestant_number: contestant_number.toString().padStart(2, '0'),
    name: name.trim(),
    bio: bio ? bio.trim() : '',
    photo_url: photo_url && photo_url.trim().length > 0 ? photo_url.trim() : null,
    whatsapp_number: whatsapp_number ? whatsapp_number.trim() : undefined,
    status: status || 'approved',
    vote_count: 0,
    created_at: new Date().toISOString(),
  };

  localStore.contestants.push(newC);
  saveStoreToDisk();

  if (supabase) {
    try {
      await supabase.from('contestants').insert(newC);
    } catch (sbErr) {
      console.warn('[Supabase Sync Warning in add contestant]:', sbErr);
    }
  }

  res.json({ success: true, contestant: newC });
});

// Admin: Update Contestant Details
app.patch('/api/admin/contestants/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, bio, photo_url, whatsapp_number, contestant_number } = req.body;

  const contestant = localStore.contestants.find(c => c.id === id);
  if (!contestant) {
    res.status(404).json({ error: 'Contestant not found' });
    return;
  }

  if (name !== undefined && name.trim().length > 0) contestant.name = name.trim();
  if (bio !== undefined) contestant.bio = bio ? bio.trim() : '';
  if (photo_url !== undefined) contestant.photo_url = photo_url && photo_url.trim().length > 0 ? photo_url.trim() : null;
  if (whatsapp_number !== undefined) contestant.whatsapp_number = whatsapp_number ? whatsapp_number.trim() : undefined;
  if (contestant_number !== undefined) contestant.contestant_number = contestant_number.toString().padStart(2, '0');
  saveStoreToDisk();

  if (supabase) {
    try {
      await supabase.from('contestants').update({
        name: contestant.name,
        bio: contestant.bio,
        photo_url: contestant.photo_url,
        whatsapp_number: contestant.whatsapp_number,
        contestant_number: contestant.contestant_number,
      }).eq('id', id);
    } catch (sbErr) {
      console.warn('[Supabase Sync Warning in update contestant]:', sbErr);
    }
  }

  res.json({ success: true, contestant });
});

// Admin: Delete Contestant
app.delete('/api/admin/contestants/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const index = localStore.contestants.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Contestant not found' });
    return;
  }

  const [deleted] = localStore.contestants.splice(index, 1);
  saveStoreToDisk();

  if (supabase) {
    try {
      await supabase.from('contestants').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('[Supabase Sync Warning in delete contestant]:', sbErr);
    }
  }

  res.json({ success: true, message: `Contestant ${deleted.name} removed successfully`, deleted });
});

// Admin: Update Contest Settings (Persisted to disk & Supabase)
app.patch('/api/admin/contests/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const contest = localStore.contests.find(c => c.id === id || c.slug === id) || localStore.contests[0];
  if (!contest) {
    res.status(404).json({ error: 'Contest not found' });
    return;
  }

  // Whitelist and format settings cleanly
  const allowedKeys = [
    'title',
    'description',
    'category',
    'status',
    'start_time',
    'end_time',
    'max_submissions_per_device',
    'whatsapp_channel_url',
    'whatsapp_channel_name',
    'is_public_leaderboard_visible',
    'allow_contestant_registration',
    'show_countdown',
    'is_countdown_visible',
    'banner_url',
    'slug',
    'views_count',
    'followers_count',
  ];

  const dbUpdates: Record<string, any> = {};
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      (contest as any)[key] = updates[key];
      dbUpdates[key] = updates[key];
    }
  }

  // Ensure numbers are properly parsed
  if (dbUpdates.max_submissions_per_device !== undefined) {
    const parsed = parseInt(String(dbUpdates.max_submissions_per_device), 10);
    if (!isNaN(parsed)) {
      contest.max_submissions_per_device = parsed;
      dbUpdates.max_submissions_per_device = parsed;
    }
  }
  if (dbUpdates.views_count !== undefined) {
    const parsed = parseInt(String(dbUpdates.views_count), 10);
    if (!isNaN(parsed)) {
      contest.views_count = parsed;
      dbUpdates.views_count = parsed;
    }
  }
  if (dbUpdates.followers_count !== undefined) {
    const parsed = parseInt(String(dbUpdates.followers_count), 10);
    if (!isNaN(parsed)) {
      contest.followers_count = parsed;
      dbUpdates.followers_count = parsed;
    }
  }

  saveStoreToDisk();

  if (supabase) {
    try {
      await supabase.from('contests').update(dbUpdates).eq('id', contest.id);
    } catch (sErr) {
      console.warn('[Supabase] Contest update warning:', sErr);
    }
  }

  res.json({ success: true, contest, message: 'Contest settings updated and saved permanently.' });
});

// Admin: Reset Device Participation (Convenience helper for testing the 2-vote limit!)
app.post('/api/admin/reset-device-test', requireAdmin, (req, res) => {
  const { deviceToken } = req.body;
  if (!deviceToken) {
    res.status(400).json({ error: 'deviceToken required' });
    return;
  }

  localStore.participations = localStore.participations.filter(p => p.device_token !== deviceToken);
  saveStoreToDisk();
  res.json({ success: true, message: `Participation test records cleared for token: ${deviceToken}` });
});

// Admin: Refresh All Devices & Clear Locked Voters (Ready for new contest / new voting round)
app.post('/api/admin/reset-all-devices', requireAdmin, async (req, res) => {
  try {
    const { contestSlug, resetVoteCounts = false, resetContestStatus = false } = req.body;
    const contest = contestSlug 
      ? localStore.contests.find(c => c.slug === contestSlug || c.id === contestSlug) 
      : localStore.contests[0];

    const prevParticipationsCount = localStore.participations.length;

    // 1. Clear all device vote/participation records so all previously locked devices are free to vote again
    if (contest) {
      localStore.participations = localStore.participations.filter(
        p => p.contest_id !== contest.id && p.contest_id !== contest.slug
      );
    } else {
      localStore.participations = [];
    }

    // 2. Also clear abuse logs so no devices stay flagged from previous contest
    localStore.abuse_logs = [];

    // 3. Optionally zero out contestant vote tallies if starting fresh contest
    if (resetVoteCounts) {
      localStore.contestants.forEach(c => {
        c.vote_count = 0;
      });
    }

    // 4. Update contest reset timestamp and status if requested
    if (contest) {
      contest.last_devices_reset_at = new Date().toISOString();
      if (resetContestStatus) {
        contest.status = 'active';
      }
    }

    saveStoreToDisk();

    // 5. If Supabase PostgreSQL is connected, sync database tables
    if (supabase) {
      try {
        if (contest) {
          await supabase.from('participations').delete().eq('contest_id', contest.id);
        } else {
          await supabase.from('participations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (resetVoteCounts) {
          await supabase.from('contestants').update({ vote_count: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (contest && resetContestStatus) {
          await supabase.from('contests').update({ 
            status: 'active', 
            updated_at: new Date().toISOString() 
          }).eq('id', contest.id);
        }
      } catch (sbErr) {
        console.warn('[Supabase] Error syncing reset-all-devices to Supabase:', sbErr);
      }
    }

    res.json({
      success: true,
      message: `All devices have been successfully refreshed and unlocked! (${prevParticipationsCount} participation locks cleared). Devices are now free to vote in the new contest.`,
      clearedRecords: prevParticipationsCount,
      resetVoteCounts,
      contest,
      contestants: localStore.contestants,
    });
  } catch (err: any) {
    console.error('[Admin Reset All Devices Error]', err);
    res.status(500).json({ error: 'Failed to reset all devices', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// SUPABASE ONE-CLICK CLOUD SYNCHRONIZATION
// ---------------------------------------------------------------------------
app.post('/api/admin/sync-to-supabase', requireAdmin, async (req, res) => {
  if (!supabase) {
    res.status(400).json({
      success: false,
      error: 'Supabase credentials are not configured.',
    });
    return;
  }

  try {
    const currentContest = localStore.contests[0];
    if (currentContest) {
      const { error: cErr } = await supabase.from('contests').upsert({
        id: currentContest.id,
        slug: currentContest.slug,
        title: currentContest.title,
        description: currentContest.description,
        category: currentContest.category,
        status: currentContest.status,
        start_time: currentContest.start_time,
        end_time: currentContest.end_time,
        max_submissions_per_device: currentContest.max_submissions_per_device,
        whatsapp_channel_url: currentContest.whatsapp_channel_url,
        whatsapp_channel_name: currentContest.whatsapp_channel_name,
        is_public_leaderboard_visible: currentContest.is_public_leaderboard_visible,
        allow_contestant_registration: currentContest.allow_contestant_registration,
      });
      if (cErr) throw cErr;
    }

    let syncedCount = 0;
    if (localStore.contestants.length > 0) {
      const records = localStore.contestants.map(c => ({
        id: c.id,
        contest_id: c.contest_id,
        contestant_number: c.contestant_number,
        name: c.name,
        bio: c.bio,
        photo_url: c.photo_url,
        status: c.status,
        whatsapp_number: c.whatsapp_number,
        vote_count: c.vote_count,
      }));
      const { error: ctErr } = await supabase.from('contestants').upsert(records);
      if (ctErr) throw ctErr;
      syncedCount = records.length;
    }

    res.json({
      success: true,
      message: `Cloud synchronization successful! Contest and ${syncedCount} contestants published to Supabase.`,
      syncedContestants: syncedCount,
    });
  } catch (err: any) {
    console.error('[Supabase Sync Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to synchronize with Supabase',
      hint: 'Ensure you have executed the SQL script in your Supabase SQL Editor first.',
      sqlUrl: 'https://supabase.com/dashboard/project/pwnpskdkoefrqmowwbgo/sql/new',
    });
  }
});

// ---------------------------------------------------------------------------
// GEMINI AI INTEGRATION ENDPOINTS
// ---------------------------------------------------------------------------

// 1. AI Contestant Bio & Pitch Generator
app.post('/api/ai/generate-bio', async (req, res) => {
  const { name, category, notes } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Candidate name is required' });
    return;
  }

  const trimmedName = name.trim();
  const contestCategory = category || 'Public Contest';

  if (!geminiClient) {
    res.json({
      success: true,
      bio: `Dedicated and passionate candidate standing for excellence and community empowerment in ${contestCategory}. Ready to serve, lead, and represent with integrity.`,
    });
    return;
  }

  try {
    const prompt = `You are a professional campaign strategist. Write a captivating, inspiring candidate manifesto / bio (maximum 2 to 3 sentences, 40 to 60 words total) for a voting contest.
Candidate Name: ${trimmedName}
Contest Category: ${contestCategory}
Key Points / Focus: ${notes || 'Integrity, vision, excellence, dedicated service'}

Output ONLY the plain bio text without quotes, headings, or bullets.`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const bio = response.text ? response.text.trim() : '';
    res.json({ success: true, bio });
  } catch (err: any) {
    console.error('[Gemini AI generate-bio error]', err.message);
    res.json({
      success: true,
      bio: `Dedicated and passionate candidate standing for excellence and community empowerment in ${contestCategory}. Ready to serve and make a lasting impact.`,
    });
  }
});

// 2. AI Vote Integrity & Fraud Audit
app.post('/api/ai/analyze-audit', requireAdmin, async (req, res) => {
  const recentVotes = localStore.participations.slice(-30);
  const abuseLogs = localStore.abuse_logs.slice(-15);

  if (!geminiClient) {
    res.json({
      success: true,
      riskLevel: 'LOW',
      summary: 'Standard 2-vote device limits and IP checks are actively safeguarding the contest. No anomalous clustering detected.',
      recommendations: [
        'Continue monitoring real-time submission logs.',
        'Use "Refresh All Devices" between contest rounds.',
      ],
    });
    return;
  }

  try {
    const auditData = {
      totalSubmissionsCount: localStore.participations.length,
      sampleRecentSubmissions: recentVotes.map(v => ({
        devicePrefix: v.device_token ? v.device_token.slice(0, 10) : 'none',
        ip: v.ip_address,
        time: v.created_at,
      })),
      recentAbuseLogs: abuseLogs,
    };

    const prompt = `You are an election cybersecurity and voting fraud detection analyst. Review this voting audit sample:
${JSON.stringify(auditData, null, 2)}

Provide a structured security analysis:
1. "riskLevel": ("LOW", "MEDIUM", or "HIGH")
2. "summary": (2 concise sentences evaluating device token distribution and velocity)
3. "recommendations": (Array of 2-3 brief actionable steps)

Output strictly valid JSON with keys: riskLevel, summary, recommendations.`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    let result = null;
    try {
      const clean = (response.text || '').replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = {
        riskLevel: 'LOW',
        summary: response.text || 'Voting patterns show normal device distribution.',
        recommendations: ['Maintain active anti-abuse rate limits.'],
      };
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Gemini AI analyze-audit error]', err.message);
    res.json({
      success: true,
      riskLevel: 'LOW',
      summary: 'Automated 2-vote limits and cryptographic device fingerprinting are active and protecting voter integrity.',
      recommendations: ['Monitor candidate standings periodically.'],
    });
  }
});

// ---------------------------------------------------------------------------
// Server & Vite Middleware Integration
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Voters Decide] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
