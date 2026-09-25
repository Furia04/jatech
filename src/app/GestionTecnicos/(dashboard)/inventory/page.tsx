'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Filter,
  Plus,
  Edit,
  EyeOff,
  Battery,
  Smartphone,
  Shield,
  Usb,
  Loader2,
  X,
  Save,
  FolderOpen,
  MinusCircle,
  PlusCircle,
  Trash2,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { InventoryItem, UserProfile } from '@/types';
import { hasFinancialAccess } from '@/lib/permissions';
import {
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  updateInventoryStock,
  deleteInventoryItem,
  getCurrentUserProfile,
} from '@/lib/supabase/services';

const DEFAULT_CATEGORIES = ['Pantallas', 'Baterías', 'Puertos', 'Accesorios', 'Placas / IC', 'Cámaras', 'Flex / Botones'];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Categorías personalizadas (guardadas localmente)
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryModalError, setCategoryModalError] = useState('');

  // Estado para Modal de Alta de Repuesto
  const [showAddModal, setShowAddModal] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantallas');
  const [customCategory, setCustomCategory] = useState('');
  const [stock, setStock] = useState<number>(5);
  const [minStock, setMinStock] = useState<number>(2);
  const [cost, setCost] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  // Estado para Modal de Edición de Repuesto
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Pantallas');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editStock, setEditStock] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(2);
  const [editCost, setEditCost] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Estado para Modal de Eliminación de Repuesto
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, items] = await Promise.all([
        getCurrentUserProfile(),
        fetchInventory(),
      ]);
      setUserProfile(profile);
      setInventory(items || []);
    } catch (err) {
      console.error('Error al cargar inventario de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    try {
      const saved = localStorage.getItem('jatech_inventory_categories');
      if (saved) {
        setCustomCategories(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error al cargar categorías personalizadas:', e);
    }
  }, []);

  const saveNewCategory = (cat: string) => {
    const clean = cat.trim();
    if (!clean) return;
    if (!allCategories.includes(clean)) {
      const updated = Array.from(new Set([...customCategories, clean]));
      setCustomCategories(updated);
      try {
        localStorage.setItem('jatech_inventory_categories', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error guardando categoría:', e);
      }
    }
  };

  const canSeeMoney = userProfile ? hasFinancialAccess(userProfile) : true;

  // CÁLCULOS EN TIEMPO REAL DESDE LA BASE DE DATOS DEL TENANT
  const totalStockUnits = inventory.reduce((acc, item) => acc + (item.stock || 0), 0);
  const totalReservedUnits = inventory.reduce((acc, item) => acc + (item.reserved_stock || 0), 0);
  const lowStockCount = inventory.filter((i) => i.stock <= i.min_stock).length;
  const totalCostValue = inventory.reduce((acc, item) => acc + (item.cost || 0) * (item.stock || 0), 0);
  const totalPotentialProfit = inventory.reduce(
    (acc, item) => acc + (item.price - (item.cost || 0)) * (item.stock || 0),
    0
  );

  const allCategories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...customCategories,
      ...inventory.map((i) => i.category).filter(Boolean),
    ])
  );

  const filteredItems = inventory.filter((i) => {
    const matchesCat = categoryFilter === 'all' ? true : i.category === categoryFilter;
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) {
      setCategoryModalError('Ingresa un nombre para la categoría.');
      return;
    }
    const cleanCat = newCategoryInput.trim();
    saveNewCategory(cleanCat);
    setNewCategoryInput('');
    setCategoryModalError('');
    setShowCategoryModal(false);
    setCategoryFilter(cleanCat);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setModalError('SKU y Nombre del repuesto son obligatorios.');
      return;
    }

    const finalCategory = category === '__NEW__' ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setModalError('Por favor selecciona o escribe una categoría válida.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const newItem = await createInventoryItem({
        sku: sku.trim(),
        name: name.trim(),
        category: finalCategory,
        stock: Number(stock) || 0,
        min_stock: Number(minStock) || 0,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
      });

      if (category === '__NEW__') {
        saveNewCategory(finalCategory);
      }

      setInventory((prev) => [...prev, newItem]);
      setSku('');
      setName('');
      setCategory('Pantallas');
      setCustomCategory('');
      setStock(5);
      setMinStock(2);
      setCost(0);
      setPrice(0);
      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar repuesto en Supabase');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setEditSku(item.sku);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditCustomCategory('');
    setEditStock(item.stock);
    setEditMinStock(item.min_stock);
    setEditCost(item.cost || 0);
    setEditPrice(item.price || 0);
    setEditModalError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;

    if (!editName.trim() || !editSku.trim()) {
      setEditModalError('SKU y Nombre del repuesto son obligatorios.');
      return;
    }

    const finalCategory = editCategory === '__NEW__' ? editCustomCategory.trim() : editCategory.trim();
    if (!finalCategory) {
      setEditModalError('Por favor selecciona o escribe una categoría.');
      return;
    }

    setEditModalLoading(true);
    setEditModalError('');

    try {
      const updatedItem = await updateInventoryItem(itemToEdit.id, {
        sku: editSku.trim(),
        name: editName.trim(),
        category: finalCategory,
        stock: Number(editStock) || 0,
        min_stock: Number(editMinStock) || 0,
        cost: Number(editCost) || 0,
        price: Number(editPrice) || 0,
      });

      if (editCategory === '__NEW__') {
        saveNewCategory(finalCategory);
      }

      setInventory((prev) => prev.map((i) => (i.id === itemToEdit.id ? updatedItem : i)));
      setItemToEdit(null);
    } catch (err: any) {
      setEditModalError(err.message || 'Error al actualizar repuesto en Supabase');
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleAdjustStock = async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    setStockUpdatingId(item.id);
    try {
      const success = await updateInventoryStock(item.id, newStock);
      if (success) {
        setInventory((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
        );
      }
    } catch (err) {
      console.error('Error al actualizar stock:', err);
    } finally {
      setStockUpdatingId(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteInventoryItem(itemToDelete.id);
      setInventory((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar repuesto de la base de datos.');
    } finally {
      setDeleting(false);
    }
  };

  const renderCategoryIcon = (catName: string) => {
    switch (catName) {
      case 'Pantallas':
        return <Smartphone className="w-3.5 h-3.5 text-primary" />;
      case 'Baterías':
        return <Battery className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Puertos':
        return <Usb className="w-3.5 h-3.5 text-amber-400" />;
      case 'Accesorios':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" /> Gestión de Inventario
          </h2>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Control de repuestos, categorías personalizadas, alertas de stock mínimo y rentabilidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-title-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            title="Crear nueva categoría de repuestos"
          >
            <FolderPlus className="w-4 h-4 text-primary" /> + Nueva Categoría
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar Repuesto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs">Cargando inventario real de Supabase...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas Bento de Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  UNIDADES EN STOCK
                </span>
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="font-display-lg text-3xl font-bold text-on-surface font-mono-data">
                  {totalStockUnits}
                </div>
                {totalReservedUnits > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Repuestos instalados en equipos pendientes de entrega">
                    +{totalReservedUnits} en taller
                  </span>
                )}
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant mt-1">
                {inventory.length} repuestos ({totalStockUnits} disps. / {totalReservedUnits} reserv.)
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-error uppercase font-semibold">
                  BAJO STOCK (ALERTAS)
                </span>
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div className="font-display-lg text-3xl font-bold text-error font-mono-data mt-2">
                {lowStockCount}
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant mt-1">
                Requieren reorden urgente
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-tertiary uppercase font-semibold">
                  VALOR (COSTO COMPRA)
                </span>
                <DollarSign className="w-5 h-5 text-tertiary" />
              </div>
              {canSeeMoney ? (
                <>
                  <div className="font-display-lg text-3xl font-bold text-on-surface font-mono-data mt-2">
                    ${totalCostValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant mt-1">
                    Inversión total en repuestos
                  </div>
                </>
              ) : (
                <>
                  <div className="font-display-lg text-2xl text-on-surface-variant/40 flex items-center gap-2 mt-2">
                    <EyeOff className="w-5 h-5" /> ****
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant/60 italic mt-1">
                    Restringido para técnicos
                  </div>
                </>
              )}
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-emerald-400 uppercase font-semibold">
                  GANANCIA POTENCIAL
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              {canSeeMoney ? (
                <>
                  <div className="font-display-lg text-3xl font-bold text-emerald-400 font-mono-data mt-2">
                    ${totalPotentialProfit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant mt-1">
                    Margen estimado de venta al público
                  </div>
                </>
              ) : (
                <>
                  <div className="font-display-lg text-2xl text-on-surface-variant/40 flex items-center gap-2 mt-2">
                    <EyeOff className="w-5 h-5" /> ****
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant/60 italic mt-1">
                    Restringido para técnicos
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabla de Inventario */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-xl flex flex-col">
            {/* Buscador y Filtros por Categoría */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por SKU, repuesto o categoría..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 pl-10 pr-4 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-title-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  Todas ({inventory.length})
                </button>
                {allCategories.map((cat) => {
                  const count = inventory.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-title-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        categoryFilter === cat
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {cat} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabla */}
            {filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <FolderOpen className="w-12 h-12 text-on-surface-variant mx-auto opacity-50" />
                <h3 className="font-title-sm text-base font-bold text-on-surface">No hay repuestos registrados</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  {searchQuery ? 'No se encontraron repuestos con tu filtro de búsqueda.' : 'Registra tus insumos y repuestos para llevar control de stock.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-xl text-xs font-bold shadow transition-all mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrar Primer Repuesto
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="bg-surface-container-highest border-b border-outline-variant font-label-caps text-on-surface-variant uppercase">
                    <tr>
                      <th className="p-4">SKU / Código</th>
                      <th className="p-4">Nombre del Repuesto</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-center">Stock Disponible</th>
                      <th className="p-4 text-center">En Equipos (Taller)</th>
                      <th className="p-4">Costo Compra</th>
                      <th className="p-4">Precio Venta</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 font-mono-data">
                    {filteredItems.map((item) => {
                      const isLow = item.stock <= item.min_stock;
                      const isUpdating = stockUpdatingId === item.id;
                      const reservedCount = item.reserved_stock || 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-surface-container-high transition-colors ${
                            isLow ? 'bg-error/5' : ''
                          }`}
                        >
                          <td className="p-4 font-mono font-bold text-primary text-xs">
                            {item.sku}
                          </td>
                          <td className="p-4 font-sans font-bold text-on-surface text-sm">
                            {item.name}
                          </td>
                          <td className="p-4 font-sans">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-bright border border-outline-variant/40 font-title-sm text-[11px] font-bold text-on-surface-variant">
                              {renderCategoryIcon(item.category)}
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                disabled={isUpdating || item.stock <= 0}
                                onClick={() => handleAdjustStock(item, -1)}
                                className="p-1 text-on-surface-variant hover:text-error hover:bg-surface-container-highest rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                title="Descontar 1 unidad"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>

                              <span
                                className={`font-mono font-bold text-sm min-w-[28px] text-center px-2 py-0.5 rounded-lg ${
                                  isLow ? 'bg-error/20 text-error border border-error/30' : 'bg-surface-container-lowest text-on-surface'
                                }`}
                              >
                                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-primary" /> : item.stock}
                              </span>

                              <button
                                disabled={isUpdating}
                                onClick={() => handleAdjustStock(item, 1)}
                                className="p-1 text-on-surface-variant hover:text-emerald-400 hover:bg-surface-container-highest rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                title="Agregar 1 unidad"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              {isLow && (
                                <span title="¡Stock bajo! Requiere reorden" className="ml-1">
                                  <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {reservedCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans" title="Unidades instaladas en equipos en proceso de reparación">
                                🟡 {reservedCount} un. en custodia
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/40 text-xs">0</span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-on-surface-variant">
                            {canSeeMoney ? `$${(item.cost || 0).toLocaleString('es-AR')}` : '--'}
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                            ${item.price.toLocaleString('es-AR')}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botón Editar Repuesto */}
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar repuesto"
                              >
                                <Edit className="w-4 h-4 text-primary" />
                              </button>

                              {/* Botón Eliminar Repuesto */}
                              <button
                                onClick={() => {
                                  setDeleteError('');
                                  setItemToDelete(item);
                                }}
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar repuesto del inventario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DE AÑADIR NUEVA CATEGORÍA */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" /> Añadir Categoría
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {categoryModalError && (
              <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold">
                {categoryModalError}
              </div>
            )}

            <div>
              <label className="block font-bold text-on-surface-variant uppercase text-xs mb-1">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Ej: Cámaras, Carcasas, Placas Madre..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow hover:bg-primary-container cursor-pointer"
              >
                <Save className="w-4 h-4" /> Guardar Categoría
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE ALTA DE REPUESTO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateItem}
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Agregar Repuesto
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {modalError && (
              <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold">
                {modalError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ej: SCR-IP13-01"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-bold"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__">➕ Otra Categoría (Crear nueva)</option>
                  </select>
                </div>
              </div>

              {category === '__NEW__' && (
                <div>
                  <label className="block font-bold text-primary uppercase mb-1">
                    Nueva Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Escribe el nombre de la nueva categoría"
                    className="w-full bg-surface-container-lowest border border-primary rounded-xl p-2.5 text-xs text-on-surface font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Nombre del Repuesto / Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Módulo Display OLED iPhone 13 Pro"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Stock Mínimo (Alerta) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Costo Compra ($ ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    placeholder="Ej: 15000"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Precio Venta ($ ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="Ej: 35000"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={modalLoading}
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalLoading ? 'Guardando...' : 'Guardar Repuesto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE REPUESTO */}
      {itemToEdit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
                <Edit className="w-5 h-5" /> Editar Repuesto
              </h3>
              <button
                type="button"
                onClick={() => setItemToEdit(null)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {editModalError && (
              <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold">
                {editModalError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="Ej: SCR-IP13-01"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Categoría *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-bold"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__">➕ Otra Categoría (Crear nueva)</option>
                  </select>
                </div>
              </div>

              {editCategory === '__NEW__' && (
                <div>
                  <label className="block font-bold text-primary uppercase mb-1">
                    Nueva Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    placeholder="Escribe el nombre de la nueva categoría"
                    className="w-full bg-surface-container-lowest border border-primary rounded-xl p-2.5 text-xs text-on-surface font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Nombre del Repuesto / Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej: Módulo Display OLED iPhone 13 Pro"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Stock Mínimo (Alerta) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Costo Compra ($ ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(Number(e.target.value))}
                    placeholder="Ej: 15000"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Precio Venta ($ ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    placeholder="Ej: 35000"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={editModalLoading}
                onClick={() => setItemToEdit(null)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editModalLoading}
                className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
              >
                {editModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editModalLoading ? 'Actualizando...' : 'Actualizar Repuesto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE REPUESTO */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-error flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-error" /> Eliminar Repuesto del Inventario
              </h3>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {deleteError && (
              <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-on-surface-variant leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el repuesto{' '}
              <strong className="text-on-surface">{itemToDelete.name}</strong> (SKU:{' '}
              <span className="font-mono text-primary font-bold">{itemToDelete.sku}</span>)?
            </p>

            {(itemToDelete.reserved_stock || 0) > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Repuesto en uso activo
                </div>
                <p className="text-[11px] text-amber-300/90 leading-normal">
                  Este repuesto tiene <strong>{itemToDelete.reserved_stock}</strong> unidad(es) asignadas a equipos en el taller. Al eliminarlo, las órdenes mantendrán su registro pero no estarán vinculadas al stock.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteItem}
                className="bg-error text-on-error font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow hover:bg-error/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
