---
phase: 01-arquitectura-de-datos-y-multi-tenant
plan: 01
subsystem: database
tags:
  - supabase
  - postgresql
  - rls
  - migrations
  - multi-tenant
requires: []
provides:
  - market-schema
  - market-rls
  - market-roles
---

# Plan 01-01 Summary: Migración SQL y Políticas RLS para Supermercado Multi-Tenant

## What Was Done
Se creó el script de migración SQL completo e idempotente para el vertical de supermercado en `supabase/migrations/20261007_market_schema.sql`.

### Entidades y Cambios Implementados:
1. **Roles de Usuario (`D-02`)**: Agregada columna `market_role TEXT DEFAULT 'cashier'` a la tabla `public.users` con restricción `('cashier', 'manager', 'admin')`.
2. **Tablas Relacionales (`D-01`)**:
   - `market_categories`: Categorías de productos.
   - `market_products`: Catálogo con código de barras, precios, stock y tipo de unidad.
   - `market_stock_movements`: Auditoría y trazabilidad de ingresos, ventas, mermas y ajustes.
   - `market_cash_shifts`: Turnos de caja asociados a cajero y tienda con control de apertura y cierre.
   - `market_cash_movements`: Ingresos y retiros manuales durante el turno.
   - `market_sales`: Cabecera de venta del POS con medios de pago y cálculo de vuelto.
   - `market_sale_items`: Detalle de productos vendidos con precio unitario y cantidades.
   - `market_mp_configs`: Credenciales y tokens de Mercado Pago por comercio.
3. **Índices de Alto Rendimiento (`D-01, D-03`)**:
   - `idx_market_products_shop_barcode`: Índice único compuesto `(shop_id, barcode)`.
   - `idx_open_shift_per_cashier`: Índice único parcial que restringe a un único turno abierto por cajero.
   - Índices de consulta sobre `shop_id`, `shift_id` y `created_at`.
4. **Seguridad y RLS (`D-04`)**:
   - Habilitado Row Level Security en las 8 tablas.
   - Políticas de aislamiento por tienda utilizando `public.get_current_shop_id()`.
   - Función auxiliar `public.is_market_admin()`.
   - Política restrictiva para `market_mp_configs`, impidiendo que cajeros u otros roles accedan a las credenciales privadas.

## Verification
- Validación del archivo de migración SQL (12 KB, sintaxis DDL idempotente, RLS activo).
- Verificado cumplimiento de requerimiento `TENANT-01`.
