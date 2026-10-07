---
phase: "2"
slug: "cat-logo-de-productos-y-precios"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-07"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript Compiler (`tsc`) & Next.js Build |
| **Config file** | `tsconfig.json` / `next.config.mjs` |
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
| 02-01-01 | 01 | 1 | CAT-01 | — | Layout y sidebar dedicado para /market | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CAT-01 | — | Pantalla de catálogo /market/catalog y tabla densa con escáner | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | CAT-02 | — | Modal de producto con cálculo de margen bidireccional y unidades | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | CAT-03, CAT-04 | — | Modal de importación y exportación CSV con upsert inteligente | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/market/layout.tsx` — Layout del módulo de supermercado
- [ ] `src/components/market/market-sidebar.tsx` — Sidebar de navegación
- [ ] `src/app/market/catalog/page.tsx` — Página principal de catálogo
- [ ] `src/components/market/product-modal.tsx` — Modal de creación/edición con cálculo de márgenes
- [ ] `src/components/market/csv-import-modal.tsx` — Modal de importación CSV con soporte de upsert

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Detección de código de barras desde lector físico | CAT-03 | Requiere hardware lector de barras USB | Escanear un producto con el lector y verificar que el buscador responde o abre el modal |
| Importación de archivo CSV real | CAT-04 | Requiere interactuar con el selector de archivos del navegador | Subir archivo CSV de prueba y confirmar que los productos se visualizan en la tabla |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-07
