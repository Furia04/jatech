# Phase 03: Control de Stock y Movimientos - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase entrega el sistema completo de control y auditoría de inventario para el vertical de supermercado bajo la ruta `/market/inventory`. Permite a los comercios supervisar las existencias en tiempo real, identificar productos con stock bajo o agotado con alertas visuales destacadas, realizar ajustes manuales de stock con justificación obligatoria (ingresos por compra, mermas, roturas, conteo físico) y consultar el historial cronológico y trazable de movimientos con el usuario responsable. No modifica en absoluto el módulo de servicio técnico existente.

</domain>

<decisions>
## Implementation Decisions

### Vista y Métricas de Inventario en Tiempo Real
- **D-01:** Crear la vista `/market/inventory/page.tsx` con un panel de KPIs clave en la cabecera:
  - Valorización total del inventario (a precio de costo y a precio de venta).
  - Alerta de productos con stock bajo (existencias <= `min_stock`).
  - Alerta de productos sin stock / agotados (`stock <= 0`).
  - Total de movimientos de stock registrados en el período.
  — **Reversibility:** reversible — Otorga visibilidad inmediata de la salud del inventario.

### Filtros Rápidos de Criticidad
- **D-02:** Proveer pestañas o filtros de acceso rápido: "Todos los productos", "Stock Crítico / Bajo", "Agotados", selector de categoría y buscador reactivo por código de barras o nombre. — **Reversibility:** reversible — Permite al encargado actuar velozmente sobre los faltantes de góndola.

### Modal de Ajuste de Stock con Justificación
- **D-03:** Implementar `StockAdjustmentModal`:
  - Tipos de movimiento: `purchase` (Ingreso por compra / recepción de proveedor), `waste` (Merma / Vencimiento / Rotura), `adjustment` (Ajuste por conteo físico de inventario), `cancellation` (Anulación).
  - En modo ajuste por conteo físico: el usuario ingresa la cantidad contada real y el sistema calcula automáticamente la diferencia (delta).
  - En modo ingreso / merma: el usuario ingresa la cantidad a sumar o restar.
  - Justificación / Motivo obligatorio para garantizar auditoría.
  - Registro atómico de `market_stock_movements` y actualización de `market_products.stock`. — **Reversibility:** reversible — Cumple con los requerimientos STK-01 y STK-03.

### Historial y Auditoría de Movimientos
- **D-04:** Implementar `StockHistoryModal` / Vista de historial:
  - Permite consultar el historial de movimientos de un producto específico o el historial global de la tienda.
  - Columnas / datos: Fecha y hora, Producto, Tipo de movimiento con badge visual distintivo, Cantidad, Stock Anterior -> Nuevo Stock, Motivo, y Usuario que realizó la acción.
  — **Reversibility:** reversible — Trazabilidad total de cada kilo o unidad que entra o sale del comercio.

</decisions>

<canonical_refs>
## Canonical References

### Requerimientos y Base de Datos
- `.planning/PROJECT.md` — Propuesta de valor y principios del sistema.
- `.planning/REQUIREMENTS.md` § Control de Stock e Inventario — Requisitos STK-01, STK-02, STK-03, STK-04.
- `supabase/migrations/20261007_market_schema.sql` — Esquema de tablas `market_products` y `market_stock_movements`.
- `src/types/market.ts` — Contratos de tipos `MarketStockMovement`, `StockMovementType`, `MarketProduct`.
- `src/lib/supabase/market-services.ts` — Funciones `adjustMarketProductStock`, `recordStockMovement`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MarketSidebar` ya cuenta con el enlace `/market/inventory`.
- `market-services.ts`:
  - `adjustMarketProductStock` ya descuenta o incrementa y registra movimiento.
  - `recordStockMovement` ya inserta en `market_stock_movements`.
- Estilos Obsidian / Emerald consistentes en `src/app/market/`.

### Integration Points
- Nueva ruta `src/app/market/inventory/page.tsx`.
- Componentes `src/components/market/stock-adjustment-modal.tsx` y `src/components/market/stock-history-modal.tsx`.
- Función complementaria en `market-services.ts`: `fetchMarketStockMovements` para listar el historial con relaciones a producto y usuario.

</code_context>

---

*Phase: 03-Control de Stock y Movimientos*
*Context gathered: 2026-10-10*
