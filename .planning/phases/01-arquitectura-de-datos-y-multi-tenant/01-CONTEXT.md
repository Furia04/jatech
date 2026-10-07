# Phase 01: Arquitectura de Datos y Multi-Tenant - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase establece el modelo de datos relacional completo en PostgreSQL / Supabase para el vertical de supermercado, asegurando el aislamiento estricto de datos por `shop_id` mediante Row Level Security (RLS). Define las tablas operativas con prefijo `market_*`, los roles de usuario específicos para supermercado (`users.market_role`) y la persistencia segura de credenciales de Mercado Pago por tenant (`market_mp_configs`). La fase entrega los scripts SQL de migración y las definiciones de tipos TypeScript correspondientes.

</domain>

<decisions>
## Implementation Decisions

### Estrategia de Tablas en Supabase
- **D-01:** Utilizar un conjunto de tablas dedicadas con prefijo `market_*` (`market_products`, `market_categories`, `market_stock_movements`, `market_sales`, `market_sale_items`, `market_cash_shifts`, `market_cash_movements`, `market_mp_configs`). — **Reversibility:** one-way — Crea un nuevo esquema relacional en base de datos; desacopla completamente el vertical de supermercado del módulo de soporte técnico existente para evitar colisiones de campos o restricciones.

### Esquema de Roles para Supermercado
- **D-02:** Agregar la columna `market_role TEXT DEFAULT 'cashier'` en la tabla existente `users` con restricción de valores `('cashier', 'manager', 'admin')`. — **Reversibility:** reversible — Permite que un usuario mantenga su rol previo en el sistema técnico (`role`) mientras cuenta con un rol específico para el supermercado sin alterar enums globales existentes.

### Gestión de Turnos y Cajas
- **D-03:** Implementar caja única por cajero. Los turnos de caja (`market_cash_shifts`) se asocian directamente al `cashier_id` y `shop_id` con estado `'open'` o `'closed'`. — **Reversibility:** reversible — Simplifica la apertura y cierre de caja sin necesidad de configurar previamente terminales físicas complejas; cada cajero es responsable de su turno activo.

### Almacenamiento de Credenciales de Mercado Pago
- **D-04:** Crear la tabla dedicada `market_mp_configs` con clave foránea a `shops(id)` y políticas RLS estrictas que solo permitan lectura y escritura al `owner` o `admin` del comercio. — **Reversibility:** one-way — Protege los Access Tokens y datos de integración de Mercado Pago de cada comercio frente a cajeros u otros tenants.

### the agent's Discretion
- Índices de base de datos para búsqueda rápida por `barcode` y filtros por `shop_id`.
- Triggers para actualización automática de `updated_at`.
- Funciones auxiliares en PostgreSQL para verificación de roles de supermercado (`public.is_market_admin()`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requerimientos y Arquitectura
- `.planning/PROJECT.md` — Visión global, decisiones iniciales y limitaciones del sistema.
- `.planning/REQUIREMENTS.md` § Multi-Tenant y Roles — Definición de TENANT-01 y TENANT-02.
- `supabase/schema.sql` — Esquema relacional actual con tablas `shops`, `users` y funciones de seguridad RLS `public.get_current_shop_id()` y `public.is_superadmin()`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Función PostgreSQL `public.get_current_shop_id()`: Extrae el `shop_id` del usuario autenticado o devuelve su `auth.uid()`.
- Función PostgreSQL `public.is_superadmin()`: Valida privilegios de administración global.
- Clientes Supabase en Next.js: `src/lib/supabase/client.ts` (navegador), `src/lib/supabase/server.ts` (SSR) y `src/lib/supabase/admin-auth.ts` (service role).

### Established Patterns
- RLS con aislamiento estricto por tienda: `shop_id = public.get_current_shop_id()`.
- Triggers de auditoría de fecha (`updated_at`).
- Tablas base `shops` y `users` compartidas en la raíz de autenticación.

### Integration Points
- Nuevo archivo de migración SQL o actualización del esquema Supabase para incorporar las tablas `market_*`.
- Archivo de tipos `src/types/market.ts` para tipado estricto en TypeScript.
- Servicios Supabase en `src/lib/supabase/market-services.ts` para interactuar con las nuevas tablas.

</code_context>

<specifics>
## Specific Ideas
- Un cajero no puede tener dos turnos abiertos al mismo tiempo en el mismo comercio (`shop_id`).
- La tabla `market_products` debe incluir `barcode TEXT`, `is_weighable BOOLEAN DEFAULT FALSE` y `unit_type TEXT DEFAULT 'unit'` para soportar productos unitarios o pesables.

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-Arquitectura de Datos y Multi-Tenant*
*Context gathered: 2026-10-07*
