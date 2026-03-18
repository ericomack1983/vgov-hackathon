# Requirements: GovPay Disruptors

**Defined:** 2026-03-18
**Core Value:** AI agent autonomously manages procurement lifecycle with instant programmable payments

## v1 Requirements

### Foundation (FOUN)

- [ ] **FOUN-01**: Next.js project scaffolded with App Router and TailwindCSS
- [ ] **FOUN-02**: Apple-style design system with Inter font, soft shadows, rounded cards
- [ ] **FOUN-03**: Sidebar navigation with 5 sections (Dashboard, Requests, Suppliers, Transactions, AI Decisions)
- [ ] **FOUN-04**: Sticky header with system status indicator
- [ ] **FOUN-05**: Global state management via React Context
- [ ] **FOUN-06**: Mock data layer with suppliers, requests, and transactions

### Dashboard (DASH)

- [ ] **DASH-01**: Stat cards showing Total Requests, Active, Completed, Total Volume
- [ ] **DASH-02**: Procurement pipeline visualization (9-stage flow)
- [ ] **DASH-03**: Recent activity feed with status badges
- [ ] **DASH-04**: Quick action buttons linking to key pages

### Procurement Requests (REQT)

- [ ] **REQT-01**: Form to create new procurement request with category, urgency, budget, description
- [ ] **REQT-02**: Display requests in grid with status, urgency badges, and progress bars
- [ ] **REQT-03**: AI readiness score badge per request

### Supplier Registry (SUPP)

- [ ] **SUPP-01**: Display supplier cards with name, category, location
- [ ] **SUPP-02**: Show compliance score (0-100), certifications, MCC code
- [ ] **SUPP-03**: Show Polygon wallet address and star rating
- [ ] **SUPP-04**: Registry summary stats (total, compliant, MCC)

### AI Agent (AIAG)

- [ ] **AIAG-01**: Simulated RFQ generation from procurement request
- [ ] **AIAG-02**: Supplier scoring with weighted criteria (Price 40%, Delivery 25%, Compliance 35%)
- [ ] **AIAG-03**: Best supplier selection and recommendation
- [ ] **AIAG-04**: LLM-style audit narrative explanation of decision
- [ ] **AIAG-05**: Quote comparison table with scoring breakdown

### Visa Simulation (VISA)

- [ ] **VISA-01**: Generate virtual card number for payment
- [ ] **VISA-02**: Enforce MCC restriction (5047 = Healthcare)
- [ ] **VISA-03**: Simulate transaction approval/rejection based on MCC
- [ ] **VISA-04**: Simulate transaction settlement

### Blockchain Escrow (BLKC)

- [ ] **BLKC-01**: Simulate USDC deposit to escrow on Polygon
- [ ] **BLKC-02**: Simulate delivery confirmation
- [ ] **BLKC-03**: Simulate payment release from escrow
- [ ] **BLKC-04**: Generate mock transaction hashes and block numbers
- [ ] **BLKC-05**: Solidity smart contract reference (GovPayEscrow.sol)

### AI Decision Panel (AIDP)

- [ ] **AIDP-01**: 7-step guided demo flow with step indicator
- [ ] **AIDP-02**: Step 1 — Select procurement request
- [ ] **AIDP-03**: Step 2 — AI analysis simulation with progress
- [ ] **AIDP-04**: Step 3 — Review decision (quotes, scores, narrative)
- [ ] **AIDP-05**: Step 4 — Choose payment method (Visa or USDC)
- [ ] **AIDP-06**: Step 5 — Lock funds (simulated Visa/blockchain transaction)
- [ ] **AIDP-07**: Step 6 — Confirm delivery
- [ ] **AIDP-08**: Step 7 — Instant settlement with visual confirmation

### Transactions (TRAN)

- [ ] **TRAN-01**: List Visa transactions with MCC validation results
- [ ] **TRAN-02**: List blockchain transactions with Tx hashes and status
- [ ] **TRAN-03**: Volume summaries and status indicators

### Documentation (DOCS)

- [ ] **DOCS-01**: README with project overview, demo script, and technical details
- [ ] **DOCS-02**: Smart contract documentation inline

## v2 Requirements

### Enhanced Features

- **ENH-01**: Real Supabase authentication
- **ENH-02**: Real blockchain deployment to Polygon testnet
- **ENH-03**: Visa sandbox API integration
- **ENH-04**: Multi-language support (EN/ES/PT)
- **ENH-05**: Mobile responsive design

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real Visa API calls | Hackathon MVP — simulated only |
| Real blockchain deployment | Mock interactions sufficient for demo |
| User authentication | Prototype — no real auth needed |
| Database backend | Client-side state with mock data |
| Mobile responsiveness | Desktop-first for hackathon demo |
| Real AI/LLM integration | Simulated narrative generation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 to FOUN-06 | Phase 1 | Pending |
| DASH-01 to DASH-04 | Phase 2 | Pending |
| REQT-01 to REQT-03 | Phase 3 | Pending |
| SUPP-01 to SUPP-04 | Phase 3 | Pending |
| AIAG-01 to AIAG-05 | Phase 4 | Pending |
| VISA-01 to VISA-04 | Phase 5 | Pending |
| BLKC-01 to BLKC-05 | Phase 5 | Pending |
| AIDP-01 to AIDP-08 | Phase 6 | Pending |
| TRAN-01 to TRAN-03 | Phase 7 | Pending |
| DOCS-01 to DOCS-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
