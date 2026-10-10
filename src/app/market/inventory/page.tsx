'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Barcode,
  Filter,
  AlertTriangle,
  Boxes,
  TrendingDown,
  TrendingUp,
  DollarSign,
  History,
  Scale,
  Package,
  RefreshCw,
  PlusCircle,
  Eye,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { MarketCategory, MarketProduct } from '@/types/market';
import {
  fetchMarketCategories,
  fetchMarketProducts,
} from '@/lib/supabase/market-services';
import { StockAdjustmentModal } from '@/components/market/stock-adjustment-modal';
import { StockHistoryModal } from '@/components/market/stock-history-modal';

type StockFilterTab = 'all' | 'low_stock' | 'out_of_stock';

export default function MarketInventoryPage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [activeTab, setActiveTab] = useState<StockFilterTab>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modales
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<MarketProduct | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const [selectedProductForHistory, setSelectedProductForHistory] = useState<MarketProduct | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
      console.error('Error cargando inventario:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Cálculos de KPIs en tiempo real
  const stats = useMemo(() => {
    let totalCostVal = 0;
    let totalSaleVal = 0;
    let lowCount = 0;
    let outCount = 0;

    for (const p of products) {
      const st = Number(p.stock) || 0;
      const min = Number(p.min_stock) || 0;
      const cost = Number(p.cost_price) || 0;
      const sale = Number(p.sale_price) || 0;

      if (st > 0) {
        totalCostVal += st * cost;
        totalSaleVal += st * sale;
      }

      if (st <= 0) {
        outCount++;
      } else if (st <= min) {
        lowCount++;
      }
    }

    return {
      totalCostValue: totalCostVal,
      totalSaleValue: totalSaleVal,
      lowStockCount: lowCount,
      outOfStockCount: outCount,
      totalProducts: products.length,
    };
  }, [products]);

  // Filtrado de la tabla
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const st = Number(p.stock) || 0;
      const min = Number(p.min_stock) || 0;

      // Filtro por pestaña de criticidad
      if (activeTab === 'low_stock' && !(st <= min && st > 0)) {
        return false;
      }
      if (activeTab === 'out_of_stock' && st > 0) {
        return false;
      }

      // Filtro por categoría
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }

      // Búsqueda por texto / código de barras
      if (!q) return true;
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      return matchBarcode || matchName || matchBrand;
    });
  }, [products, activeTab, selectedCategory, search]);

  function handleOpenAdjustment(prod: MarketProduct) {
    setSelectedProductForAdjustment(prod);
    setIsAdjustmentModalOpen(true);
  }

  function handleOpenHistory(prod?: MarketProduct) {
    setSelectedProductForHistory(prod || null);
    setIsHistoryModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Control de Stock e Inventario</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {products.length} artículos en catálogo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Supervisa existencias, detecta quiebres de mercadería y realiza ajustes manuales con auditoría.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenHistory()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Auditoría Global</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Refrescar existencias"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* D-01: Tarjetas de Métricas & KPIs de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Valorización a Costo */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Capital en Stock (Costo)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            ${stats.totalCostValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Costo de reposición estimado
          </span>
        </div>

        {/* KPI 2: Valorización a Venta */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Valorización Potencial (Venta)</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-400">
            ${stats.totalSaleValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Ingreso proyectado en góndola
          </span>
        </div>

        {/* KPI 3: Stock Crítico / Bajo */}
        <div
          onClick={() => setActiveTab('low_stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            activeTab === 'low_stock'
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-amber-500/40 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Stock Bajo (Próximos a agotar)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-400">
            {stats.lowStockCount} artículos
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Existencias &lt;= stock mínimo
          </span>
        </div>

        {/* KPI 4: Quiebre de Stock / Agotados */}
        <div
          onClick={() => setActiveTab('out_of_stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            activeTab === 'out_of_stock'
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-rose-500/40 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Agotados (Quiebre)</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-400">
            {stats.outOfStockCount} artículos
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Existencias en cero o negativas
          </span>
        </div>
      </div>

      {/* D-02: Filtros de Criticidad y Barra de Búsqueda */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3.5 shadow-xl">
        {/* Pestañas de Acceso Rápido */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('low_stock')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'low_stock'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950'
                : 'bg-slate-950 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stock Bajo ({stats.lowStockCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('out_of_stock')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'out_of_stock'
                ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950'
                : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Agotados ({stats.outOfStockCount})</span>
          </button>
        </div>

        {/* Buscador reactivo y Categoría */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escanear código de barras o buscar por nombre / marca de producto..."
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
          </div>
        </div>
      </div>

      {/* Tabla Densa de Inventario */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Producto & Marca</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-right">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Mínimo</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Capital en Stock</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Cargando inventario de productos...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No se encontraron artículos</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {activeTab !== 'all'
                        ? 'No hay productos en esta condición de stock actualmente.'
                        : 'Intenta buscar con otros términos o filtros.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const st = Number(prod.stock) || 0;
                  const min = Number(prod.min_stock) || 0;
                  const cost = Number(prod.cost_price) || 0;
                  const totalCostItem = st > 0 ? st * cost : 0;

                  const isOut = st <= 0;
                  const isLow = st <= min && st > 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Código de barras */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
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

                      {/* Tipo */}
                      <td className="py-3 px-4 text-center">
                        {prod.is_weighable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Scale className="w-3 h-3" />
                            <span>{prod.unit_type}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <Package className="w-3 h-3" />
                            <span>un</span>
                          </span>
                        )}
                      </td>

                      {/* Stock Actual con Semáforo */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span
                          className={`text-sm font-bold px-2 py-0.5 rounded-lg inline-block ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {st.toLocaleString('es-AR', {
                            maximumFractionDigits: prod.is_weighable ? 3 : 0,
                          })}{' '}
                          <span className="text-[10px] font-normal uppercase opacity-75">
                            {prod.unit_type}
                          </span>
                        </span>
                      </td>

                      {/* Stock Mínimo */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {min}{' '}
                        <span className="text-[10px] uppercase opacity-60">
                          {prod.unit_type}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <TrendingDown className="w-3 h-3" />
                            <span>Agotado</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Stock Bajo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Óptimo</span>
                          </span>
                        )}
                      </td>

                      {/* Capital en Stock */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ${totalCostItem.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ajustar Stock */}
                          <button
                            onClick={() => handleOpenAdjustment(prod)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
                            title="Registrar ajuste manual de stock"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Ajustar</span>
                          </button>

                          {/* Botón Ver Historial */}
                          <button
                            onClick={() => handleOpenHistory(prod)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                            title="Ver historial de movimientos de este producto"
                          >
                            <History className="w-3.5 h-3.5" />
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

      {/* Modal de Ajuste de Stock */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        product={selectedProductForAdjustment}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedProductForAdjustment(null);
        }}
        onSaved={loadData}
      />

      {/* Modal de Historial de Movimientos */}
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        productId={selectedProductForHistory?.id}
        productName={selectedProductForHistory?.name}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedProductForHistory(null);
        }}
      />
    </div>
  );
}
