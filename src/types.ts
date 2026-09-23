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
  whatsapp_number?: string | null; // Only available to admin
  created_at: string;
  updated_at?: string;
}

export interface ParticipationRecord {
  id: string;
  contest_id: string;
  contestant_id: string;
  contestant_name?: string;
  contestant_number?: string;
  device_token: string;
  voter_name: string;
  voter_whatsapp: string;
  ip_address?: string;
  created_at: string;
}

export interface AbuseLog {
  id: string;
  contest_id?: string;
  device_token?: string;
  event_type: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface VoteSubmissionPayload {
  contestantId: string;
  deviceToken: string;
  fullName: string;
  whatsappNumber: string;
}

export interface VoteSubmissionResult {
  success: boolean;
  message: string;
  error?: string;
  contestant?: {
    id: string;
    name: string;
    contestant_number: string;
    vote_count: number;
  };
  submissions_used?: number;
  remaining_submissions?: number;
  whatsapp_channel_url?: string;
  followers_count?: number;
}

export interface DeviceStatusResult {
  submissionsUsed: number;
  remainingSubmissions: number;
  maxAllowed: number;
  canVote: boolean;
  contestStatus: ContestStatus;
}
