# Phase 02: Catálogo de Productos y Precios - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase entrega la interfaz visual y lógica de gestión de catálogo en la ruta dedicada `/market/catalog`, incluyendo el layout y sidebar específico del módulo de supermercado (`src/app/market/`). Permite listar, crear, editar y eliminar productos con soporte de código de barras (EAN-13/UPC), categorización, cálculo bidireccional de márgenes comerciales, diferenciación entre productos unitarios y pesables, y herramientas de importación/exportación masiva en CSV con lógica upsert. No modifica en absoluto el módulo de servicio técnico existente.

</domain>

<decisions>
## Implementation Decisions

### Navegación y Layout del Módulo Supermercado
- **D-01:** Crear un layout independiente en `src/app/market/layout.tsx` con un sidebar dedicado para el supermercado (enlaces a `/market/catalog`, `/market/inventory`, `/market/cash`, `/market/pos`, `/market/reports`), interfaz moderna oscura y botón de retorno al panel principal. — **Reversibility:** reversible — Mantiene el módulo completamente aislado visual y estructuralmente.

### Interfaz del Catálogo y Escaneo Continuo
- **D-02:** Diseñar la vista de catálogo (`/market/catalog`) con una tabla densa de alta productividad, filtros por categoría y barra de búsqueda que responde instantáneamente a lecturas de escáner. Si se ingresa o escanea un código de barras inexistente, el sistema ofrece abrir inmediatamente el modal de creación con dicho código ya pre-cargado. — **Reversibility:** reversible — Acelera drásticamente el alta de nuevos productos en el local.

### Cálculo Bidireccional de Precios y Márgenes
- **D-03:** En el formulario modal de producto, implementar cálculo bidireccional reactivo: si se modifica el costo y el margen %, se autocalcula el precio de venta; si se modifica directamente el precio de venta, se recalcula el margen % obtenido. — **Reversibility:** reversible — Facilita la fijación de precios comerciales con precisión.

### Importación y Exportación Masiva en CSV
- **D-04:** Implementar importación masiva vía CSV con plantilla de ejemplo descargable y estrategia upsert (si un código de barras ya existe en la tienda, actualiza su costo, precio y stock en lugar de fallar o duplicar). Incorporar botón de exportación del catálogo completo a CSV. — **Reversibility:** reversible — Permite a los comercios migrar sus listas de precios de distribuidores de forma ágil.

### the agent's Discretion
- Diseño de badges visuales para productos pesables (`kg`) vs unitarios (`un`).
- Paginación o virtualización de la tabla para soportar catálogos de miles de productos sin pérdida de rendimiento.
- Modal de confirmación para desactivar o reactivar productos.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requerimientos y Base de Datos
- `.planning/PROJECT.md` — Propuesta de valor y principios del sistema.
- `.planning/REQUIREMENTS.md` § Catálogo y Productos — Requisitos CAT-01, CAT-02, CAT-03, CAT-04.
- `supabase/migrations/20261007_market_schema.sql` — Esquema de tablas `market_products` y `market_categories`.
- `src/types/market.ts` — Contratos de tipos `MarketProduct`, `MarketCategory`, `UnitType`.
- `src/lib/supabase/market-services.ts` — Servicios CRUD para catálogo de supermercado.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Componentes UI en `src/components/ui/` y estilos Tailwind CSS existentes.
- Servicios ya creados en Fase 1: `fetchMarketProducts`, `createMarketProduct`, `updateMarketProduct`, `fetchMarketCategories` en `src/lib/supabase/market-services.ts`.
- Cliente Supabase en `@/lib/supabase/client`.

### Established Patterns
- Formularios reactivos con estados de carga (`loading`), mensajes de error amigables y modales accesibles.
- Iconografía coherente mediante `lucide-react`.

### Integration Points
- Creación de la ruta `src/app/market/layout.tsx` y `src/app/market/catalog/page.tsx`.
- Componentes de soporte: `src/components/market/sidebar.tsx`, `src/components/market/product-modal.tsx`, `src/components/market/csv-import-modal.tsx`.

</code_context>

<specifics>
## Specific Ideas
- Soporte para atajos de teclado en catálogo: presionar `F2` o `Alt+N` abre el modal de nuevo producto, presionar `/` enfoca el buscador de código de barras.
- En la tabla de productos, resaltar en rojo suave los productos con margen negativo o precio menor al costo.

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-Catálogo de Productos y Precios*
*Context gathered: 2026-10-07*
