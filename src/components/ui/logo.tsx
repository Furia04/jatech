'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSubtitle?: string;
}

export function Logo({
  className = '',
  size = 36,
  showText = true,
  textSubtitle = 'Software para técnicos',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem SVG Logo */}
      <div
        style={{ width: size, height: size }}
        className="rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <path
            d="M180 150C155 150 135 170 135 195C135 215 148 232 166 238L140 330C136 342 145 355 158 355H190L222 245C228 246 234 246 240 244C264 236 277 210 269 186C261 162 235 149 211 157"
            stroke="white"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="340" cy="172" r="32" fill="#34d399" />
        </svg>
      </div>

      {/* Text Brand */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-headline-md text-lg font-bold text-primary tracking-tight leading-none">
            JaTech
          </span>
          {textSubtitle && (
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
