// ==============================================================================
// SAVE30 — Client API Service
// Typed HTTP client for all Save30 operations
// ==============================================================================

import {
  UserProfile,
  UserPlan,
  Plan,
  Transaction,
  WithdrawalRequest,
  InAppNotification,
  SupportTicket,
  UserDashboardData,
  PaymentReceipt,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'save30_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
    referral_code?: string;
    accept_terms: boolean;
  }): Promise<{ success: boolean; token: string; user: UserProfile; plan: UserPlan }> {
    const res = await request<{ success: boolean; token: string; user: UserProfile; plan: UserPlan }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async login(payload: { email: string; password: string }): Promise<{ success: boolean; token: string; user: UserProfile }> {
    const res = await request<{ success: boolean; token: string; user: UserProfile }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout(): void {
    setStoredToken(null);
  },

  // User Dashboard & Plans
  async getDashboard(): Promise<UserDashboardData> {
    return request<UserDashboardData>('/api/user/dashboard');
  },

  async getAvailablePlans(): Promise<{ plans: Plan[] }> {
    return request<{ plans: Plan[] }>('/api/plans');
  },

  async getMyPlans(): Promise<{ plans: UserPlan[] }> {
    return request<{ plans: UserPlan[] }>('/api/user/plans');
  },

  async startNewPlanCycle(): Promise<{ success: boolean; message: string; plan: UserPlan }> {
    return request<{ success: boolean; message: string; plan: UserPlan }>('/api/user/plans/new-cycle', {
      method: 'POST',
    });
  },

  // Daily Payments
  async initializePayment(day_number: number): Promise<{
    success: boolean;
    reference: string;
    amount: number;
    day_number: number;
    currency: string;
    authorization_url?: string;
    requires_redirect: boolean;
  }> {
    return request('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ day_number }),
    });
  },

  async selectPlan(plan_id: string): Promise<{ success: boolean; message: string; plan: UserPlan }> {
    return request('/api/user/select-plan', {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    });
  },

  async verifyPayment(
    reference: string
  ): Promise<{
    success: boolean;
    status?: string;
    message?: string;
    error?: string;
    transaction?: Transaction;
    receipt?: PaymentReceipt;
  }> {
    return request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  },

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return request<{ transactions: Transaction[] }>('/api/user/transactions');
  },

  async getReceipt(reference: string): Promise<{ receipt: PaymentReceipt }> {
    return request<{ receipt: PaymentReceipt }>(`/api/user/receipt/${encodeURIComponent(reference)}`);
  },

  // Withdrawals
  async requestWithdrawal(payload: {
    full_name: string;
    bank_name: string;
    account_number: string;
    account_name: string;
  }): Promise<{ success: boolean; message: string; withdrawal: WithdrawalRequest }> {
    return request<{ success: boolean; message: string; withdrawal: WithdrawalRequest }>(
      '/api/withdrawals/request',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: InAppNotification[] }> {
    return request<{ notifications: InAppNotification[] }>('/api/user/notifications');
  },

  async markNotificationsRead(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/user/notifications/mark-read', {
      method: 'POST',
    });
  },

  // Support
  async submitSupportTicket(payload: { subject: string; message: string }): Promise<{
    success: boolean;
    message: string;
    ticket: SupportTicket;
  }> {
    return request('/api/user/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin
  async getAdminOverview(): Promise<{
    metrics: {
      totalUsers: number;
      activePlans: number;
      completedPlans: number;
      totalSuccessfulContributions: number;
      totalVolume: number;
      pendingWithdrawalsCount: number;
      processingWithdrawalsCount: number;
      paidWithdrawalsCount: number;
      totalPayoutVolume: number;
    };
    admin_role: string;
  }> {
    return request('/api/admin/overview');
  },

  async getAdminUsers(query = ''): Promise<{ users: any[] }> {
    return request(`/api/admin/users?q=${encodeURIComponent(query)}`);
  },

  async getAdminUserDetails(id: string): Promise<any> {
    return request(`/api/admin/users/${encodeURIComponent(id)}`);
  },

  async updateUserStatus(id: string, is_suspended: boolean, reason = ''): Promise<any> {
    return request(`/api/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_suspended, reason }),
    });
  },

  async getAdminPlans(): Promise<{ plans: Plan[] }> {
    return request<{ plans: Plan[] }>('/api/admin/plans');
  },

  async createPlan(payload: {
    name: string;
    daily_amount: number;
    core_days: number;
    additional_days: number;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
  }): Promise<{ success: boolean; plan: Plan }> {
    return request('/api/admin/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePlan(
    id: string,
    payload: {
      name?: string;
      daily_amount?: number;
      core_days?: number;
      additional_days?: number;
      description?: string;
      status?: 'active' | 'inactive' | 'archived';
    }
  ): Promise<{ success: boolean; plan: Plan }> {
    return request(`/api/admin/plans/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getAdminWithdrawals(): Promise<{ withdrawals: WithdrawalRequest[] }> {
    return request<{ withdrawals: WithdrawalRequest[] }>('/api/admin/withdrawals');
  },

  async updateWithdrawal(
    id: string,
    payload: {
      status: 'pending' | 'processing' | 'successful' | 'failed';
      admin_notes?: string;
      payment_reference?: string;
    }
  ): Promise<{ success: boolean; message: string; withdrawal: WithdrawalRequest }> {
    return request(`/api/admin/withdrawals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getAdminTransactions(): Promise<{ transactions: Transaction[] }> {
    return request<{ transactions: Transaction[] }>('/api/admin/transactions');
  },

  async getAdminAuditLogs(): Promise<{ audit_logs: AuditLog[] }> {
    return request<{ audit_logs: AuditLog[] }>('/api/admin/audit-logs');
  },

  async getAdminSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
    return request<{ tickets: SupportTicket[] }>('/api/admin/support-tickets');
  },

  async updateAdminSupportTicket(id: string, status: string): Promise<any> {
    return request(`/api/admin/support-tickets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/admin/reset-database', {
      method: 'POST',
    });
  },

  async verifyAdminKey(secretKey: string): Promise<{ valid: boolean; token?: string; user?: any }> {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });
    const data = await res.json();
    if (data.valid && data.token) {
      setStoredToken(data.token);
    }
    return data;
  },
};
