"use client";

import React, { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "violet" | "cyan" | "emerald" | "default";
}

/**
 * High-performance spotlight card that updates CSS variables directly via DOM,
 * avoiding expensive React re-renders on mousemove.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  glowColor = "default",
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    cardRef.current.style.setProperty("--spotlight-opacity", "1");
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--spotlight-opacity", "0");
  }, []);

  const glowColors = {
    violet: "rgba(139, 92, 246, 0.15)",
    cyan: "rgba(6, 182, 212, 0.15)",
    emerald: "rgba(16, 185, 129, 0.15)",
    default: "rgba(255, 255, 255, 0.08)",
  };

  const borderHoverStyles = {
    violet: "group-hover:border-violet-500/40",
    cyan: "group-hover:border-cyan-500/40",
    emerald: "group-hover:border-emerald-500/40",
    default: "group-hover:border-white/25",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-[#0a0a14]/90 border border-white/[0.08] transition-colors duration-200",
        borderHoverStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Zero-rerender CSS variable spotlight glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background: `radial-gradient(350px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${glowColors[glowColor]}, transparent 75%)`,
        }}
      />

      {/* Decorative Cyber Tech Corner Brackets */}
      <div className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/20 group-hover:border-neon-violet transition-colors duration-200" />
      <div className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/20 group-hover:border-neon-cyan transition-colors duration-200" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/20 group-hover:border-neon-cyan transition-colors duration-200" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/20 group-hover:border-neon-violet transition-colors duration-200" />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
