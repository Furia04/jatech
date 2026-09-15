'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Smartphone, Check, Sparkles, Edit3, X, Loader2 } from 'lucide-react';

interface PhoneItem {
  id: string;
  brand: string;
  model: string;
  full_name: string;
  image_url?: string;
  description?: string;
}

interface DeviceAutocompleteProps {
  brand: string;
  model: string;
  onChangeBrand: (val: string) => void;
  onChangeModel: (val: string) => void;
  deviceType?: string;
  disabled?: boolean;
}

const POPULAR_BRANDS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Google', 'Honor', 'Realme', 'LG'];

export function DeviceAutocomplete({
  brand,
  model,
  onChangeBrand,
  onChangeModel,
  deviceType = 'Smartphone',
  disabled = false,
}: DeviceAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PhoneItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFromCatalog, setSelectedFromCatalog] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda con debounce
  const fetchSuggestions = (searchTerm: string, brandFilter: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchTerm.trim() && !brandFilter.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set('q', searchTerm.trim());
        if (brandFilter.trim()) params.set('brand', brandFilter.trim());

        const res = await fetch(`/api/phones/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        console.warn('Error al buscar modelos:', err);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleQuickSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    fetchSuggestions(val, brand);
  };

  const handleSelectSuggestion = (item: PhoneItem) => {
    onChangeBrand(item.brand);
    onChangeModel(item.model);
    setQuery(`${item.brand} ${item.model}`);
    setSelectedFromCatalog(true);
    setIsOpen(false);
  };

  const handleQuickBrandClick = (selectedBrand: string) => {
    if (brand.toLowerCase() === selectedBrand.toLowerCase()) {
      // Toggle off
      onChangeBrand('');
      fetchSuggestions(query, '');
    } else {
      onChangeBrand(selectedBrand);
      fetchSuggestions(query, selectedBrand);
      setIsOpen(true);
    }
  };

  const handleUseCustomDevice = (customText: string) => {
    // Si escribió ej: "iPhone 13 Pro" o "Motorola G84", intentar separar o colocar en modelo
    const trimmed = customText.trim();
    if (trimmed) {
      onChangeModel(trimmed);
      setSelectedFromCatalog(false);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* 1. Barra de Búsqueda Rápida Asistida por API (para celulares / tablets) */}
      {!manualMode && (
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Buscador Rápido de Dispositivos (API & Catálogo)
            </label>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-2.5 h-2.5" /> Escribir a mano directamente
            </button>
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-500 flex items-center pointer-events-none">
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            <input
              type="text"
              disabled={disabled}
              value={query}
              onChange={handleQuickSearchChange}
              onFocus={() => {
                if (query.trim() || brand.trim()) setIsOpen(true);
                fetchSuggestions(query, brand);
              }}
              placeholder="Buscar modelo (ej: iPhone 15, S23 Ultra, Moto G84, Note 13)..."
              className="w-full bg-[#0a0c10] border border-white/[0.12] rounded-lg py-2 pl-9 pr-8 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setIsOpen(false);
                }}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Píldoras de marcas populares para acceso en 1 clic */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 hide-scrollbar">
            <span className="font-mono text-[9px] text-slate-500 uppercase shrink-0">Marcas:</span>
            {POPULAR_BRANDS.map((b) => {
              const isSelected = brand.toLowerCase() === b.toLowerCase();
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleQuickBrandClick(b)}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-xs'
                      : 'bg-[#141820] text-slate-400 border-white/[0.06] hover:text-white hover:border-white/20'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>

          {/* Menú Flotante de Sugerencias Autocomplete */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#11141a] border border-white/[0.12] rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
              {suggestions.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 bg-[#151922] font-mono text-[9px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Modelos encontrados ({suggestions.length})</span>
                    <span className="text-amber-400/80">Catálogo Local</span>
                  </div>

                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-white group-hover:text-amber-300">
                            {item.brand} {item.model}
                          </span>
                          {item.description && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-300 shrink-0">
                        Seleccionar ↵
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 font-mono">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> Buscando en catálogo...
                    </span>
                  ) : (
                    <span>No se encontraron modelos con "{query}"</span>
                  )}
                </div>
              )}

              {/* Opción SIEMPRE DISPONIBLE para escribir libremente el modelo personalizado */}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleUseCustomDevice(query)}
                  className="w-full text-left px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-xs flex items-center gap-2 transition-colors border-t border-white/[0.08]"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>
                    Usar <strong className="text-white">"{query.trim()}"</strong> como dispositivo personalizado
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Inputs directos editables de Marca y Modelo */}
      <div className="grid grid-cols-2 gap-3 bg-[#11141a] p-3 rounded-lg border border-white/[0.08]">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Marca *
            </label>
            {manualMode && (
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[9px] font-mono text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <Sparkles className="w-2.5 h-2.5" /> Asistente API
              </button>
            )}
          </div>
          <input
            type="text"
            required
            disabled={disabled}
            value={brand}
            onChange={(e) => {
              onChangeBrand(e.target.value);
              setSelectedFromCatalog(false);
            }}
            placeholder="Ej: Apple, Samsung, Bosch..."
            className="w-full bg-[#0a0c10] border border-white/[0.1] rounded py-1.5 px-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500/70"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Modelo *
            </label>
            {selectedFromCatalog && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                <Check className="w-2.5 h-2.5" /> Catálogo
              </span>
            )}
          </div>
          <input
            type="text"
            required
            disabled={disabled}
            value={model}
            onChange={(e) => {
              onChangeModel(e.target.value);
              setSelectedFromCatalog(false);
            }}
            placeholder="Ej: iPhone 13 Pro, Moto G84..."
            className="w-full bg-[#0a0c10] border border-white/[0.1] rounded py-1.5 px-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500/70"
          />
        </div>

        <div className="col-span-2 pt-0.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>* Puedes modificar la marca o modelo manualmente en cualquier momento.</span>
          {model && !selectedFromCatalog && (
            <span className="text-amber-400/90 flex items-center gap-1">
              <Edit3 className="w-2.5 h-2.5" /> Dispositivo manual
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
