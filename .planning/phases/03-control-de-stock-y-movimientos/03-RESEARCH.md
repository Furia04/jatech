# Phase 03: Control de Stock y Movimientos - Research

**Researched:** 2026-10-10
**Domain:** Inventory Management, Stock Auditing & Real-time Alerting in Retail
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 03-CONTEXT.md)

### Locked Decisions
- **D-01 (Métricas de Inventario):** Panel de KPIs en `/market/inventory` con valorización económica del inventario (costo y venta), total de productos con stock bajo y agotados.
- **D-02 (Filtros de criticidad):** Pestañas para acceder de inmediato a "Stock Crítico / Bajo" y "Agotados".
- **D-03 (Ajuste de Stock con Justificación):** Modal de ajuste manual que admita `purchase`, `waste`, `adjustment` y `cancellation`, con justificación obligatoria y registro atómico en `market_stock_movements`.
- **D-04 (Historial y Auditoría):** Drawer o modal de consulta del historial cronológico de movimientos por producto o general con usuario responsable.

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Registro de Movimientos de Stock | Database (`market_stock_movements`) | Backend Services (`market-services.ts`) | La auditoría debe ser inmutable y registrar previous_stock, new_stock, delta, motivo y usuario. |
| Actualización de Existencias | Database (`market_products.stock`) | Client UI | El stock se actualiza atómicamente al registrar el movimiento. |
| KPIs de Inventario | Frontend en memoria / consulta agregada | Supabase | Cálculo dinámico del total de artículos, valorización a precio costo y precio público. |
| Alertas Visuales | Frontend (`/market/inventory`) | — | Badges semafóricos (verde, ámbar, rojo) según relación entre `stock` y `min_stock`. |

</architectural_responsibility_map>

<research_summary>
## Summary

La gestión de inventario en supermercados requiere dos pilares indispensables:
1. **Visibilidad operativa inmediata**: Identificar en menos de 2 segundos los artículos en quiebre de stock (`stock <= 0`) y los que están cerca de agotarse (`stock <= min_stock`) para evitar pérdidas de venta.
2. **Auditoría inmutable de movimientos**: Cada cambio en el inventario que no provenga de una venta en caja debe tener un tipo clasificado (`purchase`, `waste`, `adjustment`) y un motivo claro registrado con el ID del usuario operador.

La base de datos ya cuenta con `market_stock_movements` y `market_products` con columnas `NUMERIC(12,3)` para soportar decimales en pesables (`kg`, `g`). Además, `adjustMarketProductStock` y `recordStockMovement` ya están preparadas en `market-services.ts`.

**Recomendación principal:**
- Enriquecer `market-services.ts` con `fetchMarketStockMovements` permitiendo filtrar por producto y con joins a `users` y `market_products`.
- Implementar la pantalla `/market/inventory/page.tsx` con diseño Obsidian/Emerald, tarjetas KPI superiores y filtros por criticidad.
- Crear los modales `StockAdjustmentModal` y `StockHistoryModal` para completar el ciclo de auditoría y ajuste.
</research_summary>

<validation_architecture>
## Validation Architecture

- Verificación con `npx tsc --noEmit` para 0 errores de tipado.
- Verificación con `npm run build` para asegurar compilación estática limpia de la ruta `/market/inventory`.
- Requerimientos cubiertos: `STK-01`, `STK-02`, `STK-03`, `STK-04`.

</validation_architecture>
