import React, { useEffect } from 'react';
import { CheckCircle2, Heart, Check } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'vote' | 'follow' | 'general';
  text: string;
}

interface InteractionToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const InteractionToast: React.FC<InteractionToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;

    // Automatically disappear after 2 seconds (2000ms) as required by user prompt
    const timer = setTimeout(() => {
      onDismiss();
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#11161F] text-white border border-amber-400/40 shadow-2xl shadow-black/80 backdrop-blur-md">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-wide text-white uppercase">
            {toast.type === 'vote' ? 'Ballot Recorded' : toast.type === 'follow' ? 'Channel Followed' : 'Notice'}
          </span>
          <span className="text-sm font-bold text-zinc-200">
            {toast.text}
          </span>
        </div>
      </div>
    </div>
  );
};
