# Roadmap: Supermercado SaaS

## Overview

Este roadmap traza la construcción incremental del sistema de gestión de supermercado y minimarket multi-tenant sobre la infraestructura existente de Next.js 14 y Supabase RLS. Con una granularidad detallada (9 fases), el proyecto cubre desde la base de datos y catálogo con código de barras, pasando por stock, sesiones de caja y punto de venta ágil, hasta la integración completa con Mercado Pago (QR en caja + conciliación de historial) y reportes finales.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Arquitectura de Datos y Multi-Tenant** - Esquema de base de datos PostgreSQL/Supabase, migraciones y políticas RLS para el dominio de supermercado (completed 2026-10-07)
- [x] **Phase 2: Catálogo de Productos y Precios** - Mantenimiento de productos, marcas, categorías, unidades de venta y búsqueda rápida por código de barras (completed 2026-10-07)
- [ ] **Phase 3: Control de Stock y Movimientos** - Gestión de inventario en tiempo real, alertas de stock mínimo y ajustes manuales (ingresos/mermas)
- [ ] **Phase 4: Turnos, Arqueos y Resumen de Caja** - Apertura de turno con fondo inicial, registro de ingresos/retiros manuales y cierre Z con arqueo
- [ ] **Phase 5: Punto de Venta (POS / TPV)** - Terminal de cobro ultrarrápido para cajeros con lector de barras, atajos de teclado y múltiples medios de pago
- [ ] **Phase 6: Emisión e Impresión de Tickets** - Formateo y motor de impresión de tickets térmicos (58mm/80mm) y comprobantes de venta
- [ ] **Phase 7: Cobro QR Dinámico con Mercado Pago** - Generación de QR dinámico por venta en el POS con verificación automática de acreditación
- [ ] **Phase 8: Historial y Conciliación Mercado Pago** - Consulta del historial de cobros vía API de MP y conciliación automática contra las ventas de caja
- [ ] **Phase 9: Métricas, Reportes y Auditoría** - Dashboard ejecutivo con ventas por turno/fecha, productos más vendidos y márgenes comerciales

## Phase Details

### Phase 1: Arquitectura de Datos y Multi-Tenant

**Goal**: Establecer las tablas relacionales, enums, triggers y políticas Row Level Security (RLS) en Supabase para el aislamiento estricto de los datos de supermercado por `shop_id`.
**Depends on**: Nothing (primera fase)
**Requirements**: TENANT-01, TENANT-02
**Success Criteria** (what must be TRUE):
  1. Las tablas `market_products`, `market_categories`, `market_stock_movements`, `market_cash_shifts`, `market_cash_movements`, `market_sales`, `market_sale_items` y `market_mp_configs` existen en Supabase.
  2. Todas las consultas filtran y restringen el acceso estrictamente al `shop_id` del usuario autenticado vía RLS.
  3. Los roles de usuario (cajero vs administrador) restringen las operaciones críticas de administración y configuración.

**Plans**: 2/2 plans complete

Plans:
**Wave 1**
- [x] 01-01: Diseñar y aplicar el script SQL de migración en Supabase con tablas, índices y RLS para supermercado

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02: Definir los tipos TypeScript y el servicio de cliente/servidor para el dominio de supermercado

### Phase 2: Catálogo de Productos y Precios

**Goal**: Brindar a los comercios una interfaz completa para la gestión de productos, códigos de barra EAN-13/UPC, costos, márgenes y categorías.
**Depends on**: Phase 1
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04
**Success Criteria** (what must be TRUE):
  1. El usuario puede crear, editar y visualizar productos con código de barras, nombre, marca, precio de costo y venta.
  2. El sistema valida códigos de barras y admite productos vendidos por unidad o por peso/fraccionable.
  3. La búsqueda predictiva responde en menos de 100ms tanto por texto como por escaneo de código de barras.
  4. Es posible importar y exportar el catálogo completo mediante archivo CSV/Excel.

**Plans**: 2/2 plans complete

Plans:
**Wave 1**
- [x] 02-01: Implementar endpoints y servicios para CRUD e importación/exportación masiva de productos

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02: Construir la interfaz de gestión de catálogo, modal de edición y buscador interactivo con escaneo

### Phase 3: Control de Stock y Movimientos

**Goal**: Mantener el inventario actualizado en tiempo real con historial de movimientos y avisos de reposición.
**Depends on**: Phase 2
**Requirements**: STK-01, STK-02, STK-03, STK-04
**Success Criteria** (what must be TRUE):
  1. Cada producto refleja sus existencias actuales y umbral de stock mínimo por sucursal.
  2. El usuario puede registrar entradas y salidas manuales de stock justificando motivo (merma, reposición, ajuste).
  3. La interfaz destaca alertas visuales inmediatas para productos sin stock o próximos a agotarse.

**Plans**: 2 plans

Plans:
**Wave 1**
- [ ] 03-01: Vista principal de inventario, KPIs económicos, semáforo de existencias y servicio de movimientos

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 03-02: Modal de ajuste manual de stock con cálculo de deltas y visor de auditoría trazable

### Phase 4: Turnos, Arqueos y Resumen de Caja

**Goal**: Proporcionar control operativo y financiero de las cajas mediante apertura de turnos, registro de movimientos y cierre Z.
**Depends on**: Phase 1
**Requirements**: CASH-01, CASH-02, CASH-03, CASH-04
**Success Criteria** (what must be TRUE):
  1. Un cajero no puede iniciar cobros sin realizar la apertura formal del turno con fondo de caja.
  2. El cajero/encargado puede ingresar y retirar dinero en efectivo con descripción del concepto.
  3. El resumen de caja en vivo totaliza los ingresos clasificados por medio de pago (efectivo, MP, tarjetas).
  4. El cierre Z calcula y registra automáticamente la diferencia entre el dinero declarado en arqueo y el registrado por el sistema.

**Plans**: 2 plans

Plans:
- [ ] 04-01: Implementar el backend y modelo de turnos de caja (`market_cash_shifts`) y movimientos
- [ ] 04-02: Desarrollar la interfaz de resumen de caja, modal de arqueo y reporte de cierre de turno

### Phase 5: Punto de Venta (POS / TPV)

**Goal**: Crear una terminal de cobro ágil para el cajero, optimizada para escaneo continuo, gestión de tickets y cobro rápido.
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: POS-01, POS-02, POS-03, POS-04, POS-05
**Success Criteria** (what must be TRUE):
  1. El escáner de código de barras agrega productos al ticket sin perder el foco del campo de entrada.
  2. El cajero puede multiplicar cantidades, modificar ítems y aplicar soporte para productos pesables.
  3. El cajero puede pausar ventas en espera y reanudarlas con un clic o atajo.
  4. El sistema calcula el vuelto con precisión al ingresar el efectivo entregado y descuenta el stock correspondiente.

**Plans**: 3 plans

Plans:
- [ ] 05-01: Crear el estado global y lógica de la orden de venta activa (carrito, subtotales, pesables, atajos)
- [ ] 05-02: Diseñar la interfaz del POS de pantalla completa con soporte táctil y de teclado
- [ ] 05-03: Implementar el flujo de finalización de venta, selección de medios de pago y descuento automático de stock

### Phase 6: Emisión e Impresión de Tickets

**Goal**: Proveer la generación instantánea de comprobantes de venta optimizados para impresoras térmicas comerciales.
**Depends on**: Phase 5
**Requirements**: TKT-01, TKT-02
**Success Criteria** (what must be TRUE):
  1. El ticket de venta se formatea perfectamente para anchos de 58mm y 80mm con datos del comercio y detalle de la compra.
  2. La impresión puede dispararse automáticamente al confirmar la venta o consultarse desde el histórico.

**Plans**: 1 plan

Plans:
- [ ] 06-01: Desarrollar el componente de renderizado e impresión de tickets térmicos y vista de reimpresión

### Phase 7: Cobro QR Dinámico con Mercado Pago

**Goal**: Integrar el cobro en el POS mediante código QR dinámico de Mercado Pago con acreditación instantánea.
**Depends on**: Phase 5
**Requirements**: MP-01, MP-02, MP-03
**Success Criteria** (what must be TRUE):
  1. El comercio puede configurar sus credenciales de Mercado Pago de forma segura en su configuración de tienda.
  2. Al seleccionar Mercado Pago en el POS, se genera y muestra un código QR dinámico con el monto exacto.
  3. El POS detecta la acreditación del pago sin refrescar la página y completa la venta automáticamente.

**Plans**: 2 plans

Plans:
- [ ] 07-01: Construir endpoints de API para crear orden de cobro QR y webhook/polling de estado en tiempo real
- [ ] 07-02: Integrar el modal de cobro QR en el flujo de checkout del POS

### Phase 8: Historial y Conciliación Mercado Pago

**Goal**: Permitir la consulta directa del historial de cobros de Mercado Pago y su conciliación contra los cierres de caja.
**Depends on**: Phase 4, Phase 7
**Requirements**: MP-04, MP-05
**Success Criteria** (what must be TRUE):
  1. El usuario puede visualizar la lista de transacciones y pagos recibidos en su cuenta de MP directamente en la plataforma.
  2. El sistema coteja las ventas cobradas por Mercado Pago con las acreditaciones reales de la API, alertando sobre discrepancias.

**Plans**: 2 plans

Plans:
- [ ] 08-01: Desarrollar endpoint de consulta del historial de pagos mediante la API de Mercado Pago (`/v1/payments/search`)
- [ ] 08-02: Construir la vista de conciliación de Mercado Pago dentro del módulo de resumen de caja

### Phase 9: Métricas, Reportes y Auditoría

**Goal**: Proporcionar paneles de análisis del negocio con indicadores de ventas, productos de mayor rotación y balances por medio de pago.
**Depends on**: Phase 5, Phase 8
**Requirements**: REP-01, REP-02
**Success Criteria** (what must be TRUE):
  1. El panel muestra la evolución de ventas por día, semana y mes con gráficos interactivos.
  2. El informe detalla el ranking de productos más vendidos y el margen bruto estimado.

**Plans**: 1 plan

Plans:
- [ ] 09-01: Construir la pantalla de analíticas y reportes de ventas para administradores del supermercado

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Arquitectura de Datos y Multi-Tenant | 2/2 | Complete    | 2026-10-07 |
| 2. Catálogo de Productos y Precios | 2/2 | Complete    | 2026-10-07 |
| 3. Control de Stock y Movimientos | 0/2 | Not started | - |
| 4. Turnos, Arqueos y Resumen de Caja | 0/2 | Not started | - |
| 5. Punto de Venta (POS / TPV) | 0/3 | Not started | - |
| 6. Emisión e Impresión de Tickets | 0/1 | Not started | - |
| 7. Cobro QR Dinámico con Mercado Pago | 0/2 | Not started | - |
| 8. Historial y Conciliación Mercado Pago | 0/2 | Not started | - |
| 9. Métricas, Reportes y Auditoría | 0/1 | Not started | - |

---
*Roadmap generated: 2026-10-07*
