import React, { useState } from 'react';
import { Contestant } from '../types';
import { X, AlertCircle, Shield, CheckCircle, Loader2, ArrowLeft, User, Phone, Check, Info } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        id="voter-submission-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header Bar matching Screen 2 & 3 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-black">
              ✓
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Voters Decide
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step === 'confirm' ? (
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
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
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STEP 1: Voter Information Form (Screen 2) */}
        {step === 'details' && (
          <form onSubmit={handleContinueToConfirm} className="p-6 sm:p-8 space-y-6">
            {/* Candidate Center Portrait Banner */}
            <div className="text-center">
              <span className="text-sm font-semibold text-slate-900 block mb-3">
                You are supporting
              </span>

              {/* Photo Card with Badge */}
              <div className="relative inline-block mx-auto mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#F5EFEB] border border-slate-200/90 shadow-sm flex items-center justify-center">
                  {contestant.photo_url ? (
                    <img
                      src={contestant.photo_url}
                      alt={contestant.name}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-extrabold text-slate-700">
                      {contestant.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Candidate Number Pill Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-[#0B132B] text-white shadow-md border border-slate-700">
                    {formattedNumber}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-extrabold text-slate-950 mt-2">
                {contestant.name}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {contestant.bio || 'Passionate about leadership and community development.'}
              </p>
            </div>

            {/* Your Details Form */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-slate-900">
                Your Details
              </h4>

              {/* Full Name Field */}
              <div>
                <label 
                  htmlFor="voter-full-name"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  id="voter-full-name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
                />
              </div>

              {/* WhatsApp Number Field with Country Code */}
              <div>
                <label 
                  htmlFor="voter-whatsapp-number"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp Number</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select
                      aria-label="Country Code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs cursor-pointer"
                    >
                      <option value="+234">+234 (NG)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+233">+233 (GH)</option>
                      <option value="+254">+254 (KE)</option>
                      <option value="+27">+27 (ZA)</option>
                      <option value="+91">+91 (IN)</option>
                    </select>
                  </div>

                  <input
                    id="voter-whatsapp-number"
                    type="tel"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your WhatsApp number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {(localError || errorMessage) && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{localError || errorMessage}</span>
              </div>
            )}

            {/* Quota info */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Browser quota remaining:</span>
              <span className="font-bold text-slate-800">
                {remainingSubmissions} of 2 votes
              </span>
            </div>

            {/* Continue Button */}
            <button
              id="continue-to-confirm-btn"
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#0B132B] hover:bg-slate-950 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue</span>
            </button>
          </form>
        )}

        {/* STEP 2: Confirm Your Choice (Screen 3) */}
        {step === 'confirm' && (
          <div className="p-6 sm:p-8 space-y-6">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 text-center tracking-tight">
              Confirm Your Choice
            </h3>

            {/* Candidate Summary Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-2xs">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5EFEB] border border-slate-200 flex items-center justify-center">
                  {contestant.photo_url ? (
                    <img
                      src={contestant.photo_url}
                      alt={contestant.name}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-extrabold text-slate-700">
                      {contestant.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-[#0B132B] text-white border border-slate-700 shadow-xs">
                    {formattedNumber}
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="text-base font-extrabold text-slate-950 truncate">
                  {contestant.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {contestant.bio || 'Passionate about leadership and community development.'}
                </p>
              </div>
            </div>

            {/* Voter Details Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Your Details
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                    <span className="text-xs font-bold text-slate-800">{fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Number</span>
                    <span className="text-xs font-bold text-slate-800">
                      {whatsappNumber.startsWith('+') ? whatsappNumber : `${countryCode} ${whatsappNumber}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Light Blue Irreversible Notice Callout (Screen 3) */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                <Info className="w-3.5 h-3.5" />
              </div>
              <p className="font-semibold text-sky-950">
                Once submitted, this participation cannot be changed.
              </p>
            </div>

            {/* Error Message */}
            {(localError || errorMessage) && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{localError || errorMessage}</span>
              </div>
            )}

            {/* Two Action Buttons: Cancel and Confirm & Submit (Screen 3) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-confirm-choice-btn"
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                id="confirm-submit-vote-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0B132B] hover:bg-slate-950 active:scale-[0.99] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Submit</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
