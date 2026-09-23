import React, { useState, useEffect } from 'react';
import { Timer, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ContestCountdownProps {
  endTime: string | null;
  status?: string;
  title?: string;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endTimeStr: string | null, status?: string): TimeRemaining {
  if (status === 'closed') {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  if (!endTimeStr) {
    // Default fallback to 7 days from now if no end time configured
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false };
  }

  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0 || isNaN(diff)) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    total: diff,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

export const ContestCountdown: React.FC<ContestCountdownProps> = ({
  endTime,
  status = 'active',
  title = 'Contest Countdown',
  compact = false,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(endTime, status)
  );

  useEffect(() => {
    // Update immediately on prop change
    setTimeLeft(calculateTimeRemaining(endTime, status));

    // Tick every 1 second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(endTime, status));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, status]);

  const padZero = (n: number): string => n.toString().padStart(2, '0');

  // Compact Mode (used in secondary toolbars or sticky headers)
  if (compact) {
    if (timeLeft.isExpired || status === 'closed') {
      return (
        <div
          id="contest-countdown-compact-closed"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-semibold border border-slate-700 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Voting Closed</span>
        </div>
      );
    }

    return (
      <div
        id="contest-countdown-compact"
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 text-slate-200 text-xs font-mono font-bold border border-slate-700 shadow-2xs ${className}`}
      >
        <Timer className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-[11px] font-sans text-slate-400 font-semibold">Ends In:</span>
        <span className="tabular-nums text-emerald-300">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {padZero(timeLeft.hours)}:{padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // Full Display Card
  if (timeLeft.isExpired || status === 'closed') {
    return (
      <div
        id="contest-countdown-card-closed"
        className={`w-full rounded-2xl bg-slate-800/90 border border-slate-700/80 p-4 sm:p-5 text-white ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Contest Voting Closed</h3>
              <p className="text-xs text-slate-400">Official voting period has ended. Final results are locked.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0">
            Concluded
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="contest-countdown-card"
      className={`w-full rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-800/80 to-slate-900/95 border border-slate-700/80 p-4 sm:p-5 shadow-sm text-white ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {title}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Timer
              </span>
            </div>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Voting closes automatically when the timer reaches zero
        </span>
      </div>

      {/* 4 Counter Blocks: Days, Hours, Minutes, Seconds */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Days */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.days)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.hours)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.minutes)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-emerald-500/40 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-500/80" />
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-emerald-400 tabular-nums">
            {padZero(timeLeft.seconds)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider mt-0.5">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
};
