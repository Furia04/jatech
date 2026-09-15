'use client';

import React, { useState, useRef } from 'react';
import { RefreshCw, Lock, CheckCircle2 } from 'lucide-react';

interface PatternLockInputProps {
  value?: number[]; // ej: [1, 4, 7, 8, 9]
  onChange?: (pattern: number[]) => void;
  readOnly?: boolean;
}

export const PatternLockInput: React.FC<PatternLockInputProps> = ({
  value = [],
  onChange,
  readOnly = false,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Coordenadas de los 9 puntos en una cuadrícula 3x3 (Puntos 1 a 9)
  // 1  2  3
  // 4  5  6
  // 7  8  9
  const nodes = [
    { id: 1, x: 25, y: 25 },
    { id: 2, x: 50, y: 25 },
    { id: 3, x: 75, y: 25 },
    { id: 4, x: 25, y: 50 },
    { id: 5, x: 50, y: 50 },
    { id: 6, x: 75, y: 50 },
    { id: 7, x: 25, y: 75 },
    { id: 8, x: 50, y: 75 },
    { id: 9, x: 75, y: 75 },
  ];

  const getNodeCenter = (id: number) => {
    return nodes.find((n) => n.id === id) || { x: 0, y: 0 };
  };

  const handleNodeClick = (nodeId: number) => {
    if (readOnly || !onChange) return;
    if (value.includes(nodeId)) {
      if (value[value.length - 1] === nodeId) {
        onChange(value.slice(0, -1));
      }
      return;
    }
    onChange([...value, nodeId]);
  };

  const handleClear = () => {
    if (readOnly || !onChange) return;
    onChange([]);
  };

  return (
    <div className="space-y-3 bg-surface-container-lowest border border-outline-variant/60 p-4 rounded-xl text-center select-none">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-primary uppercase font-bold flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Patrón de Desbloqueo Táctil
        </span>
        {!readOnly && value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-error hover:text-error/80 font-bold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Grid Interactivo del Patrón */}
      <div
        ref={containerRef}
        className="relative w-48 h-48 mx-auto bg-slate-900/90 rounded-2xl border-2 border-slate-700 p-2 shadow-inner touch-none flex items-center justify-center"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          {/* Dibujar líneas entre los puntos seleccionados en secuencia */}
          {value.map((nodeId, idx) => {
            if (idx === 0) return null;
            const start = getNodeCenter(value[idx - 1]);
            const end = getNodeCenter(nodeId);
            return (
              <line
                key={`line-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#a855f7"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-in fade-in duration-200"
              />
            );
          })}
        </svg>

        {/* 9 Puntos de la Cuadrícula */}
        <div className="grid grid-cols-3 gap-6 relative z-10 w-full h-full p-4">
          {nodes.map((node) => {
            const indexInPattern = value.indexOf(node.id);
            const isSelected = indexInPattern !== -1;

            return (
              <button
                key={node.id}
                type="button"
                disabled={readOnly}
                onClick={() => handleNodeClick(node.id)}
                className={`relative w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white ring-4 ring-purple-400/40 scale-110 shadow-lg'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {/* Si está en el patrón, muestra el ORDEN de secuencia (1, 2, 3...) */}
                {isSelected ? (
                  <span className="font-mono text-xs font-black">{indexInPattern + 1}</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secuencia Numérica */}
      <div className="text-[11px] font-mono font-bold text-on-surface-variant">
        {value.length > 0 ? (
          <span>Secuencia: <span className="text-purple-400 font-extrabold">{value.join(' ➔ ')}</span></span>
        ) : (
          <span className="text-slate-500 italic">
            {readOnly ? 'Sin patrón registrado' : 'Toca los puntos en orden para trazar el patrón'}
          </span>
        )}
      </div>
    </div>
  );
};
