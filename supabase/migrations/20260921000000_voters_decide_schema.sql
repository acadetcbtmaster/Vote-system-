-- Supabase migration file: 20260921000000_voters_decide_schema.sql
-- Run with: supabase migration up or execute in Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE contest_status AS ENUM ('draft', 'upcoming', 'active', 'paused', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contestant_status AS ENUM ('pending', 'approved', 'rejected', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    status contest_status NOT NULL DEFAULT 'active',
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    max_submissions_per_device INTEGER NOT NULL DEFAULT 2,
    whatsapp_channel_url TEXT NOT NULL DEFAULT 'https://whatsapp.com/channel/0029VaVotersDecideOfficial',
    whatsapp_channel_name TEXT NOT NULL DEFAULT 'Voters Decide Official Channel',
    is_public_leaderboard_visible BOOLEAN NOT NULL DEFAULT true,
    allow_contestant_registration BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    contestant_number TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    status contestant_status NOT NULL DEFAULT 'approved',
    whatsapp_number TEXT,
    vote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_contest_contestant_number UNIQUE (contest_id, contestant_number)
);

CREATE TABLE IF NOT EXISTS public.participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES public.contestants(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    voter_name TEXT NOT NULL,
    voter_whatsapp TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abuse_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
    device_token TEXT,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contests_slug ON public.contests(slug);
CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contestants_contest_status ON public.contestants(contest_id, status);
CREATE INDEX IF NOT EXISTS idx_contestants_vote_count ON public.contestants(contest_id, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_participations_contest_device ON public.participations(contest_id, device_token);
CREATE INDEX IF NOT EXISTS idx_participations_contestant ON public.participations(contestant_id);
CREATE INDEX IF NOT EXISTS idx_participations_created_at ON public.participations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_created_at ON public.abuse_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.submit_vote(
    p_contest_id UUID,
    p_contestant_id UUID,
    p_device_token TEXT,
    p_voter_name TEXT,
    p_voter_whatsapp TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_contest RECORD;
    v_contestant RECORD;
    v_device_vote_count INTEGER;
    v_new_vote_count INTEGER;
    v_max_submissions INTEGER;
BEGIN
    SELECT id, status, start_time, end_time, max_submissions_per_device, whatsapp_channel_url
    INTO v_contest
    FROM public.contests
    WHERE id = p_contest_id
    FOR SHARE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTEST_NOT_FOUND', 'message', 'The requested contest does not exist.');
    END IF;

    IF v_contest.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTEST_NOT_ACTIVE', 'message', 'Voting is currently not active for this contest.');
    END IF;

    IF v_contest.start_time IS NOT NULL AND now() < v_contest.start_time THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTEST_NOT_STARTED', 'message', 'Voting has not started yet.');
    END IF;

    IF v_contest.end_time IS NOT NULL AND now() > v_contest.end_time THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTEST_ENDED', 'message', 'Voting has ended for this contest.');
    END IF;

    v_max_submissions := COALESCE(v_contest.max_submissions_per_device, 2);

    SELECT id, name, contestant_number, status, vote_count
    INTO v_contestant
    FROM public.contestants
    WHERE id = p_contestant_id AND contest_id = p_contest_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTESTANT_NOT_FOUND', 'message', 'Contestant not found in this contest.');
    END IF;

    IF v_contestant.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CONTESTANT_NOT_ELIGIBLE', 'message', 'This contestant is not currently eligible for votes.');
    END IF;

    SELECT COUNT(*)
    INTO v_device_vote_count
    FROM public.participations
    WHERE contest_id = p_contest_id AND device_token = p_device_token;

    IF v_device_vote_count >= v_max_submissions THEN
        INSERT INTO public.abuse_logs (contest_id, device_token, event_type, details, ip_address)
        VALUES (p_contest_id, p_device_token, 'LIMIT_EXCEEDED', jsonb_build_object('attempted_contestant_id', p_contestant_id, 'current_count', v_device_vote_count), p_ip_address);

        RETURN jsonb_build_object(
            'success', false,
            'error', 'PARTICIPATION_LIMIT_REACHED',
            'message', 'You have reached the maximum allowed submissions (2) for this contest from this browser/device.',
            'submissions_used', v_device_vote_count,
            'max_allowed', v_max_submissions
        );
    END IF;

    INSERT INTO public.participations (
        contest_id,
        contestant_id,
        device_token,
        voter_name,
        voter_whatsapp,
        ip_address,
        user_agent
    )
    VALUES (
        p_contest_id,
        p_contestant_id,
        p_device_token,
        TRIM(p_voter_name),
        TRIM(p_voter_whatsapp),
        p_ip_address,
        p_user_agent
    );

    UPDATE public.contestants
    SET vote_count = vote_count + 1,
        updated_at = now()
    WHERE id = p_contestant_id
    RETURNING vote_count INTO v_new_vote_count;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Your choice has been recorded successfully.',
        'contestant', jsonb_build_object(
            'id', v_contestant.id,
            'name', v_contestant.name,
            'contestant_number', v_contestant.contestant_number,
            'vote_count', v_new_vote_count
        ),
        'submissions_used', v_device_vote_count + 1,
        'remaining_submissions', v_max_submissions - (v_device_vote_count + 1),
        'whatsapp_channel_url', v_contest.whatsapp_channel_url
    );
END;
$$;

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contests" ON public.contests FOR SELECT TO public USING (true);
CREATE POLICY "Public read approved contestants" ON public.contestants FOR SELECT TO public USING (status = 'approved');
CREATE POLICY "Public insert pending contestant" ON public.contestants FOR INSERT TO public WITH CHECK (status = 'pending' AND vote_count = 0);
CREATE POLICY "Service role full participations" ON public.participations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full abuse logs" ON public.abuse_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
