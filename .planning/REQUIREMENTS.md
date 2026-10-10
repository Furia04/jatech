# Requirements: Supermercado SaaS

**Defined:** 2026-10-07
**Core Value:** Gestión ágil y confiable del punto de venta y stock en tiempo real con conciliación automática de caja y pagos de Mercado Pago para múltiples comercios y sucursales.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Catálogo y Productos (CAT)

- [x] **CAT-01**: El usuario puede crear, editar y listar productos con campos para código de barras (EAN-13/UPC), nombre, marca, categoría, costo, precio de venta y margen.
- [x] **CAT-02**: El sistema permite clasificar productos por tipo de venta: por unidad o por peso (kg/fraccionable).
- [x] **CAT-03**: El usuario puede buscar productos de forma instantánea por código de barras o texto predictivo.
- [x] **CAT-04**: El usuario puede importar y exportar masivamente productos mediante planillas CSV/Excel.

### Control de Stock e Inventario (STK)

- [x] **STK-01**: Cada producto mantiene su stock actual y umbral de stock mínimo por sucursal/tenant.
- [x] **STK-02**: El sistema descuenta stock automáticamente al completar cada venta y lo repone si la venta se anula.
- [x] **STK-03**: El usuario puede registrar ajustes manuales de stock especificando el motivo (ingreso de mercadería, rotura, merma, conteo físico).
- [x] **STK-04**: El sistema muestra alertas visuales de productos con stock bajo o agotado.

### Punto de Venta - POS (POS)

- [ ] **POS-01**: Interfaz de cobro ultrarrápida enfocada en teclado y escáner de código de barras continuo sin perder el foco.
- [ ] **POS-02**: El cajero puede ingresar cantidades multiplicadoras (ej. 3 * código), modificar cantidades o eliminar líneas del carrito.
- [ ] **POS-03**: Soporte para productos pesables (ingreso de peso manual o decodificación de código de barras de balanza con prefijo 20).
- [ ] **POS-04**: El cajero puede pausar una venta en espera y reanudarla posteriormente para no demorar la fila.
- [ ] **POS-05**: Selección de medio de pago (Efectivo, Débito, Crédito, Transferencia, Mercado Pago QR) con cálculo automático de vuelto para efectivo.

### Resumen y Control de Caja (CASH)

- [ ] **CASH-01**: Apertura de turno de caja con ingreso obligatorio de fondo inicial de cambio.
- [ ] **CASH-02**: Registro de movimientos de caja en el turno (ingresos extraordinarios y retiros de dinero/pagos a proveedores).
- [ ] **CASH-03**: Pantalla de resumen de caja en vivo con totales discriminados por medio de pago (efectivo, MP, tarjetas).
- [ ] **CASH-04**: Cierre de turno / Cierre Z con arqueo de valores reales contra lo esperado en sistema y cálculo de sobrante/faltante.

### Integración Mercado Pago (MP)

- [ ] **MP-01**: Configuración de credenciales de Mercado Pago (Access Token y datos de sucursal/caja) por tenant.
- [ ] **MP-02**: Generación en pantalla de código QR dinámico de Mercado Pago para el cobro del monto exacto de la venta.
- [ ] **MP-03**: Sondeo y confirmación automática en tiempo real de la acreditación del pago QR para cerrar la venta sin intervención manual.
- [ ] **MP-04**: Panel de consulta del historial de transacciones de la cuenta de Mercado Pago vía API oficial con filtros por fecha y estado.
- [ ] **MP-05**: Conciliación entre los cobros registrados en Mercado Pago y las ventas del turno de caja.

### Tickets y Comprobantes (TKT)

- [ ] **TKT-01**: Generación y formateo de ticket térmico estándar de venta (58mm y 80mm) con datos del comercio, detalle de ítems, totales e impuestos.
- [ ] **TKT-02**: Opción de impresión automática o manual tras finalizar la venta y re-impresión desde el historial de ventas.

### Reportes y Analíticas (REP)

- [ ] **REP-01**: Historial detallado de ventas con filtros por fecha, cajero, medio de pago y estado.
- [ ] **REP-02**: Reporte de productos más vendidos y recaudación total por período.

### Multi-Tenant y Roles (TENANT)

- [x] **TENANT-01**: Aislamiento estricto de catálogo, stock, ventas, cajas y pagos de Mercado Pago por `shop_id` mediante Supabase RLS.
- [x] **TENANT-02**: Gestión de permisos y roles para el módulo de supermercado (Cajero: solo POS y su caja; Encargado/Admin: catálogo, compras, arqueos y reportes).

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Facturación Electrónica Fiscal

- **AFIP-01**: Emisión de Factura A, B y C mediante Web Service de AFIP (Factura Electrónica en Argentina).
- **AFIP-02**: Inclusión de CAE y código de barras QR AFIP en el ticket térmico.

### Balanzas Seriales

- **SCALE-01**: Lectura directa de balanzas electrónicas mediante protocolo Web Serial API en el navegador.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Protocolo serial RS-232 directo por cable serial en v1 | Mayor complejidad de drivers locales en el navegador; se cubre con lectura de etiquetas de balanza y peso manual |
| Facturación AFIP obligatoria en el lanzamiento de v1 | Requiere certificados digitales y sincronización con AFIP; se prioriza la venta rápida de almacén y se incorpora en v2 |
| Reemplazo destructivo del módulo técnico | Coexistencia modular para permitir usar ambos módulos en el mismo tenant |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TENANT-01 | Phase 1 | Complete |
| TENANT-02 | Phase 1 | Complete |
| CAT-01 | Phase 2 | Complete |
| CAT-02 | Phase 2 | Complete |
| CAT-03 | Phase 2 | Complete |
| CAT-04 | Phase 2 | Complete |
| STK-01 | Phase 3 | Complete |
| STK-02 | Phase 3 | Complete |
| STK-03 | Phase 3 | Complete |
| STK-04 | Phase 3 | Complete |
| CASH-01 | Phase 4 | Pending |
| CASH-02 | Phase 4 | Pending |
| CASH-03 | Phase 4 | Pending |
| CASH-04 | Phase 4 | Pending |
| POS-01 | Phase 5 | Pending |
| POS-02 | Phase 5 | Pending |
| POS-03 | Phase 5 | Pending |
| POS-04 | Phase 5 | Pending |
| POS-05 | Phase 5 | Pending |
| TKT-01 | Phase 6 | Pending |
| TKT-02 | Phase 6 | Pending |
| MP-01 | Phase 7 | Pending |
| MP-02 | Phase 7 | Pending |
| MP-03 | Phase 7 | Pending |
| MP-04 | Phase 8 | Pending |
| MP-05 | Phase 8 | Pending |
| REP-01 | Phase 9 | Pending |
| REP-02 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-07*
*Last updated: 2026-10-07 after initial definition*
