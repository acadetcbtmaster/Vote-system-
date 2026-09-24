import React, { useState } from 'react';
import { Contestant } from '../types';
import { X, AlertCircle, Shield, CheckCircle, Loader2, ArrowLeft, User, Phone, Check, Info } from 'lucide-react';
import { VotersDecideLogo } from './VotersDecideLogo';

interface VoteModalProps {
  contestant: Contestant;
  onClose: () => void;
  onSubmit: (data: { fullName: string; whatsappNumber: string }) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string | null;
  remainingSubmissions: number;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  contestant,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  remainingSubmissions,
}) => {
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const formattedNumber = String(contestant.contestant_number || 1).padStart(2, '0');

  const handleContinueToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setLocalError('Please enter your full name.');
      return;
    }

    const trimmedPhone = whatsappNumber.trim().replace(/[\s\-()]/g, '');
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setLocalError('Please enter a valid WhatsApp phone number.');
      return;
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setLocalError(null);

    const trimmedName = fullName.trim();
    let trimmedPhone = whatsappNumber.trim().replace(/[\s\-()]/g, '');

    // Prefix country code if user didn't already type '+'
    let fullPhoneWithCode = trimmedPhone;
    if (!trimmedPhone.startsWith('+')) {
      if (trimmedPhone.startsWith('0')) {
        trimmedPhone = trimmedPhone.substring(1);
      }
      fullPhoneWithCode = `${countryCode}${trimmedPhone}`;
    }

    try {
      await onSubmit({
        fullName: trimmedName,
        whatsappNumber: fullPhoneWithCode,
      });
    } catch (err: any) {
      setLocalError(err.message || 'Submission failed. Please try again.');
    }
  };

  const getDisplayPhone = () => {
    let clean = whatsappNumber.trim().replace(/[\s\-()]/g, '');
    if (clean.startsWith('+')) return clean;
    if (clean.startsWith('0')) clean = clean.substring(1);
    return `${countryCode} ${clean}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div
        id="voter-submission-modal"
        className="relative w-full max-w-lg bg-[#141820] text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        {/* Modal Header */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-[#11141A]">
          <div className="flex items-center gap-2">
            <VotersDecideLogo size="sm" showText={true} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {step === 'confirm' ? (
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                title="Return to edit details"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                title="Return to candidates"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              id="close-vote-modal-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
              title="Cancel and close modal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* STEP 1: Voter Information Form */}
        {step === 'details' && (
          <form onSubmit={handleContinueToConfirm} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Candidate Summary Card */}
            <div className="text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-2">
                Casting Ballot For
              </span>

              {/* Photo Card with Badge */}
              <div className="relative inline-block mx-auto mb-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#0A0D12] border border-white/10 shadow-lg flex items-center justify-center">
                  {contestant.photo_url ? (
                    <img
                      src={contestant.photo_url}
                      alt={contestant.name}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-extrabold text-zinc-300">
                      {contestant.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-black/90 text-zinc-200 shadow-md border border-white/20 uppercase whitespace-nowrap">
                    Candidate {formattedNumber}
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-white mt-2">
                {contestant.name}
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-0.5 leading-relaxed">
                {contestant.bio || 'Official ballot candidate.'}
              </p>
            </div>

            {/* Voter Verification Form */}
            <div className="space-y-3.5 pt-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                Voter Verification Details
              </h4>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="voter-full-name"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  id="voter-full-name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. Chukwuma Daniel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:py-3 bg-[#1A202A] border border-white/10 rounded-xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-inner"
                />
              </div>

              {/* WhatsApp Number Field with Country Code */}
              <div>
                <label
                  htmlFor="voter-whatsapp-number"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>WhatsApp Number</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select
                      aria-label="Country Code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-full px-2.5 sm:px-3 py-2.5 sm:py-3 bg-[#1A202A] border border-white/10 rounded-xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
                    >
                      <option value="+234" className="bg-[#141820]">+234 (NG)</option>
                      <option value="+1" className="bg-[#141820]">+1 (US/CA)</option>
                      <option value="+44" className="bg-[#141820]">+44 (UK)</option>
                      <option value="+233" className="bg-[#141820]">+233 (GH)</option>
                      <option value="+254" className="bg-[#141820]">+254 (KE)</option>
                      <option value="+27" className="bg-[#141820]">+27 (ZA)</option>
                      <option value="+91" className="bg-[#141820]">+91 (IN)</option>
                    </select>
                  </div>

                  <input
                    id="voter-whatsapp-number"
                    type="tel"
                    required
                    disabled={isSubmitting}
                    placeholder="8012345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 sm:py-3 bg-[#1A202A] border border-white/10 rounded-xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Error Message Display */}
            {(localError || errorMessage) && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{localError || errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-1 space-y-2">
              <button
                id="vote-continue-to-confirm-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Confirmation</span>
              </button>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: Ballot Verification & Final Confirmation */}
        {step === 'confirm' && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Confirm Your Official Ballot
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Please verify your selection. Ballots are cryptographically sealed once submitted.
              </p>
            </div>

            {/* Verification Receipt Card */}
            <div className="bg-[#181E27] border border-white/10 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Selected Candidate</span>
                <span className="font-extrabold text-white text-xs sm:text-sm">{contestant.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Candidate Number</span>
                <span className="font-extrabold text-amber-400 tabular-nums">#{formattedNumber}</span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Voter Name</span>
                <span className="font-bold text-white">{fullName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">WhatsApp Verified</span>
                <span className="font-bold text-zinc-300 tabular-nums">
                  {getDisplayPhone()}
                </span>
              </div>
            </div>

            {/* Error Message Display */}
            {(localError || errorMessage) && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{localError || errorMessage}</span>
              </div>
            )}

            {/* Final Action Submission */}
            <div className="space-y-2.5 pt-1">
              <button
                id="vote-final-submit-btn"
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Sealing Ballot...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm &amp; Cast Official Vote</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  disabled={isSubmitting}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back (Edit Info)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-white/10 bg-[#161B24] hover:bg-[#1E2532] text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
