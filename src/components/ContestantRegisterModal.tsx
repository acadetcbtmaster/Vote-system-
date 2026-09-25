import React, { useState } from 'react';
import { X, ArrowLeft, UserPlus, CheckCircle, AlertCircle, Loader2, Sparkles, Camera, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { compressImageFile } from '../lib/imageCompress';
import { VotersDecideLogo } from './VotersDecideLogo';

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

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Candidate full legal name is required.');
      return;
    }

    const trimmedPhone = whatsappNumber.trim();
    if (!trimmedPhone) {
      setError('A valid WhatsApp contact number is required for contestant verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await dataService.registerContestant(contestSlug, {
        name: trimmedName,
        whatsappNumber: trimmedPhone,
        bio: bio.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });

      if (!data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      onSuccess(data.message || `Application for ${trimmedName} submitted and approved!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div 
        id="contestant-register-modal"
        className="relative w-full max-w-lg bg-[#141820] text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden"
      >
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 bg-[#11141A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <VotersDecideLogo size="sm" showText={false} />
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">Apply as Official Contestant</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
              title="Return to contest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#181E27] border border-white/10 text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white">Candidate Protocol:</strong> Register your official ballot profile. Approved candidates are assigned a contestant sequence number and immediately displayed on the public voting page.
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Legal Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. Samuel Adekunle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#1D7BF2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              WhatsApp Contact <span className="text-amber-400">*</span>
            </label>
            <input
              type="tel"
              required
              disabled={isSubmitting}
              placeholder="e.g. 08012345678 or +234..."
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#1D7BF2]"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">Kept private; only used by contest administrators for official contact.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Short Bio / Platform Initiative
              </label>
              <button
                type="button"
                onClick={handleGenerateAiBio}
                disabled={isSubmitting || isGeneratingBio}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D7BF2] hover:text-blue-300 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 border border-[#1D7BF2]/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGeneratingBio ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Writing Bio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI Compose Bio</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              disabled={isSubmitting}
              placeholder="Briefly describe your background, talent, or community initiative (or tap AI Compose Bio)..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#1D7BF2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Candidate Photo (Optional)
            </label>
            <div className="space-y-3">
              {photoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-[#0C0F14] border border-white/15 rounded-xl">
                  <img
                    src={photoUrl}
                    alt="Candidate preview"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Photo selected</p>
                    <p className="text-[11px] text-emerald-400 font-medium">Ready for ballot card</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/20 hover:border-[#1D7BF2] hover:bg-[#1D7BF2]/5 rounded-xl transition-all group">
                  <Camera className="w-6 h-6 text-[#1D7BF2] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Choose Photo from Gallery / Camera</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">Select image file from your device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isSubmitting}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImageFile(file);
                          setPhotoUrl(compressed);
                        } catch (err) {
                          setError('Failed to process image file');
                        }
                      }
                    }}
                  />
                </label>
              )}

              <details className="text-[11px] text-zinc-400">
                <summary className="cursor-pointer hover:text-white font-medium">
                  Or enter photo web URL manually
                </summary>
                <input
                  type="url"
                  disabled={isSubmitting}
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl.startsWith('data:') ? '' : photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] rounded-xl text-xs text-white outline-none"
                />
              </details>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Candidate Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
