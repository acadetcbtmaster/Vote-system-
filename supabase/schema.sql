-- ==============================================================================
-- SAVE30 — PRODUCTION DATABASE SCHEMA & MIGRATIONS
-- Secure, disciplined Nigerian daily savings platform
-- Single source of truth for accounts, plans, contributions, transactions, and withdrawals.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (USERS) TABLE
-- Sequential ID generator starts at 1 -> SAVE30-001, SAVE30-002, etc.
CREATE SEQUENCE IF NOT EXISTS save30_user_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    save30_id TEXT UNIQUE NOT NULL,
    sequence_number INTEGER UNIQUE NOT NULL DEFAULT nextval('save30_user_seq'),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin', 'finance_admin', 'support_admin')),
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    referral_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PLANS TABLE
-- Administrator-configurable savings plans (e.g. ₦200/day, 30 core days + 3 additional = 33 days)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    daily_amount NUMERIC(12, 2) NOT NULL DEFAULT 200.00,
    core_days INTEGER NOT NULL DEFAULT 30,
    additional_days INTEGER NOT NULL DEFAULT 3,
    total_required_days INTEGER NOT NULL DEFAULT 33,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default standard plan if none exists
INSERT INTO public.plans (name, daily_amount, core_days, additional_days, total_required_days, description, status)
VALUES (
    'Save30 Standard',
    200.00,
    30,
    3,
    33,
    'Save ₦200 daily for 30 core days plus 3 additional commitment days (33 total days). Eligible for ₦6,000 withdrawal upon Day 33 completion.',
    'active'
) ON CONFLICT DO NOTHING;

-- 3. USER PLANS TABLE
-- Snapshots plan terms so future admin changes do NOT mutate a user's active agreement
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    cycle_number INTEGER NOT NULL DEFAULT 1,
    plan_name TEXT NOT NULL,
    daily_amount NUMERIC(12, 2) NOT NULL,
    core_days INTEGER NOT NULL,
    additional_days INTEGER NOT NULL,
    total_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    completed_days INTEGER NOT NULL DEFAULT 0,
    total_amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    eligible_withdrawal_amount NUMERIC(12, 2) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_active_cycle UNIQUE (user_id, cycle_number)
);

-- 4. CONTRIBUTION DAYS TABLE
-- Sequential tracking of Day 1 through Day 33
CREATE TABLE IF NOT EXISTS public.contribution_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_plan_id UUID NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1),
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unpaid', 'pending', 'successful', 'failed', 'reversed')),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    transaction_id TEXT,
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_plan_day UNIQUE (user_plan_id, day_number)
);

-- 5. TRANSACTIONS TABLE (IMMUTABLE FINANCIAL LEDGER)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    save30_id TEXT NOT NULL,
    user_plan_id UUID NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    reference TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'paystack',
    provider_tx_id TEXT,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'reversed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ
);

-- 6. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    save30_id TEXT NOT NULL,
    user_plan_id UUID NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed')),
    admin_notes TEXT,
    processed_by_admin_id UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    admin_email TEXT NOT NULL,
    admin_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    save30_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_save30_id ON public.profiles(save30_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_status ON public.user_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contribution_days_plan_status ON public.contribution_days(user_plan_id, status);
CREATE INDEX IF NOT EXISTS idx_contribution_days_day_number ON public.contribution_days(user_plan_id, day_number);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
