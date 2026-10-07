// ==============================================================================
// TIPOS Y CONTRATOS DE DATOS: MÓDULO DE SUPERMERCADO MULTI-TENANT
// ==============================================================================

export type MarketRole = 'cashier' | 'manager' | 'admin';

export type UnitType = 'unit' | 'kg' | 'g' | 'l' | 'm';

export type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'waste' | 'cancellation';

export type CashShiftStatus = 'open' | 'closed';

export type CashMovementType = 'income' | 'expense';

export type MarketPaymentMethod =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'mercadopago_qr'
  | 'mixto';

export interface MarketCategory {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface MarketProduct {
  id: string;
  shop_id: string;
  category_id?: string | null;
  barcode: string;
  name: string;
  brand?: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  is_weighable: boolean;
  unit_type: UnitType;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: MarketCategory | null;
}

export interface MarketStockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  user_id?: string | null;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  type: StockMovementType;
  reason?: string | null;
  created_at: string;
  product?: MarketProduct | null;
  user?: {
    email: string;
    full_name?: string | null;
  } | null;
}

export interface MarketCashShift {
  id: string;
  shop_id: string;
  cashier_id: string;
  status: CashShiftStatus;
  initial_cash: number;
  expected_cash: number;
  actual_cash: number;
  difference: number;
  total_sales_amount: number;
  notes?: string | null;
  opened_at: string;
  closed_at?: string | null;
  cashier?: {
    full_name?: string | null;
    email: string;
  } | null;
}

export interface MarketCashMovement {
  id: string;
  shop_id: string;
  shift_id: string;
  user_id?: string | null;
  type: CashMovementType;
  amount: number;
  reason: string;
  created_at: string;
  user?: {
    full_name?: string | null;
    email: string;
  } | null;
}

export interface MarketSale {
  id: string;
  shop_id: string;
  shift_id?: string | null;
  cashier_id: string;
  ticket_number: string;
  total_amount: number;
  payment_method: MarketPaymentMethod;
  payment_details?: Record<string, any>;
  amount_paid: number;
  change_returned: number;
  status: 'completed' | 'cancelled';
  created_at: string;
  items?: MarketSaleItem[];
  cashier?: {
    full_name?: string | null;
    email: string;
  } | null;
}

export interface MarketSaleItem {
  id: string;
  shop_id: string;
  sale_id: string;
  product_id?: string | null;
  barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface MarketMPConfig {
  id: string;
  shop_id: string;
  access_token: string;
  public_key?: string | null;
  pos_id?: string | null;
  user_id_mp?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Input DTOs para creación y actualización
export interface CreateMarketProductInput {
  category_id?: string | null;
  barcode: string;
  name: string;
  brand?: string | null;
  cost_price?: number;
  sale_price: number;
  stock?: number;
  min_stock?: number;
  is_weighable?: boolean;
  unit_type?: UnitType;
  active?: boolean;
}

export interface UpdateMarketProductInput extends Partial<CreateMarketProductInput> {
  id: string;
}

export interface OpenCashShiftInput {
  initial_cash: number;
  notes?: string;
}

export interface CloseCashShiftInput {
  shift_id: string;
  actual_cash: number;
  notes?: string;
}

export interface CreateCashMovementInput {
  shift_id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
}

export interface CreateMarketSaleItemInput {
  product_id?: string;
  barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateMarketSaleInput {
  shift_id?: string | null;
  ticket_number?: string;
  total_amount: number;
  payment_method: MarketPaymentMethod;
  payment_details?: Record<string, any>;
  amount_paid?: number;
  change_returned?: number;
  items: CreateMarketSaleItemInput[];
}
