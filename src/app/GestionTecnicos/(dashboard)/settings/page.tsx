'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  Store,
  Receipt,
  Type,
  Hash,
  ListFilter,
  CheckSquare,
  AlignLeft,
  ChevronRight,
  Eye,
  FolderMinus,
  Phone,
  Building2,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  CustomFieldDefinition,
  DeviceCategoryTemplate,
  FieldType,
  Shop,
} from '@/types';
import { CustomFieldsRenderer } from '@/components/orders/custom-fields-renderer';
import { getCurrentUserProfile } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';

const DEFAULT_TEMPLATES: DeviceCategoryTemplate[] = [
  {
    id: 'tmpl-1',
    category_name: 'Celulares & Tablets',
    fields: [
      { id: 'f1', name: 'passcode', label: 'Patrón / Clave de Desbloqueo', type: 'text', required: false, placeholder: 'Ej: 1234' },
      { id: 'f2', name: 'has_sim', label: 'Trae Tarjeta SIM', type: 'checkbox', required: false },
      { id: 'f3', name: 'battery_state', label: 'Estado de Batería', type: 'select', required: false, options: ['Buena (Original)', 'Degradada', 'Inflada / Dañada'] },
    ],
  },
  {
    id: 'tmpl-2',
    category_name: 'Notebooks & Computadoras',
    fields: [
      { id: 'f4', name: 'charger_included', label: 'Incluye Cargador Original', type: 'checkbox', required: true },
      { id: 'f5', name: 'ram_size', label: 'Memoria RAM Instalada (GB)', type: 'number', required: false, placeholder: 'Ej: 16' },
      { id: 'f6', name: 'os_user_pass', label: 'Usuario / Clave de Inicio de Sesión', type: 'text', required: false },
    ],
  },
  {
    id: 'tmpl-3',
    category_name: 'Automotores & Módulos ECU',
    fields: [
      { id: 'f7', name: 'mileage', label: 'Kilometraje Actual del Vehículo', type: 'number', required: true, placeholder: 'Ej: 120000' },
      { id: 'f8', name: 'license_plate', label: 'Patente / Dominio', type: 'text', required: true, placeholder: 'Ej: AA123BB' },
      { id: 'f9', name: 'fault_codes', label: 'Códigos DTC de Falla Escáner', type: 'textarea', required: false, placeholder: 'Ej: P0300, P0171' },
    ],
  },
];

export default function ErgonomicSettingsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'general' | 'fields'>('general');
  const [loading, setLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);

  // Shop Settings State
  const [shopName, setShopName] = useState('Mi Taller de Servicio Técnico');
  const [whatsappPhone, setWhatsappPhone] = useState('+54 9 11 4455-6677');
  const [ticketTerms, setTicketTerms] = useState(
    'No nos responsabilizamos por pérdida de datos. Los presupuestos tienen una validez de 15 días. Garantía de reparación: 30 días sobre la falla reparada.'
  );

  // Dynamic Templates State
  const [templates, setTemplates] = useState<DeviceCategoryTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-1');
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // New field form state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Sample values for live preview
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadShopData() {
      setLoading(true);
      try {
        const profile = await getCurrentUserProfile();
        if (profile) {
          const targetShopId = profile.shop_id || profile.id;
          setCurrentShopId(targetShopId);

          const { data: dbShop } = await supabase
            .from('shops')
            .select('*')
            .or(`id.eq.${targetShopId},owner_email.eq.${profile.email}`)
            .maybeSingle();

          if (dbShop) {
            setShopName(dbShop.name || 'Mi Taller');
            if (dbShop.settings?.phone) setWhatsappPhone(dbShop.settings.phone);
            if (dbShop.settings?.ticket?.terms) setTicketTerms(dbShop.settings.ticket.terms);
            if (dbShop.settings?.templates) setTemplates(dbShop.settings.templates);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del taller:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;

    const fieldKey =
      newFieldName.trim() ||
      newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const optionsArray =
      newFieldType === 'select'
        ? newFieldOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: CustomFieldDefinition = {
      id: `f_${Date.now()}`,
      name: fieldKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: optionsArray,
    };

    setTemplates((prev) =>
      prev.map((tmpl) =>
        tmpl.id === selectedTemplateId
          ? { ...tmpl, fields: [...tmpl.fields, newField] }
          : tmpl
      )
    );

    // Reset form
    setNewFieldLabel('');
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
    setShowAddFieldForm(false);
  };

  const handleRemoveField = (fieldId: string) => {
    setTemplates((prev) =>
      prev.map((tmpl) =>
        tmpl.id === selectedTemplateId
          ? {
              ...tmpl,
              fields: tmpl.fields.filter((f) => f.id !== fieldId),
            }
          : tmpl
      )
    );
  };

  const handleAddCategory = () => {
    const categoryName = prompt('Nombre de la nueva categoría de equipos (ej: Consolas, Drones, Audio):');
    if (!categoryName) return;

    const newTmpl: DeviceCategoryTemplate = {
      id: `tmpl_${Date.now()}`,
      category_name: categoryName.trim(),
      fields: [],
    };

    setTemplates((prev) => [...prev, newTmpl]);
    setSelectedTemplateId(newTmpl.id);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (currentShopId) {
        await supabase
          .from('shops')
          .update({
            name: shopName,
            settings: {
              phone: whatsappPhone,
              ticket: { terms: ticketTerms },
              templates: templates,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentShopId);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
    } finally {
      setSaving(false);
    }
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4 text-sky-400" />;
      case 'number':
        return <Hash className="w-4 h-4 text-emerald-400" />;
      case 'select':
        return <ListFilter className="w-4 h-4 text-purple-400" />;
      case 'checkbox':
        return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case 'textarea':
        return <AlignLeft className="w-4 h-4 text-orange-400" />;
      default:
        return <Type className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs">Cargando configuración de Supabase...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12 font-sans">
      {/* Header Ergonómico de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
            <Sliders className="w-7 h-7 text-primary" /> Configuración de Marca & Rubros
          </h2>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Administra los datos de tu taller, teléfono de contacto y personaliza los campos por categoría de equipo.
          </p>
        </div>
        <button
          disabled={saving}
          onClick={handleSaveSettings}
          className="self-start sm:self-auto bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : savedSuccess ? 'Cambios Guardados' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Pestañas Principales */}
      <div className="flex gap-3 border-b border-outline-variant/50 pb-1">
        <button
          onClick={() => setActiveMainTab('general')}
          className={`pb-2 px-4 text-xs font-title-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeMainTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Building2 className="w-4 h-4" /> Marca & Ticket Térmico 80mm
        </button>
        <button
          onClick={() => setActiveMainTab('fields')}
          className={`pb-2 px-4 text-xs font-title-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeMainTab === 'fields'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Layers className="w-4 h-4" /> Campos Personalizados por Rubro
        </button>
      </div>

      {activeMainTab === 'general' ? (
        /* PESTAÑA DE DATOS GENERALES DEL TALLER */
        <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="space-y-4">
            <h3 className="font-title-sm text-base font-bold text-on-surface flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Perfil y Nombre Comercial del Taller
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Nombre del Taller / Negocio *
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ej: Electrónica Sur Taller"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Teléfono / WhatsApp de Atención *
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 4455-6677"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-outline-variant/60 pt-6">
            <h3 className="font-title-sm text-base font-bold text-on-surface flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-400" /> Términos y Garantía en Comanda 80mm
            </h3>

            <div className="text-xs">
              <label className="block font-bold text-on-surface-variant uppercase mb-1">
                Términos de Garantía y Abandono (Impresos al pie de la comanda)
              </label>
              <textarea
                rows={4}
                value={ticketTerms}
                onChange={(e) => setTicketTerms(e.target.value)}
                placeholder="Escribe aquí las cláusulas impresas al pie del ticket térmico..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface leading-relaxed"
              />
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA DE CAMPOS PERSONALIZADOS POR RUBRO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-surface-container border border-outline-variant/80 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-on-surface">Categorías de Rubro</h3>
              <button
                onClick={handleAddCategory}
                className="bg-primary/10 text-primary hover:bg-primary/20 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nueva Categoría
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span>{tmpl.category_name}</span>
                  <span className="opacity-75 text-[10px]">({tmpl.fields.length})</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase text-on-surface-variant">
                  Campos de {currentTemplate.category_name}
                </h4>
                <button
                  onClick={() => setShowAddFieldForm(!showAddFieldForm)}
                  className="bg-surface-bright border border-outline-variant text-on-surface hover:bg-surface-container-highest px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" /> Agregar Campo
                </button>
              </div>

              {showAddFieldForm && (
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3 animate-in fade-in text-xs">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Nombre Visible (Label)</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Ej: Patrón de Desbloqueo"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface-variant mb-1">Tipo de Dato</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                        className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs"
                      >
                        <option value="text">Texto Corto</option>
                        <option value="number">Número</option>
                        <option value="checkbox">Casilla de Selección (Checkbox)</option>
                        <option value="select">Lista Desplegable (Select)</option>
                        <option value="textarea">Área de Texto Largo</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={newFieldRequired}
                          onChange={(e) => setNewFieldRequired(e.target.checked)}
                          className="rounded border-outline-variant text-primary focus:ring-primary"
                        />
                        Campo Obligatorio
                      </label>
                    </div>
                  </div>

                  {newFieldType === 'select' && (
                    <div>
                      <label className="block font-bold text-on-surface-variant mb-1">Opciones (separadas por coma)</label>
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Buena, Regular, Mala"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowAddFieldForm(false)}
                      className="px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddField}
                      className="bg-primary text-on-primary font-bold px-4 py-1.5 rounded-lg text-xs shadow"
                    >
                      Guardar Campo
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {currentTemplate.fields.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic p-4 text-center">
                    No hay campos configurados para esta categoría.
                  </p>
                ) : (
                  currentTemplate.fields.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {getFieldIcon(f.type)}
                        <span className="font-bold text-on-surface">{f.label}</span>
                        {f.required && (
                          <span className="text-[10px] bg-error/20 text-error px-1.5 py-0.5 rounded font-bold uppercase">
                            Requerido
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveField(f.id)}
                        className="p-1 hover:bg-error/20 text-on-surface-variant hover:text-error rounded transition-colors"
                        title="Eliminar Campo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Vista Previa de Formulario */}
          <div className="lg:col-span-5 bg-surface-container border border-outline-variant/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-title-sm text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-3">
              <Eye className="w-4 h-4 text-primary" /> Vista Previa en Vivo
            </h3>
            <p className="text-xs text-on-surface-variant">
              Así se verá el formulario al ingresar un equipo de tipo <strong className="text-on-surface">{currentTemplate.category_name}</strong>.
            </p>
            <CustomFieldsRenderer
              fields={currentTemplate.fields}
              values={previewValues}
              onChange={(key, val) => setPreviewValues((prev) => ({ ...prev, [key]: val }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
