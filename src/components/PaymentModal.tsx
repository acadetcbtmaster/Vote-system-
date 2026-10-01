// ==============================================================================
// SAVE30 — Real Payment Gateway Modal Component
// Initiates real Paystack transactions and verifies only via backend Paystack API
// ==============================================================================

import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlan, ContributionDay, PaymentReceipt } from '../types';
import {
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface PaymentModalProps {
  day: ContributionDay;
  plan: UserPlan;
  onClose: () => void;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  day,
  plan,
  onClose,
  onPaymentSuccess,
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(
    day.payment_reference || null
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const isPending = day.status === 'pending' || !!pendingReference;

  // Real Paystack Initialization Flow
  const handleInitiatePayment = async () => {
    setErrorMessage(null);
    setStatusNotice(null);
    setIsInitializing(true);

    try {
      const res = await api.initializePayment(day.day_number);

      if (res.authorization_url) {
        setPendingReference(res.reference);
        // Save current pending reference to sessionStorage so if redirected back, it can be checked
        try {
          sessionStorage.setItem('save30_pending_ref', res.reference);
        } catch {}

        // Securely redirect to Paystack Gateway
        window.location.href = res.authorization_url;
      } else {
        setErrorMessage(
          'Payment gateway did not provide a checkout URL. Please check server Paystack configuration.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to connect to Paystack payment gateway. Please try again.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  // Real Server Verification Flow (Calls Paystack API)
  const handleCheckStatus = async () => {
    if (!pendingReference) {
      setErrorMessage('No active transaction reference found to verify.');
      return;
    }

    setErrorMessage(null);
    setStatusNotice(null);
    setIsVerifying(true);

    try {
      const res = await api.verifyPayment(pendingReference);

      if (res.success && res.receipt) {
        setStatusNotice('Payment confirmed by Paystack!');
        setTimeout(() => {
          onPaymentSuccess(res.receipt!);
        }, 1200);
      } else if (res.status === 'pending') {
        setStatusNotice('Payment is still being processed by the bank. Please wait a moment.');
      } else {
        setErrorMessage(
          res.message || 'Payment has not been confirmed yet by Paystack.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Payment was not confirmed. Please ensure you completed checkout.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0F1622] border border-[#00A86B]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Day {day.day_number} Payment
              </h3>
              <p className="text-[11px] text-zinc-400">
                {plan.plan_name} • Day {day.day_number} of {plan.total_days}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Amount Card */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-white/10 text-center space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Contribution Amount
            </span>
            <div className="text-3xl font-black font-mono text-[#00A86B]">
              ₦{day.amount.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400">
              Contribution Day: <span className="font-bold text-white">Day {day.day_number} of {plan.total_days}</span>
            </div>
          </div>

          {/* Status Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-zinc-400">Payment Status:</span>
            <span
              className={`font-black uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full ${
                day.status === 'successful'
                  ? 'bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40'
                  : isPending
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {day.status === 'successful'
                ? 'Successful ✓'
                : isPending
                ? 'Pending Confirmation'
                : 'Not Paid'}
            </span>
          </div>

          {/* Reference if pending */}
          {pendingReference && (
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Reference:</span>
              <span className="text-zinc-200 truncate max-w-[220px]">
                {pendingReference}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Notice */}
          {statusNotice && (
            <div className="p-3.5 rounded-xl bg-[#00875A]/15 border border-[#00A86B]/30 flex items-start gap-2 text-xs text-[#00A86B]">
              <ShieldCheck className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Primary Action Button */}
          {!isPending ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={isInitializing}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Paystack...</span>
                  </>
                ) : (
                  <>
                    <span>PAY ₦{day.amount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-zinc-400 text-center leading-normal">
                You will be securely redirected to Paystack to complete your contribution via Debit Card, Bank Transfer, or USSD.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isVerifying}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking Paystack Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={isInitializing || isVerifying}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Retry / Make New Payment</span>
              </button>
            </div>
          )}

          {/* Security Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1 border-t border-white/5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Secured with 256-bit encryption • Paystack PCI-DSS Level 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
