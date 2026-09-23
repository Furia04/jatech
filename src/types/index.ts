export type CoreMode = "hardware" | "software" | "solutions";

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  core: CoreMode | "hybrid";
  badge: string;
  iconName: string;
  specs: string[];
  metrics: { label: string; value: string };
  gridClass: string;
}

export interface Operator {
  id: string;
  callsign: string;
  fullName: string;
  role: string;
  clearanceLevel: string;
  division: "Hardware Lab & Field Ops" | "Software Architecture & AI";
  avatarUrl: string;
  experience: string;
  skills: { name: string; level: number; tag: string }[];
  bio: string;
  status: "ACTIVE_LAB" | "DEPLOYED_FIELD" | "AVAILABLE";
}

export interface MetricItem {
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sublabel: string;
  decimals?: number;
}

export interface ProcessStage {
  step: string;
  phase: string;
  title: string;
  description: string;
  leadTime: string;
  protocol: string;
  iconName: string;
}

// ==========================================
// SISTEMA DE GESTIÓN TÉCNICA (SAT) TYPES
// ==========================================

export type OrderStatus =
  | 'recibido'
  | 'en_revision'
  | 'esperando_repuesto'
  | 'esperando_cliente'
  | 'para_entregar'
  | 'entregado'
  | 'abandonado';

export type UserRole = 'owner' | 'technician' | 'superadmin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  shop_id: string;
  can_view_financials: boolean;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'pending_payment' | 'past_due' | 'canceled';

export interface Shop {
  id: string;
  name: string;
  owner_email: string;
  subscription_status: SubscriptionStatus;
  plan_price?: number;
  active?: boolean;
  mp_preapproval_id?: string;
  trial_ends_at?: string;
  created_at?: string;
  orders_count?: number;
  settings?: {
    phone?: string;
    receipt_footer?: string;
    thermal_printer_width?: '80mm' | '58mm';
    ticket?: {
      terms?: string;
    };
    templates?: any[];
  };
}

export interface Customer {
  id: string;
  shop_id: string;
  full_name: string;
  phone: string;
  document_id?: string;
  email?: string;
  created_at: string;
}

export interface Device {
  id: string;
  shop_id: string;
  customer_id: string;
  type: string;
  brand: string;
  model: string;
  serial_number?: string;
  custom_attributes?: Record<string, any>;
  created_at: string;
}

export interface ServiceOrder {
  id: string;
  shop_id: string;
  tracking_code: string;
  device_id: string;
  customer_id: string;
  technician_id?: string;
  status: OrderStatus;
  reported_fault: string;
  technical_diagnosis?: string;
  internal_notes?: string;
  estimated_completion?: string;
  estimated_cost?: number;
  final_price?: number;
  advance_payment?: number;
  payment_method?: string;
  device_photos?: string[];
  warranty_period?: string;
  warranty_until?: string;
  delivered_at?: string;
  updated_at?: string;
  created_at: string;
  // Joins para frontend
  customer_name?: string;
  customer_phone?: string;
  customer_document_id?: string;
  device_info?: string;
  custom_attributes?: Record<string, any>;
  unlock_pattern?: number[];
}

export interface InventoryItem {
  id: string;
  shop_id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reserved_stock?: number;
  min_stock: number;
  cost?: number;
  price: number;
  created_at: string;
}

export interface OrderSpare {
  id: string;
  shop_id: string;
  order_id: string;
  device_id?: string;
  inventory_item_id?: string;
  sku?: string;
  name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  status: 'reserved' | 'consumed' | 'returned';
  created_at: string;
}

export type FieldType = 'text' | 'number' | 'boolean' | 'checkbox' | 'select' | 'textarea';

export interface CustomFieldDefinition {
  id: string;
  key?: string;
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface DeviceCategoryTemplate {
  id: string;
  shop_id?: string;
  category_name: string;
  fields: CustomFieldDefinition[];
}

export type PartOrderStatus = 'pending' | 'arrived' | 'delivered' | 'cancelled';

export interface PartOrder {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  part_name: string;
  device_model?: string;
  advance_payment?: number;
  expected_price?: number;
  status: PartOrderStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// TRABAJOS EXTRA / SERVICIOS EN TERRENO
// ==========================================

export type ExtraJobStatus =
  | 'presupuestado'
  | 'agendado'
  | 'en_progreso'
  | 'completado'
  | 'cobrado'
  | 'cancelado';

export interface ExtraJob {
  id: string;
  shop_id: string;
  job_code: string;
  customer_id: string;
  technician_id?: string | null;
  title: string;
  description?: string | null;
  location_address?: string | null;
  scheduled_at?: string | null;
  status: ExtraJobStatus;
  labor_price: number;
  materials_price: number;
  total_price: number;
  advance_payment: number;
  payment_method?: string | null;
  technical_notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined relation fields
  customer_name?: string;
  customer_phone?: string;
  customer_document_id?: string;
  customer_email?: string;
  technician_name?: string;
}

export interface CreateExtraJobInput {
  customer_id: string;
  title: string;
  description?: string;
  location_address?: string;
  scheduled_at?: string | null;
  status?: ExtraJobStatus;
  labor_price?: number;
  materials_price?: number;
  total_price?: number;
  advance_payment?: number;
  payment_method?: string;
  technical_notes?: string;
  technician_id?: string | null;
}


