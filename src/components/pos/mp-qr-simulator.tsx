'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

interface MPQRSimulatorProps {
  amount: number;
  onPaymentSuccess: (details: Record<string, any>) => void;
}

export function MPQRSimulator({ amount, onPaymentSuccess }: MPQRSimulatorProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  function handleSimulateApproval() {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      onPaymentSuccess({
        provider: 'mercadopago_qr',
        mp_payment_id: `MP-${Date.now()}`,
        status: 'approved',
        payment_type: 'qr_dynamic',
        accredited_amount: amount,
        timestamp: new Date().toISOString(),
      });
    }, 1200);
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-sky-500/30 text-center space-y-4">
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Mercado Pago QR Dinámico
        </span>
        <span className="text-xs font-mono text-slate-400">
          Vence en {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Renderizado de QR Estilizado con Patrón Matriz */}
      <div className="relative p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
        {/* Gráfico SVG táctico que simula un QR con el logo de MP integrado */}
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48 text-slate-900"
          fill="currentColor"
        >
          {/* Patrones de esquinas QR */}
          <rect x="10" y="10" width="50" height="50" rx="6" fill="#0284c7" />
          <rect x="20" y="20" width="30" height="30" rx="3" fill="white" />
          <rect x="26" y="26" width="18" height="18" rx="2" fill="#0284c7" />

          <rect x="140" y="10" width="50" height="50" rx="6" fill="#0284c7" />
          <rect x="150" y="20" width="30" height="30" rx="3" fill="white" />
          <rect x="156" y="26" width="18" height="18" rx="2" fill="#0284c7" />

          <rect x="10" y="140" width="50" height="50" rx="6" fill="#0284c7" />
          <rect x="20" y="150" width="30" height="30" rx="3" fill="white" />
          <rect x="26" y="156" width="18" height="18" rx="2" fill="#0284c7" />

          {/* Matriz simulada de datos */}
          <rect x="70" y="15" width="12" height="12" />
          <rect x="90" y="15" width="12" height="12" />
          <rect x="110" y="15" width="12" height="12" />
          <rect x="70" y="35" width="12" height="12" />
          <rect x="100" y="35" width="22" height="12" />
          <rect x="70" y="55" width="22" height="12" />
          <rect x="110" y="55" width="12" height="12" />

          <rect x="15" y="75" width="12" height="12" />
          <rect x="35" y="75" width="22" height="12" />
          <rect x="70" y="75" width="12" height="22" />
          <rect x="90" y="85" width="22" height="12" />
          <rect x="130" y="75" width="12" height="12" />
          <rect x="150" y="75" width="22" height="12" />

          {/* Centro distintivo MP */}
          <circle cx="100" cy="100" r="18" fill="#0284c7" />
          <path
            d="M92 100 Q100 90 108 100 Q100 110 92 100"
            fill="none"
            stroke="white"
            strokeWidth="3"
          />

          <rect x="15" y="105" width="22" height="12" />
          <rect x="45" y="105" width="12" height="12" />
          <rect x="130" y="105" width="22" height="12" />
          <rect x="160" y="105" width="12" height="12" />

          <rect x="70" y="125" width="12" height="22" />
          <rect x="90" y="135" width="12" height="12" />
          <rect x="110" y="125" width="12" height="22" />

          <rect x="70" y="165" width="22" height="12" />
          <rect x="100" y="155" width="12" height="22" />
          <rect x="130" y="145" width="22" height="12" />
          <rect x="160" y="145" width="12" height="12" />
          <rect x="140" y="165" width="32" height="12" />
        </svg>

        {/* Overlay si está simulando */}
        {simulating && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-slate-900 animate-in fade-in">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Acreditando Pago...</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-xl font-mono font-black text-white">
          ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          El cliente debe escanear este código con su app de Mercado Pago o billetera bancaria.
        </p>
      </div>

      {/* Botón de Simulación para Pruebas Locales */}
      <div className="w-full pt-2">
        <button
          type="button"
          disabled={simulating}
          onClick={handleSimulateApproval}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>Simular Pago Acreditado en Vivo</span>
        </button>
      </div>
    </div>
  );
}
