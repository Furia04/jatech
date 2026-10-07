# Phase 01: Arquitectura de Datos y Multi-Tenant - Research

**Researched:** 2026-10-07
**Domain:** PostgreSQL / Supabase Multi-Tenant Data Architecture & Row Level Security (RLS)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 01-CONTEXT.md)

### Locked Decisions
- **D-01 (Modelo de tablas):** Utilizar un conjunto de tablas dedicadas con prefijo `market_*` (`market_products`, `market_categories`, `market_stock_movements`, `market_sales`, `market_sale_items`, `market_cash_shifts`, `market_cash_movements`, `market_mp_configs`). Mantiene desacoplado y limpio el vertical sin romper el módulo técnico previo. — **Reversibility:** one-way.
- **D-02 (Roles de usuario):** Agregar la columna `market_role TEXT DEFAULT 'cashier'` en la tabla existente `users` con restricción check `('cashier', 'manager', 'admin')`. — **Reversibility:** reversible.
- **D-03 (Gestión de cajas):** Caja única por cajero. Los turnos de caja (`market_cash_shifts`) se asocian directamente al `cashier_id` y `shop_id` con estado `'open'` o `'closed'`. — **Reversibility:** reversible.
- **D-04 (Credenciales de Mercado Pago):** Tabla dedicada `market_mp_configs` con foreign key a `shops(id)` y políticas RLS estrictas que solo permitan lectura y escritura al `owner` o `admin` del comercio. — **Reversibility:** one-way.

### the agent's Discretion
- Definición de tipos de datos en columnas de base de datos e índices compuestos (por ej. `(shop_id, barcode)`).
- Triggers para auditoría y actualización automática de `updated_at`.
- Funciones auxiliares PostgreSQL para validación de privilegios (`public.is_market_admin()`).

### Deferred Ideas (OUT OF SCOPE)
- Facturación electrónica directa con AFIP en v1 (diferida a v2).
- Protocolo serial RS-232 directo con balanzas (diferido a v2).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Aislamiento Multi-Tenant (RLS) | Database/Storage (PostgreSQL) | API/Backend (Next.js) | El aislamiento de datos debe garantizarse en la capa de datos mediante Row Level Security inquebrantable, no solo en la capa aplicativa. |
| Integridad Referencial & Restricciones | Database/Storage (PostgreSQL) | — | Claves foráneas, checks (`market_role`, `shift_status`) y triggers garantizan consistencia incluso ante accesos concurrentes. |
| Contrato de Tipos TypeScript | Shared (`src/types/market.ts`) | — | Tipado estricto para frontend y backend con TypeScript 5. |
| Servicios de Acceso a Datos | Frontend Server & Client (`src/lib/supabase/`) | Browser/Client | Encapsula llamadas a Supabase utilizando las cookies de sesión del usuario autenticado. |
</architectural_responsibility_map>

<research_summary>
## Summary

La investigación técnica confirma que la arquitectura multi-tenant en Supabase debe fundamentarse en el patrón de **Shared Database, Shared Schema con Row Level Security (RLS)**. Este patrón ya está exitosamente implementado en el repositorio a través de la función `public.get_current_shop_id()`, la cual deduce la tienda activa a partir del token JWT de Supabase Auth (`auth.uid()`) consultando la tabla `public.users`.

Para el nuevo vertical de supermercado, crear tablas dedicadas con prefijo `market_*` es la estrategia óptima: evita mezclar los campos de servicios técnicos (equipos, reparaciones, marcas de teléfonos) con los de consumo masivo (códigos de barra EAN-13, tipos de unidad, márgenes comerciales, sesiones de caja y pagos por venta).

**Recomendación principal:** Implementar una migración SQL limpia e idempotente que cree el esquema `market_*`, agregue la columna `market_role` a `users`, establezca políticas RLS que verifiquen `shop_id = public.get_current_shop_id()` en cada tabla y cree un índice compuesto único `(shop_id, barcode)` para búsquedas de alta velocidad en el punto de venta.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 15+ (Supabase) | Motor de base de datos relacional y RLS | Soporte nativo para RLS de alto rendimiento, triggers, enums y JSONB. |
| @supabase/supabase-js | ^2.116.0 | Cliente TypeScript para Supabase | SDK oficial para consultas tipadas, suscripciones y RPCs. |
| @supabase/ssr | ^0.12.7 | Gestión de sesiones y cookies en Next.js App Router | Manejo seguro de tokens JWT entre Server Components, Route Handlers y el cliente. |
| TypeScript | ^5.7.3 | Tipado estático y contratos de entidades | Asegura integridad de tipos entre el esquema SQL y la UI. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | ^0.475.0 | Iconografía para interfaces y estados | Indicadores visuales en componentes de dashboard y gestión. |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

```
                ┌───────────────────────────────────────────────┐
                │          Browser / POS Terminal               │
                └───────────────────────┬───────────────────────┘
                                        │
                         Cookie JWT Auth Session
                                        │
                ┌───────────────────────▼───────────────────────┐
                │        Next.js App Router (SSR & API)         │
                │        createBrowserClient / createServer     │
                └───────────────────────┬───────────────────────┘
                                        │
                    PostgreSQL connection via Supabase
                                        │
     ┌──────────────────────────────────▼──────────────────────────────────┐
     │                       PostgreSQL Engine                             │
     │                                                                     │
     │   public.get_current_shop_id() ──► Row Level Security (RLS) Filter  │
     │                                                                     │
     │   ┌─────────────────────────────────────────────────────────────┐   │
     │   │                    market_* Tables                          │   │
     │   │                                                             │   │
     │   │  • market_categories     (shop_id, name)                    │   │
     │   │  • market_products       (shop_id, barcode, name, price...) │   │
     │   │  • market_stock_movements (shop_id, product_id, qty, reason)│   │
     │   │  • market_cash_shifts    (shop_id, cashier_id, status...)   │   │
     │   │  • market_cash_movements (shop_id, shift_id, type, amount)  │   │
     │   │  • market_sales          (shop_id, shift_id, total, status) │   │
     │   │  • market_sale_items     (shop_id, sale_id, product_id...)  │   │
     │   │  • market_mp_configs     (shop_id, access_token, p_key...)  │   │
     │   └─────────────────────────────────────────────────────────────┘   │
     └─────────────────────────────────────────────────────────────────────┘
```

### 1. Definición del Esquema Relacional `market_*`

#### Tabla `market_categories`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `name` TEXT NOT NULL
- `description` TEXT
- `created_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_products`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `category_id` UUID REFERENCES public.market_categories(id) ON DELETE SET NULL
- `barcode` TEXT NOT NULL (Índice único compuesto `(shop_id, barcode)`)
- `name` TEXT NOT NULL
- `brand` TEXT
- `cost_price` NUMERIC(12,2) DEFAULT 0.00
- `sale_price` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `stock` NUMERIC(12,3) NOT NULL DEFAULT 0.000 (Soporta unidades enteras o fraccionales/kg)
- `min_stock` NUMERIC(12,3) DEFAULT 5.000
- `is_weighable` BOOLEAN DEFAULT FALSE
- `unit_type` TEXT DEFAULT 'unit' CHECK (unit_type IN ('unit', 'kg', 'g', 'l', 'm'))
- `active` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_stock_movements`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `product_id` UUID NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE
- `user_id` UUID REFERENCES public.users(id)
- `quantity` NUMERIC(12,3) NOT NULL
- `previous_stock` NUMERIC(12,3) NOT NULL
- `new_stock` NUMERIC(12,3) NOT NULL
- `type` TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment', 'waste', 'cancellation'))
- `reason` TEXT
- `created_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_cash_shifts` (Turnos de Caja)
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `cashier_id` UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
- `status` TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
- `initial_cash` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `expected_cash` NUMERIC(12,2) DEFAULT 0.00
- `actual_cash` NUMERIC(12,2) DEFAULT 0.00
- `difference` NUMERIC(12,2) DEFAULT 0.00
- `total_sales_amount` NUMERIC(12,2) DEFAULT 0.00
- `notes` TEXT
- `opened_at` TIMESTAMPTZ DEFAULT NOW()
- `closed_at` TIMESTAMPTZ

#### Tabla `market_cash_movements`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `shift_id` UUID NOT NULL REFERENCES public.market_cash_shifts(id) ON DELETE CASCADE
- `user_id` UUID NOT NULL REFERENCES public.users(id)
- `type` TEXT NOT NULL CHECK (type IN ('income', 'expense'))
- `amount` NUMERIC(12,2) NOT NULL
- `reason` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_sales` (Ventas POS)
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `shift_id` UUID REFERENCES public.market_cash_shifts(id) ON DELETE SET NULL
- `cashier_id` UUID NOT NULL REFERENCES public.users(id)
- `ticket_number` TEXT NOT NULL
- `total_amount` NUMERIC(12,2) NOT NULL DEFAULT 0.00
- `payment_method` TEXT NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mercadopago_qr', 'mixto'))
- `payment_details` JSONB DEFAULT '{}'::jsonb
- `amount_paid` NUMERIC(12,2) DEFAULT 0.00
- `change_returned` NUMERIC(12,2) DEFAULT 0.00
- `status` TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled'))
- `created_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_sale_items`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `sale_id` UUID NOT NULL REFERENCES public.market_sales(id) ON DELETE CASCADE
- `product_id` UUID REFERENCES public.market_products(id) ON DELETE SET NULL
- `barcode` TEXT NOT NULL
- `product_name` TEXT NOT NULL
- `quantity` NUMERIC(12,3) NOT NULL DEFAULT 1.000
- `unit_price` NUMERIC(12,2) NOT NULL
- `total_price` NUMERIC(12,2) NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

#### Tabla `market_mp_configs` (Credenciales MP por Tenant)
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `shop_id` UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE
- `access_token` TEXT NOT NULL
- `public_key` TEXT
- `pos_id` TEXT
- `user_id_mp` TEXT
- `is_active` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

### 2. Políticas de Seguridad RLS
- En todas las tablas `market_*`, habilitar `ROW LEVEL SECURITY`.
- Para cajeros y encargados: lectura/escritura únicamente si `shop_id = public.get_current_shop_id()`.
- Para `market_mp_configs`: la política de lectura y escritura requiere además que el usuario sea `owner`, `superadmin` o posea `market_role = 'admin'`.
- Superadministrador global: bypass total vía `public.is_superadmin()`.

</architecture_patterns>

<pitfalls>
## Pitfalls & Gotchas

1. **Colisión de Códigos de Barra entre Tiendas:**
   - *Riesgo:* Definir `barcode` como UNIQUE globalmente en la base de datos impedirá que dos supermercados distintos carguen el mismo producto (ej. una Coca Cola con código 779...).
   - *Solución:* El índice único debe ser compuesto: `UNIQUE (shop_id, barcode)`.

2. **Filtro RLS en Tablas Hijas:**
   - *Riesgo:* Depender únicamente del `sale_id` o `shift_id` en tablas secundarias (`market_sale_items`, `market_cash_movements`) sin incluir `shop_id`. Esto puede causar scans lentos con JOINs en RLS.
   - *Solución:* Incluir `shop_id` desnormalizado en todas las tablas transaccionales con su política directa `shop_id = public.get_current_shop_id()`.

3. **Manejo de Cantidades Fraccionarias (Pesables):**
   - *Riesgo:* Usar tipos `INT` para el stock o cantidad de ítems vendidos. Un cliente que compra `0.450 kg` de queso rompería la integridad.
   - *Solución:* Usar `NUMERIC(12,3)` para `stock` y `quantity`.

4. **Turnos Simultáneos del Mismo Cajero:**
   - *Riesgo:* Un cajero abre dos turnos al mismo tiempo y duplica los cómputos de caja.
   - *Solución:* Crear un índice único parcial: `CREATE UNIQUE INDEX idx_open_shift_per_cashier ON public.market_cash_shifts(shop_id, cashier_id) WHERE (status = 'open');`.
</pitfalls>

<validation_architecture>
## Validation Architecture

### Verification Queries
```sql
-- 1. Verificar existencia de las tablas
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'market_%';

-- 2. Verificar que RLS esté habilitado en todas
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'market_%';

-- 3. Probar aislamiento multi-tenant simulando dos tenants distintos
```

### TypeScript Validation
- Los tipos en `src/types/market.ts` deben mapear exactamente cada columna y enum del esquema SQL.
- El build de Next.js (`npm run build`) debe compilar sin errores de tipo.
</validation_architecture>
