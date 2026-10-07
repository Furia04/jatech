-- ==============================================================================
-- MIGRACIÓN: ESQUEMA DE DATOS Y RLS MULTI-TENANT PARA SISTEMA DE SUPERMERCADO
-- Versión: 20261007_market_schema.sql
-- ==============================================================================

-- 1. ASIGNACIÓN DE ROL DE SUPERMERCADO EN USUARIOS EXISTENTES
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'market_role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN market_role TEXT DEFAULT 'cashier';
    ALTER TABLE public.users ADD CONSTRAINT check_market_role CHECK (market_role IN ('cashier', 'manager', 'admin'));
  END IF;
END $$;

-- 2. TABLA DE CATEGORÍAS DE PRODUCTOS DE SUPERMERCADO
CREATE TABLE IF NOT EXISTS public.market_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CATÁLOGO DE PRODUCTOS (CÓDIGO DE BARRAS, PESABLES Y PRECIOS)
CREATE TABLE IF NOT EXISTS public.market_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.market_categories(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  cost_price NUMERIC(12,2) DEFAULT 0.00,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
  min_stock NUMERIC(12,3) DEFAULT 5.000,
  is_weighable BOOLEAN DEFAULT FALSE,
  unit_type TEXT DEFAULT 'unit' CHECK (unit_type IN ('unit', 'kg', 'g', 'l', 'm')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE MOVIMIENTOS Y AUDITORÍA DE STOCK
CREATE TABLE IF NOT EXISTS public.market_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  previous_stock NUMERIC(12,3) NOT NULL,
  new_stock NUMERIC(12,3) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment', 'waste', 'cancellation')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE TURNOS DE CAJA (SESIONES DE CAJERO)
CREATE TABLE IF NOT EXISTS public.market_cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  expected_cash NUMERIC(12,2) DEFAULT 0.00,
  actual_cash NUMERIC(12,2) DEFAULT 0.00,
  difference NUMERIC(12,2) DEFAULT 0.00,
  total_sales_amount NUMERIC(12,2) DEFAULT 0.00,
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 6. TABLA DE MOVIMIENTOS EXTRAORDINARIOS DE CAJA (INGRESOS / EGRESOS)
CREATE TABLE IF NOT EXISTS public.market_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.market_cash_shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE VENTAS DEL PUNTO DE VENTA (POS)
CREATE TABLE IF NOT EXISTS public.market_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.market_cash_shifts(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mercadopago_qr', 'mixto')),
  payment_details JSONB DEFAULT '{}'::jsonb,
  amount_paid NUMERIC(12,2) DEFAULT 0.00,
  change_returned NUMERIC(12,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE ÍTEMS VENDIDOS POR VENTA
CREATE TABLE IF NOT EXISTS public.market_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.market_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.market_products(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1.000,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE CONFIGURACIÓN Y CREDENCIALES DE MERCADO PAGO POR TENANT
CREATE TABLE IF NOT EXISTS public.market_mp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  public_key TEXT,
  pos_id TEXT,
  user_id_mp TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. ÍNDICES DE RENDIMIENTO Y UNICIDAD MULTI-TENANT
-- ==============================================================================

-- 10.1 Código de barras único por tienda (D-01 / Pitfalls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_products_shop_barcode 
ON public.market_products(shop_id, barcode);

-- 10.2 Control de turno único abierto por cajero (D-03 / Pitfalls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_open_shift_per_cashier 
ON public.market_cash_shifts(shop_id, cashier_id) 
WHERE (status = 'open');

-- 10.3 Índices de búsqueda y filtrado de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_market_products_shop_id ON public.market_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_market_products_category ON public.market_products(category_id);
CREATE INDEX IF NOT EXISTS idx_market_stock_movements_prod ON public.market_stock_movements(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_market_cash_shifts_shop ON public.market_cash_shifts(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_market_cash_movements_shift ON public.market_cash_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_market_sales_shift ON public.market_sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_market_sales_shop_date ON public.market_sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_sale_items_sale ON public.market_sale_items(sale_id);

-- ==============================================================================
-- 11. FUNCIONES AUXILIARES Y ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Función para verificar si el usuario es administrador de supermercado
CREATE OR REPLACE FUNCTION public.is_market_admin()
RETURNS BOOLEAN AS $$
  SELECT (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
        AND (role = 'owner' OR role = 'superadmin' OR market_role = 'admin')
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_mp_configs ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas para idempotencia
DROP POLICY IF EXISTS "Tenant Isolation Market Categories" ON public.market_categories;
DROP POLICY IF EXISTS "Tenant Isolation Market Products" ON public.market_products;
DROP POLICY IF EXISTS "Tenant Isolation Market Movements" ON public.market_stock_movements;
DROP POLICY IF EXISTS "Tenant Isolation Market Shifts" ON public.market_cash_shifts;
DROP POLICY IF EXISTS "Tenant Isolation Market Cash Movements" ON public.market_cash_movements;
DROP POLICY IF EXISTS "Tenant Isolation Market Sales" ON public.market_sales;
DROP POLICY IF EXISTS "Tenant Isolation Market Sale Items" ON public.market_sale_items;
DROP POLICY IF EXISTS "Tenant Isolation Market MP Configs" ON public.market_mp_configs;

-- 11.1 Políticas estándar de aislamiento multi-tenant por shop_id
CREATE POLICY "Tenant Isolation Market Categories" ON public.market_categories
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Products" ON public.market_products
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Movements" ON public.market_stock_movements
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Shifts" ON public.market_cash_shifts
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Cash Movements" ON public.market_cash_movements
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Sales" ON public.market_sales
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

CREATE POLICY "Tenant Isolation Market Sale Items" ON public.market_sale_items
  FOR ALL
  USING (shop_id = public.get_current_shop_id() OR public.is_superadmin())
  WITH CHECK (shop_id = public.get_current_shop_id() OR public.is_superadmin());

-- 11.2 Política restrictiva para credenciales de Mercado Pago (D-04: solo owners/admins)
CREATE POLICY "Tenant Isolation Market MP Configs" ON public.market_mp_configs
  FOR ALL
  USING (
    ((shop_id = public.get_current_shop_id()) AND public.is_market_admin()) 
    OR public.is_superadmin()
  )
  WITH CHECK (
    ((shop_id = public.get_current_shop_id()) AND public.is_market_admin()) 
    OR public.is_superadmin()
  );

-- Conceder permisos a roles anon y authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_stock_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_cash_shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_cash_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_mp_configs TO authenticated;
