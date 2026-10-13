'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode,
  Layers,
  Sparkles,
  Wallet,
  AlertTriangle,
  Lock,
  ArrowRight,
  Package,
  Scale,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { MarketProduct, MarketCashShift, MarketSale, MarketPaymentMethod } from '@/types/market';
import {
  getActiveLocalShift,
  getLocalProducts,
  getLocalCategories,
  createLocalSale,
} from '@/lib/market-store/local-market-adapter';
import { POSSearch } from '@/components/pos/pos-search';
import { POSCart, CartItem } from '@/components/pos/pos-cart';
import { PaymentModal } from '@/components/pos/payment-modal';
import { ThermalTicketModal } from '@/components/tickets/thermal-ticket-modal';

export default function POSPage() {
  const [activeShift, setActiveShift] = useState<MarketCashShift | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickProducts, setQuickProducts] = useState<MarketProduct[]>([]);

  // Modales
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<MarketSale | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Carga inicial de datos
  function loadInitialData() {
    const shift = getActiveLocalShift();
    setActiveShift(shift);

    const cats = getLocalCategories();
    setCategories(cats);

    const prods = getLocalProducts({ activeOnly: true });
    setQuickProducts(prods);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // Agregar producto al carrito
  const handleAddProduct = useCallback((product: MarketProduct, quantityToAdd: number = 1) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        const item = next[existingIdx];
        const newQty = item.quantity + quantityToAdd;
        next[existingIdx] = {
          ...item,
          quantity: newQty,
          totalPrice: newQty * item.unitPrice,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: quantityToAdd,
            unitPrice: Number(product.sale_price) || 0,
            totalPrice: quantityToAdd * (Number(product.sale_price) || 0),
          },
        ];
      }
    });
  }, []);

  // Modificar cantidad en el carrito
  const handleUpdateQuantity = useCallback((productId: string, newQty: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Quitar producto del carrito
  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Limpiar carrito
  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Atajos globales de teclado [F2, F4, Escape]
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0 && !isPaymentModalOpen) {
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isSearchModalOpen) {
          setIsSearchModalOpen(false);
        } else if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
        } else if (isTicketModalOpen) {
          setIsTicketModalOpen(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isSearchModalOpen, isPaymentModalOpen, isTicketModalOpen]);

  // Confirmar cobro y registrar venta
  async function handleConfirmSale(
    method: MarketPaymentMethod,
    amountPaid: number,
    changeReturned: number,
    paymentDetails?: Record<string, any>
  ) {
    if (cartItems.length === 0) return;

    const sale = createLocalSale({
      shift_id: activeShift?.id || null,
      payment_method: method,
      amount_paid: amountPaid,
      change_returned: changeReturned,
      payment_details: paymentDetails,
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        barcode: item.product.barcode,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })),
    });

    // Limpiar carrito, recargar estado y abrir ticket
    setCartItems([]);
    setCompletedSale(sale);
    setIsTicketModalOpen(true);
    loadInitialData();
  }

  const totalCart = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Filtrado de productos del catálogo rápido
  const filteredQuickProducts =
    selectedCategory === 'all'
      ? quickProducts
      : quickProducts.filter((p) => p.category_id === selectedCategory);

  return (
    <div className="p-4 md:p-8 space-y-4">
        {/* Barra Superior de Estado y Atajos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Punto de Venta (POS)</h1>
                {activeShift ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    TURNO ACTIVO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    CAJA CERRADA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Terminal de cobro de alta velocidad con lector continuo</p>
            </div>
          </div>

          {/* Atajos de Teclado Informativos */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">F2</kbd>
              <span>Buscar</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">F4</kbd>
              <span>Cobrar</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">Esc</kbd>
              <span>Limpiar</span>
            </span>
          </div>
        </div>

        {/* Alerta si la caja está cerrada */}
        {!activeShift && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Aviso:</strong> No has abierto un turno de caja hoy. Las ventas se registrarán sin turno asignado.
              </span>
            </div>
            <Link
              href="/market/cash"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Abrir Turno en Caja
            </Link>
          </div>
        )}

        {/* Barra de Búsqueda y Escáner Continuo */}
        <POSSearch
          onAddProduct={handleAddProduct}
          isSearchModalOpen={isSearchModalOpen}
          setIsSearchModalOpen={setIsSearchModalOpen}
        />

        {/* Layout Principal Dividido: Catálogo Táctil / Carrito de Cobro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Columna Izquierda: Grid de Productos Frecuentes / Táctiles (7 columnas) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Filtro de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos ({quickProducts.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Grid de Productos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto p-1">
              {filteredQuickProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddProduct(p, 1)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800/80 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span className="truncate max-w-[80px]">{p.brand || 'General'}</span>
                      {p.is_weighable && (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Scale className="w-3 h-3" />
                          Kg
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xs text-white line-clamp-2 group-hover:text-emerald-300 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Stock: {p.stock}</span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      ${(Number(p.sale_price) || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Carrito Táctico y Pasarela (5 columnas) */}
          <div className="lg:col-span-5 h-[620px]">
            <POSCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onOpenCheckout={() => setIsPaymentModalOpen(true)}
            />
          </div>
        </div>

      {/* Modal de Cobro Multimedio */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        totalAmount={totalCart}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmSale}
      />

      {/* Modal de Ticket Térmico */}
      <ThermalTicketModal
        isOpen={isTicketModalOpen}
        sale={completedSale}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </div>
  );
}
