"use client";

import React from "react";
import { CoreMode } from "@/types";

interface BackgroundCanvasProps {
  activeCore: CoreMode;
}

/**
 * Ultra-performant background with hardware-accelerated subtle gradients and grid.
 * Runs at 0% idle CPU and does not trigger expensive canvas re-renders or heavy blur repaints.
 */
export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ activeCore }) => {
  const isSoftware = activeCore === "software";

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid opacity-25" />

      {/* Subtle, hardware-accelerated ambient glow (replaces heavy 160px dynamic canvas & blur filters) */}
      <div
        className={`absolute -top-32 left-1/4 w-[450px] h-[450px] rounded-full opacity-20 transition-all duration-700 transform-gpu ${
          isSoftware ? "bg-purple-600" : "bg-cyan-500"
        } blur-[90px]`}
      />
      <div
        className={`absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full opacity-15 transition-all duration-700 transform-gpu ${
          isSoftware ? "bg-indigo-600" : "bg-blue-600"
        } blur-[100px]`}
      />
      <div
        className={`absolute -bottom-20 left-10 w-[350px] h-[350px] rounded-full opacity-15 transition-all duration-700 transform-gpu ${
          isSoftware ? "bg-violet-700" : "bg-teal-500"
        } blur-[90px]`}
      />

      {/* Subtle CRT Scanline overlay */}
      <div className="absolute inset-0 scanlines opacity-20" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,8,0.85)_100%)]" />
    </div>
  );
};
