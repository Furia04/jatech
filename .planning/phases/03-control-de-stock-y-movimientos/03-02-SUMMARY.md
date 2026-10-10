---
phase: 03-control-de-stock-y-movimientos
plan: 02
subsystem: ui-stock-modals
tags:
  - nextjs
  - stock-adjustment
  - stock-history
  - audit-trail
requires:
  - 03-01
provides:
  - stock-adjustment-modal
  - stock-history-modal
---

# Plan 03-02 Summary: Modal de Ajuste de Stock y Auditoría Trazable de Movimientos

## What Was Done
Se construyeron los componentes interactivos de ajuste manual de existencias con cálculo automático de deltas y el visor cronológico de auditoría de movimientos de mercadería.

### Entidades y Componentes Implementados:
1. **Modal de Ajuste de Stock (`D-03`, `STK-03`)**:
   - `src/components/market/stock-adjustment-modal.tsx`:
     - Tres modos de operación guiada: Conteo Físico Real de Góndola (`adjustment`), Ingreso por Compra a Proveedor (`purchase`) y Merma / Rotura / Vencimiento (`waste`).
     - Cálculo en tiempo real de la variación resultante (Delta: + o -) y del nuevo stock que quedará registrado en el sistema.
     - Campo obligatorio de motivo / justificación de la operación con botones de selección rápida ("Conteo mensual", "Rotura accidental", "Recepción de pedido").
     - Persistencia atómica mediante `adjustMarketProductStock` que actualiza el stock del producto e inserta el registro auditado en `market_stock_movements`.
2. **Modal de Auditoría e Historial de Movimientos (`D-04`, `STK-02`)**:
   - `src/components/market/stock-history-modal.tsx`:
     - Modo dual: puede mostrar los movimientos históricos de un producto individual o la auditoría global de toda la tienda.
     - Badges semafóricos por tipo de movimiento (Verde = Compra, Azul = Venta POS, Rojo = Merma, Púrpura = Ajuste, Ámbar = Anulación).
     - Visualización clara del stock previo y el nuevo stock (`anterior → nuevo`).
     - Detalle de motivo de la operación y el nombre/correo del usuario operador responsable.
     - Filtro por tipo de movimiento y botón de refresco en vivo.
3. **Integración Completa**:
   - Conectado a la página de inventario en `src/app/market/inventory/page.tsx` permitiendo operar sobre cualquier fila o abrir la auditoría general.

## Verification
- `npx tsc --noEmit` completado con 0 errores de tipado.
- `npm run build` ejecutado exitosamente con compilación estática libre de fallos.
- Requerimientos cubiertos: `STK-02`, `STK-03`.
