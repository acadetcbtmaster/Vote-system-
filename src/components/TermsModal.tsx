import React from 'react';
import { X, ShieldCheck, FileText, Check } from 'lucide-react';
import { Save30Logo } from './Save30Logo';

interface TermsModalProps {
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0F1622] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Save30 Terms &amp; Conditions</h3>
              <p className="text-xs text-zinc-400">Official Membership &amp; Savings Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-zinc-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#00875A]/10 border border-[#00A86B]/30 text-white flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00A86B] shrink-0 mt-0.5" />
            <p>
              Please read these terms carefully before joining Save30. Save30 is a disciplined daily savings commitment platform designed for Nigerian savers. By registering an account, you agree to comply with all rules stated below.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              1. Daily Contribution &amp; Plan Structure
            </h4>
            <p>
              Members commit to saving the designated daily contribution (standard plan is <strong>₦200 daily</strong>).
              The standard savings cycle consists of <strong>30 core contribution days</strong> followed by <strong>3 additional commitment days</strong>, totaling <strong>33 required payment days</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              2. Strict Sequential Payment Rule
            </h4>
            <p>
              Payments must be completed sequentially (Day 1, Day 2, Day 3, ... Day 33). You cannot skip days or pay for a future day until preceding days have been verified and confirmed as successful. Failed or pending payments do not count toward completed days.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              3. Withdrawal Eligibility &amp; Calculation
            </h4>
            <p>
              Withdrawals remain <strong>strictly locked</strong> until all 33 days (30 core days + 3 additional commitment days) are successfully completed and verified.
              Completing Day 30 alone does NOT unlock withdrawal. Days 31, 32, and 33 must also be completed.
            </p>
            <p>
              The eligible payout amount is calculated strictly as <strong>Daily Amount × Core Days</strong> (e.g. ₦200 × 30 = <strong>₦6,000</strong>). The additional 3 commitment days represent your platform discipline bond.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              4. Manual Payout Processing
            </h4>
            <p>
              Withdrawals are processed manually via direct Nigerian bank transfer (NUBAN) by Save30 finance administration. Processing typically takes 1 to 24 business hours from the moment your request status moves to <em>PROCESSING</em>.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              5. Plan Completion &amp; Subsequent Cycles
            </h4>
            <p>
              Once your payout is marked <em>SUCCESSFUL</em>, your current plan cycle is finalized and closed. You cannot request multiple withdrawals for the same completed cycle. You may immediately start a fresh Save30 cycle (Cycle #2, Cycle #3, etc.) to continue your daily savings habit.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              6. User Responsibilities &amp; Anti-Fraud
            </h4>
            <p>
              Each user is assigned a unique User ID (e.g. SAVE30-001). Users must provide accurate bank details matching their registered name. Multiple account creation or attempts to manipulate payment references will result in account suspension.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0B1019] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="py-2.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>I Accept Terms &amp; Conditions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
