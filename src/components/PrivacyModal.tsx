import React from 'react';
import { X, ShieldCheck, Lock, Check } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
  onAccept?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose, onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0F1622] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Save30 Privacy Policy</h3>
              <p className="text-xs text-zinc-400">Data Protection &amp; Security Standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-zinc-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#00875A]/10 border border-[#00A86B]/30 text-white flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00A86B] shrink-0 mt-0.5" />
            <p>
              Your privacy and financial security are paramount. Save30 employs strict enterprise security standards to protect your personal identity and contribution records.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              1. Information We Collect
            </h4>
            <p>
              To maintain your unique Save30 account and process banking payouts, we collect your name, phone number, email address, password (cryptographically salted and hashed; we never store plain passwords), and destination Nigerian bank account details during withdrawal requests.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              2. How Payment Information is Handled
            </h4>
            <p>
              We do not store your debit card details, PIN, or CVV. Payment processing is handled by licensed, PCI-DSS compliant payment gateways (such as Paystack). All transaction verification occurs server-side using cryptographically signed webhooks and verification APIs.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              3. Data Retention &amp; Immutable Ledger
            </h4>
            <p>
              For audit, financial reconciliation, and receipt generation, your daily contribution records, timestamps, and payout histories are preserved in an immutable transaction ledger. You may request a complete export of your transaction history at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-[#00A86B]">
              4. Contact &amp; Support
            </h4>
            <p>
              If you have inquiries regarding your account data or privacy, contact our Data Protection Officer at <strong>privacy@save30.ng</strong> or submit a ticket through the in-app support drawer.
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
              <span>I Accept Privacy Policy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
