'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Package,
  Wrench,
  Calculator,
  Printer,
  Save,
  CheckCircle2,
  TrendingUp,
  EyeOff,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Clock,
} from 'lucide-react';
import { InventoryItem, OrderSpare, ServiceOrder, UserProfile } from '@/types';
import {
  fetchOrderSpares,
  assignSpareToOrder,
  returnSpareToInventory,
} from '@/lib/supabase/services';

export interface BudgetItem {
  id: string;
  inventory_item_id?: string;
  spare_id?: string;
  description: string;
  unit_cost: number;
  unit_price: number;
  quantity: number;
  status?: 'reserved' | 'consumed' | 'returned';
}

interface BudgetCalculatorProps {
  order?: ServiceOrder;
  user?: UserProfile;
  availableInventory?: InventoryItem[];
  inventory?: InventoryItem[];
  onApplyBudget?: (cost: number, price: number) => void;
  onSaveBudget?: (
    totalLabor: number,
    totalParts: number,
    finalPrice: number,
    items: BudgetItem[]
  ) => void;
}

export function BudgetCalculator({
  order,
  user,
  availableInventory,
  inventory,
  onApplyBudget,
  onSaveBudget,
}: BudgetCalculatorProps) {
  const inventoryList = availableInventory || inventory || [];

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [loadingSpares, setLoadingSpares] = useState<boolean>(false);
  const [assigningSpare, setAssigningSpare] = useState<boolean>(false);

  useEffect(() => {
    async function loadSpares() {
      if (!order?.id) return;
      setLoadingSpares(true);
      try {
        const dbSpares = await fetchOrderSpares(order.id);
        const mappedItems: BudgetItem[] = dbSpares
          .filter((s) => s.status !== 'returned')
          .map((s) => ({
            id: s.id,
            spare_id: s.id,
            inventory_item_id: s.inventory_item_id,
            description: `${s.name} ${s.sku ? `(${s.sku})` : ''}`,
            unit_cost: Number(s.unit_cost) || 0,
            unit_price: Number(s.unit_price) || 0,
            quantity: s.quantity || 1,
            status: s.status,
          }));
        setItems(mappedItems);
      } catch (err) {
        console.error('Error al cargar repuestos en custodia:', err);
      } finally {
        setLoadingSpares(false);
      }
    }
    loadSpares();
  }, [order?.id]);

  const [errorMsg, setErrorMsg] = useState<string>('');

  const totalPartsCost = items.reduce(
    (sum, item) => sum + item.unit_cost * item.quantity,
    0
  );
  const totalPartsPrice = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const subtotal = totalPartsPrice + laborCost;
  const finalPrice = Math.max(0, subtotal - discount);

  const handleAddInventoryItem = async () => {
    setErrorMsg('');
    if (!selectedInventoryId) return;

    const invItem = inventoryList.find((i) => i.id === selectedInventoryId);
    if (!invItem) return;

    if (invItem.stock <= 0) {
      setErrorMsg(`El repuesto "${invItem.name}" no tiene unidades disponibles en stock.`);
      return;
    }

    setAssigningSpare(true);
    try {
      if (order?.id) {
        // Guardar repuesto reservado en custodia en la base de datos real
        const assigned = await assignSpareToOrder({
          order_id: order.id,
          device_id: order.device_id,
          inventory_item_id: invItem.id,
          quantity: 1,
        });

        if (assigned) {
          const newItem: BudgetItem = {
            id: assigned.id,
            spare_id: assigned.id,
            inventory_item_id: invItem.id,
            description: `${invItem.name} (${invItem.sku})`,
            unit_cost: invItem.cost || 0,
            unit_price: invItem.price || 0,
            quantity: 1,
            status: 'reserved',
          };
          setItems((prev) => [...prev, newItem]);
        }
      } else {
        const newItem: BudgetItem = {
          id: `b_${Date.now()}`,
          inventory_item_id: invItem.id,
          description: invItem.name,
          unit_cost: invItem.cost || 0,
          unit_price: invItem.price || 0,
          quantity: 1,
          status: 'reserved',
        };
        setItems((prev) => [...prev, newItem]);
      }
      setSelectedInventoryId('');
    } catch (err: any) {
      console.error('Error al asignar repuesto:', err);
      setErrorMsg(err.message || 'Error al asignar repuesto.');
    } finally {
      setAssigningSpare(false);
    }
  };

  const handleAddCustomItem = () => {
    const desc = prompt('Descripción del repuesto o insumo personalizado:');
    if (!desc) return;
    const priceStr = prompt('Precio de venta al público ($ ARS):', '15000');
    if (!priceStr) return;

    const price = parseFloat(priceStr) || 0;

    const newItem: BudgetItem = {
      id: `b_${Date.now()}`,
      description: desc.trim(),
      unit_cost: price * 0.5,
      unit_price: price,
      quantity: 1,
      status: 'reserved',
    };

    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = async (targetItem: BudgetItem) => {
    if (targetItem.spare_id) {
      try {
        await returnSpareToInventory(targetItem.spare_id);
      } catch (err) {
        console.error('Error al devolver repuesto a inventario:', err);
      }
    }
    setItems((prev) => prev.filter((i) => i.id !== targetItem.id));
  };

  const handleQuantityChange = (itemId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i
      )
    );
  };

  const handleSave = () => {
    if (onApplyBudget) {
      onApplyBudget(totalPartsCost, finalPrice);
    }
    if (onSaveBudget) {
      onSaveBudget(laborCost, totalPartsPrice, finalPrice, items);
    }
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-6 text-xs font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-outline-variant/50 pb-4">
        <div>
          <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Presupuestador & Repuestos de Reparación
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Carga de repuestos de inventario, mano de obra y cálculo de precio final.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-surface-bright border border-outline-variant hover:bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-title-sm text-on-surface flex items-center gap-2 transition-colors font-bold self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-primary" /> Imprimir Cotización
        </button>
      </div>

      {/* Selector de Repuestos del Inventario */}
      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-4 space-y-3">
        <label className="block font-bold text-on-surface-variant uppercase text-[11px]">
          1. Agregar Repuesto de Inventario (Descuenta Stock Automáticamente)
        </label>
        
        {errorMsg && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-xs flex items-center gap-2">
            <span className="font-bold">¡Atención!</span> {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedInventoryId}
            onChange={(e) => {
              setSelectedInventoryId(e.target.value);
              setErrorMsg('');
            }}
            className="flex-1 bg-surface-container border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface"
          >
            <option value="">-- Seleccionar repuesto de inventario --</option>
            {inventoryList.map((item) => {
              const isOutOfStock = (item.stock || 0) <= 0;
              const isLowStock = !isOutOfStock && (item.stock || 0) <= (item.min_stock || 2);
              
              const stockLabel = isOutOfStock
                ? `[AGOTADO - 0 u.]`
                : isLowStock
                ? `⚠️ POCO STOCK (${item.stock} u.)`
                : `Stock: ${item.stock} u.`;

              return (
                <option key={item.id} value={item.id} disabled={isOutOfStock}>
                  {item.name} ({item.category}) — {stockLabel} — Venta: ${item.price.toLocaleString('es-AR')}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            disabled={assigningSpare}
            onClick={handleAddInventoryItem}
            className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary-container transition-all"
          >
            {assigningSpare ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Agregar Repuesto</span>
          </button>
        </div>
      </div>

      {/* Lista de Repuestos Involucrados */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block font-bold text-on-surface-variant uppercase text-[11px]">
            Repuestos e Insumos Involucrados ({items.length})
          </label>
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Repuesto Personalizado
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
            No se han agregado repuestos aún a este presupuesto.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/60 gap-2"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <div className="font-bold text-on-surface flex items-center gap-2 flex-wrap">
                      <span>{item.description}</span>
                      {item.status === 'consumed' ? (
                        <span className="font-label-caps text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Consumido (Entregado)
                        </span>
                      ) : (
                        <span className="font-label-caps text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Almacenado en Equipo (En Custodia)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                      Costo: ${item.unit_cost.toLocaleString('es-AR')} • Venta: ${item.unit_price.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[11px]">Cant:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 bg-surface-container border border-outline-variant rounded p-1 text-center font-mono font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error/20 rounded-lg border border-error/30 transition-colors"
                    title="Devolver repuesto al stock de inventario"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Devolver a Inventario
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mano de Obra y Totales */}
      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-on-surface-variant uppercase text-[11px] mb-1">
              Mano de Obra ($ ARS)
            </label>
            <input
              type="number"
              value={laborCost || ''}
              onChange={(e) => setLaborCost(Number(e.target.value))}
              placeholder="Ej: 15000"
              className="w-full bg-surface-container border border-outline-variant rounded-xl p-2.5 font-mono font-bold text-on-surface"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase text-[11px] mb-1">
              Descuento Especial ($ ARS)
            </label>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="Ej: 0"
              className="w-full bg-surface-container border border-outline-variant rounded-xl p-2.5 font-mono font-bold text-on-surface"
            />
          </div>
        </div>

        {/* Resumen Total */}
        <div className="flex justify-between items-center bg-primary/10 border border-primary/30 p-4 rounded-xl">
          <div>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider">PRECIO FINAL CLIENTE</span>
            <div className="text-xl font-extrabold text-primary font-mono">
              ${finalPrice.toLocaleString('es-AR')}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold px-6 py-3 rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Aplicar al Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
}
