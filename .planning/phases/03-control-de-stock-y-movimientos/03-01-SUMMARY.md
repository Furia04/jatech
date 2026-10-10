---
phase: 03-control-de-stock-y-movimientos
plan: 01
subsystem: ui-inventory
tags:
  - nextjs
  - inventory
  - stock-kpis
  - supermarket
requires:
  - 02-01
  - 02-02
provides:
  - market-inventory-page
  - stock-movement-service
---

# Plan 03-01 Summary: Vista Principal de Inventario, KPIs y Existencias en Tiempo Real

## What Was Done
Se implementó la pantalla de control de inventario (`/market/inventory`) con panel de métricas económicas, filtros de criticidad inmediata y el servicio de consulta de movimientos de stock con relaciones relacionales.

### Entidades y Vistas Implementadas:
1. **Servicio de Consulta de Movimientos (`D-04`)**:
   - `src/lib/supabase/market-services.ts`: función `fetchMarketStockMovements` con soporte de filtrado opcional por producto (`productId`), tipo de movimiento (`type`) y límite, trayendo automáticamente los datos del producto (`name`, `barcode`) y del usuario operador (`full_name`, `email`).
2. **Dashboard de Inventario (`D-01`, `D-02`, `STK-01`, `STK-04`)**:
   - `src/app/market/inventory/page.tsx`:
     - Tarjetas superiores de KPIs:
       - Capital total inmovilizado en stock a precio de costo ($).
       - Valorización comercial proyectada a precio de venta ($).
       - Conteo de artículos en Stock Bajo (`stock <= min_stock && stock > 0`).
       - Conteo de artículos Agotados / Quiebre (`stock <= 0`).
     - Pestañas de filtrado rápido con un solo clic: "Todos los productos", "Stock Bajo / Reposición Urgente" y "Agotados".
     - Buscador continuo por escáner de código de barras o texto predictivo.
     - Tabla densa de existencias con semáforo de colores (verde = óptimo, ámbar = stock bajo, rojo = quiebre) y valorización por producto.
     - Botones de acción rápida por fila para ajustar existencias o ver el historial del artículo.

## Verification
- `npx tsc --noEmit` completado con 0 errores de tipado.
- `npm run build` ejecutado exitosamente con ruta `/market/inventory` (8.87 kB) generada sin regresiones.
- Requerimientos cubiertos: `STK-01`, `STK-04`.
