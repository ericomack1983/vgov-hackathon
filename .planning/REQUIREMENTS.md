# Requirements: GovProcure AI

**Defined:** 2026-03-20
**Core Value:** AI ranks suppliers and recommends best value — then pays instantly via Visa or USDC — with a transparent, animated, auditable flow.

## v1 Requirements

### Foundation & Infrastructure

- [ ] **FOUN-01**: Next.js 14 app scaffolded with App Router, TailwindCSS, and Framer Motion installed
- [ ] **FOUN-02**: App shell renders with sidebar (nav links), header (role switcher), and main content area
- [ ] **FOUN-03**: Role switcher allows toggling between Gov Officer, Supplier, and Auditor views
- [ ] **FOUN-04**: AppContext (3 slices: Procurement, Payment, UI) provides global state to all pages
- [ ] **FOUN-05**: Mock data seeded: 8 suppliers with varied profiles, 5 RFPs in various states, historical transactions

### Supplier Management

- [ ] **SUPP-01**: Supplier registry page lists all suppliers with name, rating, compliance status, and certifications
- [ ] **SUPP-02**: Supplier profile page shows rating score, past performance, pricing history, wallet address, and compliance badge
- [ ] **SUPP-03**: Supplier can submit a bid on an open RFP (bid amount, delivery days, notes)
- [ ] **SUPP-04**: Mock suppliers have deliberately varied scores (spread ≥15 points composite) to ensure clear AI winner

### Procurement Requests (RFP)

- [ ] **PROC-01**: Government user can create a new RFP with title, description, budget ceiling, deadline, and category
- [ ] **PROC-02**: RFP list page shows all requests with status (Draft, Open, Evaluating, Awarded, Paid)
- [ ] **PROC-03**: RFP detail page shows description, submitted bids, and status timeline
- [ ] **PROC-04**: Gov officer can trigger AI evaluation on an RFP with submitted bids

### AI Procurement Engine

- [ ] **AIEN-01**: AI scoring engine computes weighted composite score per bid: Price (30%), Delivery (20%), Reliability (25%), Compliance (15%), Risk (10%)
- [ ] **AIEN-02**: Decision dashboard shows ranked supplier list with individual dimension scores and composite score
- [ ] **AIEN-03**: "Best Value" badge highlights the AI-recommended winner
- [ ] **AIEN-04**: AI explainability panel shows natural language narrative citing specific data points
- [ ] **AIEN-05**: Score radar/bar chart renders per supplier for visual comparison
- [ ] **AIEN-06**: Gov officer can manually override AI recommendation with a written justification note

### Payment & Checkout

- [ ] **PAYM-01**: Payment selector presents two options: "Pay with USD" and "Pay with USDC (Polygon)"
- [ ] **PAYM-02**: Checkout summary shows supplier name, amount, payment method, and order ID
- [ ] **PAYM-03**: Confirming payment triggers the settlement animation flow
- [ ] **PAYM-04**: Completed transactions are added to AppContext transaction history

### Settlement Engine (Animated)

- [ ] **SETL-01**: USD settlement flow animates: Government Bank → Visa Network → Supplier Bank with labeled nodes and moving funds indicator
- [ ] **SETL-02**: USD settlement progresses through: Authorized → Processing → Settled (T+2) with real-time status updates (~6s total)
- [ ] **SETL-03**: USDC settlement flow animates: Government Wallet → Polygon Network → Supplier Wallet with blockchain hash display
- [ ] **SETL-04**: USDC settlement progresses through: Submitted → Confirmed → Settled Instantly (~3s total)
- [ ] **SETL-05**: Settlement state machine resets cleanly on re-entry; no stuck states or double-fire notifications
- [ ] **SETL-06**: Side-by-side comparison panel shows "Traditional Rail (T+2)" vs "Blockchain Rail (Instant)" after settlement

### Notifications

- [ ] **NOTF-01**: Toast notification fires on each settlement state change (initiated, authorized, settled)
- [ ] **NOTF-02**: Each notification includes timestamp, payment method (USD/USDC), and transaction ID / blockchain hash
- [ ] **NOTF-03**: Notification history page lists all past notifications in reverse chronological order
- [ ] **NOTF-04**: Notification bell in header shows unread count badge

### Financial Dashboard

- [ ] **DASH-01**: Dashboard shows USD balance, USDC balance, active orders count, completed orders count
- [ ] **DASH-02**: Total spend metric and AI optimization savings (difference between highest bid and winning bid)
- [ ] **DASH-03**: Payment breakdown pie/donut chart showing % paid via Visa vs % paid via USDC
- [ ] **DASH-04**: Spend-over-time area chart
- [ ] **DASH-05**: Recent transactions list with method badge, amount, supplier, and status

### Audit & Compliance

- [ ] **AUDT-01**: Audit trail page shows timestamped log of all procurement events
- [ ] **AUDT-02**: Auditor role can view all transactions across all RFPs
- [ ] **AUDT-03**: "Export PDF" button generates a procurement report (audit trail + transaction summary)

## v2 Requirements

### Enhanced Features (Post-Hackathon)

- **ENH-01**: Real Visa API integration
- **ENH-02**: Real Polygon/USDC transactions (Amoy testnet)
- **ENH-03**: Supplier self-registration flow
- **ENH-04**: Email notifications for payment events
- **ENH-05**: Multi-currency support beyond USD/USDC
- **ENH-06**: Mobile responsiveness
- **ENH-07**: Real authentication (OAuth or JWT)
- **ENH-08**: Database persistence (Postgres or Supabase)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real Visa API calls | External dependency; can fail during demo |
| Real blockchain transactions | Gas fees, wallet setup; can fail during demo |
| Real authentication | Role switcher sufficient for demo |
| Database backend | Mock data sufficient; no persistence needed |
| Mobile responsiveness | Desktop demo; judges won't test mobile |
| Email notifications | Infrastructure overhead |
| Supplier self-registration form | Pre-seed mock suppliers instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Pending |
| FOUN-02 | Phase 1 | Pending |
| FOUN-03 | Phase 1 | Pending |
| FOUN-04 | Phase 1 | Pending |
| FOUN-05 | Phase 1 | Pending |
| SUPP-04 | Phase 1 | Pending |
| SUPP-01 | Phase 2 | Pending |
| SUPP-02 | Phase 2 | Pending |
| SUPP-03 | Phase 2 | Pending |
| PROC-01 | Phase 2 | Pending |
| PROC-02 | Phase 2 | Pending |
| PROC-03 | Phase 2 | Pending |
| PROC-04 | Phase 2 | Pending |
| AIEN-01 | Phase 2 | Pending |
| AIEN-02 | Phase 2 | Pending |
| AIEN-03 | Phase 2 | Pending |
| AIEN-04 | Phase 2 | Pending |
| AIEN-05 | Phase 2 | Pending |
| AIEN-06 | Phase 2 | Pending |
| PAYM-01 | Phase 3 | Pending |
| PAYM-02 | Phase 3 | Pending |
| PAYM-03 | Phase 3 | Pending |
| PAYM-04 | Phase 3 | Pending |
| SETL-01 | Phase 3 | Pending |
| SETL-02 | Phase 3 | Pending |
| SETL-03 | Phase 3 | Pending |
| SETL-04 | Phase 3 | Pending |
| SETL-05 | Phase 3 | Pending |
| SETL-06 | Phase 3 | Pending |
| NOTF-01 | Phase 3 | Pending |
| NOTF-02 | Phase 3 | Pending |
| NOTF-03 | Phase 3 | Pending |
| NOTF-04 | Phase 3 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DASH-05 | Phase 3 | Pending |
| AUDT-01 | Phase 3 | Pending |
| AUDT-02 | Phase 3 | Pending |
| AUDT-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
