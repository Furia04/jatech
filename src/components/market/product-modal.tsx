'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Barcode,
  Tag,
  DollarSign,
  TrendingUp,
  Boxes,
  Scale,
  Package,
  AlertTriangle,
  Plus,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { MarketCategory, MarketProduct, UnitType } from '@/types/market';
import {
  createMarketProduct,
  updateMarketProduct,
  createMarketCategory,
} from '@/lib/supabase/market-services';

interface ProductModalProps {
  isOpen: boolean;
  product: MarketProduct | null;
  prefilledBarcode?: string;
  categories: MarketCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductModal({
  isOpen,
  product,
  prefilledBarcode,
  categories,
  onClose,
  onSaved,
}: ProductModalProps) {
  const isEditing = Boolean(product);

  // Form states
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [marginPercent, setMarginPercent] = useState<number | string>(30);
  const [salePrice, setSalePrice] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(0);
  const [minStock, setMinStock] = useState<number | string>(5);
  const [isWeighable, setIsWeighable] = useState(false);
  const [unitType, setUnitType] = useState<UnitType>('unit');
  const [active, setActive] = useState(true);

  // Categorías y creación rápida
  const [categoryList, setCategoryList] = useState<MarketCategory[]>(categories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  // UI status
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar categorías recibidas
  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  // Inicializar formulario al abrir o cambiar producto
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');

    if (product) {
      setBarcode(product.barcode || '');
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategoryId(product.category_id || '');
      const cost = Number(product.cost_price) || 0;
      const sale = Number(product.sale_price) || 0;
      setCostPrice(cost);
      setSalePrice(sale);
      const calcMargin = cost > 0 ? ((sale - cost) / cost) * 100 : 0;
      setMarginPercent(parseFloat(calcMargin.toFixed(1)));
      setStock(product.stock);
      setMinStock(product.min_stock);
      setIsWeighable(product.is_weighable);
      setUnitType(product.unit_type || (product.is_weighable ? 'kg' : 'unit'));
      setActive(product.active);
    } else {
      setBarcode(prefilledBarcode || '');
      setName('');
      setBrand('');
      setCategoryId('');
      setCostPrice(0);
      setMarginPercent(30);
      setSalePrice(0);
      setStock(0);
      setMinStock(5);
      setIsWeighable(false);
      setUnitType('unit');
      setActive(true);
    }
  }, [isOpen, product, prefilledBarcode]);

  // D-03: Cálculo bidireccional reactivo
  function handleCostChange(val: string) {
    const cost = parseFloat(val) || 0;
    setCostPrice(val);
    const margin = typeof marginPercent === 'number' ? marginPercent : parseFloat(marginPercent) || 0;
    const newPrice = cost * (1 + margin / 100);
    setSalePrice(parseFloat(newPrice.toFixed(2)));
  }

  function handleMarginChange(val: string) {
    const margin = parseFloat(val) || 0;
    setMarginPercent(val);
    const cost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
    const newPrice = cost * (1 + margin / 100);
    setSalePrice(parseFloat(newPrice.toFixed(2)));
  }

  function handleSalePriceChange(val: string) {
    const price = parseFloat(val) || 0;
    setSalePrice(val);
    const cost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
    if (cost > 0) {
      const calcMargin = ((price - cost) / cost) * 100;
      setMarginPercent(parseFloat(calcMargin.toFixed(1)));
    } else {
      setMarginPercent(0);
    }
  }

  // Generador de código interno para productos pesables o sin EAN
  function handleGenerateInternalBarcode() {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`2000${randomSuffix}`);
  }

  // Creación rápida de categoría
  async function handleQuickCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCategorySaving(true);
    try {
      const created = await createMarketCategory(newCategoryName.trim());
      if (created) {
        setCategoryList((prev) => [...prev, created]);
        setCategoryId(created.id);
        setNewCategoryName('');
        setIsCreatingCategory(false);
      }
    } catch (err: any) {
      console.error('Error creando categoría:', err);
      setErrorMsg('No se pudo crear la categoría');
    } finally {
      setCategorySaving(false);
    }
  }

  // Guardar producto
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const cleanBarcode = barcode.trim();
    const cleanName = name.trim();

    if (!cleanBarcode) {
      setErrorMsg('El código de barras es obligatorio.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }

    const costNum = Number(costPrice) || 0;
    const saleNum = Number(salePrice) || 0;
    const stockNum = Number(stock) || 0;
    const minStockNum = Number(minStock) || 0;

    if (saleNum < 0) {
      setErrorMsg('El precio de venta no puede ser negativo.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && product) {
        await updateMarketProduct({
          id: product.id,
          barcode: cleanBarcode,
          name: cleanName,
          brand: brand.trim() || null,
          category_id: categoryId || null,
          cost_price: costNum,
          sale_price: saleNum,
          min_stock: minStockNum,
          is_weighable: isWeighable,
          unit_type: unitType,
          active,
        });
      } else {
        await createMarketProduct({
          barcode: cleanBarcode,
          name: cleanName,
          brand: brand.trim() || null,
          category_id: categoryId || null,
          cost_price: costNum,
          sale_price: saleNum,
          stock: stockNum,
          min_stock: minStockNum,
          is_weighable: isWeighable,
          unit_type: unitType,
          active,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar producto:', err);
      if (err.message?.includes('duplicate key') || err.message?.includes('idx_market_products_shop_barcode')) {
        setErrorMsg(`Ya existe otro producto registrado con el código "${cleanBarcode}" en esta tienda.`);
      } else {
        setErrorMsg(err.message || 'Error al guardar el producto');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const costNum = Number(costPrice) || 0;
  const saleNum = Number(salePrice) || 0;
  const isNegativeMargin = costNum > 0 && saleNum < costNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? 'Actualiza los datos, costos y precios al público.'
                : 'Registra un nuevo artículo para ventas en góndola o mostrador.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Fila 1: Código de barras y botón autogenerar */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-400" />
                Código de Barras (EAN-13 / UPC / Código Interno) *
              </label>
              <button
                type="button"
                onClick={handleGenerateInternalBarcode}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Código Interno</span>
              </button>
            </div>
            <div className="mt-1.5 relative">
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Escanea el código de barras o ingresa código único..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 text-white font-mono placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Fila 2: Nombre y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Leche Entera 1L, Pan Francés..."
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Marca / Fabricante</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej: La Serenísima"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Fila 3: Categoría y Nueva Categoría */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-400" />
                Categoría
              </label>
              {!isCreatingCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Categoría</span>
                </button>
              )}
            </div>

            {isCreatingCategory ? (
              <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la nueva categoría..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-white border border-slate-700 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={categorySaving}
                  onClick={handleQuickCreateCategory}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {categorySaving ? 'Guardando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 text-slate-200 border border-slate-800 focus:border-emerald-500 outline-none transition-all cursor-pointer"
              >
                <option value="">Sin categoría asignada</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fila 4: Tipo de Venta (Unidad vs Pesable por Balanza) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                Modalidad de Venta y Balanza
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsWeighable(false);
                    setUnitType('unit');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !isWeighable
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Por Unidad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsWeighable(true);
                    setUnitType('kg');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isWeighable
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Pesable / Fraccionable
                </button>
              </div>
            </div>

            {isWeighable && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
                <span>Unidad de medida en caja/balanza:</span>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-white border border-slate-700 outline-none text-xs"
                >
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="l">Litros (l)</option>
                  <option value="m">Metros (m)</option>
                </select>
              </div>
            )}
          </div>

          {/* D-03: Sección de Precios y Rentabilidad Bidireccional */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Precios y Rentabilidad
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Cálculo bidireccional automático
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Costo */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Precio Costo ($)</label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => handleCostChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-slate-900 text-white font-mono border border-slate-800 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Margen % */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Margen Deseado (%)</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    value={marginPercent}
                    onChange={(e) => handleMarginChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 text-white font-mono border border-slate-800 focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
              </div>

              {/* Precio Venta */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-400">Precio de Venta ($) *</label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-slate-900 text-white font-mono font-bold border border-emerald-500/50 focus:border-emerald-400 outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Alerta de margen negativo */}
            {isNegativeMargin && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Atención: El precio de venta (${saleNum}) es menor al precio de costo (${costNum}). Este producto generará pérdida.
                </span>
              </div>
            )}
          </div>

          {/* Fila 5: Control de Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-400" />
                {isEditing ? 'Stock Actual' : 'Stock Inicial'} ({unitType})
              </label>
              <input
                type="number"
                step={isWeighable ? '0.001' : '1'}
                disabled={isEditing}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1.5 w-full px-3.5 py-2 text-sm rounded-xl bg-slate-950 text-white font-mono border border-slate-800 disabled:opacity-60 focus:border-emerald-500 outline-none"
              />
              {isEditing && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Para modificar el stock de un producto existente, usa la sección de Inventario / Ajuste.
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Stock Mínimo de Alerta ({unitType})
              </label>
              <input
                type="number"
                step={isWeighable ? '0.001' : '1'}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="5"
                className="mt-1.5 w-full px-3.5 py-2 text-sm rounded-xl bg-slate-950 text-white font-mono border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Fila 6: Estado Activo/Inactivo (si es edición) */}
          {isEditing && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Producto Activo para Venta</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {active ? 'Activo en Góndola' : 'Desactivado'}
              </button>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
