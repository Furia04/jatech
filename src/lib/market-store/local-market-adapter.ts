import {
  MarketCategory,
  MarketProduct,
  MarketStockMovement,
  MarketCashShift,
  MarketCashMovement,
  MarketSale,
  MarketSaleItem,
  CreateMarketProductInput,
  StockMovementType,
  CashMovementType,
  MarketPaymentMethod,
  UnitType,
} from '@/types/market';

// ============================================================================
// SEMILLAS DE PRODUCTOS Y CATEGORÍAS REALISTAS PARA SUPERMERCADO
// ============================================================================

const RAW_CATEGORIES = [
  { id: 'cat-bebidas', shop_id: 'local-shop', name: 'Bebidas y Gaseosas', description: 'Aguas, gaseosas, jugos y bebidas isotónicas' },
  { id: 'cat-almacen', shop_id: 'local-shop', name: 'Almacén y Comestibles', description: 'Arroz, fideos, aceites, harinas y conservas' },
  { id: 'cat-lacteos', shop_id: 'local-shop', name: 'Lácteos y Quesos', description: 'Leche, yogures, quesos y mantecas' },
  { id: 'cat-panaderia', shop_id: 'local-shop', name: 'Panadería y Facturas', description: 'Pan francés, medialunas, facturas y galletitas' },
  { id: 'cat-verduleria', shop_id: 'local-shop', name: 'Verdulería y Frutas', description: 'Frutas y verduras vendidas por kilo / peso' },
  { id: 'cat-limpieza', shop_id: 'local-shop', name: 'Limpieza y Perfumería', description: 'Detergentes, lavandinas, jabones y cuidado personal' },
  { id: 'cat-golosinas', shop_id: 'local-shop', name: 'Snacks y Golosinas', description: 'Chocolates, alfajores, papas fritas y caramelos' },
];

const RAW_PRODUCTS = [
  {
    id: 'prod-001',
    shop_id: 'local-shop',
    category_id: 'cat-bebidas',
    barcode: '7790895000997',
    name: 'Coca Cola Original 2.25L',
    brand: 'Coca Cola',
    cost_price: 2400,
    sale_price: 3600,
    stock: 48,
    min_stock: 12,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-002',
    shop_id: 'local-shop',
    category_id: 'cat-bebidas',
    barcode: '7790895000980',
    name: 'Coca Cola Zero 2.25L',
    brand: 'Coca Cola',
    cost_price: 2400,
    sale_price: 3600,
    stock: 35,
    min_stock: 10,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-003',
    shop_id: 'local-shop',
    category_id: 'cat-bebidas',
    barcode: '7791813421153',
    name: 'Agua Mineral Villavicencio con gas 1.5L',
    brand: 'Villavicencio',
    cost_price: 900,
    sale_price: 1500,
    stock: 60,
    min_stock: 15,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-004',
    shop_id: 'local-shop',
    category_id: 'cat-almacen',
    barcode: '7790070411802',
    name: 'Fideos Lucchetti Tallarín 500g',
    brand: 'Lucchetti',
    cost_price: 850,
    sale_price: 1350,
    stock: 75,
    min_stock: 20,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-005',
    shop_id: 'local-shop',
    category_id: 'cat-almacen',
    barcode: '7790070318538',
    name: 'Aceite de Girasol Cocinero 900ml',
    brand: 'Cocinero',
    cost_price: 1400,
    sale_price: 2200,
    stock: 40,
    min_stock: 10,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-006',
    shop_id: 'local-shop',
    category_id: 'cat-almacen',
    barcode: '7790580120153',
    name: 'Arroz Gallo Oro Parboil 1kg',
    brand: 'Gallo',
    cost_price: 1650,
    sale_price: 2550,
    stock: 32,
    min_stock: 12,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-007',
    shop_id: 'local-shop',
    category_id: 'cat-lacteos',
    barcode: '7790080064500',
    name: 'Leche La Serenísima Entera Clásica 1L Sache',
    brand: 'La Serenísima',
    cost_price: 950,
    sale_price: 1450,
    stock: 50,
    min_stock: 15,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-008',
    shop_id: 'local-shop',
    category_id: 'cat-lacteos',
    barcode: '7790080064609',
    name: 'Yogur La Serenísima Firme Vainilla 190g',
    brand: 'La Serenísima',
    cost_price: 650,
    sale_price: 1100,
    stock: 28,
    min_stock: 8,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-009',
    shop_id: 'local-shop',
    category_id: 'cat-panaderia',
    barcode: '2000000000010',
    name: 'Pan Francés Tradicional (por Kg)',
    brand: 'Panadería Propia',
    cost_price: 1200,
    sale_price: 2200,
    stock: 45,
    min_stock: 10,
    is_weighable: true,
    unit_type: 'kg',
    active: true,
  },
  {
    id: 'prod-010',
    shop_id: 'local-shop',
    category_id: 'cat-verduleria',
    barcode: '2000000000027',
    name: 'Banana Ecuador Premium (por Kg)',
    brand: 'Frutería Fresca',
    cost_price: 1300,
    sale_price: 2100,
    stock: 60,
    min_stock: 15,
    is_weighable: true,
    unit_type: 'kg',
    active: true,
  },
  {
    id: 'prod-011',
    shop_id: 'local-shop',
    category_id: 'cat-verduleria',
    barcode: '2000000000034',
    name: 'Tomate Redondo Seleccionado (por Kg)',
    brand: 'Quinta Regional',
    cost_price: 1100,
    sale_price: 1900,
    stock: 35,
    min_stock: 10,
    is_weighable: true,
    unit_type: 'kg',
    active: true,
  },
  {
    id: 'prod-012',
    shop_id: 'local-shop',
    category_id: 'cat-limpieza',
    barcode: '7791290000452',
    name: 'Detergente Magistral Ultra Limón 500ml',
    brand: 'Magistral',
    cost_price: 1600,
    sale_price: 2600,
    stock: 25,
    min_stock: 6,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
  {
    id: 'prod-013',
    shop_id: 'local-shop',
    category_id: 'cat-golosinas',
    barcode: '7790580982102',
    name: 'Alfajor Havanna Mixto Chocolate 90g',
    brand: 'Havanna',
    cost_price: 1100,
    sale_price: 1800,
    stock: 80,
    min_stock: 20,
    is_weighable: false,
    unit_type: 'unit',
    active: true,
  },
];

const SEED_TIMESTAMP = '2026-10-12T00:00:00.000Z';

const SEED_CATEGORIES: MarketCategory[] = RAW_CATEGORIES.map((c) => ({
  ...c,
  created_at: SEED_TIMESTAMP,
}));

const SEED_PRODUCTS: MarketProduct[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  unit_type: p.unit_type as UnitType,
  created_at: SEED_TIMESTAMP,
  updated_at: SEED_TIMESTAMP,
}));

// Claves de almacenamiento
const STORAGE_KEYS = {
  CATEGORIES: 'jatech_market_categories_v1',
  PRODUCTS: 'jatech_market_products_v1',
  SHIFTS: 'jatech_market_shifts_v1',
  MOVEMENTS: 'jatech_market_movements_v1',
  SALES: 'jatech_market_sales_v1',
  ACTIVE_SHIFT_ID: 'jatech_market_active_shift_id_v1',
};

// Utilidad segura de localStorage
function getSafeStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err);
    return fallback;
  }
}

function setSafeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing to localStorage key ${key}:`, err);
  }
}

// Inicialización de semillas en caso de no existir datos
function ensureInitialized(): void {
  if (typeof window === 'undefined') return;
  
  const existingCats = getSafeStorage<MarketCategory[]>(STORAGE_KEYS.CATEGORIES, []);
  if (existingCats.length === 0) {
    setSafeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  }

  const existingProds = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, []);
  if (existingProds.length === 0) {
    // Vincular objeto categoría a cada producto inicial
    const mapped = SEED_PRODUCTS.map((p) => ({
      ...p,
      category: SEED_CATEGORIES.find((c) => c.id === p.category_id),
    }));
    setSafeStorage(STORAGE_KEYS.PRODUCTS, mapped);
  }
}

// ============================================================================
// SERVICIOS DE CATEGORÍAS Y PRODUCTOS LOCALES
// ============================================================================

export function getLocalCategories(): MarketCategory[] {
  ensureInitialized();
  return getSafeStorage<MarketCategory[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
}

export function getLocalProducts(options?: {
  search?: string;
  categoryId?: string;
  activeOnly?: boolean;
}): MarketProduct[] {
  ensureInitialized();
  let list = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);

  if (options?.activeOnly !== false) {
    list = list.filter((p) => p.active !== false);
  }

  if (options?.categoryId && options.categoryId !== 'all') {
    list = list.filter((p) => p.category_id === options.categoryId);
  }

  if (options?.search) {
    const term = options.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.barcode.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term))
    );
  }

  return list;
}

export function getLocalProductByBarcode(barcode: string): MarketProduct | null {
  ensureInitialized();
  const clean = barcode.trim().toLowerCase();
  const list = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  return list.find((p) => p.barcode.toLowerCase() === clean && p.active !== false) || null;
}

export function saveLocalProduct(input: CreateMarketProductInput & { id?: string }): MarketProduct {
  ensureInitialized();
  const list = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  const categories = getLocalCategories();
  const targetCategory = categories.find((c) => c.id === input.category_id);

  if (input.id) {
    // Actualizar producto existente
    const index = list.findIndex((p) => p.id === input.id);
    if (index >= 0) {
      const updated: MarketProduct = {
        ...list[index],
        barcode: input.barcode.trim(),
        name: input.name.trim(),
        brand: input.brand?.trim() || null,
        category_id: input.category_id || null,
        category: targetCategory,
        cost_price: Number(input.cost_price) || 0,
        sale_price: Number(input.sale_price) || 0,
        stock: Number(input.stock) || 0,
        min_stock: Number(input.min_stock) || 5,
        is_weighable: Boolean(input.is_weighable),
        unit_type: input.unit_type || 'unit',
        active: input.active !== false,
      };
      list[index] = updated;
      setSafeStorage(STORAGE_KEYS.PRODUCTS, list);
      return updated;
    }
  }

  // Crear nuevo producto
  const newProduct: MarketProduct = {
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    shop_id: 'local-shop',
    category_id: input.category_id || null,
    category: targetCategory,
    barcode: input.barcode.trim(),
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    cost_price: Number(input.cost_price) || 0,
    sale_price: Number(input.sale_price) || 0,
    stock: Number(input.stock) || 0,
    min_stock: Number(input.min_stock) || 5,
    is_weighable: Boolean(input.is_weighable),
    unit_type: input.unit_type || 'unit',
    active: input.active !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  list.push(newProduct);
  setSafeStorage(STORAGE_KEYS.PRODUCTS, list);
  return newProduct;
}

export function adjustLocalStock(
  productId: string,
  newStock: number,
  type: StockMovementType,
  reason: string
): MarketProduct | null {
  ensureInitialized();
  const list = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  const idx = list.findIndex((p) => p.id === productId);
  if (idx < 0) return null;

  const current = list[idx];
  const delta = newStock - current.stock;
  current.stock = newStock;
  list[idx] = current;
  setSafeStorage(STORAGE_KEYS.PRODUCTS, list);

  // Registrar movimiento local
  const movements = getSafeStorage<MarketStockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  movements.unshift({
    id: `stkmov-${Date.now()}`,
    shop_id: 'local-shop',
    product_id: productId,
    user_id: 'cajero-local',
    type,
    quantity: Math.abs(delta),
    previous_stock: current.stock - delta,
    new_stock: newStock,
    reason,
    created_at: new Date().toISOString(),
  });
  setSafeStorage(STORAGE_KEYS.MOVEMENTS, movements);

  return current;
}

// ============================================================================
// SERVICIOS DE TURNOS DE CAJA Y ARQUEOS LOCALES
// ============================================================================

export function getActiveLocalShift(): MarketCashShift | null {
  ensureInitialized();
  const activeId = getSafeStorage<string | null>(STORAGE_KEYS.ACTIVE_SHIFT_ID, null);
  if (!activeId) return null;

  const shifts = getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
  const found = shifts.find((s) => s.id === activeId && s.status === 'open');
  return found || null;
}

export function openLocalShift(params: { initial_cash: number; notes?: string }): MarketCashShift {
  ensureInitialized();
  const existing = getActiveLocalShift();
  if (existing) {
    throw new Error('Ya tienes un turno de caja abierto.');
  }

  const shifts = getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
  const initialAmount = Number(params.initial_cash) || 0;

  const newShift: MarketCashShift = {
    id: `shift-${Date.now()}`,
    shop_id: 'local-shop',
    cashier_id: 'cajero-local',
    status: 'open',
    initial_cash: initialAmount,
    expected_cash: initialAmount,
    actual_cash: 0,
    difference: 0,
    total_sales_amount: 0,
    notes: params.notes?.trim() || null,
    opened_at: new Date().toISOString(),
    cashier: {
      email: 'cajero@jatechmarket.local',
      full_name: 'Cajero Principal (Turno Mañana)',
    },
  };

  shifts.unshift(newShift);
  setSafeStorage(STORAGE_KEYS.SHIFTS, shifts);
  setSafeStorage(STORAGE_KEYS.ACTIVE_SHIFT_ID, newShift.id);

  return newShift;
}

export function recordLocalCashMovement(params: {
  shift_id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
}): MarketCashMovement {
  ensureInitialized();
  const amount = Number(params.amount);
  if (amount <= 0) throw new Error('El importe debe ser mayor a cero.');

  const shifts = getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
  const shiftIdx = shifts.findIndex((s) => s.id === params.shift_id);
  if (shiftIdx < 0) throw new Error('Turno de caja no encontrado.');

  const shift = shifts[shiftIdx];
  const delta = params.type === 'income' ? amount : -amount;
  shift.expected_cash = (Number(shift.expected_cash) || 0) + delta;
  shifts[shiftIdx] = shift;
  setSafeStorage(STORAGE_KEYS.SHIFTS, shifts);

  const movements = getSafeStorage<MarketCashMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  const movement: MarketCashMovement = {
    id: `cshmov-${Date.now()}`,
    shop_id: 'local-shop',
    shift_id: params.shift_id,
    user_id: 'cajero-local',
    type: params.type,
    amount,
    reason: params.reason.trim(),
    created_at: new Date().toISOString(),
  };

  movements.unshift(movement);
  setSafeStorage(STORAGE_KEYS.MOVEMENTS, movements);

  return movement;
}

export function closeLocalShift(params: {
  shift_id: string;
  actual_cash: number;
  notes?: string;
}): MarketCashShift {
  ensureInitialized();
  const shifts = getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
  const shiftIdx = shifts.findIndex((s) => s.id === params.shift_id);
  if (shiftIdx < 0) throw new Error('Turno de caja no encontrado.');

  const shift = shifts[shiftIdx];
  const actualCash = Number(params.actual_cash) || 0;
  const expectedCash = Number(shift.expected_cash) || 0;
  const diff = actualCash - expectedCash;

  shift.status = 'closed';
  shift.actual_cash = actualCash;
  shift.difference = diff;
  shift.notes = params.notes?.trim() || shift.notes;
  shift.closed_at = new Date().toISOString();

  shifts[shiftIdx] = shift;
  setSafeStorage(STORAGE_KEYS.SHIFTS, shifts);
  setSafeStorage(STORAGE_KEYS.ACTIVE_SHIFT_ID, null);

  return shift;
}

export function getLocalCashMovements(shiftId?: string): MarketCashMovement[] {
  ensureInitialized();
  const list = getSafeStorage<MarketCashMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  if (!shiftId) return list;
  return list.filter((m) => m.shift_id === shiftId);
}

export function getLocalShifts(): MarketCashShift[] {
  ensureInitialized();
  return getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
}

// ============================================================================
// SERVICIOS DE VENTAS POS LOCALES
// ============================================================================

export interface CreateLocalSaleParams {
  shift_id?: string | null;
  payment_method: MarketPaymentMethod;
  amount_paid: number;
  change_returned: number;
  items: {
    product_id: string;
    barcode: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  payment_details?: Record<string, any>;
}

export function createLocalSale(params: CreateLocalSaleParams): MarketSale {
  ensureInitialized();
  const sales = getSafeStorage<MarketSale[]>(STORAGE_KEYS.SALES, []);
  const products = getSafeStorage<MarketProduct[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  const totalAmount = params.items.reduce((sum, item) => sum + item.total_price, 0);

  const saleNumber = (sales.length + 1).toString().padStart(6, '0');
  const ticketNumber = `T-${saleNumber}`;

  // 1. Crear cabecera de la venta
  const sale: MarketSale = {
    id: `sale-${Date.now()}`,
    shop_id: 'local-shop',
    shift_id: params.shift_id || null,
    cashier_id: 'cajero-local',
    ticket_number: ticketNumber,
    total_amount: totalAmount,
    payment_method: params.payment_method,
    payment_details: params.payment_details || {},
    amount_paid: params.amount_paid,
    change_returned: params.change_returned,
    status: 'completed',
    created_at: new Date().toISOString(),
    cashier: {
      email: 'cajero@jatechmarket.local',
      full_name: 'Cajero Principal',
    },
    items: params.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      shop_id: 'local-shop',
      sale_id: `sale-${Date.now()}`,
      product_id: it.product_id,
      barcode: it.barcode,
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      created_at: new Date().toISOString(),
    })),
  };

  // 2. Descontar stock de cada producto
  for (const item of params.items) {
    const prodIdx = products.findIndex((p) => p.id === item.product_id);
    if (prodIdx >= 0) {
      const p = products[prodIdx];
      p.stock = Math.max(0, p.stock - item.quantity);
      products[prodIdx] = p;
    }
  }
  setSafeStorage(STORAGE_KEYS.PRODUCTS, products);

  // 3. Actualizar finanzas del turno si está activo
  if (params.shift_id) {
    const shifts = getSafeStorage<MarketCashShift[]>(STORAGE_KEYS.SHIFTS, []);
    const shiftIdx = shifts.findIndex((s) => s.id === params.shift_id);
    if (shiftIdx >= 0) {
      const s = shifts[shiftIdx];
      s.total_sales_amount = (Number(s.total_sales_amount) || 0) + totalAmount;
      if (params.payment_method === 'efectivo') {
        s.expected_cash = (Number(s.expected_cash) || 0) + totalAmount;
      }
      shifts[shiftIdx] = s;
      setSafeStorage(STORAGE_KEYS.SHIFTS, shifts);
    }
  }

  sales.unshift(sale);
  setSafeStorage(STORAGE_KEYS.SALES, sales);

  return sale;
}

export function getLocalSales(shiftId?: string): MarketSale[] {
  ensureInitialized();
  const sales = getSafeStorage<MarketSale[]>(STORAGE_KEYS.SALES, []);
  if (!shiftId) return sales;
  return sales.filter((s) => s.shift_id === shiftId);
}

export function getLocalSaleById(saleId: string): MarketSale | null {
  ensureInitialized();
  const sales = getSafeStorage<MarketSale[]>(STORAGE_KEYS.SALES, []);
  return sales.find((s) => s.id === saleId) || null;
}
