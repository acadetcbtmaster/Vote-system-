import React from 'react';

interface Save30LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Save30Logo: React.FC<Save30LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Disciplined Growth Vault & Emerald 30 */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#00875A] to-[#054F31] border border-[#00A86B]/30 flex items-center justify-center shadow-lg shadow-[#00875A]/20 shrink-0 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 opacity-30 transform -skew-x-12" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-white"
        >
          {/* Vault shield with 30 / daily growth check */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight">
          <span className={`font-black ${textSizes[size]} text-white`}>
            SAVE<span className="text-[#00A86B]">30</span>
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/40 rounded-md">
            NG
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">
            Disciplined Daily Savings
          </span>
        )}
      </div>
    </div>
  );
};
