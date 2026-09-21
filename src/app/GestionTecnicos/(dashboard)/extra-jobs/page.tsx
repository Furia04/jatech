'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Calendar,
  User,
  Phone,
  DollarSign,
  MessageSquare,
  Printer,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  X,
  Save,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { ExtraJob, ExtraJobStatus, Customer, Shop, UserProfile } from '@/types';
import {
  fetchExtraJobs,
  createExtraJob,
  updateExtraJob,
  updateExtraJobStatus,
  deleteExtraJob,
  fetchCustomers,
  createCustomer,
  fetchCurrentShop,
  getCurrentUserProfile,
} from '@/lib/supabase/services';
import { ExtraJobWhatsAppModal } from '@/components/extra-jobs/extra-job-whatsapp-modal';
import { ExtraJobTicket } from '@/components/extra-jobs/extra-job-ticket';

const STATUS_CONFIG: Record<
  ExtraJobStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  presupuestado: {
    label: 'Presupuestado',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: DollarSign,
  },
  agendado: {
    label: 'Agendado',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: Calendar,
  },
  en_progreso: {
    label: 'En Progreso',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    icon: Clock,
  },
  completado: {
    label: 'Completado',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  cobrado: {
    label: 'Cobrado',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
    icon: Check,
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    icon: XCircle,
  },
};

export default function ExtraJobsPage() {
  const [jobs, setJobs] = useState<ExtraJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingJob, setEditingJob] = useState<ExtraJob | null>(null);
  const [ticketJob, setTicketJob] = useState<ExtraJob | null>(null);
  const [whatsAppJob, setWhatsAppJob] = useState<ExtraJob | null>(null);
  const [deletingJob, setDeletingJob] = useState<ExtraJob | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    location_address: '',
    scheduled_at: '',
    status: 'presupuestado' as ExtraJobStatus,
    labor_price: 0,
    materials_price: 0,
    total_price: 0,
    advance_payment: 0,
    payment_method: 'efectivo',
    technical_notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick Customer Creation inline
  const [showNewCustomerInline, setShowNewCustomerInline] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDoc, setNewCustDoc] = useState('');
  const [creatingCust, setCreatingCust] = useState(false);

  // Copied code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Carga de Datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, custsData, shopData, profileData] = await Promise.all([
        fetchExtraJobs(),
        fetchCustomers(),
        fetchCurrentShop(),
        getCurrentUserProfile(),
      ]);
      setJobs(jobsData || []);
      setCustomers(custsData || []);
      setShop(shopData);
      setUserProfile(profileData);
    } catch (err) {
      console.error('Error al cargar datos de trabajos extra:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Formateadores
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // KPIs de Command Center
  const metrics = useMemo(() => {
    const activeJobs = jobs.filter(
      (j) => j.status === 'presupuestado' || j.status === 'agendado' || j.status === 'en_progreso'
    );
    const scheduledJobs = jobs.filter((j) => j.status === 'agendado' || Boolean(j.scheduled_at));
    const totalPendingBalance = jobs.reduce((acc, j) => {
      if (j.status === 'cancelado' || j.status === 'cobrado') return acc;
      const pending = Math.max(0, j.total_price - j.advance_payment);
      return acc + pending;
    }, 0);
    const totalBudgeted = jobs.reduce((acc, j) => {
      if (j.status === 'cancelado') return acc;
      return acc + (j.total_price || 0);
    }, 0);

    return {
      activeCount: activeJobs.length,
      scheduledCount: scheduledJobs.length,
      pendingBalance: totalPendingBalance,
      totalBudgeted: totalBudgeted,
    };
  }, [jobs]);

  // Filtrado de Trabajos
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        job.job_code.toLowerCase().includes(query) ||
        job.title.toLowerCase().includes(query) ||
        job.customer_name?.toLowerCase().includes(query) ||
        job.customer_phone?.includes(query) ||
        job.location_address?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [jobs, statusFilter, searchQuery]);

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setEditingJob(null);
    setFormData({
      customer_id: customers.length > 0 ? customers[0].id : '',
      title: '',
      description: '',
      location_address: '',
      scheduled_at: '',
      status: 'presupuestado',
      labor_price: 0,
      materials_price: 0,
      total_price: 0,
      advance_payment: 0,
      payment_method: 'efectivo',
      technical_notes: '',
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (job: ExtraJob) => {
    setEditingJob(job);
    let schedIso = '';
    if (job.scheduled_at) {
      try {
        const d = new Date(job.scheduled_at);
        schedIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {}
    }

    setFormData({
      customer_id: job.customer_id,
      title: job.title,
      description: job.description || '',
      location_address: job.location_address || '',
      scheduled_at: schedIso,
      status: job.status,
      labor_price: job.labor_price,
      materials_price: job.materials_price,
      total_price: job.total_price,
      advance_payment: job.advance_payment,
      payment_method: job.payment_method || 'efectivo',
      technical_notes: job.technical_notes || '',
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Guardar Formulario (Crear o Editar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      setFormError('Por favor selecciona un cliente.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Por favor escribe el título o descripción del trabajo.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const scheduledUtc = formData.scheduled_at
        ? new Date(formData.scheduled_at).toISOString()
        : null;

      if (editingJob) {
        const ok = await updateExtraJob(editingJob.id, {
          customer_id: formData.customer_id,
          title: formData.title,
          description: formData.description,
          location_address: formData.location_address,
          scheduled_at: scheduledUtc,
          status: formData.status,
          labor_price: formData.labor_price,
          materials_price: formData.materials_price,
          total_price: formData.total_price,
          advance_payment: formData.advance_payment,
          payment_method: formData.payment_method,
          technical_notes: formData.technical_notes,
        });

        if (ok) {
          setShowFormModal(false);
          await loadData();
        } else {
          setFormError('No se pudo actualizar el trabajo. Intenta de nuevo.');
        }
      } else {
        await createExtraJob({
          customer_id: formData.customer_id,
          title: formData.title,
          description: formData.description,
          location_address: formData.location_address,
          scheduled_at: scheduledUtc,
          status: formData.status,
          labor_price: formData.labor_price,
          materials_price: formData.materials_price,
          total_price: formData.total_price,
          advance_payment: formData.advance_payment,
          payment_method: formData.payment_method,
          technical_notes: formData.technical_notes,
        });

        setShowFormModal(false);
        await loadData();
      }
    } catch (err: any) {
      console.error('Error al guardar trabajo extra:', err);
      setFormError(err?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setFormLoading(false);
    }
  };

  // Crear Cliente Rápido inline
  const handleCreateCustomerInline = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Nombre y Teléfono son requeridos.');
      return;
    }
    setCreatingCust(true);
    try {
      const newCust = await createCustomer({
        full_name: newCustName.trim(),
        phone: newCustPhone.trim(),
        document_id: newCustDoc.trim(),
      });
      if (newCust) {
        setCustomers((prev) => [newCust, ...prev]);
        setFormData((prev) => ({ ...prev, customer_id: newCust.id }));
        setShowNewCustomerInline(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustDoc('');
      }
    } catch (err) {
      console.error('Error al crear cliente rápido:', err);
      alert('No se pudo crear el cliente.');
    } finally {
      setCreatingCust(false);
    }
  };

  // Cambio de Estado Rápido
  const handleQuickStatusChange = async (jobId: string, newStatus: ExtraJobStatus) => {
    try {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      await updateExtraJobStatus(jobId, newStatus);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      loadData();
    }
  };

  // Eliminar Trabajo
  const handleDeleteConfirm = async () => {
    if (!deletingJob) return;
    setDeleteLoading(true);
    try {
      const ok = await deleteExtraJob(deletingJob.id);
      if (ok) {
        setJobs((prev) => prev.filter((j) => j.id !== deletingJob.id));
        setDeletingJob(null);
      } else {
        alert('No se pudo eliminar el registro.');
      }
    } catch (err) {
      console.error('Error al eliminar trabajo:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 1. Encabezado y Botón Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                Trabajos Extra
              </h1>
              <p className="text-xs text-on-surface-variant">
                Servicios en terreno, cámaras, cableado de redes y tareas especiales fuera del taller
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Trabajo Extra</span>
        </button>
      </div>

      {/* 2. KPIs / Command Center Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Trabajos Activos
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-on-surface font-mono">
              {metrics.activeCount}
            </span>
            <span className="text-[11px] text-on-surface-variant">en curso / agendados</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Visitas Agendadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-on-surface font-mono">
              {metrics.scheduledCount}
            </span>
            <span className="text-[11px] text-blue-400">con fecha asignada</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Saldo por Cobrar
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {formatCurrency(metrics.pendingBalance)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Presupuestado
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-on-surface font-mono">
              {formatCurrency(metrics.totalBudgeted)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (EXT-001), título, cliente o dirección..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-outline-variant/40'
            }`}
          >
            Todos ({jobs.length})
          </button>
          {(Object.keys(STATUS_CONFIG) as ExtraJobStatus[]).map((st) => {
            const count = jobs.filter((j) => j.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-outline-variant/40'
                }`}
              >
                <span>{STATUS_CONFIG[st].label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grid de Tarjetas Técnicas */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-on-surface-variant gap-3 bg-surface-container-low rounded-2xl border border-outline-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs">Cargando trabajos extra...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-low rounded-2xl border border-outline-variant/60 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">No hay trabajos extra que mostrar</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'No se encontraron resultados con los filtros actuales.'
                : 'Registra tu primera instalación, tendido de red o trabajo en terreno haciendo clic en "Nuevo Trabajo Extra".'}
            </p>
          </div>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-primary hover:underline font-semibold mt-1"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              + Crear Primer Trabajo Extra
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.presupuestado;
            const StatusIcon = statusCfg.icon;
            const pendingBalance = Math.max(0, job.total_price - job.advance_payment);
            const isFullyPaid = job.advance_payment >= job.total_price && job.total_price > 0;
            const paymentPercent = job.total_price > 0 ? Math.min(100, Math.round((job.advance_payment / job.total_price) * 100)) : 0;

            return (
              <div
                key={job.id}
                className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col justify-between hover:border-outline-variant/80 hover:shadow-lg transition-all group"
              >
                {/* Header de la Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(job.job_code, job.id)}
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant text-primary hover:border-primary flex items-center gap-1.5 transition-colors"
                        title="Copiar código"
                      >
                        <span>{job.job_code}</span>
                        {copiedCodeId === job.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-on-surface-variant opacity-60" />
                        )}
                      </button>

                      {job.scheduled_at && (
                        <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.scheduled_at)}
                        </span>
                      )}
                    </div>

                    {/* Selector Rápido de Estado */}
                    <div className="relative inline-block">
                      <select
                        value={job.status}
                        onChange={(e) => handleQuickStatusChange(job.id, e.target.value as ExtraJobStatus)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none transition-colors ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {(Object.keys(STATUS_CONFIG) as ExtraJobStatus[]).map((st) => (
                          <option key={st} value={st} className="bg-surface text-on-surface">
                            {STATUS_CONFIG[st].label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                    </div>
                  </div>

                  {/* Título y Alcance */}
                  <div className="mt-3.5">
                    <h3 className="text-sm font-bold text-on-surface line-clamp-2 leading-snug">
                      {job.title}
                    </h3>
                    {job.description && (
                      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Dirección y Cliente */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-outline-variant/30 text-xs">
                    {job.location_address && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate text-on-surface font-medium">{job.location_address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-on-surface-variant">
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                        <span className="truncate font-medium text-on-surface">{job.customer_name || 'Sin Cliente'}</span>
                      </div>

                      {job.customer_phone && (
                        <a
                          href={`tel:${job.customer_phone}`}
                          className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline shrink-0"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{job.customer_phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Desglose Financiero */}
                  <div className="mt-4 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-on-surface-variant text-[11px] uppercase tracking-wider">Total</span>
                      <span className="text-base font-bold font-mono text-on-surface">
                        {formatCurrency(job.total_price)}
                      </span>
                    </div>

                    {/* Barra de Progreso de Pago */}
                    <div className="space-y-1">
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isFullyPaid ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${paymentPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-on-surface-variant">
                          Seña: {formatCurrency(job.advance_payment)} ({paymentPercent}%)
                        </span>
                        <span className={pendingBalance > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {pendingBalance > 0 ? `Resta: ${formatCurrency(pendingBalance)}` : 'Saldado'}
                        </span>
                      </div>
                    </div>

                    {(job.labor_price > 0 || job.materials_price > 0) && (
                      <div className="pt-1.5 border-t border-outline-variant/30 flex justify-between text-[10px] text-on-surface-variant">
                        <span>M. Obra: <strong className="font-mono text-on-surface">{formatCurrency(job.labor_price)}</strong></span>
                        <span>Mat: <strong className="font-mono text-on-surface">{formatCurrency(job.materials_price)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="mt-4 pt-3 border-t border-outline-variant/50 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setWhatsAppJob(job)}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                      title="Enviar mensaje por WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Botón Ticket / Comprobante */}
                    <button
                      type="button"
                      onClick={() => setTicketJob(job)}
                      className="p-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors"
                      title="Imprimir comprobante / presupuesto"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(job)}
                      className="p-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors"
                      title="Editar trabajo extra"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setDeletingJob(job)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors"
                      title="Eliminar trabajo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal de Creación / Edición */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    {editingJob ? `Editar Trabajo ${editingJob.job_code}` : 'Nuevo Trabajo Extra / En Terreno'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {editingJob ? 'Actualiza los datos del servicio' : 'Registra los datos del cliente, dirección y cotización'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Sección 1: Cliente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Cliente *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerInline(!showNewCustomerInline)}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {showNewCustomerInline ? 'Cancelar nuevo cliente' : '+ Crear cliente rápido'}
                  </button>
                </div>

                {/* Inline New Customer Form */}
                {showNewCustomerInline ? (
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-primary/40 space-y-3">
                    <p className="text-xs font-bold text-primary">Alta Rápida de Cliente</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-on-surface-variant block mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          value={newCustName}
                          onChange={(e) => setNewCustName(e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant block mb-1">Teléfono / WhatsApp *</label>
                        <input
                          type="text"
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          placeholder="Ej: 11 4455 6677"
                          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={creatingCust}
                      onClick={handleCreateCustomerInline}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {creatingCust ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Guardar y Seleccionar Cliente</span>
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Selecciona un cliente --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sección 2: Título y Ubicación */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Título o Tipo de Trabajo *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Instalación de 4 cámaras Dahua + DVR 1TB / Cableado de red oficina"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                      Dirección / Ubicación
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        value={formData.location_address}
                        onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                        placeholder="Ej: Av. San Martín 1234, Piso 2"
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                      Fecha y Hora de Visita
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Alcance y Descripción */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Alcance del Trabajo / Requerimientos
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalle de materiales, cantidad de metros de cable, configuración de app móvil, etc."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Notas Internas / Observaciones de Acceso
                  </label>
                  <input
                    type="text"
                    value={formData.technical_notes}
                    onChange={(e) => setFormData({ ...formData, technical_notes: e.target.value })}
                    placeholder="Ej: Llaves en recepción, timbre 4B, escalera alta requerida"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Sección 4: Presupuesto y Cobros */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 space-y-3">
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Presupuesto y Cobranza
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Mano de Obra ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.labor_price || ''}
                      onChange={(e) => {
                        const labor = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          labor_price: labor,
                          total_price: labor + prev.materials_price,
                        }));
                      }}
                      placeholder="0"
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Materiales ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.materials_price || ''}
                      onChange={(e) => {
                        const mat = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          materials_price: mat,
                          total_price: prev.labor_price + mat,
                        }));
                      }}
                      placeholder="0"
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Total Presupuestado ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.total_price || ''}
                      onChange={(e) => setFormData({ ...formData, total_price: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-surface border border-primary/50 font-bold rounded-lg px-3 py-2 text-xs font-mono text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/30">
                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Seña / Anticipo ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.advance_payment || ''}
                      onChange={(e) => setFormData({ ...formData, advance_payment: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Método de Pago</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta_debito">Tarjeta Débito</option>
                      <option value="tarjeta_credito">Tarjeta Crédito</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">Estado Inicial</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ExtraJobStatus })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      {(Object.keys(STATUS_CONFIG) as ExtraJobStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs font-mono">
                  <span className="text-on-surface-variant">Saldo Restante al Concluir:</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {formatCurrency(Math.max(0, formData.total_price - formData.advance_payment))}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingJob ? 'Guardar Cambios' : 'Crear Trabajo Extra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmación de Eliminación */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">¿Eliminar Trabajo Extra?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Estás a punto de eliminar el registro <strong>{deletingJob.job_code}</strong> ({deletingJob.title}). Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingJob(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de WhatsApp */}
      {whatsAppJob && (
        <ExtraJobWhatsAppModal
          job={whatsAppJob}
          shop={shop}
          onClose={() => setWhatsAppJob(null)}
        />
      )}

      {/* 8. Modal de Impresión / Comprobante Ticket */}
      {ticketJob && (
        <ExtraJobTicket
          job={ticketJob}
          shop={shop}
          onClose={() => setTicketJob(null)}
        />
      )}
    </div>
  );
}
