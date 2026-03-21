# Requirements: GovProcure AI

**Defined:** 2026-03-20
**Core Value:** AI ranks suppliers and recommends best value — then pays instantly via Visa or USDC — with a transparent, animated, auditable flow.

## v1 Requirements

### Foundation & Infrastructure

- [x] **FOUN-01**: Next.js 14 app scaffolded with App Router, TailwindCSS, and Framer Motion installed
- [x] **FOUN-02**: App shell renders with sidebar (nav links), header (role switcher), and main content area
- [x] **FOUN-03**: Role switcher allows toggling between Gov Officer, Supplier, and Auditor views
- [x] **FOUN-04**: AppContext (3 slices: Procurement, Payment, UI) provides global state to all pages
- [x] **FOUN-05**: Mock data seeded: 8 suppliers with varied profiles, 5 RFPs in various states, historical transactions

### Supplier Management

- [x] **SUPP-01**: Supplier registry page lists all suppliers with name, rating, compliance status, and certifications
- [x] **SUPP-02**: Supplier profile page shows rating score, past performance, pricing history, wallet address, and compliance badge
- [x] **SUPP-03**: Supplier can submit a bid on an open RFP (bid amount, delivery days, notes)
- [x] **SUPP-04**: Mock suppliers have deliberately varied scores (spread ≥15 points composite) to ensure clear AI winner

### Procurement Requests (RFP)

- [x] **PROC-01**: Government user can create a new RFP with title, description, budget ceiling, deadline, and category
- [x] **PROC-02**: RFP list page shows all requests with status (Draft, Open, Evaluating, Awarded, Paid)
- [x] **PROC-03**: RFP detail page shows description, submitted bids, and status timeline
- [x] **PROC-04**: Gov officer can trigger AI evaluation on an RFP with submitted bids

### AI Procurement Engine

- [x] **AIEN-01**: AI scoring engine computes weighted composite score per bid: Price (30%), Delivery (20%), Reliability (25%), Compliance (15%), Risk (10%)
- [x] **AIEN-02**: Decision dashboard shows ranked supplier list with individual dimension scores and composite score
- [x] **AIEN-03**: "Best Value" badge highlights the AI-recommended winner
- [x] **AIEN-04**: AI explainability panel shows natural language narrative citing specific data points
- [x] **AIEN-05**: Score radar/bar chart renders per supplier for visual comparison
- [x] **AIEN-06**: Gov officer can manually override AI recommendation with a written justification note

### Payment & Checkout

- [x] **PAYM-01**: Payment selector presents two options: "Pay with USD" and "Pay with USDC (Polygon)"
- [x] **PAYM-02**: Checkout summary shows supplier name, amount, payment method, and order ID
- [x] **PAYM-03**: Confirming payment triggers the settlement animation flow
- [x] **PAYM-04**: Completed transactions are added to AppContext transaction history

### Settlement Engine (Animated)

- [x] **SETL-01**: USD settlement flow animates: Government Bank → Visa Network → Supplier Bank with labeled nodes and moving funds indicator
- [x] **SETL-02**: USD settlement progresses through: Authorized → Processing → Settled (T+2) with real-time status updates (~6s total)
- [x] **SETL-03**: USDC settlement flow animates: Government Wallet → Polygon Network → Supplier Wallet with blockchain hash display
- [x] **SETL-04**: USDC settlement progresses through: Submitted → Confirmed → Settled Instantly (~3s total)
- [x] **SETL-05**: Settlement state machine resets cleanly on re-entry; no stuck states or double-fire notifications
- [x] **SETL-06**: Side-by-side comparison panel shows "Traditional Rail (T+2)" vs "Blockchain Rail (Instant)" after settlement

### Notifications

- [x] **NOTF-01**: Toast notification fires on each settlement state change (initiated, authorized, settled)
- [x] **NOTF-02**: Each notification includes timestamp, payment method (USD/USDC), and transaction ID / blockchain hash
- [ ] **NOTF-03**: Notification history page lists all past notifications in reverse chronological order
- [ ] **NOTF-04**: Notification bell in header shows unread count badge

### Financial Dashboard

- [x] **DASH-01**: Dashboard shows USD balance, USDC balance, active orders count, completed orders count
- [x] **DASH-02**: Total spend metric and AI optimization savings (difference between highest bid and winning bid)
- [x] **DASH-03**: Payment breakdown pie/donut chart showing % paid via Visa vs % paid via USDC
- [x] **DASH-04**: Spend-over-time area chart
- [x] **DASH-05**: Recent transactions list with method badge, amount, supplier, and status

### Audit & Compliance

- [x] **AUDT-01**: Audit trail page shows timestamped log of all procurement events
- [x] **AUDT-02**: Auditor role can view all transactions across all RFPs
- [x] **AUDT-03**: "Export PDF" button generates a procurement report (audit trail + transaction summary)

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
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| FOUN-05 | Phase 1 | Complete |
| SUPP-04 | Phase 1 | Complete |
| SUPP-01 | Phase 2 | Complete |
| SUPP-02 | Phase 2 | Complete |
| SUPP-03 | Phase 2 | Complete |
| PROC-01 | Phase 2 | Complete |
| PROC-02 | Phase 2 | Complete |
| PROC-03 | Phase 2 | Complete |
| PROC-04 | Phase 2 | Complete |
| AIEN-01 | Phase 2 | Complete |
| AIEN-02 | Phase 2 | Complete |
| AIEN-03 | Phase 2 | Complete |
| AIEN-04 | Phase 2 | Complete |
| AIEN-05 | Phase 2 | Complete |
| AIEN-06 | Phase 2 | Complete |
| PAYM-01 | Phase 3 | Complete |
| PAYM-02 | Phase 3 | Complete |
| PAYM-03 | Phase 3 | Complete |
| PAYM-04 | Phase 3 | Complete |
| SETL-01 | Phase 3 | Complete |
| SETL-02 | Phase 3 | Complete |
| SETL-03 | Phase 3 | Complete |
| SETL-04 | Phase 3 | Complete |
| SETL-05 | Phase 3 | Complete |
| SETL-06 | Phase 3 | Complete |
| NOTF-01 | Phase 3 | Complete |
| NOTF-02 | Phase 3 | Complete |
| NOTF-03 | Phase 3 | Pending |
| NOTF-04 | Phase 3 | Pending |
| DASH-01 | Phase 3 | Complete |
| DASH-02 | Phase 3 | Complete |
| DASH-03 | Phase 3 | Complete |
| DASH-04 | Phase 3 | Complete |
| DASH-05 | Phase 3 | Complete |
| AUDT-01 | Phase 3 | Complete |
| AUDT-02 | Phase 3 | Complete |
| AUDT-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
