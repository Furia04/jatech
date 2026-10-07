'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Barcode,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Package,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { MarketCategory, MarketProduct } from '@/types/market';
import {
  fetchMarketCategories,
  fetchMarketProducts,
  updateMarketProduct,
} from '@/lib/supabase/market-services';
import { ProductModal } from '@/components/market/product-modal';
import { CSVImportModal } from '@/components/market/csv-import-modal';

export default function MarketCatalogPage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string>('');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales
  async function loadData() {
    setLoading(true);
    try {
      const [catsData, prodsData] = await Promise.all([
        fetchMarketCategories(),
        fetchMarketProducts({ activeOnly: false }),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (e) {
      console.error('Error cargando catálogo:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Atajos de teclado globales
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // F2: Nuevo Producto
      if (e.key === 'F2') {
        e.preventDefault();
        openNewProductModal();
      }
      // '/' : Enfocar buscador si no está en un input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtrado reactivo en memoria
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      // Filtro de activos
      if (showActiveOnly && !p.active) return false;

      // Filtro de categoría
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;

      // Búsqueda por código de barras, nombre o marca
      if (!q) return true;
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      return matchBarcode || matchName || matchBrand;
    });
  }, [products, search, selectedCategory, showActiveOnly]);

  // Detección de código de barras no encontrado
  const isSearchExactBarcodeMissing = useMemo(() => {
    const clean = search.trim();
    if (clean.length < 4 || !/^\d+$/.test(clean)) return false;
    return filteredProducts.length === 0;
  }, [search, filteredProducts]);

  function openNewProductModal(initialBarcode: string = '') {
    setSelectedProduct(null);
    setPrefilledBarcode(initialBarcode);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(prod: MarketProduct) {
    setSelectedProduct(prod);
    setPrefilledBarcode('');
    setIsProductModalOpen(true);
  }

  async function toggleProductStatus(prod: MarketProduct) {
    try {
      await updateMarketProduct({
        id: prod.id,
        active: !prod.active,
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === prod.id ? { ...item, active: !prod.active } : item))
      );
    } catch (err) {
      console.error('Error al cambiar estado del producto:', err);
    }
  }

  // Exportar catálogo completo a CSV
  function handleExportCSV() {
    if (products.length === 0) return;

    const headers = ['barcode', 'name', 'brand', 'category', 'cost_price', 'sale_price', 'stock', 'min_stock', 'unit_type', 'active'];
    const rows = products.map((p) => [
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${(p.category?.name || '').replace(/"/g, '""')}"`,
      p.cost_price,
      p.sale_price,
      p.stock,
      p.min_stock,
      p.unit_type,
      p.active ? 'true' : 'false',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_supermercado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo de Productos</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {products.length} productos registrados
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Administra precios de costo, precios al público, stock y códigos de barras (EAN-13/UPC).
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm"
            title="Descargar catálogo completo en CSV"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => openNewProductModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto (F2)</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda Continua */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3.5 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Buscador reactivo por código de barra o nombre */}
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escanear código de barras o escribir nombre / marca... (Presiona '/' para buscar)"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filtro de Categoría */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl bg-slate-950 text-slate-200 border border-slate-800 focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              <option value="all">Todas las categorías ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Toggle de Activos */}
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                showActiveOnly
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {showActiveOnly ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showActiveOnly ? 'Solo Activos' : 'Todos'}</span>
            </button>

            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
              title="Refrescar catálogo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* D-02: Banner de código de barras no encontrado para alta rápida */}
        {isSearchExactBarcodeMissing && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                El código de barras <strong>"{search.trim()}"</strong> no está registrado en este comercio.
              </span>
            </div>
            <button
              onClick={() => openNewProductModal(search.trim())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all shrink-0 ml-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear con este código</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabla Densa de Productos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Código / Barras</th>
                <th className="py-3.5 px-4">Producto & Marca</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-right">Costo</th>
                <th className="py-3.5 px-4 text-right">Precio Venta</th>
                <th className="py-3.5 px-4 text-right">Margen %</th>
                <th className="py-3.5 px-4 text-right">Stock</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Cargando productos del supermercado...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No se encontraron productos</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Intenta buscar con otros términos, cambia los filtros o crea tu primer producto.
                    </p>
                    <button
                      onClick={() => openNewProductModal()}
                      className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Producto</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const cost = Number(prod.cost_price) || 0;
                  const price = Number(prod.sale_price) || 0;
                  const marginPercent = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                  const isStockLow = Number(prod.stock) <= Number(prod.min_stock);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Código de barras */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 inline-block font-semibold">
                          {prod.barcode}
                        </span>
                      </td>

                      {/* Nombre y Marca */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {prod.name}
                        </div>
                        {prod.brand && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {prod.brand}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4">
                        <span className="text-slate-300 text-[11px]">
                          {prod.category?.name || '—'}
                        </span>
                      </td>

                      {/* Tipo de venta */}
                      <td className="py-3 px-4">
                        {prod.is_weighable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Scale className="w-3 h-3" />
                            <span>Pesable ({prod.unit_type})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <Package className="w-3 h-3" />
                            <span>Unidad</span>
                          </span>
                        )}
                      </td>

                      {/* Costo */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        ${cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Precio de Venta */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ${price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Margen % */}
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            marginPercent >= 30
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : marginPercent > 0
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-rose-400 bg-rose-500/10 font-bold'
                          }`}
                        >
                          {marginPercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            Number(prod.stock) <= 0
                              ? 'text-rose-400 font-bold'
                              : isStockLow
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {Number(prod.stock).toLocaleString('es-AR', {
                            maximumFractionDigits: prod.is_weighable ? 3 : 0,
                          })}{' '}
                          <span className="text-[10px] text-slate-500 uppercase">
                            {prod.unit_type}
                          </span>
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleProductStatus(prod)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                            prod.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400'
                          }`}
                        >
                          {prod.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductModal(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                            title="Editar producto"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición de Producto */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={selectedProduct}
        prefilledBarcode={prefilledBarcode}
        categories={categories}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={loadData}
      />

      {/* Modal de Importación Masiva CSV */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onCompleted={loadData}
      />
    </div>
  );
}
