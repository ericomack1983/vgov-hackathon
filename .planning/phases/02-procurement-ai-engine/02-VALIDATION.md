---
phase: 2
slug: procurement-ai-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured in Phase 1) |
| **Config file** | vitest.config.ts (or package.json scripts) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | SUPP-01 | unit | `npm run test -- --run src/__tests__/suppliers.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | SUPP-02 | unit | `npm run test -- --run src/__tests__/suppliers.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | SUPP-03 | manual | — | — | ⬜ pending |
| 2-02-01 | 02 | 1 | PROC-01 | unit | `npm run test -- --run src/__tests__/rfp.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | PROC-02 | unit | `npm run test -- --run src/__tests__/rfp.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 2 | PROC-03 | unit | `npm run test -- --run src/__tests__/rfp.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-04 | 02 | 2 | PROC-04 | manual | — | — | ⬜ pending |
| 2-03-01 | 03 | 1 | AIEN-01 | unit | `npm run test -- --run src/__tests__/ai-engine.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 1 | AIEN-02 | unit | `npm run test -- --run src/__tests__/ai-engine.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-03 | 03 | 1 | AIEN-03 | unit | `npm run test -- --run src/__tests__/ai-engine.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-04 | 03 | 2 | AIEN-04 | unit | `npm run test -- --run src/__tests__/ai-engine.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-05 | 03 | 2 | AIEN-05 | manual | — | — | ⬜ pending |
| 2-03-06 | 03 | 2 | AIEN-06 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/suppliers.test.ts` — stubs for SUPP-01, SUPP-02
- [ ] `src/__tests__/rfp.test.ts` — stubs for PROC-01, PROC-02, PROC-03
- [ ] `src/__tests__/ai-engine.test.ts` — stubs for AIEN-01, AIEN-02, AIEN-03, AIEN-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supplier profile page renders all details correctly | SUPP-03 | UI rendering, visual inspection needed | Navigate to /suppliers/[id], verify name, rating, compliance badge, certifications list |
| RFP manual override flow with justification note | PROC-04 | Multi-step form interaction | As Gov Officer, select non-winner supplier, enter justification, confirm override is saved |
| AI narrative explanation cites specific data points | AIEN-05 | Natural language quality check | Trigger evaluation, read narrative, verify it mentions actual supplier names and scores |
| Best Value badge visible on winning row | AIEN-06 | Visual inspection | Verify indigo-600 border + Sparkles icon + "Best Value" badge on winner row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
