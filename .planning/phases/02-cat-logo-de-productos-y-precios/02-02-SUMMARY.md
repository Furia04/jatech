---
phase: 02-cat-logo-de-productos-y-precios
plan: 02
subsystem: ui-products
tags:
  - nextjs
  - modal
  - csv-import
  - upsert
  - pricing-margins
requires:
  - 02-01
provides:
  - product-modal
  - csv-import-modal
  - batch-upsert-service
---

# Plan 02-02 Summary: Modal de Producto con Márgenes Bidireccionales e Importación Masiva CSV

## What Was Done
Se implementaron los componentes interactivos para la gestión de productos individuales con cálculo bidireccional reactivo y el sistema de importación masiva por lotes con upsert inteligente.

### Entidades y Componentes Implementados:
1. **Modal de Alta y Edición de Producto (`D-03`, `CAT-02`)**:
   - `src/components/market/product-modal.tsx`:
     - Cálculo bidireccional en tiempo real:
       - Costo ($) + Margen (%) = Precio de Venta ($).
       - Modificar Precio de Venta recalcula automáticamente el Margen (%).
       - Alerta visual inmediata en caso de margen negativo o venta bajo costo.
     - Clasificación de productos unitarios vs pesables / fraccionables (`unit`, `kg`, `g`, `l`, `m`) con toggle `is_weighable`.
     - Generador integrado de códigos de barra internos (`2000XXXXXX`) para artículos fraccionados o de elaboración propia sin EAN comercial.
     - Selector de categorías con botón inline de creación inmediata sin abandonar el modal.
     - Guardado mediante `createMarketProduct` y `updateMarketProduct`.
2. **Servicio de Upsert Masivo por Lote (`D-04`)**:
   - En `src/lib/supabase/market-services.ts`, implementación de `batchUpsertMarketProducts`:
     - Procesa lotes de hasta 100 productos por transacción para optimizar la red con Supabase.
     - Resuelve conflictos por clave única compuesta `(shop_id, barcode)`, actualizando precios, costos y stock sin duplicar registros.
     - Retorna métricas precisas de cuántos productos fueron insertados y cuántos actualizados.
3. **Modal de Importación Masiva CSV (`D-04`, `CAT-04`)**:
   - `src/components/market/csv-import-modal.tsx`:
     - Descarga directa de plantilla CSV de ejemplo con encabezados oficiales (`barcode,name,brand,category,cost_price,sale_price,stock,min_stock,unit_type`).
     - Soporte para separadores por coma `,` o punto y coma `;` (Excel regional).
     - Validación y tabla de previsualización previa de filas antes de enviar el lote.
     - Autocreación de categorías faltantes durante el procesamiento del archivo CSV.
     - Resumen visual con conteo de insertados, actualizados y panel de advertencias.

## Verification
- `npx tsc --noEmit` completado con 0 errores de tipado en todos los componentes y servicios.
- `npm run build` ejecutado exitosamente con compilación estática libre de fallos.
- Requerimientos cubiertos: `CAT-02`, `CAT-04`.
