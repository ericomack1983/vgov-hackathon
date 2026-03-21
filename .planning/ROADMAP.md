# Roadmap: GovProcure AI

## Overview

GovProcure AI is built in three phases following the data dependency chain: foundation and mock data first (everything downstream depends on it), then core procurement workflow and AI scoring engine (the intellectual core), then payments, animated settlement visualization, dashboard, and audit (the demo "wow moment"). Each phase delivers a complete, verifiable capability that unblocks the next. The entire build targets a working hackathon demo completable in under 3 minutes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & App Shell** - Next.js scaffold, context architecture, role switcher, mock data seeding, and shared component library (completed 2026-03-20)
- [ ] **Phase 2: Procurement & AI Engine** - Supplier pages, RFP workflow, bid submission, AI scoring engine, decision dashboard with explainability
- [ ] **Phase 3: Payments, Settlement & Polish** - Hybrid payment checkout, animated settlement visualization, notifications, financial dashboard, audit trail, PDF export

## Phase Details

### Phase 1: Foundation & App Shell
**Goal**: A running application with navigable layout, role switching, seeded mock data, and shared components -- ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, SUPP-04
**Success Criteria** (what must be TRUE):
  1. App loads in browser with sidebar navigation, header with role switcher, and main content area rendering placeholder pages
  2. Clicking role switcher toggles between Gov Officer, Supplier, and Auditor views -- sidebar nav items update per role
  3. Mock data is accessible in context: 8 suppliers with varied profiles (score spread >= 15 points), 5 RFPs in different states, and historical transactions
  4. Navigation between all placeholder pages works without errors or blank screens
  5. AppContext is split into 3 slices (Procurement, Payment, UI) and all pages can read from them
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold, dependencies, layout shell, placeholder pages, shared components
- [ ] 01-02-PLAN.md -- 3-slice AppContext, mock data seeding, role switcher, role-based navigation wiring

### Phase 2: Procurement & AI Engine
**Goal**: Gov Officer can create an RFP, view supplier bids, trigger AI evaluation, see ranked results with transparent scoring and narrative explanation, and select a winner
**Depends on**: Phase 1
**Requirements**: SUPP-01, SUPP-02, SUPP-03, PROC-01, PROC-02, PROC-03, PROC-04, AIEN-01, AIEN-02, AIEN-03, AIEN-04, AIEN-05, AIEN-06
**Success Criteria** (what must be TRUE):
  1. Supplier registry page lists all 8 mock suppliers with name, rating, compliance status, and certifications; clicking a supplier opens a profile page with full details
  2. Gov Officer can create a new RFP with title, description, budget ceiling, deadline, and category -- it appears in the RFP list with correct status
  3. Supplier can submit a bid on an open RFP with bid amount, delivery days, and notes -- bid appears on the RFP detail page
  4. Triggering AI evaluation on an RFP produces a ranked supplier list with individual dimension scores (price, delivery, reliability, compliance, risk), composite score, "Best Value" badge on the winner, and a natural language explanation citing specific data points
  5. Gov Officer can manually override the AI recommendation by selecting a different supplier and providing a written justification note
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md -- AI scoring engine types, pure scoring function, narrative generator, context extension
- [ ] 02-02-PLAN.md -- Supplier registry grid page and supplier profile detail page
- [ ] 02-03-PLAN.md -- RFP list, create, detail pages and bid submission workflow
- [ ] 02-04-PLAN.md -- AI evaluation dashboard components wired into RFP detail with override

### Phase 3: Payments, Settlement & Polish
**Goal**: Full end-to-end demo flow from RFP to settled payment with animated fund-flow visualization, real-time notifications, financial dashboard, and auditable compliance trail
**Depends on**: Phase 2
**Requirements**: PAYM-01, PAYM-02, PAYM-03, PAYM-04, SETL-01, SETL-02, SETL-03, SETL-04, SETL-05, SETL-06, NOTF-01, NOTF-02, NOTF-03, NOTF-04, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, AUDT-01, AUDT-02, AUDT-03
**Success Criteria** (what must be TRUE):
  1. After selecting a winner, Gov Officer sees payment selector with "Pay with USD" and "Pay with USDC (Polygon)" options, checkout summary with supplier name, amount, method, and order ID
  2. USD settlement plays animated flow: Government Bank to Visa Network to Supplier Bank with labeled nodes, progressing through Authorized, Processing, Settled (approximately 6 seconds total) with toast notifications at each state change
  3. USDC settlement plays animated flow: Government Wallet to Polygon Network to Supplier Wallet with blockchain hash display, progressing through Submitted, Confirmed, Settled Instantly (approximately 3 seconds total) with toast notifications at each state change
  4. Financial dashboard shows USD and USDC balances, active and completed order counts, total spend, AI optimization savings, payment breakdown chart (Visa vs USDC percentage), spend-over-time chart, and recent transactions list -- all updated after payment completion
  5. Audit trail page shows timestamped log of all procurement events, Auditor role can view all transactions, and "Export PDF" generates a downloadable procurement report
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD
- [ ] 03-04: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & App Shell | 2/2 | Complete    | 2026-03-20 |
| 2. Procurement & AI Engine | 0/4 | Not started | - |
| 3. Payments, Settlement & Polish | 0/4 | Not started | - |
