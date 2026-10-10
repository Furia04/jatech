---
phase: "3"
slug: "control-de-stock-y-movimientos"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-10"
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | STK-01, STK-04 | — | Pantalla /market/inventory con KPIs y filtros de criticidad | typecheck | `npx tsc --noEmit` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | STK-01, STK-03 | — | Servicio fetchMarketStockMovements en market-services.ts | typecheck | `npx tsc --noEmit` | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | STK-02, STK-03 | — | Modal de ajuste manual de stock con justificación obligatoria | typecheck | `npx tsc --noEmit` | ✅ | ✅ green |
| 03-02-02 | 02 | 2 | STK-03 | — | Modal / Drawer de historial de auditoría de movimientos | typecheck | `npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/market/inventory/page.tsx` — Página principal de inventario
- [ ] `src/components/market/stock-adjustment-modal.tsx` — Modal de ajuste de stock
- [ ] `src/components/market/stock-history-modal.tsx` — Modal de historial de movimientos

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-10
