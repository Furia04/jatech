'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PartOrder } from '@/types';
import { Plus, Search, MessageCircle, PackageOpen, CheckCircle, Clock } from 'lucide-react';

export default function PartOrdersPage() {
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    part_name: '',
    device_model: '',
    advance_payment: 0,
    expected_price: 0,
    notes: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Intentar obtener el shop_id actual
      const { data: userData } = await supabase.from('users').select('shop_id').eq('id', session.user.id).single();
      const currentShopId = userData?.shop_id || session.user.id;
      setShopId(currentShopId);

      const { data } = await supabase
        .from('part_orders')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });
        
      if (data) {
        setOrders(data as PartOrder[]);
      }
    } catch (error) {
      console.error('Error fetching part orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    try {
      const { data, error } = await supabase
        .from('part_orders')
        .insert([{
          ...newOrder,
          shop_id: shopId,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setOrders([data as PartOrder, ...orders]);
      setIsModalOpen(false);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        part_name: '',
        device_model: '',
        advance_payment: 0,
        expected_price: 0,
        notes: '',
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Hubo un error al crear el pedido.');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('part_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('No se pudo actualizar el estado.');
    }
  };

  const notifyViaWhatsApp = (order: PartOrder) => {
    // Formatear el número de teléfono
    let phone = order.customer_phone.replace(/\D/g, '');
    if (!phone.startsWith('549')) {
      if (phone.startsWith('11') || phone.length === 10) {
        phone = '549' + phone;
      }
    }

    const message = `Hola ${order.customer_name}, te avisamos que el repuesto que encargaste (*${order.part_name}*) ya llegó a nuestro taller y está listo. ¡Te esperamos!`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-on-surface">Pedidos de Repuestos</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gestiona repuestos encargados y notifica a tus clientes cuando lleguen.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Encargo
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/50">
              <tr>
                <th className="p-4 font-semibold text-on-surface-variant">Cliente</th>
                <th className="p-4 font-semibold text-on-surface-variant">Repuesto / Equipo</th>
                <th className="p-4 font-semibold text-on-surface-variant">Finanzas</th>
                <th className="p-4 font-semibold text-on-surface-variant">Estado</th>
                <th className="p-4 font-semibold text-right text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    No hay pedidos registrados aún.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">{order.customer_name}</div>
                      <div className="text-xs text-on-surface-variant">{order.customer_phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">{order.part_name}</div>
                      <div className="text-xs text-on-surface-variant">{order.device_model || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">Seña: <span className="font-mono text-emerald-400">${order.advance_payment}</span></div>
                      <div className="text-xs text-on-surface-variant">Total est.: <span className="font-mono">${order.expected_price}</span></div>
                    </td>
                    <td className="p-4">
                      {order.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Encargado
                        </span>
                      )}
                      {order.status === 'arrived' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <PackageOpen className="w-3.5 h-3.5" /> Ya Llegó
                        </span>
                      )}
                      {order.status === 'delivered' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Entregado
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex flex-col gap-2 justify-end items-end">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'arrived')}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          Marcar como Llegó
                        </button>
                      )}
                      
                      {order.status === 'arrived' && (
                        <>
                          <button
                            onClick={() => notifyViaWhatsApp(order)}
                            className="px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#25D366]/20"
                          >
                            <MessageCircle className="w-4 h-4" /> Avisar Cliente
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400"
                          >
                            Marcar Entregado
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface">Registrar Nuevo Pedido</h2>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cliente</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={newOrder.customer_phone}
                    onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="ej. 1122334455"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Repuesto / Pieza</label>
                  <input
                    type="text"
                    required
                    value={newOrder.part_name}
                    onChange={(e) => setNewOrder({...newOrder, part_name: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="ej. Pantalla Módulo"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Modelo Equipo</label>
                  <input
                    type="text"
                    value={newOrder.device_model}
                    onChange={(e) => setNewOrder({...newOrder, device_model: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="ej. Moto G20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Seña Dejada ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOrder.advance_payment}
                    onChange={(e) => setNewOrder({...newOrder, advance_payment: Number(e.target.value)})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Precio Estimado ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOrder.expected_price}
                    onChange={(e) => setNewOrder({...newOrder, expected_price: Number(e.target.value)})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Notas Adicionales</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                  rows={2}
                  placeholder="Proveedor, color de tapa, etc."
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
