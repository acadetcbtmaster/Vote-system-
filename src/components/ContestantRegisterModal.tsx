import React, { useState } from 'react';
import { X, ArrowLeft, UserPlus, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ContestantRegisterModalProps {
  contestSlug: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ContestantRegisterModal: React.FC<ContestantRegisterModalProps> = ({
  contestSlug,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAiBio = async () => {
    if (!name.trim()) {
      setError('Please enter candidate name first before generating bio.');
      return;
    }
    setError(null);
    setIsGeneratingBio(true);
    try {
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: 'Official Contest',
          notes: bio || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bio) {
          setBio(data.bio);
          return;
        }
      }
      // Smart offline fallback
      setBio(`Dedicated candidate committed to excellence, integrity, and driving impactful leadership for our community.`);
    } catch {
      setBio(`Dedicated candidate committed to excellence, integrity, and driving impactful leadership for our community.`);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Candidate full name is required.');
      return;
    }

    if (!whatsappNumber.trim()) {
      setError('A valid WhatsApp contact number is required for contestant verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await dataService.registerContestant(contestSlug, {
        name: name.trim(),
        whatsappNumber: whatsappNumber.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });

      if (!data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      onSuccess(data.message || 'Application submitted successfully.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div 
        id="contestant-register-modal"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold">Apply as Contestant</h2>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer"
              title="Return to contest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/10 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Candidate Verification:</strong> All submitted entries are reviewed by contest administrators. Approved candidates are assigned an official contestant number and listed on the voting page.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. Samuel Adekunle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Contact <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              disabled={isSubmitting}
              placeholder="e.g. 08012345678 or +234..."
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500">Kept private; only used by contest admins for communication.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Short Bio / Platform Initiative
              </label>
              <button
                type="button"
                onClick={handleGenerateAiBio}
                disabled={isSubmitting || isGeneratingBio}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-colors disabled:opacity-50"
              >
                {isGeneratingBio ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Writing Bio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>AI Compose Bio</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              disabled={isSubmitting}
              placeholder="Briefly describe your project, community initiative, or talent (or click AI Compose Bio)..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              disabled={isSubmitting}
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500">Provide a direct portrait image link, or leave blank to use default avatar.</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
