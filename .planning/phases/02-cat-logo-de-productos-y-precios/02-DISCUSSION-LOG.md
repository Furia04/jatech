# Phase 02: Catálogo de Productos y Precios - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-07
**Phase:** 02-Catálogo de Productos y Precios
**Areas discussed:** Navegación y Layout del Supermercado, Interfaz del Catálogo y Lector de Barras, Cálculo de Precios y Márgenes, Importación/Exportación Masiva

---

## Navegación y Layout del Supermercado

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar dedicado para /market | Catálogo, Stock, Caja, POS, Métricas con diseño moderno oscuro y botón de regreso | ✓ |
| Navbar superior horizontal | Barra fija superior estilo aplicación de escritorio | |

**User's choice:** Sidebar dedicado para /market (Catálogo, Stock, Caja, POS, Métricas) con diseño moderno oscuro y botón de regreso
**Notes:** Da identidad propia al módulo de supermercado y navegación cómoda en pantallas de gestión.

---

## Interfaz del Catálogo y Lector de Barras

| Option | Description | Selected |
|--------|-------------|----------|
| Abrir modal con código precargado | Si se escanea un código inexistente, abrir automáticamente el alta de producto | ✓ |
| Solo avisar no encontrado | Mostrar mensaje pasivo de no encontrado | |

**User's choice:** Si se escanea un código inexistente, abrir automáticamente el alta de producto con el código precargado
**Notes:** Reduce clics al dar de alta mercadería recién ingresada con lector de barras.

---

## Cálculo de Precios y Márgenes

| Option | Description | Selected |
|--------|-------------|----------|
| Bidireccional | Costo + Margen % = Precio de Venta, o Costo + Precio = Margen % | ✓ |
| Manual fijo | Ingreso de números sin cálculo de margen | |

**User's choice:** Cálculo bidireccional reactivo en el formulario
**Notes:** Permite al comerciante asegurar su margen comercial deseado automáticamente.

---

## Importación y Exportación Masiva

| Option | Description | Selected |
|--------|-------------|----------|
| Upsert inteligente | Actualizar producto si el código de barras ya existe (costo, precio, stock) | ✓ |
| Omitir duplicados | Saltear ítems repetidos e informar | |

**User's choice:** Actualizar producto si el código de barras ya existe (Upsert inteligente: actualiza precios y stock)
**Notes:** Facilita la actualización de listas de precios masivas de distribuidores.

---

## the agent's Discretion
- Formato de las planillas CSV y manejo de errores línea por línea.
- Atajos de teclado para agilidad en caja y administración.
