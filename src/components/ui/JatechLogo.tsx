import React from "react";
import { cn } from "@/lib/utils";

interface JatechLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export const JatechLogo: React.FC<JatechLogoProps> = ({
  className,
  iconOnly = false,
  size = "md",
}) => {
  const iconSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8 sm:w-9 sm:h-9";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      {/* Modern High-End Vector Icon */}
      <div
        className={cn(
          iconSize,
          "relative rounded-xl flex items-center justify-center p-1.5",
          "bg-gradient-to-br from-[#0c1020] via-[#080812] to-[#150a24]",
          "border border-white/15 shadow-[0_0_15px_-3px_rgba(6,182,212,0.25)]",
          "group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_0px_rgba(139,92,246,0.4)]",
          "transition-all duration-300 shrink-0"
        )}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="jt-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="jt-violet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="shadow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Stylized geometric J */}
          <path
            d="M11 11V23.5C11 27.0899 13.9101 30 17.5 30H18C19.933 30 21.5 28.433 21.5 26.5C21.5 24.567 19.933 23 18 23H17C15.8954 23 15 22.1046 15 21V11H11Z"
            fill="url(#jt-cyan)"
            filter="url(#shadow-filter)"
          />

          {/* Stylized geometric T */}
          <path
            d="M17 11H31V15H26V29H22V15H17V11Z"
            fill="url(#jt-violet)"
            filter="url(#shadow-filter)"
          />

          {/* High-tech accent dot */}
          <circle cx="28" cy="22" r="2" fill="#22d3ee" />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span
              className={cn(
                textSize,
                "font-sans font-black tracking-wider text-white group-hover:text-slate-100 transition-colors"
              )}
            >
              JA<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">TECH</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>
      )}
    </div>
  );
};
