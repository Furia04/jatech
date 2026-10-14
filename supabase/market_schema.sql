-- =========================================================================
-- ESQUEMA COMPLETO SUPABASE: JATECH MARKET & SEGREGACIÓN SAAS MULTI-TENANT
-- =========================================================================
-- Ejecutar en el SQL Editor de tu proyecto en Supabase (app.supabase.com)
-- Incluye: Tablas, Relaciones, RLS de Seguridad, Soporte Superadmin e Índices
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EXTENSIÓN DE TABLA SHOPS (TIENDAS / TALLERES)
-- Asegura columnas para segregar módulos: Taller vs Supermercado
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops') THEN
    CREATE TABLE shops (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      owner_email TEXT,
      subscription_status TEXT DEFAULT 'pending_payment' CHECK (subscription_status IN ('active', 'pending_payment', 'suspended', 'trial')),
      subscription_module TEXT DEFAULT 'workshop' CHECK (subscription_module IN ('workshop', 'market', 'both')),
      plan_price NUMERIC(12,2) DEFAULT 20000,
      active BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Agregar columnas de segregación si ya existe la tabla
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_module TEXT DEFAULT 'workshop' CHECK (subscription_module IN ('workshop', 'market', 'both'));
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending_payment' CHECK (subscription_status IN ('active', 'pending_payment', 'suspended', 'trial'));
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS plan_price NUMERIC(12,2) DEFAULT 20000;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. EXTENSIÓN DE TABLA USERS (PERFILES)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS market_role TEXT DEFAULT 'admin' CHECK (market_role IN ('admin', 'manager', 'cashier'));
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
  END IF;
END $$;

-- 3. CATEGORÍAS DEL SUPERMERCADO
CREATE TABLE IF NOT EXISTS market_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTOS DEL SUPERMERCADO (CÓDIGO DE BARRAS, PESABLES Y STOCK)
CREATE TABLE IF NOT EXISTS market_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES market_categories(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  cost_price NUMERIC(12,2) DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12,3) NOT NULL DEFAULT 5,
  is_weighable BOOLEAN DEFAULT false,
  unit_type TEXT DEFAULT 'unit' CHECK (unit_type IN ('unit', 'kg', 'g', 'l', 'ml')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_market_products_shop_barcode UNIQUE(shop_id, barcode)
);

-- 5. AUDITORÍA DE MOVIMIENTOS DE STOCK (KÁRDEX)
CREATE TABLE IF NOT EXISTS market_stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  previous_stock NUMERIC(12,3) NOT NULL,
  new_stock NUMERIC(12,3) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'loss', 'return')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TURNOS Y SESIONES DE CAJA (ARQUEO Z)
CREATE TABLE IF NOT EXISTS market_cash_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_cash NUMERIC(12,2) DEFAULT 0,
  difference NUMERIC(12,2) DEFAULT 0,
  total_sales_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 7. MOVIMIENTOS MANUALES DE GAVETA (INGRESOS / RETIROS)
CREATE TABLE IF NOT EXISTS market_cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES market_cash_shifts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VENTAS DEL PUNTO DE VENTA (CABECERAS)
CREATE TABLE IF NOT EXISTS market_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES market_cash_shifts(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mercadopago_qr', 'mixto')),
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ÍTEMS DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS market_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES market_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES market_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CONFIGURACIÓN MERCADO PAGO QR POR TIENDA
CREATE TABLE IF NOT EXISTS market_mp_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT,
  collector_id TEXT,
  pos_id TEXT,
  external_pos_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUSCRIPCIONES Y COBROS DEL SAAS DE SUPERMERCADO
CREATE TABLE IF NOT EXISTS market_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'plan-market-retail',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('active', 'pending_payment', 'suspended', 'trial')),
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  price NUMERIC(12,2) DEFAULT 25000,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ÍNDICES DE RENDIMIENTO (BÚSQUEDA INSTANTÁNEA EN POS Y REPORTES)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_market_products_shop_barcode ON market_products(shop_id, barcode);
CREATE INDEX IF NOT EXISTS idx_market_products_shop_name ON market_products(shop_id, name);
CREATE INDEX IF NOT EXISTS idx_market_sales_shop_created ON market_sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_cash_shifts_shop_status ON market_cash_shifts(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_market_sale_items_sale ON market_sale_items(sale_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) MULTI-TENANT & SUPERADMIN
-- =========================================================================

-- Habilitar RLS
ALTER TABLE market_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_mp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_subscriptions ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para verificar si el usuario es Superadmin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
      AND (
        email = 'furiaortiz04@gmail.com' 
        OR (raw_user_meta_data->>'role') = 'superadmin'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
      AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Categorías
DROP POLICY IF EXISTS "Categorias por tienda o superadmin" ON market_categories;
CREATE POLICY "Categorias por tienda o superadmin" ON market_categories
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Productos
DROP POLICY IF EXISTS "Productos por tienda o superadmin" ON market_products;
CREATE POLICY "Productos por tienda o superadmin" ON market_products
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Turnos de Caja
DROP POLICY IF EXISTS "Turnos por tienda o superadmin" ON market_cash_shifts;
CREATE POLICY "Turnos por tienda o superadmin" ON market_cash_shifts
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Movimientos de Caja
DROP POLICY IF EXISTS "Movimientos caja por tienda o superadmin" ON market_cash_movements;
CREATE POLICY "Movimientos caja por tienda o superadmin" ON market_cash_movements
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Ventas
DROP POLICY IF EXISTS "Ventas por tienda o superadmin" ON market_sales;
CREATE POLICY "Ventas por tienda o superadmin" ON market_sales
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Ítems de Venta
DROP POLICY IF EXISTS "Items de venta por tienda o superadmin" ON market_sale_items;
CREATE POLICY "Items de venta por tienda o superadmin" ON market_sale_items
  FOR ALL USING (
    is_super_admin() OR sale_id IN (
      SELECT id FROM market_sales WHERE is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
    )
  );

-- Políticas para Auditoría de Stock
DROP POLICY IF EXISTS "Stock movements por tienda o superadmin" ON market_stock_movements;
CREATE POLICY "Stock movements por tienda o superadmin" ON market_stock_movements
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );

-- Políticas para Suscripciones
DROP POLICY IF EXISTS "Suscripciones market por tienda o superadmin" ON market_subscriptions;
CREATE POLICY "Suscripciones market por tienda o superadmin" ON market_subscriptions
  FOR ALL USING (
    is_super_admin() OR shop_id IN (SELECT shop_id FROM users WHERE id = auth.uid())
  );
