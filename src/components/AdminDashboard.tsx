import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Save30Logo } from './Save30Logo';
import { Plan } from '../types';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Layers,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  X,
  Plus,
  Edit,
  Eye,
  Building2,
  FileText,
  RotateCcw,
  Check,
  Send,
  Loader2,
  Lock,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToApp: () => void;
  currentAdminRole?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToApp,
  currentAdminRole = 'super_admin',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'users' | 'plans' | 'transactions' | 'audit' | 'tickets'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Withdrawal for Processing Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<'processing' | 'successful' | 'failed'>('processing');
  const [adminNote, setAdminNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingWth, setIsProcessingWth] = useState(false);

  // Plan Edit/Create Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<{
    name: string;
    daily_amount: number;
    core_days: number;
    additional_days: number;
    description: string;
    status: 'active' | 'inactive';
  }>({
    name: 'Save30 Standard',
    daily_amount: 200,
    core_days: 30,
    additional_days: 3,
    description: '',
    status: 'active',
  });

  // Selected User Modal for deep inspection
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [adminNotification, setAdminNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResettingDb, setIsResettingDb] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminNotification({ type, message });
    setTimeout(() => {
      setAdminNotification(null);
    }, 4000);
  };

  const handleResetDatabase = async () => {
    if (isResettingDb) return;
    try {
      setIsResettingDb(true);
      await api.resetDatabase();
      await loadData();
      showNotification('Database reset successfully. 0 users, 0 transactions, 0 plans.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset database.', 'error');
    } finally {
      setIsResettingDb(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, wthRes, usersRes, plansRes, txRes, auditRes, ticketsRes] = await Promise.allSettled([
        api.getAdminOverview(),
        api.getAdminWithdrawals(),
        api.getAdminUsers(searchQuery),
        api.getAdminPlans(),
        api.getAdminTransactions(),
        api.getAdminAuditLogs(),
        api.getAdminSupportTickets(),
      ]);

      if (overviewRes.status === 'fulfilled') setMetrics(overviewRes.value.metrics);
      if (wthRes.status === 'fulfilled') setWithdrawals(wthRes.value.withdrawals);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.plans);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.audit_logs);
      if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.tickets);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleUpdateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    setIsProcessingWth(true);

    try {
      await api.updateWithdrawal(selectedWithdrawal.id, {
        status: newStatus,
        admin_notes: adminNote.trim() || undefined,
        payment_reference: paymentReference.trim() || undefined,
      });

      setSelectedWithdrawal(null);
      setAdminNote('');
      setPaymentReference('');
      await loadData();
      showNotification(`Withdrawal updated to ${newStatus.toUpperCase()}!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update withdrawal.', 'error');
    } finally {
      setIsProcessingWth(false);
    }
  };

  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm({
      name: '',
      daily_amount: 200,
      core_days: 30,
      additional_days: 3,
      description: '',
      status: 'active',
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      daily_amount: plan.daily_amount,
      core_days: plan.core_days,
      additional_days: plan.additional_days,
      description: plan.description || '',
      status: plan.status === 'active' ? 'active' : 'inactive',
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlanId) {
        await api.updatePlan(editingPlanId, planForm);
        showNotification('Plan updated successfully!', 'success');
      } else {
        await api.createPlan(planForm);
        showNotification('New Plan created successfully!', 'success');
      }
      setIsPlanModalOpen(false);
      setEditingPlanId(null);
      await loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save plan.', 'error');
    }
  };

  const handleTogglePlanStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updatePlan(plan.id, { status: nextStatus });
      await loadData();
      showNotification(`Plan "${plan.name}" is now ${nextStatus.toUpperCase()}.`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update plan status.', 'error');
    }
  };

  const handleToggleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      await api.updateUserStatus(
        userId,
        !isSuspended,
        isSuspended ? 'Account reactivated by administrator' : 'Account suspended by administrator'
      );
      await loadData();
      showNotification(`User account ${isSuspended ? 'reactivated' : 'suspended'}.`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col font-sans">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0F1622] border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-colors cursor-pointer"
              title="Return to Member Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Save30Logo size="sm" />
            <div className="hidden sm:block border-l border-white/10 pl-3">
              <span className="text-xs font-black text-white">ADMINISTRATION</span>
              <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                {currentAdminRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentAdminRole === 'super_admin' && (
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={isResettingDb}
                className="py-1.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Wipe database to clean state (0 users, 0 transactions, 0 plans)"
              >
                {isResettingDb ? 'Resetting...' : 'Reset Database'}
              </button>
            )}
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onBackToApp}
              className="py-1.5 px-3 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </header>

      {/* Admin Notification Banner */}
      {adminNotification && (
        <div
          className={`px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            adminNotification.type === 'success'
              ? 'bg-[#00875A] text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {adminNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{adminNotification.message}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'withdrawals' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Withdrawals</span>
            {withdrawals.filter(w => w.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-black font-black">
                {withdrawals.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              activeTab === 'plans' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              activeTab === 'transactions' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Transactions
          </button>
          {currentAdminRole === 'super_admin' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
                activeTab === 'audit' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Audit Logs
            </button>
          )}
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              activeTab === 'tickets' ? 'bg-[#00875A] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Support Tickets
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Savers
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  {metrics?.totalUsers ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">Registered member accounts</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Contributions
                </span>
                <div className="text-2xl font-black text-[#00A86B] font-mono">
                  ₦{(metrics?.totalVolume ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {metrics?.totalSuccessfulContributions ?? 0} verified payments
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Pending Payouts
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {metrics?.pendingWithdrawalsCount ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">Awaiting admin review</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Paid Out
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  ₦{(metrics?.totalPayoutVolume ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {metrics?.paidWithdrawalsCount ?? 0} successful payouts
                </span>
              </div>
            </div>

            {/* Quick Pending Withdrawals Card */}
            <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">Pending Withdrawal Requests</h3>
                  <p className="text-xs text-zinc-400">Requires manual bank transfer verification</p>
                </div>
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className="text-xs font-bold text-[#00A86B] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => (
                  <div key={w.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{w.save30_id}</span>
                        <span className="text-zinc-400">• {w.full_name}</span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        {w.bank_name} • {w.account_number} ({w.account_name})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#00A86B] text-sm">
                        ₦{w.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedWithdrawal(w);
                          setNewStatus('processing');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        Process
                      </button>
                    </div>
                  </div>
                ))}
                {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                  <div className="py-4 text-center text-zinc-500">
                    No pending withdrawal requests.
                  </div>
                )}
              </div>
            </div>

            {/* Database Clean State Reset Card for Super Admin */}
            {currentAdminRole === 'super_admin' && (
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Database Maintenance & Clean State Reset</span>
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-xl">
                      Wipe all test user accounts, transactions, withdrawals, and plan records. Resets the database to a 100% clean initial state (Registered Users: 0, Transactions: 0, Plans: 0).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDatabase}
                    disabled={isResettingDb}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
                  >
                    {isResettingDb ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <span>Reset Database to Clean State</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WITHDRAWAL MANAGEMENT */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Withdrawal Administration</h3>
                <p className="text-xs text-zinc-400">
                  Manual payout processing pipeline: PENDING → PROCESSING → SUCCESSFUL.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0C111A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080C14] text-zinc-400 font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Beneficiary</th>
                      <th className="py-3 px-4">Bank Details</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No withdrawal requests yet.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#00A86B]">
                            {w.save30_id}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {w.full_name}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            <div>{w.bank_name}</div>
                            <div className="text-[11px] font-mono text-zinc-400">
                              {w.account_number} ({w.account_name})
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            ₦{w.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                w.status === 'successful'
                                  ? 'bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40'
                                  : w.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : w.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {new Date(w.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {w.status !== 'successful' && (
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setNewStatus(w.status === 'pending' ? 'processing' : 'successful');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                Update Status
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Registered Savers</h3>
                <p className="text-xs text-zinc-400">
                  Search, monitor, or suspend user accounts.
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, name, email..."
                  className="w-full pl-9 pr-3.5 py-2 bg-[#0F1622] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#00A86B]"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0C111A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080C14] text-zinc-400 font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Active Plan Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No users registered yet.
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#00A86B]">
                          {u.save30_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {u.email}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {u.phone}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {u.activePlan ? (
                            <span>
                              {u.activePlan.completed_days}/{u.activePlan.total_days} days (₦{u.activePlan.total_amount_paid.toLocaleString()})
                            </span>
                          ) : (
                            <span className="text-zinc-500">None active</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.is_suspended
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-[#00875A]/20 text-[#00A86B]'
                            }`}
                          >
                            {u.is_suspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const details = await api.getAdminUserDetails(u.id);
                                setSelectedUserDetail(details);
                              } catch {}
                            }}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Inspect
                          </button>
                          {currentAdminRole === 'super_admin' && (
                            <button
                              onClick={() => handleToggleSuspendUser(u.id, u.is_suspended)}
                              className={`px-2.5 py-1 rounded font-bold text-[11px] cursor-pointer ${
                                u.is_suspended
                                  ? 'bg-[#00875A]/20 text-[#00A86B]'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {u.is_suspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLAN MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Savings Plans</h3>
                <p className="text-xs text-zinc-400">
                  Configure daily amounts and core/additional days rules.
                </p>
              </div>

              {currentAdminRole === 'super_admin' && (
                <button
                  onClick={handleOpenCreatePlan}
                  className="py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#00875A]/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Plan</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.length === 0 ? (
                <div className="col-span-1 md:col-span-2 p-12 text-center text-zinc-400 text-xs rounded-2xl bg-[#0F1622] border border-white/10 space-y-3">
                  <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
                  <div className="text-base font-bold text-white">No plans available</div>
                  <p className="text-zinc-400 max-w-sm mx-auto">
                    No savings plans have been configured yet. Click "+ Create Plan" above to create your first database-backed plan.
                  </p>
                </div>
              ) : (
                plans.map(p => {
                  const isPlanActive = p.status === 'active';
                  return (
                    <div key={p.id} className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-black text-white">{p.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                              isPlanActive
                                ? 'bg-[#00875A]/20 text-[#00A86B] border-[#00875A]/40'
                                : 'bg-zinc-700/20 text-zinc-400 border-zinc-700/40'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400">{p.description}</p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-zinc-500 block uppercase">Daily</span>
                            <strong className="text-white">₦{p.daily_amount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block uppercase">Core Days</span>
                            <strong className="text-white">{p.core_days} days</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block uppercase">Total Required</span>
                            <strong className="text-[#00A86B]">{p.total_required_days} days</strong>
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-400 pt-1">
                          Eligible Payout: <strong className="text-[#00A86B] font-mono">₦{(p.daily_amount * p.core_days).toLocaleString()}</strong>
                        </div>
                      </div>

                      {currentAdminRole === 'super_admin' && (
                        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPlan(p)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Edit Plan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePlanStatus(p)}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isPlanActive
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                : 'bg-[#00875A]/20 hover:bg-[#00875A]/30 text-[#00A86B] border border-[#00875A]/30'
                            }`}
                          >
                            {isPlanActive ? 'Disable Plan' : 'Enable Plan'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TRANSACTIONS LEDGER */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Full Transaction Ledger</h3>
              <p className="text-xs text-zinc-400">Real-time immutable financial transaction history.</p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0C111A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-[#080C14] text-zinc-400 font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(t => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-mono font-bold text-[#00A86B]">
                          {t.save30_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          Day {t.day_number}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          ₦{t.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                          {t.reference}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.status === 'successful'
                                ? 'bg-[#00875A]/20 text-[#00A86B]'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && currentAdminRole === 'super_admin' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Audit Log Timeline</h3>
              <p className="text-xs text-zinc-400">Complete record of all administrative actions.</p>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs rounded-xl bg-[#0F1622] border border-white/10">
                  No audit logs yet.
                </div>
              ) : (
                auditLogs.map(log => (
                <div key={log.id} className="p-4 rounded-xl bg-[#0F1622] border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#00A86B] uppercase">{log.action}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-white font-medium">
                    Admin: {log.admin_email} ({log.admin_role})
                  </div>
                  <div className="text-zinc-400">
                    Target: {log.target_type} ({log.target_id})
                  </div>
                  {log.details && (
                    <div className="text-zinc-300 italic pt-1">
                      "{log.details}"
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Support Inquiries</h3>
              <p className="text-xs text-zinc-400">Manage member questions and resolutions.</p>
            </div>

            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs rounded-xl bg-[#0F1622] border border-white/10">
                  No support tickets yet.
                </div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="p-4 rounded-xl bg-[#0F1622] border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{t.subject}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-zinc-300">
                        {t.status}
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      From: {t.user_name} ({t.save30_id} • {t.user_email})
                    </div>
                    <p className="text-zinc-200 bg-[#080C14] p-3 rounded-lg border border-white/5">
                      {t.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* WITHDRAWAL PROCESSING MODAL */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F1622] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Process Withdrawal</h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090D14] border border-white/10 text-xs space-y-1">
              <div><strong>User ID:</strong> {selectedWithdrawal.save30_id}</div>
              <div><strong>Beneficiary:</strong> {selectedWithdrawal.full_name}</div>
              <div><strong>Bank:</strong> {selectedWithdrawal.bank_name} - {selectedWithdrawal.account_number}</div>
              <div><strong>Amount:</strong> ₦{selectedWithdrawal.amount.toLocaleString()}</div>
            </div>

            <form onSubmit={handleUpdateWithdrawal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold uppercase mb-1">Status Transition</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-[#0D131C] border border-white/15 rounded-xl text-white outline-none"
                >
                  <option value="processing">PROCESSING (Under Bank Review)</option>
                  <option value="successful">SUCCESSFUL (Payout Completed &amp; Close Plan)</option>
                  <option value="failed">FAILED (Reject / Account Issue)</option>
                </select>
              </div>

              {newStatus === 'successful' && (
                <div>
                  <label className="block text-zinc-300 font-bold uppercase mb-1">
                    Bank Payment Reference / Session ID
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. NUBAN-TRF-9823478912"
                    className="w-full p-2.5 bg-[#0D131C] border border-white/15 rounded-xl text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-bold uppercase mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Optional memo or payout confirmation details..."
                  className="w-full p-2.5 bg-[#0D131C] border border-white/15 rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-zinc-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWth}
                  className="flex-1 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold cursor-pointer"
                >
                  {isProcessingWth ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN CREATION / EDIT MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0F1622] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingPlanId ? 'Edit Savings Plan' : 'Create New Savings Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Save30 Standard"
                  className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Daily (₦)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.daily_amount}
                    onChange={e => setPlanForm({ ...planForm, daily_amount: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Core Days</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.core_days}
                    onChange={e => setPlanForm({ ...planForm, core_days: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Extra Days</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planForm.additional_days}
                    onChange={e => setPlanForm({ ...planForm, additional_days: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Status</label>
                <select
                  value={planForm.status}
                  onChange={e => setPlanForm({ ...planForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white outline-none"
                >
                  <option value="active">Active (Available for user selection)</option>
                  <option value="inactive">Inactive (Disabled / Hidden from selection)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Terms, daily commitment details, and withdrawal eligibility description..."
                  className="w-full p-2 bg-[#0D131C] border border-white/15 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-zinc-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold cursor-pointer"
                >
                  {editingPlanId ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAIL INSPECTOR MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0F1622] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-black text-white">
                Member Profile: {selectedUserDetail.user.save30_id}
              </h3>
              <button onClick={() => setSelectedUserDetail(null)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-1">
              <div><strong>Name:</strong> {selectedUserDetail.user.first_name} {selectedUserDetail.user.last_name}</div>
              <div><strong>Email:</strong> {selectedUserDetail.user.email}</div>
              <div><strong>Phone:</strong> {selectedUserDetail.user.phone}</div>
              <div><strong>Status:</strong> {selectedUserDetail.user.is_suspended ? 'SUSPENDED' : 'ACTIVE'}</div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 uppercase text-[11px] text-[#00A86B]">Plan Cycles ({selectedUserDetail.userPlans.length})</h4>
              <div className="space-y-2">
                {selectedUserDetail.userPlans.map((p: any) => (
                  <div key={p.id} className="p-3 bg-[#080C14] rounded-xl border border-white/10">
                    <div className="font-bold text-white">Cycle #{p.cycle_number} ({p.status})</div>
                    <div className="text-zinc-400">{p.completed_days}/{p.total_days} days • ₦{p.total_amount_paid} paid</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 uppercase text-[11px] text-[#00A86B]">Payout Requests ({selectedUserDetail.withdrawals.length})</h4>
              <div className="space-y-2">
                {selectedUserDetail.withdrawals.map((w: any) => (
                  <div key={w.id} className="p-3 bg-[#080C14] rounded-xl border border-white/10">
                    <div className="font-bold text-white">₦{w.amount} - {w.status}</div>
                    <div className="text-zinc-400">{w.bank_name} ({w.account_number})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
