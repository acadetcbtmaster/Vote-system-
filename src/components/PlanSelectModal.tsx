// ==============================================================================
// SAVE30 — Plan Selection & Confirmation Modal
// Allows users to review available plans and confirm enrollment with snapshotted terms
// ==============================================================================

import React, { useState } from 'react';
import { Plan, UserPlan } from '../types';
import { api } from '../services/api';
import {
  Layers,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface PlanSelectModalProps {
  availablePlans: Plan[];
  onClose: () => void;
  onPlanSelected: (newPlan: UserPlan) => void;
}

export const PlanSelectModal: React.FC<PlanSelectModalProps> = ({
  availablePlans,
  onClose,
  onPlanSelected,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePlans = availablePlans.filter(p => p.status === 'active');

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.selectPlan(selectedPlan.id);
      if (res.success && res.plan) {
        onPlanSelected(res.plan);
      } else {
        setErrorMessage(res.message || 'Failed to enroll in the selected plan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to join plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0F1622] border border-[#00A86B]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {selectedPlan ? 'Confirm Plan Selection' : 'Select a Save30 Savings Plan'}
              </h3>
              <p className="text-xs text-zinc-400">
                {selectedPlan
                  ? 'Review your plan commitment terms before starting'
                  : 'Choose the disciplined daily contribution that fits your goals'}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW A: Confirmation View for Chosen Plan */}
          {selectedPlan ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0B121C] to-[#0A0F16] border border-[#00A86B]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00A86B] uppercase tracking-wider">
                    Plan Confirmation
                  </span>
                  <span className="text-xs font-mono font-black text-white px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                    ₦{selectedPlan.daily_amount.toLocaleString()} / day
                  </span>
                </div>
                <h4 className="text-xl font-black text-white">
                  You are about to join {selectedPlan.name}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedPlan.description}
                </p>
              </div>

              {/* Term Breakdown Table */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400">Daily Payment:</span>
                  <span className="font-black text-white font-mono">
                    ₦{selectedPlan.daily_amount.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400">Core Saving Period:</span>
                  <span className="font-bold text-white">
                    {selectedPlan.core_days} Days
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400">Additional Commitment Days:</span>
                  <span className="font-bold text-amber-400">
                    {selectedPlan.additional_days} Days
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400">Total Sequential Payment Days:</span>
                  <span className="font-black text-white">
                    {selectedPlan.total_required_days} Days
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400">Withdrawal Becomes Available:</span>
                  <span className="font-black text-[#00A86B]">
                    After Day {selectedPlan.total_required_days}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#00875A]/15 border border-[#00A86B]/30 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-300 font-semibold block">Eligible Withdrawal Payout:</span>
                    <span className="text-[11px] text-zinc-400">
                      ₦{selectedPlan.daily_amount.toLocaleString()} × {selectedPlan.core_days} core days
                    </span>
                  </div>
                  <span className="text-base font-black text-[#00A86B] font-mono">
                    ₦{(selectedPlan.daily_amount * selectedPlan.core_days).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  disabled={isSubmitting}
                  className="w-1/3 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Change Plan
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPlan}
                  disabled={isSubmitting}
                  className="w-2/3 py-3 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Plan...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRM PLAN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : activePlans.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No plans available</h4>
              <p className="text-xs text-zinc-400">
                There are currently no active savings plans configured. Please check back later or contact administration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activePlans.map(plan => {
                const payoutAmount = plan.daily_amount * plan.core_days;
                return (
                  <div
                    key={plan.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#0B1019] border border-white/10 hover:border-[#00A86B]/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/30">
                          Active Plan
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          {plan.total_required_days} Days
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-white">{plan.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="pt-2 space-y-1.5 text-xs text-zinc-300">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Daily Amount:</span>
                          <span className="font-black text-[#00A86B] font-mono">
                            ₦{plan.daily_amount.toLocaleString()} / day
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
                        <div className="flex justify-between border-t border-white/5 pt-1.5">
                          <span className="text-zinc-300 font-semibold">Eligible Payout:</span>
                          <span className="font-black text-[#00A86B] font-mono">
                            ₦{payoutAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00875A]/25 transition-all cursor-pointer"
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
    </div>
  );
};
