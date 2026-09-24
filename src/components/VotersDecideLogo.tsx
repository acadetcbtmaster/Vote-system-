import React, { useState } from 'react';
import logoImg from '../assets/images/voters_decide_logo_1790226388393.jpg';

interface VotersDecideLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  textColor?: string;
  className?: string;
  customLogoUrl?: string | null;
  preferImage?: boolean;
}

export const VotersDecideLogo: React.FC<VotersDecideLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  textColor = 'text-white',
  className = '',
  customLogoUrl,
  preferImage = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Size specifications for emblem icon
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  const titleSizes = {
    sm: 'text-sm font-black tracking-tight',
    md: 'text-base sm:text-lg font-black tracking-tight',
    lg: 'text-xl sm:text-2xl font-black tracking-tight',
    xl: 'text-2xl sm:text-3xl font-black tracking-tight',
  }[size];

  const taglineSizes = {
    sm: 'text-[9px] tracking-wide',
    md: 'text-[10.5px] tracking-wide',
    lg: 'text-xs tracking-wider',
    xl: 'text-sm tracking-wider',
  }[size];

  const candidateUrl = customLogoUrl || logoImg;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Emblem Mark: Either raster image or precision vector graphic */}
      <div className={`relative ${iconDimensions} shrink-0 flex items-center justify-center`}>
        {preferImage && !imgFailed ? (
          <img
            src={candidateUrl}
            alt="Voters Decide Official Logo"
            className="w-full h-full object-contain drop-shadow-md rounded-lg"
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* Official Vector VD Ballot Emblem matching the user logo */
          <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(29,123,242,0.35)]">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full overflow-visible"
            >
              <defs>
                {/* Electric Blue Gradient for the 'D' */}
                <linearGradient id="vdBlueGrad" x1="40" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#258AFF" />
                  <stop offset="100%" stopColor="#0B63E5" />
                </linearGradient>

                {/* Darker Inset Blue for the Ballot Box Slot */}
                <linearGradient id="vdSlotGrad" x1="45" y1="25" x2="80" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#084EBA" />
                  <stop offset="100%" stopColor="#053B8F" />
                </linearGradient>

                {/* Subtle drop shadow for depth */}
                <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" floodColor="#000000" />
                </filter>
              </defs>

              {/* 1. TOP BALLOT PAPER INSERTED INTO SLOT */}
              <g filter="url(#shadow)">
                {/* Ballot Card tilted slightly */}
                <path
                  d="M55 12 L73 8 L67 36 L49 40 Z"
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                {/* Checkmark inside ballot card */}
                <path
                  d="M55 24 L59 28 L68 17"
                  stroke="#111827"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* 2. THE BLUE 'D' WITH BALLOT BOX TOP */}
              {/* Outer 'D' Body */}
              <path
                d="M48 28 
                   L75 28 
                   C88 28, 96 38, 96 58 
                   C96 78, 88 88, 75 88 
                   L48 88 
                   Z"
                fill="url(#vdBlueGrad)"
              />

              {/* Top Slot Lip / Dimension */}
              <path
                d="M44 26 L76 26 C80 26, 84 29, 84 34 L40 34 C40 29, 42 26, 44 26 Z"
                fill="url(#vdSlotGrad)"
              />
              {/* Slot Opening */}
              <ellipse cx="61" cy="30" rx="14" ry="2.5" fill="#021C4A" />

              {/* Inner Cutout (Counter) of the 'D' */}
              <path
                d="M60 44 
                   L69 44 
                   C77 44, 82 50, 82 58 
                   C82 66, 77 72, 69 72 
                   L60 72 
                   Z"
                fill="#0F1216"
              />

              {/* 3. THE WHITE 'V' INTERLOCKING IN FRONT */}
              <g filter="url(#shadow)">
                {/* Left Arm of V */}
                <path
                  d="M10 30 L26 30 L44 80 L30 80 Z"
                  fill="#FFFFFF"
                />
                {/* Right Arm of V (crossing over D) */}
                <path
                  d="M58 38 L43 80 L30 80 L52 28 L65 28 Z"
                  fill="#FFFFFF"
                />
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Brand Typography matching official logo */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSizes} text-white uppercase font-black font-sans tracking-wide`}>
              VOTERS
            </span>
            <span className={`${titleSizes} text-[#1D7BF2] uppercase font-black font-sans tracking-wide`}>
              DECIDE
            </span>
          </div>

          {showTagline && (
            <span className={`${taglineSizes} font-semibold text-zinc-300 tracking-wide mt-0.5`}>
              Real People. Real Votes. Real Winners.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
