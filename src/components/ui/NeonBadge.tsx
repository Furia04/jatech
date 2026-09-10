import React from "react";
import { cn } from "@/lib/utils";

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "cyan" | "violet" | "amber";
  pulse?: boolean;
  className?: string;
  prefixCode?: string;
}

export const NeonBadge: React.FC<NeonBadgeProps> = ({
  children,
  variant = "emerald",
  pulse = true,
  className,
  prefixCode,
}) => {
  const variantStyles = {
    emerald: {
      badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      dot: "bg-emerald-400",
      glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    },
    cyan: {
      badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      dot: "bg-cyan-400",
      glow: "shadow-[0_0_8px_rgba(6,182,212,0.5)]",
    },
    violet: {
      badge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
      dot: "bg-violet-400",
      glow: "shadow-[0_0_8px_rgba(139,92,246,0.5)]",
    },
    amber: {
      badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      dot: "bg-amber-400",
      glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono tracking-wider uppercase border backdrop-blur-md transition-colors select-none",
        style.badge,
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              style.dot
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", style.dot, style.glow)}
          />
        </span>
      )}
      {prefixCode && <span className="opacity-50 font-normal">[{prefixCode}]</span>}
      <span className="font-semibold">{children}</span>
    </span>
  );
};
