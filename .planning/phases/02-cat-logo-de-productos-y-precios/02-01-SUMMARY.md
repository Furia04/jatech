---
phase: 02-cat-logo-de-productos-y-precios
plan: 01
subsystem: ui-catalog
tags:
  - nextjs
  - catalog
  - supermarket
  - barcode
  - layout
requires:
  - 01-01
  - 01-02
provides:
  - market-layout
  - market-sidebar
  - market-catalog-page
---

# Plan 02-01 Summary: Layout de Supermercado y Pantalla de Catálogo de Productos

## What Was Done
Se construyó la infraestructura base de navegación aislada para el vertical de supermercado (`/market`) y la interfaz principal del catálogo de productos con tabla densa optimizada para terminales de retail.

### Componentes y Vistas Implementadas:
1. **Layout y Sidebar Independientes (`D-01`)**:
   - `src/components/market/market-sidebar.tsx`: Navegación dedicada para el vertical con accesos a Catálogo (`/market/catalog`), Inventario (`/market/inventory`), Cajas (`/market/cash`), POS (`/market/pos`), Métricas (`/market/reports`), selector de tienda e indicador de rol del usuario. Cero colisión con `GestionTecnicos`.
   - `src/app/market/layout.tsx`: Layout envolvente con soporte de modo oscuro Obsidian/Emerald y carga contextual del usuario de supermercado.
2. **Pantalla Principal de Catálogo (`D-02`)**:
   - `src/app/market/catalog/page.tsx`:
     - Tabla densa con columnas: Código de barras, Producto & Marca, Categoría, Tipo de venta, Precio de costo, Precio de venta, Margen %, Stock actual, Estado y Acciones.
     - Buscador reactivo continuo con autofocus y selector de categorías.
     - Atajos de teclado: `F2` para abrir modal de alta de producto, `/` para enfocar rápidamente el buscador de código de barras.
     - Detección proactiva de código no encontrado: cuando se escanea un código inexistente, despliega un banner de alta rápida prellenando el código ingresado.
     - Exportación de catálogo completo a archivo CSV descargable compatible con Excel.

## Verification
- `npx tsc --noEmit` completado con 0 errores de tipado.
- `npm run build` ejecutado exitosamente con ruta estática `/market/catalog` generada sin interferir con las rutas existentes de `GestionTecnicos`.
- Requerimientos cubiertos: `CAT-01`, `CAT-03`.
