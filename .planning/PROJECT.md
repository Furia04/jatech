# Supermercado SaaS - Multi-Tenant

## What This Is

Sistema integral de gestión de supermercado y minimarket multi-tenant desarrollado sobre Next.js 14 App Router, TypeScript, Tailwind CSS y Supabase (PostgreSQL con Row Level Security). Permite a los comercios gestionar su catálogo masivo de productos con códigos de barra (EAN/UPC), control de stock/inventario con alertas, punto de venta ágil (POS), control y arqueo de caja por turnos, e integración bidireccional con Mercado Pago (cobro QR dinámico y consulta de historial de transacciones para conciliación de caja). Coexiste como módulo independiente dentro de la arquitectura existente del repositorio.

## Core Value

Gestión ágil y confiable del punto de venta y stock en tiempo real con conciliación automática de caja y pagos de Mercado Pago para múltiples comercios y sucursales.

## Business Context

- **Customer**: Dueños de supermercados, autoservicios, minimarkets y sus cajeros/encargados.
- **Revenue model**: Suscripción mensual SaaS por comercio/sucursal (integrada con Mercado Pago Subscriptions).
- **Success metric**: Velocidad en el cobro en caja (< 3 seg por escaneo/pago) y 100% de conciliación en el arqueo de caja con Mercado Pago.

## Requirements

### Validated

- ✓ Arquitectura multi-tenant con Supabase RLS y jerarquía de roles (`shops`, `users`, `public.get_current_shop_id()`) — existente en codebase
- ✓ Autenticación y gestión de sesiones con `@supabase/ssr` — existente en codebase
- ✓ Integración base con SDK de Mercado Pago y webhooks para suscripciones — existente en codebase
- ✓ Sistema de diseño moderno y componentes UI base (Tailwind CSS, Lucide icons) — existente en codebase

### Active

- [ ] **Módulo de Catálogo & Productos Supermercado**: Gestión de productos con código de barras (EAN/UPC), categoría, marca, precios de costo/venta, márgenes y tipos de unidad (unidad / kg / litro).
- [ ] **Control de Stock e Inventario**: Seguimiento de existencias en tiempo real, alertas de stock mínimo, registro de movimientos (entradas, bajas, mermas y ajustes).
- [ ] **Punto de Venta Rápido (POS / TPV)**: Interfaz de cobro de alta velocidad optimizada para lector de código de barras y atajos de teclado, búsqueda rápida, cálculo de vuelto y selección de medio de pago.
- [ ] **Cobro con QR Dinámico de Mercado Pago**: Generación de QR dinámico en caja con verificación instantánea del estado del pago antes de cerrar la venta.
- [ ] **Control y Resumen de Caja**: Sistema de turnos de caja con apertura de fondo inicial, registro de ingresos/retiros manuales, arqueo y cierre Z con desglose por medio de pago.
- [ ] **Historial y Conciliación con Mercado Pago**: Consulta de transacciones de la cuenta de MP vía API, visualización de historial de cobros y conciliación automática contra las ventas y cierres de caja.
- [ ] **Impresión de Tickets de Venta**: Generación de tickets térmicos (58mm/80mm) y comprobantes de venta descargables/imprimibles.
- [ ] **Dashboard y Métricas del Supermercado**: Panel con ventas del día, productos más vendidos, recaudación por medio de pago y estado de cajas.

### Out of Scope

- Protocolo serial RS-232 directo con balanzas físicas — Se utilizará soporte para códigos de barra de balanza (prefijo 20 + peso) y pesaje manual en POS.
- Facturación electrónica AFIP directa en v1 — Se deja preparada la estructura de datos para acoplar el web service en un milestone posterior.
- Reemplazo destructivo del sistema de soporte técnico previo — Coexistirán como módulos verticales independientes compartiendo el tenancy y auth.

## Context

El repositorio cuenta con una sólida base técnica construida con Next.js 14 App Router, Supabase y Mercado Pago. El sistema actual ya resuelve la infraestructura multi-tenant (`shops`), la autenticación y las pasarelas de pago recurrentes. El objetivo es incorporar la vertical de supermercado con modelos de datos específicos, endpoints de API dedicados y una interfaz de POS y caja altamente receptiva.

## Constraints

- **Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase PostgreSQL con RLS.
- **Multi-Tenant**: Aislamiento estricto de datos por `shop_id` garantizado a nivel de base de datos con políticas RLS.
- **Compatibilidad**: No alterar ni romper los módulos existentes de `GestionTecnicos`.
- **Performance**: La pantalla de cobro POS debe operar de forma instantánea sin latencias perceptibles en cada lectura de código de barras.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Coexistencia modular | El usuario requiere mantener el módulo actual y sumar el de supermercado como vertical independiente | ✓ Good |
| Integración dual con Mercado Pago | Se implementará tanto el cobro por QR dinámico en caja como la lectura de historial de transacciones vía API para conciliación | ✓ Good |
| Enfoque POS con soporte de lector de barras | Prioridad al flujo de cajero con lectura continua y atajos de teclado sin requerir mouse | ✓ Good |
| Granularidad detallada (Fine) | Desglose en 8 a 12 fases bien delimitadas para asegurar pruebas y entrega incremental sólida | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-07 after initialization*
