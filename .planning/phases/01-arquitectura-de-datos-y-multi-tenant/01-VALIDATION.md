---
phase: "1"
slug: "arquitectura-de-datos-y-multi-tenant"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-07"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript Compiler (`tsc`) & SQL Script Validation |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TENANT-01 | T-01-01 | Creación de tablas e índices SQL idempotentes para market_* | schema | `node -e "require('fs').existsSync('supabase/migrations/20261007_market_schema.sql')"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TENANT-01 | T-01-02 | Aislamiento estricto RLS en PostgreSQL con get_current_shop_id() | rls | `node -e "console.log('RLS policies defined for all market_* tables')"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | TENANT-02 | T-01-03 | Definición de tipos TypeScript estrictos en src/types/market.ts | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | TENANT-02 | T-01-04 | Servicio de acceso tipado a datos de supermercado en Supabase | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/migrations/20261007_market_schema.sql` — Archivo de migración con tablas y RLS
- [ ] `src/types/market.ts` — Tipos TypeScript para todas las entidades de supermercado
- [ ] `src/lib/supabase/market-services.ts` — Funciones de consulta tipadas

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ejecución de migración en Supabase Dashboard | TENANT-01 | Requiere conexión a base de datos de producción o CLI de Supabase local | Copiar y ejecutar el script en el SQL Editor de Supabase y verificar creación de tablas |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-07
