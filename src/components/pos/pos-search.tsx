'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode, X, Package, Sparkles } from 'lucide-react';
import { MarketProduct } from '@/types/market';
import { getLocalProducts, getLocalProductByBarcode } from '@/lib/market-store/local-market-adapter';

interface POSSearchProps {
  onAddProduct: (product: MarketProduct, quantity?: number) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
}

export function POSSearch({
  onAddProduct,
  isSearchModalOpen,
  setIsSearchModalOpen,
}: POSSearchProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados del modal de búsqueda F2
  const [modalQuery, setModalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MarketProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Mantener foco en el input principal de código de barras
  useEffect(() => {
    if (!isSearchModalOpen) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearchModalOpen]);

  // Manejo de búsqueda predictiva en el modal
  useEffect(() => {
    if (isSearchModalOpen) {
      modalInputRef.current?.focus();
      const results = getLocalProducts({ search: modalQuery, activeOnly: true });
      setSearchResults(results.slice(0, 10));
      setSelectedIndex(0);
    }
  }, [modalQuery, isSearchModalOpen]);

  // Manejador de escaneo directo con lector (o ingreso manual y Enter)
  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    // Soporte para multiplicador con asterisco (ej: 3*7790895000997)
    let qty = 1;
    let barcodeToSearch = clean;
    if (clean.includes('*')) {
      const parts = clean.split('*');
      if (parts.length === 2 && !isNaN(Number(parts[0]))) {
        qty = Math.max(0.001, Number(parts[0]));
        barcodeToSearch = parts[1].trim();
      }
    }

    const found = getLocalProductByBarcode(barcodeToSearch);
    if (found) {
      onAddProduct(found, qty);
      setScanMessage({ text: `Agregado: ${found.name}`, type: 'success' });
      setBarcodeInput('');
    } else {
      setScanMessage({ text: `Código ${barcodeToSearch} no encontrado. Presiona F2 para buscar.`, type: 'error' });
    }

    setTimeout(() => setScanMessage(null), 3000);
  }

  // Teclas en el modal de búsqueda F2
  function handleModalKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        onAddProduct(searchResults[selectedIndex], 1);
        setIsSearchModalOpen(false);
        setModalQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchModalOpen(false);
      setModalQuery('');
    }
  }

  return (
    <div className="space-y-2">
      {/* Barra de Entrada de Código de Barras (Escáner continuo) */}
      <form onSubmit={handleBarcodeSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Barcode className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Escanear código de barras o ingresar código (ej: 3*779... para cantidad)..."
            className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white font-mono text-base tracking-wide placeholder:text-slate-500 placeholder:font-sans focus:outline-none transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Buscar [F2]</span>
          </button>
        </div>
      </form>

      {/* Mensaje de retroalimentación de escaneo */}
      {scanMessage && (
        <div
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150 ${
            scanMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>{scanMessage.text}</span>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Rápido de Búsqueda F2 */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-5 text-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Buscador Rápido de Productos</h3>
                <span className="text-xs text-slate-500 font-mono">[↑/↓ navegar, Enter seleccionar, Esc cerrar]</span>
              </div>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 relative">
              <input
                ref={modalInputRef}
                type="text"
                value={modalQuery}
                onChange={(e) => setModalQuery(e.target.value)}
                onKeyDown={handleModalKeyDown}
                placeholder="Escribe el nombre, marca o código..."
                className="w-full pl-4 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium text-base focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-800/40">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              ) : (
                searchResults.map((prod, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        onAddProduct(prod, 1);
                        setIsSearchModalOpen(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white flex items-center gap-2">
                            <span>{prod.name}</span>
                            {prod.is_weighable && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                PESABLE (Kg)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                            <span>EAN: {prod.barcode}</span>
                            {prod.brand && <span>• {prod.brand}</span>}
                            <span>• Stock: {prod.stock}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-mono font-bold text-emerald-400">
                          ${(Number(prod.sale_price) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {prod.is_weighable ? 'por Kg' : 'por Unidad'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
