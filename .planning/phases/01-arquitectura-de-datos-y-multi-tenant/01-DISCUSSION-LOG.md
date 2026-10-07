# Phase 01: Arquitectura de Datos y Multi-Tenant - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-07
**Phase:** 01-Arquitectura de Datos y Multi-Tenant
**Areas discussed:** Estrategia de Tablas en Supabase, Esquema de Roles para Supermercado, Gestión de Cajas y Terminales, Almacenamiento de Credenciales de Mercado Pago

---

## Estrategia de Tablas en Supabase

| Option | Description | Selected |
|--------|-------------|----------|
| Tablas dedicadas market_* | Desacoplamiento total, limpio y escalable con prefijo propio | ✓ |
| Reutilizar y modificar tablas existentes | Compartir inventory y service_orders con nuevas columnas | |

**User's choice:** Tablas dedicadas con prefijo market_* (desacoplamiento total, limpio y escalable)
**Notes:** Se decidió separar el dominio para evitar ensuciar los modelos de reparación técnica existentes y mantener alta mantenibilidad.

---

## Esquema de Roles para Supermercado

| Option | Description | Selected |
|--------|-------------|----------|
| Columna market_role en users | Agregar 'cashier', 'manager', 'admin' sin romper el rol técnico previo | ✓ |
| Ampliar enum global user_role | Modificar el tipo enum en PostgreSQL | |

**User's choice:** Agregar columna market_role (o roles específicos) en users: 'cashier', 'manager', 'admin' sin romper el rol técnico existente
**Notes:** Permite que coexistan ambos módulos en el mismo tenant y que los usuarios tengan roles diferenciados por vertical.

---

## Gestión de Cajas y Terminales

| Option | Description | Selected |
|--------|-------------|----------|
| Soportar múltiples cajas físicas | Crear entidad previa de terminales físicas (Caja 1, Caja 2) | |
| Caja única por cajero | El turno se asocia directamente al cajero sin crear cajas físicas previamente | ✓ |

**User's choice:** Caja única por cajero (el turno se asocia directamente al cajero sin crear cajas físicas previamente)
**Notes:** Menor fricción operativa y flujo directo de apertura y cierre de turno.

---

## Almacenamiento de Credenciales de Mercado Pago

| Option | Description | Selected |
|--------|-------------|----------|
| Tabla dedicada market_mp_configs | RLS estricto donde solo admin/owner puede ver/modificar tokens | ✓ |
| JSONB en shops.settings | Guardar configuraciones en la tabla shops existente | |

**User's choice:** Tabla dedicada market_mp_configs con RLS estricto (solo admin/owner puede ver/modificar tokens)
**Notes:** Seguridad reforzada para credenciales de cobro y claves de API de los clientes.

---

## the agent's Discretion

- Definición precisa de tipos en PostgreSQL e índices en columnas de búsqueda frecuente (`barcode`, `shop_id`).
- Funciones RPC y triggers para integridad referencial y control de turnos únicos por cajero.

## Deferred Ideas

None — discussion stayed within phase scope.
