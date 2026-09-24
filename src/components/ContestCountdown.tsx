import React, { useState, useEffect } from 'react';
import { Timer, Clock } from 'lucide-react';

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
    setTimeLeft(calculateTimeRemaining(endTime, status));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(endTime, status));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, status]);

  const padZero = (n: number): string => n.toString().padStart(2, '0');

  // Compact Mode
  if (compact) {
    if (timeLeft.isExpired || status === 'closed') {
      return (
        <div
          id="contest-countdown-compact-closed"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A202A] text-amber-300 text-xs font-semibold border border-white/10 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Voting Closed</span>
        </div>
      );
    }

    return (
      <div
        id="contest-countdown-compact"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A202A] text-zinc-200 text-xs font-mono font-bold border border-white/10 shadow-sm ${className}`}
      >
        <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-[11px] font-sans text-zinc-400 font-semibold">Ends In:</span>
        <span className="tabular-nums text-amber-300">
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
        className={`w-full rounded-xl bg-[#151921] border border-white/10 p-4 sm:p-5 text-white ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Voting Concluded</h3>
              <p className="text-xs text-zinc-400">Official deadline has passed. Final audited ballots are locked.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0">
            Closed
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="contest-countdown-card"
      className={`w-full rounded-xl bg-[#151921] border border-white/10 p-4 sm:p-5 shadow-lg text-white ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {title}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Timer
            </span>
          </div>
        </div>

        <span className="text-[11px] text-zinc-400">
          Closes automatically when countdown reaches zero
        </span>
      </div>

      {/* 4 Counter Blocks */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Days */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-[#0C0F14] border border-white/10 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.days)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-[#0C0F14] border border-white/10 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.hours)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-[#0C0F14] border border-white/10 shadow-inner">
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
            {padZero(timeLeft.minutes)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-[#0C0F14] border border-amber-500/40 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-400" />
          <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-amber-400 tabular-nums">
            {padZero(timeLeft.seconds)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mt-0.5">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
};
