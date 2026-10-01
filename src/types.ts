// ==============================================================================
// SAVE30 — TypeScript Domain Models & Types
// Modern, Nigerian-first disciplined daily savings platform
// ==============================================================================

export type UserRole = 'user' | 'super_admin' | 'finance_admin' | 'support_admin';

export interface UserProfile {
  id: string;
  save30_id: string; // e.g. SAVE30-001
  sequence_number: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_suspended: boolean;
  referral_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  daily_amount: number; // e.g. 200 (₦200)
  core_days: number; // e.g. 30
  additional_days: number; // e.g. 3
  total_required_days: number; // e.g. 33
  description: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at?: string;
}

export type UserPlanStatus = 'active' | 'completed' | 'terminated';

export interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  cycle_number: number;
  plan_name: string;
  daily_amount: number; // Plan snapshot (e.g. 200)
  core_days: number; // Plan snapshot (e.g. 30)
  additional_days: number; // Plan snapshot (e.g. 3)
  total_days: number; // Plan snapshot (e.g. 33)
  status: UserPlanStatus;
  completed_days: number; // Number of successful days (0..33)
  total_amount_paid: number;
  eligible_withdrawal_amount: number; // dynamic: daily_amount * core_days = ₦6,000
  started_at: string;
  completed_at?: string | null;
}

export type ContributionDayStatus =
  | 'locked'
  | 'unpaid'
  | 'pending'
  | 'successful'
  | 'failed'
  | 'reversed';

export interface ContributionDay {
  id: string;
  user_plan_id: string;
  user_id: string;
  day_number: number; // 1 to 33
  amount: number;
  status: ContributionDayStatus;
  due_date?: string;
  paid_at?: string | null;
  transaction_id?: string | null;
  payment_reference?: string | null;
  created_at: string;
  updated_at?: string;
}

export type TransactionStatus = 'pending' | 'successful' | 'failed' | 'reversed';

export interface Transaction {
  id: string;
  user_id: string;
  save30_id: string;
  user_plan_id: string;
  day_number: number;
  amount: number;
  currency: string; // 'NGN'
  reference: string;
  provider: 'paystack' | 'bank_transfer' | 'mock_sandbox';
  provider_tx_id?: string;
  payment_method?: string;
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  verified_at?: string | null;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'successful' | 'failed';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  save30_id: string;
  user_plan_id: string;
  full_name: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  admin_notes?: string | null;
  processed_by_admin_id?: string | null;
  processed_at?: string | null;
  payment_reference?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_role: string;
  action: string;
  target_type: string;
  target_id: string;
  previous_value?: unknown;
  new_value?: unknown;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  save30_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface PaymentReceipt {
  transaction_id: string;
  reference: string;
  save30_id: string;
  user_name: string;
  day_number: number;
  amount: number;
  currency: string;
  status: 'successful';
  date: string;
  plan_name: string;
  payment_channel?: string;
}

export interface UserDashboardData {
  user: UserProfile;
  activePlan: UserPlan | null;
  planTemplate: Plan | null;
  contributionDays: ContributionDay[];
  currentRequiredDay: number;
  isWithdrawalAvailable: boolean;
  withdrawalReason: string;
  activeWithdrawal: WithdrawalRequest | null;
  stats: {
    totalSuccessfulDays: number;
    totalRequiredDays: number;
    totalCoreDays: number;
    totalAdditionalDays: number;
    totalAmountPaid: number;
    eligibleWithdrawalAmount: number;
    dailyAmount: number;
  };
  recentTransactions: Transaction[];
  unreadNotificationsCount: number;
}

// ---------------------------------------------------------------------------
// Legacy Types (Preserved for compatibility)
// ---------------------------------------------------------------------------
export type ContestStatus = 'draft' | 'upcoming' | 'active' | 'paused' | 'closed';
export type ContestantStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category?: string;
  status: ContestStatus;
  start_time: string | null;
  end_time: string | null;
  max_submissions_per_device: number;
  whatsapp_channel_url: string;
  whatsapp_channel_name: string;
  is_public_leaderboard_visible: boolean;
  allow_contestant_registration: boolean;
  show_countdown?: boolean;
  views_count?: number;
  followers_count?: number;
  last_devices_reset_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Contestant {
  id: string;
  contest_id: string;
  contestant_number: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  status: ContestantStatus;
  vote_count: number;
  whatsapp_number?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VoteSubmissionResult {
  success: boolean;
  message: string;
  submissions_used?: number;
  remaining_submissions?: number;
  contestant?: Contestant;
  error?: string;
}

export interface DeviceStatusResult {
  submissionsUsed: number;
  remainingSubmissions: number;
  maxAllowed: number;
  canVote: boolean;
  contestStatus: string;
}
