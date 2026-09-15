'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  FileText,
  Search,
  User,
  Smartphone,
  AlertCircle,
  Save,
  CheckCircle2,
  ArrowRight,
  Lock,
  DollarSign,
  CreditCard,
  Camera,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import { createServiceOrderWithDevice, getCurrentUserProfile } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { CustomFieldDefinition, DeviceCategoryTemplate, ServiceOrder, Shop } from '@/types';
import { CustomFieldsRenderer } from '@/components/orders/custom-fields-renderer';
import { PatternLockInput } from '@/components/orders/pattern-lock-input';
import { DeviceAutocomplete } from '@/components/orders/device-autocomplete';
import { PhotoUploader } from '@/components/orders/photo-uploader';
import { WhatsAppModal } from '@/components/orders/whatsapp-modal';
import { fetchCurrentShop } from '@/lib/supabase/services';

const DEFAULT_TEMPLATES: DeviceCategoryTemplate[] = [
  {
    id: 'tmpl-1',
    category_name: 'Smartphone',
    fields: [
      { id: 'f1', name: 'passcode', label: 'Patrón / Clave de Desbloqueo (Texto)', type: 'text', required: false, placeholder: 'Ej: PIN 1234' },
      { id: 'f2', name: 'has_sim', label: 'Trae Tarjeta SIM', type: 'checkbox', required: false },
      { id: 'f3', name: 'battery_state', label: 'Estado de Batería', type: 'select', required: false, options: ['Buena (Original)', 'Degradada', 'Inflada / Dañada'] },
    ],
  },
  {
    id: 'tmpl-2',
    category_name: 'Computadora / Laptop',
    fields: [
      { id: 'f4', name: 'charger_included', label: 'Incluye Cargador Original', type: 'checkbox', required: true },
      { id: 'f5', name: 'ram_size', label: 'Memoria RAM Instalada (GB)', type: 'number', required: false, placeholder: 'Ej: 16' },
      { id: 'f6', name: 'os_user_pass', label: 'Usuario / Clave de Inicio de Sesión', type: 'text', required: false },
    ],
  },
  {
    id: 'tmpl-3',
    category_name: 'Automotor / Placa ECU',
    fields: [
      { id: 'f7', name: 'mileage', label: 'Kilometraje Actual del Vehículo', type: 'number', required: true, placeholder: 'Ej: 120000' },
      { id: 'f8', name: 'license_plate', label: 'Patente / Dominio', type: 'text', required: true, placeholder: 'Ej: AA123BB' },
      { id: 'f9', name: 'fault_codes', label: 'Códigos DTC de Falla Escáner', type: 'textarea', required: false, placeholder: 'Ej: P0300, P0171' },
    ],
  },
];

export default function NewOrderIntakePage() {
  const router = useRouter();

  // Datos del Cliente con DNI / Documento
  const [customerName, setCustomerName] = useState('');
  const [customerDocumentId, setCustomerDocumentId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Datos del Dispositivo
  const [deviceType, setDeviceType] = useState('Smartphone');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [serialImei, setSerialImei] = useState('');
  const [powersOn, setPowersOn] = useState(true);
  const [faultDescription, setFaultDescription] = useState('');

  // Finanzas y Seña / Anticipo
  const [estimatedCost, setEstimatedCost] = useState<number | string>('');
  const [advancePayment, setAdvancePayment] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');

  // Evidencias Fotográficas de Recepción
  const [devicePhotos, setDevicePhotos] = useState<string[]>([]);

  // Patrón Táctil de Desbloqueo (1 a 9)
  const [unlockPattern, setUnlockPattern] = useState<number[]>([]);
  const [showPatternDrawer, setShowPatternDrawer] = useState(false);

  // Plantillas de Campos Personalizados por Rubro
  const [categoryTemplates, setCategoryTemplates] = useState<DeviceCategoryTemplate[]>(DEFAULT_TEMPLATES);
  const [customAttrValues, setCustomAttrValues] = useState<Record<string, any>>({});

  // Formato de Impresión: 80mm vs Hoja A4
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [ticketCode] = useState(`WO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [todayDate] = useState(new Date().toLocaleDateString('es-AR'));

  const [createdOrderForWhatsApp, setCreatedOrderForWhatsApp] = useState<ServiceOrder | null>(null);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  const numEstimatedCost = Number(estimatedCost) || 0;
  const numAdvancePayment = Number(advancePayment) || 0;
  const remainingBalance = Math.max(0, numEstimatedCost - numAdvancePayment);

  useEffect(() => {
    async function loadShopAndTemplates() {
      try {
        const [profile, realShop] = await Promise.all([
          getCurrentUserProfile(),
          fetchCurrentShop(),
        ]);
        if (realShop) {
          setCurrentShop(realShop);
        }
        if (profile) {
          const targetShopId = profile.shop_id || profile.id;
          const { data: dbShop } = await supabase
            .from('shops')
            .select('settings')
            .or(`id.eq.${targetShopId},owner_email.eq.${profile.email}`)
            .maybeSingle();

          if (dbShop?.settings?.templates && Array.isArray(dbShop.settings.templates) && dbShop.settings.templates.length > 0) {
            setCategoryTemplates(dbShop.settings.templates);
          }
        }
      } catch (e) {
        console.warn('Plantillas por defecto cargadas');
      }
    }
    loadShopAndTemplates();
  }, []);

  const activeTemplate = categoryTemplates.find(
    (t) => t.category_name.toLowerCase() === deviceType.toLowerCase() || deviceType.toLowerCase().includes(t.category_name.toLowerCase())
  ) || categoryTemplates[0];

  const activeCategoryFields = activeTemplate ? activeTemplate.fields : [];

  const validateForm = () => {
    if (!customerName.trim() || !customerPhone.trim() || !deviceBrand.trim() || !deviceModel.trim() || !faultDescription.trim()) {
      alert('Por favor complete los campos obligatorios (* Nombre del cliente, Teléfono, Marca, Modelo y Descripción de la Falla).');
      return false;
    }

    for (const field of activeCategoryFields) {
      if (field.required && !customAttrValues[field.name]) {
        alert(`El campo personalizado "${field.label}" es obligatorio para la categoría ${deviceType}.`);
        return false;
      }
    }

    return true;
  };

  const handleSaveOnly = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSuccessMessage('');

    const newOrderPayload = {
      customer: {
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        document_id: customerDocumentId.trim(),
        email: customerEmail.trim(),
      },
      device: {
        type: deviceType,
        brand: deviceBrand.trim(),
        model: deviceModel.trim(),
        serial_number: serialImei.trim(),
        custom_attributes: { powers_on: powersOn, unlock_pattern: unlockPattern, ...customAttrValues },
      },
      order: {
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        tracking_code: `#${ticketCode}`,
      },
    };

    try {
      const savedOrder = await createServiceOrderWithDevice(newOrderPayload);
      const localOrderObj: ServiceOrder = {
        id: savedOrder?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0')),
        shop_id: savedOrder?.shop_id || 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: savedOrder?.device_id || `dev-${Date.now()}`,
        customer_id: savedOrder?.customer_id || `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: savedOrder?.created_at || new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        const filtered = existing.filter((o: any) => o.tracking_code !== `#${ticketCode}` && o.id !== localOrderObj.id);
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...filtered]));
      } catch (e) {}

      setSuccessMessage('¡Orden de servicio guardada exitosamente! Redirigiendo...');
      setTimeout(() => {
        router.push('/GestionTecnicos/orders');
      }, 800);
    } catch (err) {
      console.warn('Guardado local de emergencia realizado:', err);
      const localOrderObj: ServiceOrder = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0'),
        shop_id: 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: `dev-${Date.now()}`,
        customer_id: `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...existing]));
      } catch (e) {}

      setSuccessMessage('¡Orden de servicio registrada exitosamente!');
      setTimeout(() => {
        router.push('/GestionTecnicos/orders');
      }, 800);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndWhatsApp = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSuccessMessage('');

    const newOrderPayload = {
      customer: {
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        document_id: customerDocumentId.trim(),
        email: customerEmail.trim(),
      },
      device: {
        type: deviceType,
        brand: deviceBrand.trim(),
        model: deviceModel.trim(),
        serial_imei: serialImei.trim() || undefined,
        powers_on: powersOn,
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      },
      order: {
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        tracking_code: `#${ticketCode}`,
      },
    };

    try {
      const savedOrder = await createServiceOrderWithDevice(newOrderPayload);
      const localOrderObj: ServiceOrder = {
        id: savedOrder?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0')),
        shop_id: savedOrder?.shop_id || 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: savedOrder?.device_id || `dev-${Date.now()}`,
        customer_id: savedOrder?.customer_id || `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: savedOrder?.created_at || new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        const filtered = existing.filter((o: any) => o.tracking_code !== `#${ticketCode}` && o.id !== localOrderObj.id);
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...filtered]));
      } catch (e) {}

      setSuccessMessage('¡Orden registrada exitosamente! Preparando notificación de WhatsApp...');
      setCreatedOrderForWhatsApp(localOrderObj);
    } catch (err) {
      console.warn('Guardado local de emergencia realizado:', err);
      const localOrderObj: ServiceOrder = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0'),
        shop_id: 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: `dev-${Date.now()}`,
        customer_id: `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...existing]));
      } catch (e) {}

      setCreatedOrderForWhatsApp(localOrderObj);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async (selectedFormat: '80mm' | 'a4') => {
    if (!validateForm()) return;

    setPrintFormat(selectedFormat);
    setSaving(true);
    setSuccessMessage('');

    const newOrderPayload = {
      customer: {
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        document_id: customerDocumentId.trim(),
        email: customerEmail.trim(),
      },
      device: {
        type: deviceType,
        brand: deviceBrand.trim(),
        model: deviceModel.trim(),
        serial_number: serialImei.trim(),
        custom_attributes: { powers_on: powersOn, unlock_pattern: unlockPattern, ...customAttrValues },
      },
      order: {
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        tracking_code: `#${ticketCode}`,
      },
    };

    try {
      const savedOrder = await createServiceOrderWithDevice(newOrderPayload);
      const localOrderObj: ServiceOrder = {
        id: savedOrder?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0')),
        shop_id: savedOrder?.shop_id || 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: savedOrder?.device_id || `dev-${Date.now()}`,
        customer_id: savedOrder?.customer_id || `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: savedOrder?.created_at || new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        const filtered = existing.filter((o: any) => o.tracking_code !== `#${ticketCode}` && o.id !== localOrderObj.id);
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...filtered]));
      } catch (e) {}
    } catch (err) {
      console.warn('Guardado local de emergencia realizado:', err);
      const localOrderObj: ServiceOrder = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0'),
        shop_id: 'local-shop',
        tracking_code: `#${ticketCode}`,
        device_id: `dev-${Date.now()}`,
        customer_id: `cust-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_document_id: customerDocumentId.trim(),
        device_info: `${deviceType} · ${deviceBrand.trim()} ${deviceModel.trim()}`,
        status: 'recibido',
        reported_fault: faultDescription.trim(),
        estimated_cost: numEstimatedCost,
        final_price: numEstimatedCost,
        advance_payment: numAdvancePayment,
        payment_method: paymentMethod,
        device_photos: devicePhotos,
        created_at: new Date().toISOString(),
        custom_attributes: { unlock_pattern: unlockPattern, ...customAttrValues },
      };

      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        const existing = storedStr ? JSON.parse(storedStr) : [];
        localStorage.setItem('prorepair_local_orders', JSON.stringify([localOrderObj, ...existing]));
      } catch (e) {}
    } finally {
      setSaving(false);
      setTimeout(() => {
        window.print();
        router.push('/GestionTecnicos/orders');
      }, 300);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      {/* Encabezado con Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface">
            Punto de Recepción de Equipos
          </h2>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Alta real de cliente, equipo y emisión de orden en la base de datos de tu taller.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Botón 1: Solo Guardar Orden */}
          <button
            onClick={handleSaveOnly}
            disabled={saving}
            className="flex-1 sm:flex-none bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-title-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            {saving ? 'Guardando...' : 'Guardar Orden (Sin Imprimir)'}
          </button>

          {/* Botón 2: Imprimir Comanda 80mm & Guardar */}
          <button
            onClick={() => handleSaveAndPrint('80mm')}
            disabled={saving}
            className="flex-1 sm:flex-none bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Imprimir Comanda (80mm) & Guardar'}
          </button>

          {/* Botón 3: Imprimir Hoja A4 & Guardar */}
          <button
            onClick={() => handleSaveAndPrint('a4')}
            disabled={saving}
            className="flex-1 sm:flex-none bg-purple-600 text-white hover:bg-purple-500 font-title-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Imprimir Hoja A4 & Guardar'}
          </button>

          {/* Botón 4: Guardar & Enviar WhatsApp */}
          <button
            onClick={handleSaveAndWhatsApp}
            disabled={saving}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-title-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar & WhatsApp'}
          </button>
        </div>
      </div>

      {/* Notificación de Éxito */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        {/* Columna Izquierda: Formulario de Recepción */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paso 1: Datos del Cliente */}
            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col relative group shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/60 pb-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-caps text-xs font-bold">
                  1
                </div>
                <h3 className="font-title-sm text-sm text-on-surface font-bold">
                  Datos del Cliente
                </h3>
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1 uppercase text-[10px]">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Sarah Connor"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1 uppercase text-[10px]">
                    DNI / CUIT / Identificación
                  </label>
                  <input
                    type="text"
                    value={customerDocumentId}
                    onChange={(e) => setCustomerDocumentId(e.target.value)}
                    placeholder="Ej: 38912402"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 font-mono text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1 uppercase text-[10px]">
                    Teléfono (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 4455 6677"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 font-mono text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Paso 2: Perfil del Dispositivo */}
            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col relative group shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/60 pb-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-caps text-xs font-bold">
                  2
                </div>
                <h3 className="font-title-sm text-sm text-on-surface font-bold">
                  Perfil del Dispositivo & Rubro
                </h3>
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1 uppercase text-[10px]">
                    Categoría / Rubro de Equipo
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => {
                      setDeviceType(e.target.value);
                      setCustomAttrValues({});
                    }}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 font-bold"
                  >
                    {categoryTemplates.map((t) => (
                      <option key={t.id} value={t.category_name}>
                        {t.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <DeviceAutocomplete
                    brand={deviceBrand}
                    model={deviceModel}
                    onChangeBrand={setDeviceBrand}
                    onChangeModel={setDeviceModel}
                    deviceType={deviceType}
                    disabled={saving}
                  />

                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/50">
                    <label className="block font-bold text-on-surface-variant mb-1 uppercase text-[10px]">
                      IMEI / Nº Serie
                    </label>
                    <input
                      type="text"
                      value={serialImei}
                      onChange={(e) => setSerialImei(e.target.value)}
                      placeholder="Ej: 358923019842019"
                      className="w-full bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="powersOnCheck"
                      checked={powersOn}
                      onChange={(e) => setPowersOn(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary"
                    />
                    <label htmlFor="powersOnCheck" className="text-xs font-semibold text-on-surface-variant cursor-pointer select-none">
                      Enciende al ingresar
                    </label>
                  </div>

                  {/* Botón para Abrir el Dibujador de Patrón Táctil */}
                  <button
                    type="button"
                    onClick={() => setShowPatternDrawer(!showPatternDrawer)}
                    className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {unlockPattern.length > 0
                      ? `Patrón trazado (${unlockPattern.length} ptos)`
                      : 'Dibujar Patrón Táctil'}
                  </button>
                </div>

                {/* DIBUJADOR DE PATRÓN TÁCTIL (VISUAL DIGITAL) */}
                {showPatternDrawer && (
                  <div className="pt-2 animate-in zoom-in-95 duration-150">
                    <PatternLockInput value={unlockPattern} onChange={setUnlockPattern} />
                  </div>
                )}

                {/* RENDERING DE CAMPOS PERSONALIZADOS DINÁMICOS POR CATEGORÍA */}
                {activeCategoryFields && activeCategoryFields.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant/60">
                    <CustomFieldsRenderer
                      fields={activeCategoryFields}
                      values={customAttrValues}
                      onChange={(key, val) => setCustomAttrValues((prev) => ({ ...prev, [key]: val }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Paso 3: Falla Reportada */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/60 pb-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-caps text-xs font-bold">
                3
              </div>
              <h3 className="font-title-sm text-sm text-on-surface font-bold">
                Descripción de la Falla *
              </h3>
            </div>
            <textarea
              required
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              rows={3}
              className="w-full flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none"
              placeholder="Describa la falla reportada por el cliente en detalle..."
            />
          </div>

          {/* Paso 4: Finanzas & Seña / Anticipo */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-caps text-xs font-bold">
                4
              </div>
              <h3 className="font-title-sm text-sm text-on-surface font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Presupuesto & Seña / Anticipo
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Presupuesto Estimado ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-on-surface focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">
                  Seña / Anticipo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-surface-container-lowest border border-emerald-500/40 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Medio de Pago de Seña
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 px-3 text-xs font-bold text-on-surface focus:border-primary"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia Bancaria</option>
                  <option value="mercadopago">📱 Mercado Pago</option>
                  <option value="debito">💳 Tarjeta de Débito</option>
                  <option value="credito">💳 Tarjeta de Crédito</option>
                </select>
              </div>
            </div>

            {/* Resumen Financiero Dinámico */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-semibold">Total Estimado</span>
                <span className="font-mono font-bold text-on-surface text-sm">${numEstimatedCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Seña Recibida</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">${numAdvancePayment.toFixed(2)}</span>
              </div>
              <div className="border-l border-outline-variant pl-4">
                <span className="text-amber-400 block text-[10px] uppercase font-semibold">Saldo a Cobrar al Retirar</span>
                <span className="font-mono font-bold text-amber-400 text-base">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: Evidencias Fotográficas de Recepción */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-caps text-xs font-bold">
                5
              </div>
              <h3 className="font-title-sm text-sm text-on-surface font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Evidencias Fotográficas de Recepción
              </h3>
            </div>
            <PhotoUploader
              photos={devicePhotos}
              onChange={setDevicePhotos}
              maxPhotos={8}
            />
          </div>
        </div>

        {/* Columna Derecha: Vista Previa de Documento (80mm o A4) */}
        <div className="xl:col-span-5 h-full">
          <div className="bg-surface-container rounded-2xl border border-outline-variant h-full flex flex-col overflow-hidden shadow-xl">
            {/* Encabezado y Pestañas de Vista Previa */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="font-label-caps text-xs text-on-surface-variant uppercase flex items-center gap-2 font-bold">
                <Printer className="w-4 h-4 text-primary" /> Vista Previa de Documento (Digital / Impresión)
              </span>

              <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60 text-xs w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPrintFormat('80mm')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all text-[11px] ${
                    printFormat === '80mm'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Comanda 80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all text-[11px] ${
                    printFormat === 'a4'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Hoja A4
                </button>
              </div>
            </div>

            {/* Contenedor de Vista Previa en Pantalla */}
            <div className="flex-1 bg-surface-container-highest p-6 flex items-start justify-center overflow-y-auto max-h-[70vh]">
              {printFormat === '80mm' ? (
                /* VISTA PREVIA COMANDA 80MM */
                <div className="bg-white text-black w-[300px] p-6 shadow-2xl font-mono text-xs leading-tight rounded-sm">
                  <div className="text-center mb-4 border-b-2 border-black border-dashed pb-4">
                    <div className="font-bold text-base uppercase tracking-wider">
                      JATECH
                    </div>
                    <div className="text-[10px]">SERVICIOS Y REPARACIONES</div>
                    <div className="mt-2 font-bold text-sm font-mono">#{ticketCode}</div>
                    <div className="text-[10px]">{todayDate}</div>
                  </div>

                  <div className="mb-4 space-y-0.5 text-[11px]">
                    <div className="font-bold uppercase text-[10px] text-slate-700">CLIENTE</div>
                    <div>Nombre: {customerName || '------------------'}</div>
                    <div>DNI: {customerDocumentId || 'N/A'}</div>
                    <div>Tel: {customerPhone || '------------------'}</div>
                  </div>

                  <div className="mb-4 space-y-0.5 text-[11px]">
                    <div className="font-bold uppercase text-[10px] text-slate-700">DISPOSITIVO</div>
                    <div>Rubro: {deviceType}</div>
                    <div>Equipo: {deviceBrand} {deviceModel}</div>
                    <div>SN/IMEI: {serialImei || 'N/A'}</div>
                    <div>Enciende: {powersOn ? 'SÍ' : 'NO'}</div>

                    {/* Mapeo de Campos Personalizados en Ticket 80mm */}
                    {Object.keys(customAttrValues).length > 0 && (
                      <div className="pt-1 mt-1 border-t border-slate-300">
                        {Object.entries(customAttrValues).map(([k, v]) => (
                          <div key={k} className="text-[10px]">
                            <strong className="uppercase">{k}:</strong> {String(v)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-4 border-b-2 border-black border-dashed pb-3 text-[11px]">
                    <div className="font-bold uppercase text-[10px] text-slate-700">FALLA REPORTADA</div>
                    <p className="whitespace-pre-wrap italic mt-0.5">{faultDescription || 'Sin especificar...'}</p>
                  </div>

                  {/* Sección Financiera en Ticket 80mm */}
                  <div className="mb-4 bg-slate-100 p-2.5 rounded border border-slate-300 space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>PRESUPUESTO:</span>
                      <span>${numEstimatedCost.toFixed(2)}</span>
                    </div>
                    {numAdvancePayment > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>SEÑA ({paymentMethod.toUpperCase()}):</span>
                        <span>-${numAdvancePayment.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold border-t border-slate-300 pt-1 text-slate-900">
                      <span>SALDO AL RETIRAR:</span>
                      <span>${remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  {devicePhotos.length > 0 && (
                    <div className="mb-4 text-[10px] text-slate-600 text-center font-bold">
                      📸 {devicePhotos.length} fotos de evidencia registradas
                    </div>
                  )}

                  <div className="text-center text-[9px] text-slate-600 leading-tight">
                    <p>No nos responsabilizamos por pérdida de datos.</p>
                    <p>Garantía de reparación: 30 días.</p>
                  </div>
                </div>
              ) : (
                /* VISTA PREVIA HOJA A4 */
                <div className="bg-white text-black w-full max-w-lg p-6 shadow-2xl font-sans text-xs space-y-4 rounded-sm border border-slate-300">
                  <div className="flex justify-between items-start border-b-2 border-black pb-3">
                    <div>
                      <h2 className="font-extrabold text-base uppercase tracking-tight">JATECH</h2>
                      <p className="text-[10px] font-semibold text-slate-700">ORDEN DE INGRESO Y ASISTENCIA TÉCNICA</p>
                    </div>
                    <div className="text-right bg-slate-100 p-2 rounded border border-slate-300 font-mono">
                      <span className="text-[9px] font-bold text-slate-600 block">CÓDIGO OT</span>
                      <span className="text-base font-extrabold text-slate-900">#{ticketCode}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-700 uppercase block text-[9px]">CLIENTE</span>
                      <p className="font-bold text-xs">{customerName || '------------------'}</p>
                      <p>DNI/CUIT: {customerDocumentId || 'N/A'}</p>
                      <p>Tel: {customerPhone || '------------------'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 uppercase block text-[9px]">DISPOSITIVO</span>
                      <p className="font-bold text-xs">{deviceBrand} {deviceModel || '------------------'}</p>
                      <p>Rubro: {deviceType}</p>
                      <p>IMEI/SN: {serialImei || 'N/A'}</p>
                      {Object.keys(customAttrValues).length > 0 && (
                        <div className="pt-1 text-[10px] text-slate-600 border-t border-slate-200 mt-1">
                          {Object.entries(customAttrValues).map(([k, v]) => (
                            <div key={k}>
                              <strong className="uppercase">{k}:</strong> {String(v)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                    <span className="font-bold uppercase text-[9px] text-slate-600">FALLA REPORTADA AL INGRESO</span>
                    <p className="text-xs italic">{faultDescription || 'Sin especificar...'}</p>
                  </div>

                  {/* Resumen Financiero en Hoja A4 */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-100 p-3 rounded border border-slate-300 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-slate-600 uppercase font-bold block">PRESUPUESTO</span>
                      <span className="font-bold text-xs">${numEstimatedCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-700 uppercase font-bold block">SEÑA ({paymentMethod.toUpperCase()})</span>
                      <span className="font-bold text-xs text-emerald-700">${numAdvancePayment.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-900 uppercase font-extrabold block">SALDO PENDIENTE</span>
                      <span className="font-extrabold text-xs text-slate-900">${remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  {devicePhotos.length > 0 && (
                    <div className="text-[10px] text-slate-600 text-center font-bold">
                      📸 {devicePhotos.length} fotos de evidencia física registradas al ingreso
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-6 text-center text-[10px] font-bold">
                    <div className="border-t border-black pt-1">
                      Firma del Cliente
                    </div>
                    <div className="border-t border-black pt-1">
                      Firma del Técnico
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPONENTE EXCLUSIVO IMPRESIÓN (PRINT MEDIA CSS FOR 80MM) */}
      {printFormat === '80mm' && (
        <div className="hidden print:block print:w-[80mm] print:p-2 print:m-0 print:bg-white print:text-black font-mono text-[10px] leading-tight">
          <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
            <h1 className="font-bold text-xs uppercase">JATECH</h1>
            <p className="text-[9px]">SERVICIOS Y REPARACIONES</p>
            <p className="text-[9px]">TEL/WA: {customerPhone || 'N/A'}</p>
          </div>

          <div className="text-center py-2 mb-2 bg-gray-100 rounded border border-black font-mono">
            <span className="text-[8px] uppercase font-bold">CÓDIGO DE ORDEN</span>
            <div className="text-lg font-bold">#{ticketCode}</div>
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div><strong>FECHA:</strong> {todayDate}</div>
            <div><strong>CLIENTE:</strong> {customerName}</div>
            {customerDocumentId && <div><strong>DNI/CUIT:</strong> {customerDocumentId}</div>}
            {customerPhone && <div><strong>TEL:</strong> {customerPhone}</div>}
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div className="font-bold uppercase">EQUIPO</div>
            <div>{deviceType} - {deviceBrand} {deviceModel}</div>
            {serialImei && <div>SN/IMEI: {serialImei}</div>}
            <div><strong>FALLA:</strong> {faultDescription}</div>
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div><strong>TOTAL:</strong> ${numEstimatedCost.toFixed(2)}</div>
            {numAdvancePayment > 0 && (
              <div><strong>SEÑA ({paymentMethod.toUpperCase()}):</strong> ${numAdvancePayment.toFixed(2)}</div>
            )}
            <div><strong>SALDO PENDIENTE:</strong> ${remainingBalance.toFixed(2)}</div>
          </div>

          <div className="text-[8px] text-center pt-1">
            <p>No nos responsabilizamos por pérdida de datos.</p>
            <p className="font-bold mt-2">www.jatech.ops / #{ticketCode}</p>
          </div>
        </div>
      )}

      {/* COMPONENTE EXCLUSIVO IMPRESIÓN (PRINT MEDIA CSS FOR HOJA A4) */}
      {printFormat === 'a4' && (
        <div className="hidden print:block print:w-full print:p-8 print:m-0 print:bg-white print:text-black font-sans text-xs space-y-6">
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <h1 className="font-extrabold text-xl uppercase">JATECH</h1>
              <p className="text-xs font-bold text-gray-700">ORDEN DE INGRESO Y CERTIFICADO TÉCNICO</p>
              <p className="text-xs">Fecha de Ingreso: {todayDate}</p>
            </div>
            <div className="text-right border border-black p-3 rounded font-mono">
              <span className="text-xs font-bold block uppercase">ORDEN DE SERVICIO</span>
              <span className="text-2xl font-extrabold">#{ticketCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 border border-black rounded text-xs">
            <div>
              <span className="font-bold uppercase text-[10px] text-gray-600 block mb-1">DATOS DEL CLIENTE</span>
              <p className="font-bold text-sm">{customerName}</p>
              <p>DNI / CUIT: {customerDocumentId || 'S/D'}</p>
              <p>Teléfono: {customerPhone}</p>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-gray-600 block mb-1">DATOS DEL DISPOSITIVO</span>
              <p className="font-bold text-sm">{deviceBrand} {deviceModel}</p>
              <p>Tipo: {deviceType}</p>
              <p>IMEI/SN: {serialImei || 'N/A'}</p>
              <p>Enciende: {powersOn ? 'Sí' : 'No'}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border border-black rounded space-y-2">
            <span className="font-bold uppercase text-[10px] text-gray-600">DESCRIPCIÓN DE LA FALLA REPORTADA</span>
            <p className="font-bold text-sm">{faultDescription}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-gray-100 p-3 border border-black rounded text-center font-mono">
            <div>
              <span className="text-[9px] uppercase font-bold block">PRESUPUESTO</span>
              <span className="font-bold text-sm">${numEstimatedCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold block">SEÑA RECIBIDA</span>
              <span className="font-bold text-sm">${numAdvancePayment.toFixed(2)} ({paymentMethod.toUpperCase()})</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold block">SALDO A COBRAR</span>
              <span className="font-bold text-sm">${remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-black pt-3 text-[10px] text-gray-700 leading-relaxed">
            <p>El cliente declara haber entregado el dispositivo descrito en las condiciones mencionadas. Los presupuestos tienen una validez de 15 días. Garantía sobre la falla reparada: 30 días.</p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs font-bold">
            <div className="border-t border-black pt-2">
              Firma y Aclaración del Cliente
            </div>
            <div className="border-t border-black pt-2">
              Firma y Sello del Técnico / Taller
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIÓN WHATSAPP AL CREAR LA ORDEN */}
      {createdOrderForWhatsApp && (
        <WhatsAppModal
          order={createdOrderForWhatsApp}
          shop={currentShop}
          defaultTemplate="ingreso"
          onClose={() => {
            setCreatedOrderForWhatsApp(null);
            router.push('/GestionTecnicos/orders');
          }}
        />
      )}
    </div>
  );
}
