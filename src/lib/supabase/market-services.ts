import { supabase } from './client';
import {
  MarketCategory,
  MarketProduct,
  MarketStockMovement,
  MarketCashShift,
  MarketCashMovement,
  MarketSale,
  MarketSaleItem,
  MarketMPConfig,
  CreateMarketProductInput,
  UpdateMarketProductInput,
  OpenCashShiftInput,
  CloseCashShiftInput,
  CreateCashMovementInput,
  CreateMarketSaleInput,
  StockMovementType,
  MarketRole,
} from '@/types/market';

// =======================================================
// CONTEXTO DE TIENDA Y USUARIO PARA SUPERMERCADO
// =======================================================

export interface MarketUserContext {
  userId: string;
  shopId: string;
  email: string;
  fullName: string;
  role: string;
  marketRole: MarketRole;
}

export async function getMarketUserContext(): Promise<MarketUserContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, shop_id, role, market_role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const shopId = profile?.shop_id || user.user_metadata?.shop_id || user.id;
  const role = profile?.role || 'owner';
  const marketRole = (profile?.market_role as MarketRole) || (role === 'owner' ? 'admin' : 'cashier');

  return {
    userId: user.id,
    shopId,
    email: user.email || '',
    fullName: profile?.full_name || user.user_metadata?.full_name || user.email || 'Usuario',
    role,
    marketRole,
  };
}

export function isMarketAdmin(marketRole?: MarketRole, globalRole?: string): boolean {
  return globalRole === 'owner' || globalRole === 'superadmin' || marketRole === 'admin';
}

// =======================================================
// 1. GESTIÓN DE CATEGORÍAS
// =======================================================

export async function fetchMarketCategories(): Promise<MarketCategory[]> {
  const ctx = await getMarketUserContext();
  if (!ctx) return [];

  const { data, error } = await supabase
    .from('market_categories')
    .select('*')
    .eq('shop_id', ctx.shopId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching market categories:', error);
    return [];
  }
  return data || [];
}

export async function createMarketCategory(name: string, description?: string): Promise<MarketCategory | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) return null;

  const { data, error } = await supabase
    .from('market_categories')
    .insert([{
      shop_id: ctx.shopId,
      name: name.trim(),
      description: description?.trim() || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating market category:', error);
    throw error;
  }
  return data;
}

// =======================================================
// 2. GESTIÓN DE CATÁLOGO Y PRODUCTOS
// =======================================================

export async function fetchMarketProducts(options?: {
  search?: string;
  categoryId?: string;
  activeOnly?: boolean;
  limit?: number;
}): Promise<MarketProduct[]> {
  const ctx = await getMarketUserContext();
  if (!ctx) return [];

  let query = supabase
    .from('market_products')
    .select('*, category:market_categories(*)')
    .eq('shop_id', ctx.shopId);

  if (options?.activeOnly !== false) {
    query = query.eq('active', true);
  }

  if (options?.categoryId && options.categoryId !== 'all') {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.search) {
    const term = options.search.trim();
    query = query.or(`barcode.ilike.%${term}%,name.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  query = query.order('name', { ascending: true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching market products:', error);
    return [];
  }
  return data || [];
}

export async function fetchMarketProductByBarcode(barcode: string): Promise<MarketProduct | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) return null;

  const cleanBarcode = barcode.trim();
  const { data, error } = await supabase
    .from('market_products')
    .select('*, category:market_categories(*)')
    .eq('shop_id', ctx.shopId)
    .eq('barcode', cleanBarcode)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching product by barcode ${cleanBarcode}:`, error);
    return null;
  }
  return data;
}

export async function createMarketProduct(input: CreateMarketProductInput): Promise<MarketProduct | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('market_products')
    .insert([{
      shop_id: ctx.shopId,
      category_id: input.category_id || null,
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
    }])
    .select('*, category:market_categories(*)')
    .single();

  if (error) {
    console.error('Error creating market product:', error);
    throw error;
  }

  // Registrar movimiento inicial de stock si es mayor a cero
  if (data && Number(input.stock) > 0) {
    await recordStockMovement({
      productId: data.id,
      quantity: Number(input.stock),
      previousStock: 0,
      newStock: Number(input.stock),
      type: 'purchase',
      reason: 'Inventario inicial de creación de producto',
    });
  }

  return data;
}

export async function updateMarketProduct(input: UpdateMarketProductInput): Promise<MarketProduct | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.barcode !== undefined) updatePayload.barcode = input.barcode.trim();
  if (input.brand !== undefined) updatePayload.brand = input.brand?.trim() || null;
  if (input.category_id !== undefined) updatePayload.category_id = input.category_id || null;
  if (input.cost_price !== undefined) updatePayload.cost_price = Number(input.cost_price);
  if (input.sale_price !== undefined) updatePayload.sale_price = Number(input.sale_price);
  if (input.min_stock !== undefined) updatePayload.min_stock = Number(input.min_stock);
  if (input.is_weighable !== undefined) updatePayload.is_weighable = Boolean(input.is_weighable);
  if (input.unit_type !== undefined) updatePayload.unit_type = input.unit_type;
  if (input.active !== undefined) updatePayload.active = Boolean(input.active);

  const { data, error } = await supabase
    .from('market_products')
    .update(updatePayload)
    .eq('id', input.id)
    .eq('shop_id', ctx.shopId)
    .select('*, category:market_categories(*)')
    .single();

  if (error) {
    console.error('Error updating market product:', error);
    throw error;
  }
  return data;
}

// =======================================================
// 3. MOVIMIENTOS Y AJUSTES DE STOCK
// =======================================================

export async function recordStockMovement(params: {
  productId: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  type: StockMovementType;
  reason?: string;
}): Promise<MarketStockMovement | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) return null;

  const { data, error } = await supabase
    .from('market_stock_movements')
    .insert([{
      shop_id: ctx.shopId,
      product_id: params.productId,
      user_id: ctx.userId,
      quantity: params.quantity,
      previous_stock: params.previousStock,
      new_stock: params.newStock,
      type: params.type,
      reason: params.reason || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error recording stock movement:', error);
  }
  return data;
}

export async function adjustMarketProductStock(
  productId: string,
  newQuantity: number,
  type: StockMovementType,
  reason?: string
): Promise<MarketProduct | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  // Obtener producto actual
  const { data: currentProduct, error: fetchErr } = await supabase
    .from('market_products')
    .select('id, stock')
    .eq('id', productId)
    .eq('shop_id', ctx.shopId)
    .single();

  if (fetchErr || !currentProduct) throw new Error('Producto no encontrado');

  const currentStock = Number(currentProduct.stock) || 0;
  const targetStock = Number(newQuantity);
  const delta = targetStock - currentStock;

  const { data, error } = await supabase
    .from('market_products')
    .update({
      stock: targetStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('shop_id', ctx.shopId)
    .select('*, category:market_categories(*)')
    .single();

  if (error) throw error;

  await recordStockMovement({
    productId,
    quantity: Math.abs(delta),
    previousStock: currentStock,
    newStock: targetStock,
    type,
    reason: reason || 'Ajuste manual de existencias',
  });

  return data;
}

// =======================================================
// 4. TURNOS Y SESIONES DE CAJA
// =======================================================

export async function getActiveCashShift(cashierId?: string): Promise<MarketCashShift | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) return null;

  const targetCashierId = cashierId || ctx.userId;

  const { data, error } = await supabase
    .from('market_cash_shifts')
    .select('*, cashier:users(id, full_name, email)')
    .eq('shop_id', ctx.shopId)
    .eq('cashier_id', targetCashierId)
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Error getting active cash shift:', error);
    return null;
  }
  return data;
}

export async function openCashShift(input: OpenCashShiftInput): Promise<MarketCashShift> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  // Verificar si ya tiene turno abierto
  const existingShift = await getActiveCashShift(ctx.userId);
  if (existingShift) {
    throw new Error('Ya tienes un turno de caja abierto actualmente.');
  }

  const initialAmount = Number(input.initial_cash) || 0;

  const { data, error } = await supabase
    .from('market_cash_shifts')
    .insert([{
      shop_id: ctx.shopId,
      cashier_id: ctx.userId,
      status: 'open',
      initial_cash: initialAmount,
      expected_cash: initialAmount,
      actual_cash: 0,
      difference: 0,
      total_sales_amount: 0,
      notes: input.notes?.trim() || null,
      opened_at: new Date().toISOString(),
    }])
    .select('*, cashier:users(id, full_name, email)')
    .single();

  if (error) {
    console.error('Error opening cash shift:', error);
    throw error;
  }
  return data;
}

export async function closeCashShift(input: CloseCashShiftInput): Promise<MarketCashShift> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const { data: shift, error: fetchErr } = await supabase
    .from('market_cash_shifts')
    .select('*')
    .eq('id', input.shift_id)
    .eq('shop_id', ctx.shopId)
    .single();

  if (fetchErr || !shift) throw new Error('Turno de caja no encontrado');

  const actualCash = Number(input.actual_cash) || 0;
  const expectedCash = Number(shift.expected_cash) || 0;
  const difference = actualCash - expectedCash;

  const { data, error } = await supabase
    .from('market_cash_shifts')
    .update({
      status: 'closed',
      actual_cash: actualCash,
      difference,
      notes: input.notes?.trim() || shift.notes,
      closed_at: new Date().toISOString(),
    })
    .eq('id', input.shift_id)
    .eq('shop_id', ctx.shopId)
    .select('*, cashier:users(id, full_name, email)')
    .single();

  if (error) {
    console.error('Error closing cash shift:', error);
    throw error;
  }
  return data;
}

export async function recordCashMovement(input: CreateCashMovementInput): Promise<MarketCashMovement> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const amount = Number(input.amount);
  if (amount <= 0) throw new Error('El monto del movimiento debe ser mayor a 0');

  const { data, error } = await supabase
    .from('market_cash_movements')
    .insert([{
      shop_id: ctx.shopId,
      shift_id: input.shift_id,
      user_id: ctx.userId,
      type: input.type,
      amount,
      reason: input.reason.trim(),
    }])
    .select('*, user:users(full_name, email)')
    .single();

  if (error) throw error;

  // Actualizar dinero esperado en el turno de caja
  const { data: shift } = await supabase
    .from('market_cash_shifts')
    .select('expected_cash')
    .eq('id', input.shift_id)
    .single();

  if (shift) {
    const currentExpected = Number(shift.expected_cash) || 0;
    const delta = input.type === 'income' ? amount : -amount;
    await supabase
      .from('market_cash_shifts')
      .update({ expected_cash: currentExpected + delta })
      .eq('id', input.shift_id);
  }

  return data;
}

// =======================================================
// 5. VENTAS POS Y DESCUENTO DE STOCK
// =======================================================

export async function createMarketSale(input: CreateMarketSaleInput): Promise<MarketSale> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const ticketNumber = input.ticket_number || `T-${Date.now().toString().slice(-6)}`;
  const totalAmount = Number(input.total_amount);

  // 1. Crear cabecera de la venta
  const { data: sale, error: saleErr } = await supabase
    .from('market_sales')
    .insert([{
      shop_id: ctx.shopId,
      shift_id: input.shift_id || null,
      cashier_id: ctx.userId,
      ticket_number: ticketNumber,
      total_amount: totalAmount,
      payment_method: input.payment_method,
      payment_details: input.payment_details || {},
      amount_paid: Number(input.amount_paid) || totalAmount,
      change_returned: Number(input.change_returned) || 0,
      status: 'completed',
    }])
    .select('*, cashier:users(full_name, email)')
    .single();

  if (saleErr || !sale) {
    console.error('Error creating sale record:', saleErr);
    throw saleErr;
  }

  // 2. Insertar los ítems vendidos
  if (input.items && input.items.length > 0) {
    const itemsToInsert = input.items.map((item) => ({
      shop_id: ctx.shopId,
      sale_id: sale.id,
      product_id: item.product_id || null,
      barcode: item.barcode,
      product_name: item.product_name,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
    }));

    const { error: itemsErr } = await supabase
      .from('market_sale_items')
      .insert(itemsToInsert);

    if (itemsErr) {
      console.error('Error creating sale items:', itemsErr);
    }

    // 3. Descontar stock de cada producto vendido
    for (const item of input.items) {
      if (item.product_id) {
        try {
          const { data: prod } = await supabase
            .from('market_products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (prod) {
            const currentStock = Number(prod.stock) || 0;
            const soldQty = Number(item.quantity) || 1;
            const newStock = currentStock - soldQty;

            await supabase
              .from('market_products')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', item.product_id);

            await recordStockMovement({
              productId: item.product_id,
              quantity: soldQty,
              previousStock: currentStock,
              newStock,
              type: 'sale',
              reason: `Venta POS #${ticketNumber}`,
            });
          }
        } catch (stkErr) {
          console.warn(`Error discounting stock for product ${item.product_id}:`, stkErr);
        }
      }
    }
  }

  // 4. Si hay turno de caja asociado, actualizar total de ventas y monto esperado (si fue en efectivo)
  if (input.shift_id) {
    try {
      const { data: shift } = await supabase
        .from('market_cash_shifts')
        .select('expected_cash, total_sales_amount')
        .eq('id', input.shift_id)
        .single();

      if (shift) {
        const currentSalesTotal = Number(shift.total_sales_amount) || 0;
        let newExpectedCash = Number(shift.expected_cash) || 0;

        if (input.payment_method === 'efectivo') {
          newExpectedCash += totalAmount;
        }

        await supabase
          .from('market_cash_shifts')
          .update({
            total_sales_amount: currentSalesTotal + totalAmount,
            expected_cash: newExpectedCash,
          })
          .eq('id', input.shift_id);
      }
    } catch (shiftErr) {
      console.warn('Error updating shift financials with sale:', shiftErr);
    }
  }

  return sale;
}

// =======================================================
// 6. CONFIGURACIÓN MERCADO PAGO POR TIENDA
// =======================================================

export async function getMarketMPConfig(): Promise<MarketMPConfig | null> {
  const ctx = await getMarketUserContext();
  if (!ctx) return null;

  const { data, error } = await supabase
    .from('market_mp_configs')
    .select('*')
    .eq('shop_id', ctx.shopId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching market MP config:', error);
    return null;
  }
  return data;
}

export async function saveMarketMPConfig(params: {
  access_token: string;
  public_key?: string;
  pos_id?: string;
  user_id_mp?: string;
  is_active?: boolean;
}): Promise<MarketMPConfig> {
  const ctx = await getMarketUserContext();
  if (!ctx) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('market_mp_configs')
    .upsert({
      shop_id: ctx.shopId,
      access_token: params.access_token.trim(),
      public_key: params.public_key?.trim() || null,
      pos_id: params.pos_id?.trim() || null,
      user_id_mp: params.user_id_mp?.trim() || null,
      is_active: params.is_active !== false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'shop_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving market MP config:', error);
    throw error;
  }
  return data;
}
