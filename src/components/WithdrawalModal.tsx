import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlan, WithdrawalRequest } from '../types';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Building2, User, CreditCard, Shield, X, Loader2 } from 'lucide-react';

interface WithdrawalModalProps {
  plan: UserPlan;
  userName: string;
  onClose: () => void;
  onSuccess: (withdrawal: WithdrawalRequest) => void;
}

const POPULAR_NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'Zenith Bank',
  'Fidelity Bank',
  'Kuda Bank',
  'Moniepoint MFB',
  'OPay (PayCom)',
  'Palmpay',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'Union Bank of Nigeria',
  'Wema Bank / ALAT',
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  plan,
  userName,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState(userName);
  const [bankName, setBankName] = useState(POPULAR_NIGERIAN_BANKS[0]);
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleAmount = plan.eligible_withdrawal_amount; // ₦6,000

  const resolvedBank = bankName === 'Other Bank' ? customBank : bankName;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !accountNumber.trim() || !accountName.trim() || !resolvedBank.trim()) {
      setError('Please fill in all banking and account details.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      setError('Nigerian bank account numbers must be exactly 10 digits.');
      return;
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.requestWithdrawal({
        full_name: fullName.trim(),
        bank_name: resolvedBank.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });

      if (res.success) {
        onSuccess(res.withdrawal);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0F1622] border border-[#00A86B]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Request Payout</h3>
              <p className="text-xs text-zinc-400">Day 33 Completed • Plan Eligible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Eligible Amount Badge */}
              <div className="p-4 rounded-xl bg-[#080C13] border border-[#00A86B]/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Eligible Withdrawal Amount
                  </span>
                  <span className="text-2xl font-black text-[#00A86B] font-mono">
                    ₦{eligibleAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-[#00875A]/20 border border-[#00875A]/40 text-[#00A86B] text-[10px] font-black uppercase tracking-wider">
                  Fixed Plan Rate
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Beneficiary Full Legal Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Chukwuemeka Adebayo"
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                >
                  {POPULAR_NIGERIAN_BANKS.map(b => (
                    <option key={b} value={b} className="bg-[#0D131C]">
                      {b}
                    </option>
                  ))}
                  <option value="Other Bank" className="bg-[#0D131C]">
                    Other Nigerian Bank...
                  </option>
                </select>
              </div>

              {bankName === 'Other Bank' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Specify Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customBank}
                    onChange={e => setCustomBank(e.target.value)}
                    placeholder="Enter your bank name"
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    NUBAN Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit account no."
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Account Name (as in bank)
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-zinc-300">
                <Shield className="w-4 h-4 text-[#00A86B] shrink-0" />
                <span>
                  Withdrawals are manually reviewed and processed by our finance administration. Once completed, your current plan cycle will be finalized.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer"
                >
                  <span>Review Request</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#00875A]/20 border border-[#00A86B]/40 flex items-center justify-center text-[#00A86B]">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-white">
                  Confirm Payout Request
                </h4>
                <p className="text-xs text-zinc-300">
                  You are requesting a withdrawal of{' '}
                  <span className="text-[#00A86B] font-bold font-mono">
                    ₦{eligibleAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                  .
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080C13] border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Beneficiary:</span>
                  <span className="font-bold text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Bank:</span>
                  <span className="font-bold text-white">{resolvedBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Number:</span>
                  <span className="font-mono font-bold text-white">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Name:</span>
                  <span className="font-bold text-white">{accountName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="font-mono font-black text-[#00A86B] text-sm">
                    ₦{eligibleAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>CONFIRM WITHDRAWAL</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
