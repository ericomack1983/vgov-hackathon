# Roadmap: GovPay Disruptors

**Created:** 2026-03-18
**Granularity:** Standard (7 phases)
**Core Value:** AI agent autonomously manages procurement lifecycle with instant programmable payments

## Milestone 1: Hackathon MVP

### Phase 1: Project Foundation & Design System
**Goal:** Scaffold Next.js project, install dependencies, configure TailwindCSS, build the shared layout (sidebar, header), design system tokens, and global state management.
**Requirements:** FOUN-01 through FOUN-06
**UAT:**
- [ ] `npm run dev` starts without errors
- [ ] Sidebar with 5 nav items renders correctly
- [ ] Inter font loads, Apple-style design tokens applied
- [ ] AppContext provides global state to all pages

### Phase 2: Dashboard Page
**Goal:** Build the main dashboard with KPIs, procurement pipeline visualization, recent activity, and quick actions.
**Requirements:** DASH-01 through DASH-04
**UAT:**
- [ ] 4 stat cards display correct data from app state
- [ ] Pipeline shows 9 stages with counts
- [ ] Recent activity feed shows request/transaction history
- [ ] Quick action buttons navigate to correct pages

### Phase 3: Requests & Suppliers Pages
**Goal:** Build the Procurement Requests page (create/view) and Supplier Registry page with compliance data.
**Requirements:** REQT-01 through REQT-03, SUPP-01 through SUPP-04
**UAT:**
- [ ] New Request form creates a request and adds to state
- [ ] Request cards show urgency, budget, status, progress
- [ ] Supplier cards show compliance score, certs, MCC, wallet, rating
- [ ] Registry summary shows total suppliers, compliant count, MCC

### Phase 4: AI Procurement Agent Logic
**Goal:** Implement the core AI agent — RFQ simulation, supplier scoring model, winner selection, and LLM-style audit narrative generation.
**Requirements:** AIAG-01 through AIAG-05
**UAT:**
- [ ] Agent generates realistic quotes from mock suppliers
- [ ] Scoring uses Price 40%, Delivery 25%, Compliance 35%
- [ ] Winner selected correctly based on highest composite score
- [ ] Narrative reads like an audit explanation with specific data points
- [ ] API route `/api/ai-agent` returns valid response

### Phase 5: Payment Simulators (Visa + Blockchain)
**Goal:** Build the Visa virtual card simulator (with MCC restrictions) and blockchain escrow simulator (Polygon/USDC).
**Requirements:** VISA-01 through VISA-04, BLKC-01 through BLKC-05
**UAT:**
- [ ] Virtual card generated with masked PAN
- [ ] MCC 5047 approved, non-5047 rejected
- [ ] Transaction settles after approval
- [ ] Escrow deposit generates Tx hash and block number
- [ ] Delivery confirmation triggers release
- [ ] Solidity contract exists as reference

### Phase 6: AI Decision Panel (Full Demo Flow)
**Goal:** Build the crown jewel — the 7-step guided demo page that walks through the entire procurement lifecycle.
**Requirements:** AIDP-01 through AIDP-08
**UAT:**
- [ ] Step indicator shows current position in flow
- [ ] Step 1: Select from active requests
- [ ] Step 2: AI analysis runs with visual progress
- [ ] Step 3: Quote comparison table + score breakdown + narrative
- [ ] Step 4: Visa vs USDC payment method selector
- [ ] Step 5: Fund locking with simulation feedback
- [ ] Step 6: Delivery confirmation trigger
- [ ] Step 7: Instant settlement with success animation

### Phase 7: Transactions Page, Polish & Documentation
**Goal:** Build Transactions page, write README with demo script, final UI polish, build verification.
**Requirements:** TRAN-01 through TRAN-03, DOCS-01 through DOCS-02
**UAT:**
- [ ] Visa transactions listed with MCC validation
- [ ] Blockchain transactions listed with Tx hashes
- [ ] README contains demo script, tech stack, architecture
- [ ] `npm run build` succeeds without errors
- [ ] All pages render correctly in browser

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
