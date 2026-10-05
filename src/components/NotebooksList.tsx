'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/catalog';

interface NotebooksListProps {
  products: Product[];
}

export default function NotebooksList({ products }: NotebooksListProps) {
  const [search, setSearch] = useState('');
  const [marcaFilter, setMarcaFilter] = useState<string>('Todas');
  const [gradoFilter, setGradoFilter] = useState<string>('Todos');

  const marcas = useMemo(() => {
    const s = new Set(products.map(p => p.marca));
    return ['Todas', ...Array.from(s).sort()];
  }, [products]);

  const grados = useMemo(() => {
    const s = new Set(products.map(p => p.grado));
    return ['Todos', ...Array.from(s).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) || 
                          p.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchMarca = marcaFilter === 'Todas' || p.marca === marcaFilter;
      const matchGrado = gradoFilter === 'Todos' || p.grado === gradoFilter;
      return matchSearch && matchMarca && matchGrado && p.disponible;
    });
  }, [products, search, marcaFilter, gradoFilter]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-xl border border-cyber-border shadow-md">
        <div>
          <label className="block text-xs font-mono font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Buscar Equipo</label>
          <input 
            type="text" 
            placeholder="Ej: i5, 8gb, SSD..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-highest border-outline text-on-surface rounded-md p-2 border focus:ring-1 focus:ring-primary focus:border-primary placeholder-on-surface-variant/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Marca</label>
          <select 
            value={marcaFilter}
            onChange={(e) => setMarcaFilter(e.target.value)}
            className="w-full bg-surface-container-highest border-outline text-on-surface rounded-md p-2 border focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          >
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Condición / Grado</label>
          <select 
            value={gradoFilter}
            onChange={(e) => setGradoFilter(e.target.value)}
            className="w-full bg-surface-container-highest border-outline text-on-surface rounded-md p-2 border focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          >
            {grados.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Listado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-surface-container group rounded-xl overflow-hidden border border-cyber-border hover:border-primary/50 hover:shadow-neon-cyan/20 transition-all duration-300 flex flex-col">
            <div className="relative h-48 w-full bg-surface-container-lowest flex-shrink-0 border-b border-cyber-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent z-10 opacity-60"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={product.imagen} 
                alt={product.titulo}
                className="w-full h-full object-contain p-4 relative z-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 z-20 bg-surface-bright/90 backdrop-blur-sm border border-cyber-border text-on-surface text-xs font-mono font-bold px-2 py-1 rounded-sm shadow-sm">
                {product.grado}
              </div>
              <div className="absolute top-3 left-3 z-20 bg-primary/20 border border-primary/50 text-primary text-xs font-mono font-bold px-2 py-1 rounded-sm">
                {product.marca}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow relative z-20">
              <h3 className="font-sans font-bold text-lg text-on-surface mb-2 line-clamp-1">{product.titulo}</h3>
              <p className="text-on-surface-variant text-sm mb-5 line-clamp-2 flex-grow">{product.descripcion}</p>
              
              <div className="flex flex-col gap-1 mb-5 border-t border-cyber-border pt-4">
                <span className="text-2xl font-black text-primary font-mono tracking-tight">
                  ${product.precio.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-neon-cyan">credit_card</span>
                  Aceptamos tarjetas de crédito
                </span>
              </div>
              
              <Link 
                href={`/notebooks/${product.id}`}
                className="w-full text-center bg-surface-bright border border-cyber-border hover:bg-primary hover:text-on-primary hover:border-primary text-on-surface font-semibold py-2.5 px-4 rounded-md transition-all duration-300 font-sans"
              >
                Ver Detalles
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-surface-container-low rounded-xl border border-cyber-border">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">search_off</span>
          <p className="text-on-surface-variant font-mono">Sin resultados en los registros.</p>
        </div>
      )}
    </div>
  );
}
