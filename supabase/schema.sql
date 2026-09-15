-- =======================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS POSTGRESQL / SUPABASE
-- SISTEMA DE ATENCIÓN TÉCNICA MULTIRUBRO & SAAS
-- =======================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS PERSONALIZADOS (ENUMS)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'technician', 'superadmin');
  ELSE
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'recibido',
      'en_revision',
      'esperando_repuesto',
      'esperando_cliente',
      'para_entregar',
      'entregado',
      'abandonado'
    );
  ELSE
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'entregado';
  END IF;
END $$;

-- 3. TABLA DE TALLERES (SHOPS / TENANTS)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT,
  owner_email TEXT,
  subscription_status TEXT DEFAULT 'pending_payment',
  plan_price NUMERIC(10,2) DEFAULT 20000.00,
  active BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASEGURAR COMPATIBILIDAD DE COLUMNAS EN LA TABLA SHOPS
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.shops ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending_payment';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS plan_price NUMERIC(10,2) DEFAULT 20000.00;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. TABLA DE USUARIOS DEL SISTEMA (USERS / PROFILES)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'owner',
  can_view_financials BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'owner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_view_financials BOOLEAN DEFAULT TRUE;

-- 5. TABLA DE CLIENTES (CUSTOMERS)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  document_id TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE DISPOSITIVOS / EQUIPOS (DEVICES)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  custom_attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE ÓRDENES DE SERVICIO (SERVICE_ORDERS)
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tracking_code TEXT UNIQUE NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id),
  status order_status DEFAULT 'recibido',
  reported_fault TEXT NOT NULL,
  technical_diagnosis TEXT,
  internal_notes TEXT,
  estimated_completion TEXT,
  estimated_cost NUMERIC(10,2) DEFAULT 0.00,
  final_price NUMERIC(10,2) DEFAULT 0.00,
  advance_payment NUMERIC(10,2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'efectivo',
  device_photos JSONB DEFAULT '[]'::jsonb,
  warranty_period TEXT,
  warranty_until TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE INVENTARIO Y REPUESTOS (INVENTORY)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  reserved_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 2,
  cost NUMERIC(10,2) DEFAULT 0.00,
  price NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPATIBILIDAD DE COLUMNA RESERVED_STOCK EN INVENTARIO
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS reserved_stock INT DEFAULT 0;

-- 9. TABLA DE PLANTILLAS POR CATEGORÍA DE DISPOSITIVO (DEVICE_CATEGORY_TEMPLATES)
CREATE TABLE IF NOT EXISTS device_category_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA DE REPUESTOS EN CUSTODIA / INSTALADOS EN EQUIPOS (ORDER_SPARES)
CREATE TABLE IF NOT EXISTS order_spares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  sku TEXT,
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) DEFAULT 0.00,
  unit_price NUMERIC(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'reserved', -- 'reserved' (almacenado en equipo), 'consumed' (entregado), 'returned' (devuelto a stock)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 10. SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- =======================================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_spares ENABLE ROW LEVEL SECURITY;

-- 10.1 FUNCIONES AUXILIARES PARA CONTROL DE ACCESO
CREATE OR REPLACE FUNCTION public.get_current_shop_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT shop_id FROM public.users WHERE id = auth.uid()),
    auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT (
    COALESCE(auth.jwt() ->> 'email', '') IN ('furiaortiz04@gmail.com', 'admin@prorepair.com')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- LIMPIEZA DE POLÍTICAS PREVIAS
DROP POLICY IF EXISTS "Allow All Shops" ON shops;
DROP POLICY IF EXISTS "Allow All Users" ON users;
DROP POLICY IF EXISTS "Allow All Orders" ON service_orders;
DROP POLICY IF EXISTS "Allow All Customers" ON customers;
DROP POLICY IF EXISTS "Allow All Devices" ON devices;
DROP POLICY IF EXISTS "Allow All Inventory" ON inventory;
DROP POLICY IF EXISTS "Allow All Templates" ON device_category_templates;
DROP POLICY IF EXISTS "Allow All Spares" ON order_spares;

DROP POLICY IF EXISTS "Superadmin Full Access Shops" ON shops;
DROP POLICY IF EXISTS "Users Select Own Shop" ON shops;
DROP POLICY IF EXISTS "Users Update Own Shop" ON shops;
DROP POLICY IF EXISTS "Users Insert Own Shop" ON shops;

DROP POLICY IF EXISTS "Superadmin Full Access Users" ON users;
DROP POLICY IF EXISTS "Users View Own Shop Members" ON users;
DROP POLICY IF EXISTS "Users Update Own Profile" ON users;
DROP POLICY IF EXISTS "Users Insert Own Profile" ON users;

DROP POLICY IF EXISTS "Superadmin Full Access Customers" ON customers;
DROP POLICY IF EXISTS "Tenant Isolation Customers" ON customers;

DROP POLICY IF EXISTS "Superadmin Full Access Devices" ON devices;
DROP POLICY IF EXISTS "Tenant Isolation Devices" ON devices;

DROP POLICY IF EXISTS "Superadmin Full Access Orders" ON service_orders;
DROP POLICY IF EXISTS "Tenant Isolation Orders" ON service_orders;

DROP POLICY IF EXISTS "Superadmin Full Access Inventory" ON inventory;
DROP POLICY IF EXISTS "Tenant Isolation Inventory" ON inventory;

DROP POLICY IF EXISTS "Superadmin Full Access Templates" ON device_category_templates;
DROP POLICY IF EXISTS "Tenant Isolation Templates" ON device_category_templates;

DROP POLICY IF EXISTS "Tenant Isolation Spares" ON order_spares;
DROP POLICY IF EXISTS "Superadmin Full Access Spares" ON order_spares;

-- 10.2 POLÍTICAS DE SHOPS (TALLERES)
CREATE POLICY "Superadmin Full Access Shops" ON shops
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Users Select Own Shop" ON shops
  FOR SELECT
  USING (id = public.get_current_shop_id() OR id = auth.uid() OR owner_email = auth.jwt() ->> 'email');

CREATE POLICY "Users Update Own Shop" ON shops
  FOR UPDATE
  USING (id = public.get_current_shop_id() OR id = auth.uid() OR owner_email = auth.jwt() ->> 'email')
  WITH CHECK (id = public.get_current_shop_id() OR id = auth.uid() OR owner_email = auth.jwt() ->> 'email');

CREATE POLICY "Users Insert Own Shop" ON shops
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR public.is_superadmin());

-- 10.3 POLÍTICAS DE USERS (PERFILES)
CREATE POLICY "Superadmin Full Access Users" ON users
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Users View Own Shop Members" ON users
  FOR SELECT
  USING (shop_id = public.get_current_shop_id() OR id = auth.uid());

CREATE POLICY "Users Insert Own Profile" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users Update Own Profile" ON users
  FOR UPDATE
  USING (id = auth.uid() OR shop_id = public.get_current_shop_id())
  WITH CHECK (id = auth.uid() OR shop_id = public.get_current_shop_id());

-- 10.4 POLÍTICAS DE CUSTOMERS (CLIENTES)
CREATE POLICY "Superadmin Full Access Customers" ON customers
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Customers" ON customers
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.5 POLÍTICAS DE DEVICES (DISPOSITIVOS)
CREATE POLICY "Superadmin Full Access Devices" ON devices
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Devices" ON devices
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.6 POLÍTICAS DE SERVICE_ORDERS (ÓRDENES DE SERVICIO)
CREATE POLICY "Superadmin Full Access Orders" ON service_orders
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Orders" ON service_orders
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.7 POLÍTICAS DE INVENTORY (INVENTARIO)
CREATE POLICY "Superadmin Full Access Inventory" ON inventory
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Inventory" ON inventory
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.8 POLÍTICAS DE DEVICE_CATEGORY_TEMPLATES (PLANTILLAS)
CREATE POLICY "Superadmin Full Access Templates" ON device_category_templates
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Templates" ON device_category_templates
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.9 POLÍTICAS DE ORDER_SPARES (REPUESTOS ASIGNADOS A ÓRDENES)
CREATE POLICY "Superadmin Full Access Spares" ON order_spares
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Tenant Isolation Spares" ON order_spares
  FOR ALL
  USING (shop_id = public.get_current_shop_id())
  WITH CHECK (shop_id = public.get_current_shop_id());

-- 10.10 LIMPIEZA DE POLÍTICAS PÚBLICAS INSEGURAS
-- Nota: El seguimiento público B2C se realiza exclusivamente mediante la función segura RPC get_public_order_tracking(p_query)
DROP POLICY IF EXISTS "Public Read Service Orders" ON service_orders;
DROP POLICY IF EXISTS "Public Read Customers" ON customers;
DROP POLICY IF EXISTS "Public Read Devices" ON devices;
DROP POLICY IF EXISTS "Public Read Shops" ON shops;

-- =======================================================
-- 11. TRIGGER AUTOMÁTICO AL REGISTRAR UN USUARIO EN AUTH
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_name TEXT;
  v_full_name TEXT;
  v_slug TEXT;
BEGIN
  v_shop_name := COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Taller de ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_slug := LOWER(REGEXP_REPLACE(v_shop_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  
  -- 1. Insertar automáticamente en public.shops
  INSERT INTO public.shops (id, name, slug, owner_email, subscription_status, plan_price, active)
  VALUES (
    NEW.id,
    v_shop_name,
    v_slug,
    NEW.email,
    'pending_payment',
    20000.00,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        slug = COALESCE(public.shops.slug, EXCLUDED.slug),
        owner_email = EXCLUDED.owner_email;

  -- 2. Insertar automáticamente en public.users
  INSERT INTO public.users (id, shop_id, email, full_name, role, can_view_financials)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    v_full_name,
    'owner',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =======================================================
-- 12. SINCRONIZACIÓN DE USUARIOS PREVIOS DE AUTH A SHOPS
-- =======================================================

INSERT INTO public.shops (id, name, slug, owner_email, subscription_status, plan_price, active)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'shop_name', 'Taller de ' || COALESCE(raw_user_meta_data->>'full_name', email)),
  LOWER(REGEXP_REPLACE(COALESCE(raw_user_meta_data->>'shop_name', email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 8),
  email,
  'pending_payment',
  20000.00,
  FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, shop_id, email, full_name, role, can_view_financials)
SELECT 
  id,
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'owner',
  TRUE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- COMPATIBILIDAD DE COLUMNAS DE GARANTÍA
-- COMPATIBILIDAD DE COLUMNAS DE GARANTÍA, ANTICIPOS Y EVIDENCIAS FOTOGRÁFICAS
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS warranty_period TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS warranty_until TIMESTAMPTZ;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS advance_payment NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'efectivo';
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS device_photos JSONB DEFAULT '[]'::jsonb;

-- =======================================================
-- 13. FUNCIÓN RPC PARA SEGUIMIENTO PÚBLICO SEGURO (B2C)
-- =======================================================

DROP FUNCTION IF EXISTS public.get_public_order_tracking(TEXT);
DROP FUNCTION IF EXISTS public.get_public_order_tracking(p_query TEXT);

CREATE OR REPLACE FUNCTION public.get_public_order_tracking(p_query TEXT)
RETURNS TABLE (
  id UUID,
  tracking_code TEXT,
  shop_name TEXT,
  shop_phone TEXT,
  status TEXT,
  reported_fault TEXT,
  technical_diagnosis TEXT,
  estimated_completion TEXT,
  final_price NUMERIC,
  advance_payment NUMERIC,
  payment_method TEXT,
  device_photos JSONB,
  warranty_period TEXT,
  warranty_until TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_document_id TEXT,
  device_type TEXT,
  device_brand TEXT,
  device_model TEXT
) AS $$
DECLARE
  clean_q TEXT;
  code_q TEXT;
  raw_q TEXT;
BEGIN
  clean_q := TRIM(UPPER(p_query));
  code_q := CASE WHEN clean_q LIKE '#%' THEN clean_q ELSE '#' || clean_q END;
  raw_q := REGEXP_REPLACE(clean_q, '^#', '');

  RETURN QUERY
  SELECT 
    so.id,
    so.tracking_code,
    s.name AS shop_name,
    COALESCE(s.settings->>'phone', '') AS shop_phone,
    so.status::text AS status,
    so.reported_fault,
    so.technical_diagnosis,
    so.estimated_completion,
    so.final_price,
    COALESCE(so.advance_payment, 0.00) AS advance_payment,
    COALESCE(so.payment_method, 'efectivo') AS payment_method,
    COALESCE(so.device_photos, '[]'::jsonb) AS device_photos,
    so.warranty_period,
    so.warranty_until,
    so.delivered_at,
    so.created_at,
    c.full_name AS customer_name,
    c.document_id AS customer_document_id,
    d.type AS device_type,
    d.brand AS device_brand,
    d.model AS device_model
  FROM public.service_orders so
  JOIN public.shops s ON s.id = so.shop_id
  JOIN public.customers c ON c.id = so.customer_id
  JOIN public.devices d ON d.id = so.device_id
  WHERE (
    so.tracking_code = clean_q
    OR so.tracking_code = code_q
    OR UPPER(so.tracking_code) = clean_q
    OR UPPER(so.tracking_code) = code_q
    OR UPPER(REGEXP_REPLACE(so.tracking_code, '^#', '')) = raw_q
    OR UPPER(c.document_id) = clean_q
    OR so.id::text = clean_q
  )
  ORDER BY so.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(TEXT) TO anon, authenticated;
