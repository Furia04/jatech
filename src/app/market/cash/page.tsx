'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  Plus,
  History,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Clock,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { MarketCashShift, MarketCashMovement, CashMovementType } from '@/types/market';
import {
  getActiveLocalShift,
  openLocalShift,
  closeLocalShift,
  recordLocalCashMovement,
  getLocalCashMovements,
  getLocalShifts,
} from '@/lib/market-store/local-market-adapter';
import { OpenShiftModal } from '@/components/cash/open-shift-modal';
import { CashMovementModal } from '@/components/cash/cash-movement-modal';
import { CloseShiftModal } from '@/components/cash/close-shift-modal';

export default function CashPage() {
  const [activeShift, setActiveShift] = useState<MarketCashShift | null>(null);
  const [movements, setMovements] = useState<MarketCashMovement[]>([]);
  const [pastShifts, setPastShifts] = useState<MarketCashShift[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  function loadCashData() {
    try {
      const current = getActiveLocalShift();
      setActiveShift(current);
      if (current) {
        setMovements(getLocalCashMovements(current.id));
      } else {
        setMovements([]);
      }
      const allShifts = getLocalShifts();
      setPastShifts(allShifts.filter((s) => s.status === 'closed'));
    } catch (err) {
      console.error('Error loading cash data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCashData();
  }, []);

  async function handleOpenShift(initialCash: number, notes?: string) {
    openLocalShift({ initial_cash: initialCash, notes });
    loadCashData();
  }

  async function handleCloseShift(actualCash: number, notes?: string) {
    if (!activeShift) return;
    closeLocalShift({ shift_id: activeShift.id, actual_cash: actualCash, notes });
    loadCashData();
  }

  async function handleRecordMovement(type: CashMovementType, amount: number, reason: string) {
    if (!activeShift) return;
    recordLocalCashMovement({
      shift_id: activeShift.id,
      type,
      amount,
      reason,
    });
    loadCashData();
  }

  // Cálculos de movimientos del turno activo
  const totalIncomes = movements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const totalWithdrawals = movements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Módulo Financiero
              </span>
              <span className="text-xs text-slate-500 font-mono">Sesión Local Activa</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Wallet className="w-7 h-7 text-emerald-400" />
              Gestión de Cajas y Turnos
            </h1>
            <p className="text-sm text-slate-400">
              Control de apertura de turno, fondos de gaveta, movimientos manuales y Arqueo Z
            </p>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center gap-3">
            {activeShift ? (
              <>
                <button
                  onClick={() => setIsMovementModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Ingreso / Retiro</span>
                </button>
                <button
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cierre Z y Arqueo</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Turno de Caja</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado de la Caja */}
        {activeShift ? (
          <div className="space-y-6">
            {/* Banner de Turno Abierto */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Unlock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">Turno de Caja Abierto</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      EN OPERACIÓN
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Abierto: {new Date(activeShift.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>Cajero: {activeShift.cashier?.full_name || 'Cajero Principal'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">ID de Turno</span>
                <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {activeShift.id}
                </span>
              </div>
            </div>

            {/* Tarjetas KPI Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fondo Inicial */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">Fondo Inicial</span>
                <div className="mt-2 text-2xl font-bold font-mono text-white">
                  ${(Number(activeShift.initial_cash) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1">Base al iniciar turno</span>
              </div>

              {/* Ventas Registradas */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">Ventas en el Turno</span>
                <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                  ${(Number(activeShift.total_sales_amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1">Facturación total acumulada</span>
              </div>

              {/* Movimientos Manuales */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">Movimientos Manuales</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xs font-mono text-emerald-400">
                    +${totalIncomes.toLocaleString('es-AR')}
                  </span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs font-mono text-amber-400">
                    -${totalWithdrawals.toLocaleString('es-AR')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1">
                  Neto: ${(totalIncomes - totalWithdrawals).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Efectivo Esperado en Gaveta */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between">
                <span className="text-xs font-medium text-emerald-400">Efectivo Teórico en Gaveta</span>
                <div className="mt-2 text-2xl font-bold font-mono text-white">
                  ${(Number(activeShift.expected_cash) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-400/70 mt-1">Dinero físico que debe haber</span>
              </div>
            </div>

            {/* Tabla de Movimientos del Turno Actual */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Movimientos Manuales del Turno Actual
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  {movements.length} registro{movements.length !== 1 ? 's' : ''}
                </span>
              </div>

              {movements.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay ingresos ni retiros manuales registrados en este turno.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Hora</th>
                        <th className="py-2.5 px-4">Tipo</th>
                        <th className="py-2.5 px-4">Monto</th>
                        <th className="py-2.5 px-4">Motivo / Concepto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {new Date(m.created_at).toLocaleTimeString('es-AR')}
                          </td>
                          <td className="py-3 px-4">
                            {m.type === 'income' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                Ingreso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Retiro
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            ${(Number(m.amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{m.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Estado Caja Cerrada */
          <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No hay turno de caja abierto</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Para comenzar a emitir ventas y cobrar en el Punto de Venta (POS), debes iniciar un turno con fondo inicial.
              </p>
            </div>
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/25 transition-all inline-flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Turno Ahora</span>
            </button>
          </div>
        )}

        {/* Historial de Turnos Cerrados */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Historial de Turnos Anteriores (Cierres Z)
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {pastShifts.length} turno{pastShifts.length !== 1 ? 's' : ''} auditado{pastShifts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {pastShifts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Aún no hay turnos cerrados en el historial local.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Fecha / Horario</th>
                    <th className="py-2.5 px-4">Cajero</th>
                    <th className="py-2.5 px-4">Fondo Inicial</th>
                    <th className="py-2.5 px-4">Total Ventas</th>
                    <th className="py-2.5 px-4">Esperado</th>
                    <th className="py-2.5 px-4">Contado Físico</th>
                    <th className="py-2.5 px-4">Diferencia</th>
                    <th className="py-2.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pastShifts.map((s) => {
                    const diff = Number(s.difference) || 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          <div>{new Date(s.opened_at).toLocaleDateString('es-AR')}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(s.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {s.closed_at ? new Date(s.closed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-300">
                          {s.cashier?.full_name || 'Cajero Principal'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          ${(Number(s.initial_cash) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-400">
                          ${(Number(s.total_sales_amount) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          ${(Number(s.expected_cash) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-white">
                          ${(Number(s.actual_cash) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold">
                          {diff === 0 ? (
                            <span className="text-emerald-400">$0.00</span>
                          ) : diff > 0 ? (
                            <span className="text-sky-400">+${diff.toLocaleString('es-AR')}</span>
                          ) : (
                            <span className="text-rose-400">-${Math.abs(diff).toLocaleString('es-AR')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            Cerrado Z
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modales */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onConfirm={handleOpenShift}
      />

      {activeShift && (
        <>
          <CashMovementModal
            isOpen={isMovementModalOpen}
            shiftId={activeShift.id}
            onClose={() => setIsMovementModalOpen(false)}
            onConfirm={handleRecordMovement}
          />
          <CloseShiftModal
            isOpen={isCloseShiftModalOpen}
            shift={activeShift}
            onClose={() => setIsCloseShiftModalOpen(false)}
            onConfirm={handleCloseShift}
          />
        </>
      )}
    </div>
  );
}
