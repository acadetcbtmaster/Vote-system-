import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UserProfile,
  UserDashboardData,
  ContributionDay,
  PaymentReceipt,
  WithdrawalRequest,
  InAppNotification,
  UserPlan,
  Plan,
} from '../types';
import { Save30Logo } from './Save30Logo';
import { ReceiptModal } from './ReceiptModal';
import { WithdrawalModal } from './WithdrawalModal';
import { PaymentModal } from './PaymentModal';
import { PlanSelectModal } from './PlanSelectModal';
import { PasswordInput } from './PasswordInput';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Bell,
  RefreshCw,
  LogOut,
  User,
  History,
  FileText,
  LifeBuoy,
  ChevronRight,
  Sparkles,
  Printer,
  Calendar,
  Layers,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  Check,
} from 'lucide-react';

interface UserDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onLogout,
  onOpenAdmin,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'days' | 'plans' | 'transactions' | 'withdrawal' | 'notifications' | 'support' | 'profile'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [myPlans, setMyPlans] = useState<UserPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<ContributionDay | null>(null);
  const [isPlanSelectOpen, setIsPlanSelectOpen] = useState(false);
  const [isCheckingCallback, setIsCheckingCallback] = useState(false);

  // Profile Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Support Ticket Form
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportMsg, setSupportMsg] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const [myPlansRes, availRes] = await Promise.all([
        api.getMyPlans(),
        api.getAvailablePlans().catch(() => ({ plans: [] })),
      ]);
      setMyPlans(myPlansRes.plans);
      setAvailablePlans(availRes.plans);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch {}
  };

  useEffect(() => {
    loadDashboard();
    loadPlans();
    loadNotifications();

    // Check for Paystack redirect callback: ?payment_reference=... or ?reference=...
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('payment_reference') || params.get('reference');
      if (ref) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsCheckingCallback(true);
        api.verifyPayment(ref)
          .then((res) => {
            if (res.success && res.receipt) {
              setActiveReceipt(res.receipt);
              loadDashboard();
              loadPlans();
              loadNotifications();
            } else if (res.status === 'pending') {
              setPaymentError('Your payment is still being processed by the bank. Please check status again shortly.');
            } else {
              setPaymentError('Payment was not completed or failed on Paystack.');
            }
          })
          .catch((err) => {
            setPaymentError(err.message || 'Payment verification failed.');
          })
          .finally(() => {
            setIsCheckingCallback(false);
          });
      }
    } catch {}
  }, []);

  const handleOpenPayment = (dayNumber: number) => {
    setPaymentError(null);
    const day = data?.contributionDays.find(d => d.day_number === dayNumber);
    if (day) {
      setSelectedPaymentDay(day as any);
    }
  };

  const handleStartNewCycle = async () => {
    try {
      setIsLoading(true);
      const res = await api.startNewPlanCycle();
      if (res.success) {
        await loadDashboard();
        await loadPlans();
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Could not start new cycle.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportMsg(null);
    setIsSubmittingSupport(true);
    try {
      const res = await api.submitSupportTicket({
        subject: supportSubject,
        message: supportMessage,
      });
      setSupportMsg(res.message || 'Ticket submitted successfully.');
      setSupportSubject('');
      setSupportMessage('');
    } catch (err: any) {
      setSupportMsg(err.message || 'Failed to submit ticket.');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Save30Logo size="lg" className="justify-center animate-pulse" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wide">
            Loading your Save30 vault...
          </p>
        </div>
      </div>
    );
  }

  const activePlan = data?.activePlan;
  const completedDays = activePlan?.completed_days || 0;
  const totalDays = activePlan?.total_days || 33;
  const coreDays = activePlan?.core_days || 30;
  const additionalDays = activePlan?.additional_days || 3;
  const progressPercent = Math.min(100, Math.round((completedDays / totalDays) * 100));

  const currentRequiredDay = data?.currentRequiredDay || 1;
  const isWithdrawalAvailable = data?.isWithdrawalAvailable || false;

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0C121D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Save30Logo size="md" showTagline />
          </div>

          <div className="flex items-center gap-3">
            {/* User ID Badge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                User ID
              </span>
              <span className="text-xs font-mono font-black text-[#00A86B] bg-[#00875A]/15 border border-[#00875A]/30 px-2 py-0.5 rounded-md">
                {user.save30_id}
              </span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setActiveTab('notifications');
                api.markNotificationsRead();
              }}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(data?.unreadNotificationsCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00A86B] text-[9px] font-black flex items-center justify-center text-white">
                  {data?.unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Admin Switcher (STRICTLY restricted to verified administrators) */}
            {user.role !== 'user' && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-bold transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs (Mobile scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('days')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'days'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>33-Day Grid</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('plans');
              loadPlans();
            }}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawal')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'withdrawal'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Withdraw</span>
            {isWithdrawalAvailable && (
              <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#00875A] text-white shadow-md shadow-[#00875A]/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {paymentError && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{paymentError}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* User Greeting & ID Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0F1724] via-[#101928] to-[#0A101A] border border-white/10 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-400 font-semibold">Welcome back,</span>
                    <span className="text-xs font-mono font-bold text-[#00A86B] bg-[#00875A]/20 px-2 py-0.5 rounded-full border border-[#00875A]/40">
                      {user.save30_id}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    {activePlan
                      ? `Disciplined daily savings. Pay ₦${activePlan.daily_amount.toLocaleString()} every day sequentially to unlock your payout.`
                      : 'You do not have an active savings plan. Select an active plan below to begin your daily savings discipline.'}
                  </p>
                </div>

                {!activePlan ? (
                  <button
                    onClick={() => setIsPlanSelectOpen(true)}
                    className="py-3.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00875A]/30 transition-all cursor-pointer shrink-0"
                  >
                    <Layers className="w-4 h-4" />
                    <span>SELECT A PLAN</span>
                  </button>
                ) : (
                  <>
                    {/* Quick Action: Pay Today's Contribution */}
                    {completedDays < totalDays && (
                      <button
                        onClick={() => handleOpenPayment(currentRequiredDay)}
                        className="py-3.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-[#00875A]/30 transition-all cursor-pointer shrink-0 transform active:scale-98"
                      >
                        <span>PAY TODAY (DAY {currentRequiredDay})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* If completed all 33 days */}
                    {completedDays >= totalDays && !data?.activeWithdrawal && (
                      <button
                        onClick={() => setIsWithdrawalModalOpen(true)}
                        className="py-3.5 px-6 rounded-xl bg-[#00A86B] hover:bg-[#00875A] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00A86B]/30 transition-all cursor-pointer shrink-0 animate-bounce"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>REQUEST ₦{activePlan?.eligible_withdrawal_amount.toLocaleString()} PAYOUT</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* If user has NO active plan, display No Active Plan banner and call to action */}
            {!activePlan ? (
              <div className="space-y-6 animate-in fade-in">
                {/* No Active Plan Banner */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0F1724] to-[#0A1019] border border-amber-500/30 shadow-xl space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-2xl font-black text-white">Select a Save30 Plan</h3>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      You currently don't have an active Save30 plan. Choose a savings plan below to begin your daily savings discipline.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setIsPlanSelectOpen(true)}
                      className="py-3 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#00875A]/25 transition-all inline-flex items-center gap-2 cursor-pointer transform active:scale-98"
                    >
                      <Layers className="w-4 h-4" />
                      <span>BROWSE AVAILABLE PLANS</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Available Plans List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00A86B]" />
                      <span>Available Active Plans ({availablePlans.filter(p => p.status === 'active').length})</span>
                    </h4>
                    <span className="text-xs text-zinc-400">Database-backed plan terms</span>
                  </div>

                  {availablePlans.filter(p => p.status === 'active').length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#0F1622] border border-white/10 text-zinc-500 text-xs">
                      No plans available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availablePlans.filter(p => p.status === 'active').map(plan => {
                        const payoutAmount = plan.daily_amount * plan.core_days;
                        return (
                          <div
                            key={plan.id}
                            className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 hover:border-[#00A86B]/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/30">
                                  Active Plan
                                </span>
                                <span className="text-xs font-mono font-bold text-zinc-400">
                                  {plan.total_required_days} Days
                                </span>
                              </div>

                              <h4 className="text-lg font-black text-white">{plan.name}</h4>
                              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                                {plan.description}
                              </p>

                              <div className="pt-2 space-y-1.5 text-xs text-zinc-300">
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Daily Payment:</span>
                                  <span className="font-black text-[#00A86B] font-mono">
                                    ₦{plan.daily_amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Core Period:</span>
                                  <span className="font-bold text-white">{plan.core_days} Days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Commitment Days:</span>
                                  <span className="font-bold text-amber-400">{plan.additional_days} Days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Total Payment Days:</span>
                                  <span className="font-black text-white">{plan.total_required_days} Days</span>
                                </div>
                                <div className="flex justify-between border-t border-white/5 pt-1.5">
                                  <span className="text-zinc-300 font-semibold">Eligible Payout:</span>
                                  <span className="font-black text-[#00A86B] font-mono">
                                    ₦{payoutAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-[10px] text-zinc-400 pt-0.5">
                                  Withdrawal becomes available after Day {plan.total_required_days}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsPlanSelectOpen(true);
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00875A]/25 transition-all cursor-pointer transform active:scale-98"
                            >
                              <span>SELECT PLAN</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>

            {/* WITHDRAWAL STATUS BANNER */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isWithdrawalAvailable
                  ? 'bg-gradient-to-r from-[#00875A]/20 via-[#054F31]/30 to-[#00875A]/20 border-[#00A86B]/50'
                  : 'bg-[#10141D] border-white/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isWithdrawalAvailable
                        ? 'bg-[#00A86B]/20 text-[#00A86B] border border-[#00A86B]/40'
                        : 'bg-white/5 text-amber-400 border border-white/10'
                    }`}
                  >
                    {isWithdrawalAvailable ? (
                      <Unlock className="w-5 h-5 text-[#00A86B]" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {isWithdrawalAvailable ? '🟢 WITHDRAWAL AVAILABLE' : '🔒 WITHDRAWAL LOCKED'}
                      </h4>
                      {completedDays >= coreDays && completedDays < totalDays && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Core Completed (30/30 ✓)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                      {isWithdrawalAvailable
                        ? `Congratulations! All ${totalDays} required days have been successfully completed. You can now request your full ₦${activePlan?.eligible_withdrawal_amount.toLocaleString()} eligible payout.`
                        : data?.withdrawalReason || 'Complete all 33 sequential contribution days to unlock payout.'}
                    </p>
                  </div>
                </div>

                {isWithdrawalAvailable ? (
                  <button
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="py-2.5 px-5 rounded-xl bg-[#00A86B] hover:bg-[#00875A] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00A86B]/30 transition-all cursor-pointer shrink-0"
                  >
                    <span>Withdraw ₦{activePlan?.eligible_withdrawal_amount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 block">
                      Target: ₦{activePlan?.eligible_withdrawal_amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {totalDays - completedDays} days remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PROGRESS & PLAN STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Progress Card */}
              <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Savings Progress
                  </span>
                  <span className="text-xs font-mono font-black text-[#00A86B]">
                    {completedDays} / {totalDays} Days
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#00875A] to-[#00A86B] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>30 Core Days</span>
                  <span>3 Additional Days</span>
                </div>
              </div>

              {/* Total Paid Card */}
              <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Amount Saved
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  ₦{activePlan?.total_amount_paid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-zinc-400">
                  {completedDays} successful contribution payments
                </span>
              </div>

              {/* Plan Details Card */}
              <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Plan Terms
                  </span>
                  <span className="text-[10px] font-black uppercase text-[#00A86B] bg-[#00875A]/20 px-2 py-0.5 rounded border border-[#00875A]/30">
                    Cycle #{activePlan?.cycle_number || 1}
                  </span>
                </div>
                <div className="text-sm font-black text-white">
                  {activePlan?.plan_name || 'Save30 Standard'}
                </div>
                <p className="text-[11px] text-zinc-400">
                  ₦{activePlan?.daily_amount} daily • ₦{activePlan?.eligible_withdrawal_amount.toLocaleString()} target payout
                </p>
              </div>
            </div>

            {/* ACTIVE WITHDRAWAL TRACKER IF PENDING */}
            {data?.activeWithdrawal && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <h4 className="text-sm font-bold text-white">Active Withdrawal Request</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Status: {data.activeWithdrawal.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Payout of ₦{data.activeWithdrawal.amount.toLocaleString()} to {data.activeWithdrawal.bank_name} ({data.activeWithdrawal.account_number}) is currently under review by finance administration.
                </p>
              </div>
            )}

            {/* QUICK PREVIEW OF DAYS 1..33 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">Daily Contribution Schedule</h3>
                  <p className="text-xs text-zinc-400">Strictly sequential. Day 1 through Day 33.</p>
                </div>
                <button
                  onClick={() => setActiveTab('days')}
                  className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                >
                  <span>View Full Grid</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Responsive Grid of first 12 days + quick link */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {(data?.contributionDays || []).slice(0, 12).map(day => (
                  <div
                    key={day.id}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      day.status === 'successful'
                        ? 'bg-[#00875A]/15 border-[#00A86B]/40 text-white'
                        : day.day_number === currentRequiredDay
                        ? 'bg-[#00875A]/10 border-[#00A86B] text-white ring-2 ring-[#00A86B]/30'
                        : 'bg-[#0C111A] border-white/10 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-extrabold">Day {day.day_number}</span>
                      {day.status === 'successful' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B]" />
                      ) : day.day_number === currentRequiredDay ? (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-600" />
                      )}
                    </div>
                    <div className="text-xs font-black font-mono">
                      ₦{day.amount}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mt-1 text-zinc-400">
                      {day.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* TAB 2: FULL 33-DAY GRID VIEW */}
        {activeTab === 'days' && (
          <div className="space-y-6">
            {!activePlan ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1622] border border-white/10 space-y-3">
                <Layers className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">No Active Plan</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Select a savings plan first to unlock your 33-day sequential contribution grid.
                </p>
                <button
                  onClick={() => setIsPlanSelectOpen(true)}
                  className="py-2.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00875A]/25"
                >
                  <span>Select a Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">All 33 Contribution Days</h3>
                    <p className="text-xs text-zinc-400">
                      Sequential progress: Days 1–30 (Core) + Days 31–33 (Commitment)
                    </p>
                  </div>

                  {completedDays < totalDays && (
                    <button
                      onClick={() => handleOpenPayment(currentRequiredDay)}
                      className="py-2.5 px-5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/30 transition-all cursor-pointer"
                    >
                      <span>Pay Day {currentRequiredDay} (₦{activePlan.daily_amount.toLocaleString()})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(data?.contributionDays || []).map(day => {
                    const isCurrent = day.day_number === currentRequiredDay;
                    const isSuccess = day.status === 'successful';

                    return (
                      <div
                        key={day.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isSuccess
                            ? 'bg-[#00875A]/15 border-[#00A86B]/40'
                            : isCurrent
                            ? 'bg-[#0D1624] border-[#00A86B] ring-2 ring-[#00A86B]/40 shadow-lg'
                            : 'bg-[#0A0F17] border-white/10 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-white">
                              Day {day.day_number}
                            </span>
                            {isSuccess ? (
                              <span className="p-1 rounded-full bg-[#00875A]/30 text-[#00A86B]">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : isCurrent ? (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#00A86B] text-white">
                                Today
                              </span>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-zinc-600" />
                            )}
                          </div>

                          <div className="text-sm font-black font-mono text-[#00A86B]">
                            ₦{day.amount}
                          </div>

                          {day.day_number > coreDays && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              Commitment Day
                            </span>
                          )}
                        </div>

                        <div className="pt-3">
                          {isCurrent ? (
                            <button
                              onClick={() => handleOpenPayment(day.day_number)}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#00875A] hover:bg-[#00A86B] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#00875A]/20"
                            >
                              <span>Pay ₦{day.amount}</span>
                            </button>
                          ) : isSuccess ? (
                            <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#00A86B]" />
                              <span>Confirmed</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-zinc-600" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: MY PLANS / CYCLE HISTORY */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">My Savings Plan Cycles</h3>
                <p className="text-xs text-zinc-400">
                  Each completed cycle is permanently recorded in your history.
                </p>
              </div>

              {/* Can start fresh cycle if no active plan or if active plan is completed */}
              {(!activePlan || activePlan.status === 'completed') && (
                <button
                  onClick={() => setIsPlanSelectOpen(true)}
                  className="py-2.5 px-5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{activePlan ? `Start Plan Cycle #${myPlans.length + 1}` : 'Select a Plan'}</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {myPlans.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-[#0F1622] border border-white/10 space-y-2">
                  <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="font-bold text-white text-sm">No plans joined yet.</p>
                  <p className="text-zinc-400">Select an active plan below to begin your daily savings discipline.</p>
                </div>
              ) : (
                myPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-2xl border ${
                    plan.status === 'active'
                      ? 'bg-[#0F1622] border-[#00A86B]/40'
                      : 'bg-[#0B0F17] border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#00A86B]">
                          Cycle #{plan.cycle_number}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            plan.status === 'active'
                              ? 'bg-[#00875A]/20 text-[#00A86B] border-[#00875A]/40'
                              : 'bg-white/10 text-zinc-300 border-white/20'
                          }`}
                        >
                          Status: {plan.status}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">
                        {plan.plan_name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        ₦{plan.daily_amount} daily • {plan.total_days} total required days • Started:{' '}
                        {new Date(plan.started_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-zinc-400 block">Progress</span>
                      <span className="text-base font-black text-white font-mono">
                        {plan.completed_days} / {plan.total_days} Days
                      </span>
                      <span className="text-xs font-mono font-bold text-[#00A86B] block">
                        ₦{plan.total_amount_paid.toLocaleString()} paid
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWAL TAB */}
        {activeTab === 'withdrawal' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {!activePlan ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1622] border border-white/10 space-y-3">
                <Lock className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">No Active Plan</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  You need an active plan to participate and qualify for payouts. Select a plan to begin your daily savings.
                </p>
                <button
                  onClick={() => setIsPlanSelectOpen(true)}
                  className="py-2.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00875A]/25"
                >
                  <span>Select a Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#0F1622] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isWithdrawalAvailable
                        ? 'bg-[#00A86B]/20 text-[#00A86B] border border-[#00A86B]/40'
                        : 'bg-white/5 text-amber-400 border border-white/10'
                    }`}
                  >
                    {isWithdrawalAvailable ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {isWithdrawalAvailable ? 'Withdrawal Unlocked' : 'Withdrawal Locked'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Target eligible payout:{' '}
                      <strong className="text-white font-mono">
                        ₦{activePlan ? activePlan.eligible_withdrawal_amount.toLocaleString() : '0'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#090D14] border border-white/10 space-y-2 text-xs text-zinc-300 leading-relaxed">
                  <div className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
                    <span>Withdrawal Rules &amp; Requirement</span>
                  </div>
                  <p>
                    To request your payout, you must complete all {coreDays} core days (₦{activePlan?.daily_amount.toLocaleString()} × {coreDays} = ₦{activePlan?.eligible_withdrawal_amount.toLocaleString()}) PLUS the {additionalDays} commitment days (Days {coreDays + 1}–{totalDays}).
                  </p>
                  <div className="pt-2 flex justify-between font-mono font-bold text-xs text-zinc-400 border-t border-white/10">
                    <span>Current completed days:</span>
                    <span className="text-[#00A86B]">{completedDays} / {totalDays}</span>
                  </div>
                </div>

                {isWithdrawalAvailable ? (
                  <button
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00875A]/30 transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>REQUEST WITHDRAWAL (₦{activePlan?.eligible_withdrawal_amount.toLocaleString()})</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 px-6 rounded-xl bg-white/5 text-zinc-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-white/10"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Complete Days 1–33 to Unlock Withdrawal</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Payment &amp; Ledger History</h3>
              <p className="text-xs text-zinc-400">
                Verifiable, immutable transaction records with printable receipts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0C111A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080C14] text-zinc-400 font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {(data?.recentTransactions || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      (data?.recentTransactions || []).map(tx => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            Day {tx.day_number}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#00A86B]">
                            ₦{tx.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                            {tx.reference}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                tx.status === 'successful'
                                  ? 'bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.status === 'successful' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await api.getReceipt(tx.reference);
                                    setActiveReceipt(res.receipt);
                                  } catch {}
                                }}
                                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3 text-[#00A86B]" />
                                <span>Receipt</span>
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

        {/* TAB 6: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-lg font-black text-white">Notifications</h3>
              <p className="text-xs text-zinc-400">Account and contribution alerts.</p>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-[#0F1622] border border-white/10">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl bg-[#0F1622] border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white">{n.title}</h4>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT */}
        {activeTab === 'support' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#0F1622] border border-white/10 space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">Save30 Member Support</h3>
                <p className="text-xs text-zinc-400">
                  Have questions about your daily contribution, banking details, or withdrawal status?
                </p>
              </div>

              {supportMsg && (
                <div className="p-3.5 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/40 text-xs text-[#00A86B]">
                  {supportMsg}
                </div>
              )}

              <form onSubmit={handleSendSupport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={e => setSupportSubject(e.target.value)}
                    placeholder="e.g. Inquiries regarding Day 33 withdrawal"
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={supportMessage}
                    onChange={e => setSupportMessage(e.target.value)}
                    placeholder="Describe your request in detail..."
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="w-full py-2.5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSupport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 8: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Account Details */}
            <div className="p-6 rounded-2xl bg-[#0F1622] border border-white/10 space-y-4">
              <h3 className="text-base font-black text-white">Profile Details</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Save30 User ID</span>
                  <span className="font-mono font-bold text-[#00A86B]">{user.save30_id}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Full Name</span>
                  <span className="font-bold text-white">{user.first_name} {user.last_name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Email Address</span>
                  <span className="font-medium text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Phone Number</span>
                  <span className="font-medium text-white">{user.phone}</span>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="p-6 rounded-2xl bg-[#0F1622] border border-white/10 space-y-4">
              <h3 className="text-base font-black text-white">Security &amp; Password</h3>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    passwordMsg.type === 'success'
                      ? 'bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <PasswordInput
                  label="Current Password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />

                <PasswordInput
                  label="New Password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />

                <PasswordInput
                  label="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-2.5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Real Paystack Payment Modal */}
      {selectedPaymentDay && activePlan && (
        <PaymentModal
          day={selectedPaymentDay}
          plan={activePlan}
          onClose={() => setSelectedPaymentDay(null)}
          onPaymentSuccess={(receipt) => {
            setSelectedPaymentDay(null);
            setActiveReceipt(receipt);
            loadDashboard();
            loadPlans();
            loadNotifications();
          }}
        />
      )}

      {/* Plan Selection & Confirmation Modal */}
      {isPlanSelectOpen && (
        <PlanSelectModal
          availablePlans={availablePlans}
          onClose={() => setIsPlanSelectOpen(false)}
          onPlanSelected={() => {
            setIsPlanSelectOpen(false);
            loadDashboard();
            loadPlans();
            loadNotifications();
          }}
        />
      )}

      {/* Withdrawal Form Modal */}
      {isWithdrawalModalOpen && activePlan && (
        <WithdrawalModal
          plan={activePlan}
          userName={`${user.first_name} ${user.last_name}`}
          onClose={() => setIsWithdrawalModalOpen(false)}
          onSuccess={w => {
            setIsWithdrawalModalOpen(false);
            loadDashboard();
            alert(`Withdrawal request of ₦${w.amount.toLocaleString()} submitted!`);
          }}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Save30. Disciplined daily savings for real Nigerians.</p>
          <div className="flex items-center gap-4">
            <button onClick={onOpenTerms} className="hover:text-white transition-colors cursor-pointer">
              Terms &amp; Conditions
            </button>
            <button onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
