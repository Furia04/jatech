import React from 'react';

interface MarketLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

export function MarketLogo({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
}: MarketLogoProps) {
  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Isotipo SVG de Alta Definición */}
      <div
        className={`${dimensions.icon} relative shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 p-0.5 shadow-lg shadow-emerald-500/25 border border-emerald-400/40 flex items-center justify-center group overflow-hidden`}
      >
        {/* Resplandor interno */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-emerald-300/30 opacity-70 pointer-events-none" />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 text-white drop-shadow-md"
        >
          {/* Base canasta / estructura comercial */}
          <path
            d="M8 15L14 36C14.5 37.8 16.2 39 18 39H30C31.8 39 33.5 37.8 34 36L40 15"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Rayos de escáner / código de barras moderno */}
          <path
            d="M19 22V32"
            stroke="#6EE7B7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M25 20V34"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M31 24V30"
            stroke="#6EE7B7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Asa superior de la J de JaTech */}
          <path
            d="M15 15C15 10 18.5 7 24 7C29.5 7 33 10 33 15"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Destello de tecnología en vértice */}
          <circle cx="37" cy="11" r="2.5" fill="#34D399" />
        </svg>
      </div>

      {showText && (
        <div className={`flex flex-col text-left ${textClassName}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${dimensions.text} font-black tracking-tight text-white font-sans`}>
              JATECH
            </span>
            <span
              className={`${dimensions.text} font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent`}
            >
              MARKET
            </span>
          </div>
          <span
            className={`${dimensions.sub} font-mono tracking-widest uppercase text-emerald-400/90 font-semibold mt-1`}
          >
            SISTEMA RETAIL & POS
          </span>
        </div>
      )}
    </div>
  );
}
