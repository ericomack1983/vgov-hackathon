---
phase: 3
slug: payments-settlement-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured) |
| **Config file** | package.json scripts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run test -- --run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | PAYM-01, PAYM-02 | unit | `npx tsc --noEmit src/app/payment/**` | ✅ (tsc) | ⬜ pending |
| 3-01-02 | 01 | 1 | PAYM-03, PAYM-04 | manual | — | — | ⬜ pending |
| 3-02-01 | 02 | 1 | SETL-01, SETL-02, SETL-03 | unit | `npx tsc --noEmit src/components/settlement/**` | ✅ (tsc) | ⬜ pending |
| 3-02-02 | 02 | 1 | SETL-04, SETL-05, SETL-06, NOTF-01, NOTF-02, NOTF-03, NOTF-04 | manual | — | — | ⬜ pending |
| 3-03-01 | 03 | 2 | DASH-01, DASH-02, DASH-03 | unit | `npx tsc --noEmit src/app/dashboard/**` | ✅ (tsc) | ⬜ pending |
| 3-03-02 | 03 | 2 | DASH-04, DASH-05 | manual | — | — | ⬜ pending |
| 3-04-01 | 04 | 2 | AUDT-01, AUDT-02 | unit | `npx tsc --noEmit src/app/audit/**` | ✅ (tsc) | ⬜ pending |
| 3-04-02 | 04 | 2 | AUDT-03 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements via `npx tsc --noEmit`. No Wave 0 test stubs required — TypeScript type-checking provides automated verification at every task, consistent with Phase 2 approach.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| USD settlement animation plays 3-step flow (~6s) | SETL-01, SETL-02 | Visual animation, timing | Click "Pay with USD", watch Authorized → Processing → Settled transitions with ~2s each |
| USDC settlement animation plays 3-step flow (~3s) | SETL-03, SETL-04 | Visual animation, blockchain hash | Click "Pay with USDC", watch Submitted → Confirmed → Settled Instantly with hash displayed |
| Toast notifications fire at each settlement state | NOTF-01, NOTF-02 | UI interaction, timing | Observe toast popups at each state change during settlement |
| Payment method selector renders properly | PAYM-03, PAYM-04 | Visual inspection | Verify USD + USDC options, checkout summary with supplier/amount/method/orderId |
| Financial dashboard charts render correctly | DASH-04, DASH-05 | SVG visual inspection | Verify donut chart (Visa vs USDC %) and area chart (spend over time) render with data |
| Export PDF generates downloadable report | AUDT-03 | Browser download | Click "Export PDF", verify browser triggers download of a PDF file |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
