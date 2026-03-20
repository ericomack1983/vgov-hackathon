# Project Research Summary

**Project:** GovProcure AI
**Domain:** GovTech / Fintech — AI-powered government procurement with hybrid payment rails
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

GovProcure AI is a hackathon demo product that sits at the intersection of government procurement workflow, AI decision support, and hybrid payment rails (traditional Visa vs. USDC on Polygon). Experts building this class of product in 2025 combine a Next.js App Router frontend with Framer Motion for animation-driven storytelling, mock data layers that simulate the full procurement and settlement lifecycle, and a deterministic AI scoring engine that produces transparent, auditable rankings — no real APIs, no database, no authentication. The entire value proposition is demonstrated through UI narrative, not infrastructure.

The recommended approach is a three-phase build ordered strictly by data dependency: foundation and mock data first (everything downstream depends on it), then core procurement and AI engine, then payments and polish. The animated dual-rail settlement visualization — showing USD (T+1/T+2) vs. USDC (instant) side-by-side — is the single highest-impact differentiator and must be the centerpiece of Phase 3. All timing delays should be tuned for a 3-minute demo window, with a pre-seeded "demo-ready" RFP available from first load.

The dominant risks are animation state management (race conditions in the settlement machine), AI scoring that looks arbitrary if disconnected from visible bid data, and context performance if AppContext is not split early. These three pitfalls all have well-understood preventions and must be designed against from Phase 1 — they are not fixable in polish. PDF export is a secondary risk that needs early testing but does not block the core demo story.

## Key Findings

### Recommended Stack

The stack is a pragmatic, hackathon-optimized selection of stable 2025 libraries. Next.js 14+ with App Router handles routing and layout nesting cleanly. TailwindCSS 3.4 + tailwind-merge covers all styling needs without the overhead of component libraries. Framer Motion 11 drives the settlement animation — its `AnimatePresence`, `motion` variants, and `useMotionValue` primitives are purpose-built for the fund-flow visualization. Recharts 2.x handles dashboard charts with zero SSR friction via dynamic imports.

Blockchain simulation uses ethers.js 6.x for correct type utilities and hash formatting only — no real provider, no wallet connection. State management is deliberately minimal: React Context + useReducer split across three context slices (Procurement, Payment, UI), which is sufficient for mock-data scope and avoids Redux/Zustand overhead.

**Core technologies:**
- **Next.js 14+ (App Router):** Routing, layout nesting, API routes for scoring endpoint — App Router is the 2025 standard
- **TailwindCSS 3.4 + tailwind-merge:** Fast fintech UI styling without component library lock-in
- **Framer Motion 11:** Settlement animation state machine, fund-flow visualization, orchestrated transitions
- **Recharts 2.x:** PieChart (Visa vs USDC breakdown), AreaChart (spend over time) — clean React integration
- **ethers.js 6.x:** USDC/Polygon type utilities, correct 64-char tx hash generation, formatUnits for 6-decimal USDC
- **react-hot-toast:** Lightweight payment event notifications
- **jsPDF 2.x + html2canvas:** Audit trail PDF export (medium confidence — test early)
- **date-fns + uuid + lucide-react:** Timestamp formatting, ID generation, consistent icon set

**What NOT to use:** wagmi/viem (overkill for mocked blockchain), Redux/Zustand (mock-data scope doesn't need it), NextAuth (role switcher via UI is faster), MUI/Ant Design (clashes with custom fintech aesthetic), Prisma/database (mock data is sufficient).

### Expected Features

The feature set divides cleanly into table stakes (procurement core + AI decision + payment flow + dashboard) and differentiators (animated settlement visualization, AI explainability panel, role-based views, audit trail with PDF). The anti-feature list is equally important: no real auth, no database, no real API calls, no email notifications, no mobile responsiveness — none of these add demo value and all add integration risk.

The key insight from FEATURES.md is the feature dependency chain: supplier data must exist before RFP creation, RFPs before bids, bids before AI scoring, AI scoring before payment, payment before settlement animation and dashboard metrics. This directly dictates build order.

**Must have (table stakes):**
- RFP creation form with budget, deadline, and category — judges expect this workflow
- Supplier registry with ratings, certifications, and past performance — feeds AI scoring
- Bid submission per RFP and side-by-side bid comparison — core procurement UX
- AI ranked output with score breakdown (price 30%, delivery 20%, reliability 25%, compliance 15%, risk 10%) — non-negotiable
- "Best Value" recommendation with natural language narrative citing specific numbers
- Payment method selection (USD vs USDC) and settlement status indicators
- Financial dashboard: total spend, active orders, recent transactions, USD + USDC balances

**Should have (differentiators):**
- Animated fund-flow visualization showing USD rail (slow) vs USDC rail (instant) side-by-side — the "wow factor"
- AI explainability panel with radar chart and audit-ready narrative
- Manual override with override note (Gov officer overrides AI recommendation)
- Role-based views: Gov Officer, Supplier, Auditor
- Audit trail with PDF export
- "AI Optimization Savings" metric showing ROI vs. highest bid

**Defer (v2+):**
- Real authentication (OAuth, JWT)
- Database persistence
- Real Visa or Polygon API calls
- Email notifications
- Mobile responsiveness
- Search/filter across tables
- Supplier onboarding flow
- Multi-currency beyond USD/USDC

### Architecture Approach

The architecture is a clean client-side SPA within Next.js App Router, with three context slices (ProcurementContext, PaymentContext, UIContext), all mock data in `lib/mock-data/` as TypeScript constants, and simulators in `lib/payment/` for Visa and USDC flows. The AI scoring engine is a pure function in `lib/ai/scoring-engine.ts` that takes bids and suppliers and returns ranked results with scores and narrative. The settlement state machine lives locally in `SettlementFlow.tsx` (not global context) and progresses through: `idle → method-selected → initiating → authorized → processing → settled`.

**Major components:**
1. **AppContext (split into 3 slices):** Global state for role, RFPs, suppliers, bids, transactions, notifications — must be split from day 1 to avoid re-render cascades
2. **AI Scoring Engine (`lib/ai/scoring-engine.ts`):** Pure function, deterministic, computable from visible bid attributes — the transparency is the feature
3. **SettlementFlow + USDFlow/USDCFlow:** Local state machine with `useEffect`/`setTimeout` chains, abort controller for cleanup, timed progression with tunable constants
4. **Payment Simulators (`lib/payment/`):** visa-simulator and usdc-simulator return mock authorization and realistic-format tx hashes
5. **Layout (Sidebar + Header + AppShell):** Role switcher in Header triggers context update; role-sensitive sections use `key={role}` to force remount

### Critical Pitfalls

1. **Settlement animation race conditions** — Use `useRef` to store timeout IDs, cancel all in `useEffect` cleanup, reset to `idle` on mount. Test: navigate away mid-animation, return, verify clean reset. Phase 3.
2. **AI scoring looks arbitrary** — Score MUST derive from visible bid attributes. Show the weighted formula. Narrative must cite specific numbers: "SupplierX won because their $45,000 bid is 23% below average..." Phase 2.
3. **AppContext re-renders kill performance** — Split into three context slices (Procurement, Payment, UI) from Phase 1. Use `useMemo` for derived values. This cannot be refactored later without pain.
4. **Demo flow too long** — Pre-seed one demo-ready RFP with bids already submitted. Settlement total: USD 6-8s, USDC 3-4s. Add "Demo Mode" form pre-fill. Every click beyond 7 from RFP to settled payment is a liability.
5. **Mock blockchain hashes look fake** — Always generate full `0x` + 64-char hex. Show block number, gas used, confirmation count. "View on Polygonscan" link (href="#" is fine).

**Secondary pitfalls:** Role switcher breaks page state (use `key={role}`), PDF export captures wrong DOM (test early with `scale: 2, useCORS: true`), notifications fire multiple times in StrictMode (use `hasSettled` ref guard), supplier scores not varied enough (ensure 15+ point spread between 1st and last).

## Implications for Roadmap

Based on combined research, the feature dependency chain and architecture build order align tightly. Three phases are the right structure.

### Phase 1: Foundation and Mock Data

**Rationale:** Everything else depends on the data layer and context architecture. AppContext split must happen here — retrofitting three contexts later is painful. Mock supplier data with deliberate score spread must be designed now, not at evaluation time.

**Delivers:** Working app shell with navigation, role switcher, seeded mock data, and all shared components. A developer can open the app and see the sidebar, switch roles, and navigate to placeholder pages.

**Addresses from FEATURES.md:** Supplier registry (static display), role-based views (switcher), notification infrastructure.

**Implements from ARCHITECTURE.md:** Next.js scaffold, AppContext (3 slices), layout components (Sidebar, Header, AppShell), shared components (StatusBadge, Timeline), `lib/mock-data/` with suppliers, RFPs, and transactions.

**Avoids from PITFALLS.md:**
- AppContext re-renders (split into 3 slices from day 1)
- Role switcher state breaks (implement `key={role}` pattern immediately)
- Supplier scores not varied enough (design mock data with 15+ point spread and one clear "best value" winner)

### Phase 2: Core Procurement and AI Engine

**Rationale:** The AI scoring and decision dashboard is the intellectual core of the product. It must be rock-solid and transparent before payment is layered on top. Bid management and scoring are prerequisite to knowing who gets paid.

**Delivers:** Full RFP-to-decision workflow. A Gov Officer can create an RFP, see submitted bids from mock suppliers, trigger AI evaluation, see ranked results with score breakdown and narrative, and select a winner. The demo story is completable through this phase.

**Addresses from FEATURES.md:** RFP creation, bid submission, bid comparison, AI ranked output, score breakdown, "Best Value" highlight, natural language explanation, AI explainability panel, radar chart, manual override with note.

**Implements from ARCHITECTURE.md:** `lib/ai/scoring-engine.ts` (pure function), RFP pages, Supplier pages, AI components (ScoringPanel, ExplainabilityPanel, ScoreRadar), procurement data flow.

**Avoids from PITFALLS.md:**
- AI scoring looks arbitrary (scoring formula derived from visible bid attributes, weights displayed, narrative cites specific numbers)

### Phase 3: Payments, Visualization, and Polish

**Rationale:** The settlement animation is the demo's "wow moment" and the most complex technical component. It builds on top of the AI decision (who to pay) and requires the notification and dashboard infrastructure to feel complete. Do this last so the foundation is stable.

**Delivers:** Full end-to-end demo: RFP to settled payment with animated fund-flow visualization showing USD vs USDC rails side-by-side. Financial dashboard with spend charts. Audit trail with PDF export. Notification history.

**Addresses from FEATURES.md:** Payment method selection, settlement status indicators, animated fund flow (the differentiator), hybrid payment rails UX, blockchain hash display, financial dashboard KPIs, audit trail, PDF export, "AI Optimization Savings" metric, toast notifications.

**Implements from ARCHITECTURE.md:** SettlementFlow state machine, USDFlow and USDCFlow components, payment simulators (visa-simulator, usdc-simulator), PaymentSelector, dashboard charts (SpendChart, PaymentBreakdown), audit page, PDF report generator.

**Avoids from PITFALLS.md:**
- Settlement animation race conditions (abort controller, useRef timeout IDs, reset on mount)
- Notifications fire multiple times (hasSettled ref guard, deduplication in dispatch)
- Mock blockchain hashes look fake (full 64-char hex, block number, gas, Polygonscan link)
- PDF export captures wrong DOM (test early, target specific ref, scale: 2)
- Demo flow too long (pre-seed demo RFP, tune timing constants, add Demo Mode)

### Phase Ordering Rationale

- Data before UI: AppContext and mock data must exist before any page can render meaningfully. The feature dependency chain (suppliers → RFPs → bids → AI → payment → animation) dictates this order directly.
- Logic before animation: The AI scoring engine is a pure function that must be correct before the settlement flow is built on top of it. Errors in scoring logic discovered late cascade into payment narrative errors.
- Complexity last: The settlement state machine is the highest-complexity component. Building it on a stable foundation (Phase 1) with a working AI decision (Phase 2) reduces debugging surface area.
- Performance foundations early: The AppContext split and Framer Motion performance patterns (React.memo on charts, initial={false} on AnimatePresence) must be established in Phase 1, not added in Phase 3 when animation jank is discovered.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Settlement Animation):** The SettlementFlow state machine with abort controllers and timed progression is the highest-risk implementation. Consider a `/gsd:research-phase` spike on the exact Framer Motion patterns for the fund-flow node animation before building.
- **Phase 3 (PDF Export):** html2canvas behavior with Tailwind JIT and SVG charts is documented as problematic. Needs early proof-of-concept, not last-minute testing.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js App Router scaffold, TailwindCSS setup, and context patterns are well-documented with stable 2025 patterns. No research needed.
- **Phase 2 (AI Scoring):** The scoring engine is a pure TypeScript function with a deterministic weighted formula. Implementation is straightforward — design the mock data spread carefully and the math follows.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core libraries are stable 2025 choices with clear version recommendations. PDF export (jsPDF + html2canvas) is MEDIUM — implementation behavior varies with Tailwind. |
| Features | HIGH | Feature set is well-defined with clear table stakes, differentiators, and explicit anti-features. Dependency chain is explicit and well-reasoned. |
| Architecture | HIGH | Component map, data flow, and build order are fully specified. State machine pattern is concrete. Context split strategy is established. |
| Pitfalls | HIGH | 10 pitfalls identified with specific phase assignments and concrete prevention strategies. Quick wins enumerated. |

**Overall confidence:** HIGH

### Gaps to Address

- **Settlement animation node positioning:** The exact Framer Motion approach for moving "fund nodes" between entity boxes (Gov → Visa Network → Supplier) is specified at concept level but not at implementation level. The specific `useMotionValue` + `useTransform` pattern for path-following animation may need a spike in Phase 3 planning.
- **PDF export reliability:** html2canvas + Tailwind JIT interaction is flagged as potentially problematic. If PDF export is critical to the auditor role demo, validate the capture approach before committing to it as a feature.
- **Demo timing tuning:** Settlement delay constants (6s USD, 3s USDC) are guidelines. Actual demo pacing should be validated against a run-through before finalizing — judges may prefer faster or the animation may need more time to read clearly.

## Sources

### Primary (HIGH confidence)
- STACK.md researcher findings — Next.js 14, TailwindCSS 3.4, Framer Motion 11, Recharts 2.x, ethers.js 6.x version recommendations
- ARCHITECTURE.md researcher findings — component map, data flow diagrams, state machine specification, AI scoring interface
- FEATURES.md researcher findings — table stakes, differentiators, anti-features, feature dependency chain, complexity ratings
- PITFALLS.md researcher findings — 10 pitfalls with phase assignments, prevention strategies, and quick wins

### Secondary (MEDIUM confidence)
- PDF export approach (jsPDF + html2canvas) — flagged as implementation-dependent; multiple sources note Tailwind JIT and SVG chart capture issues
- Framer Motion fund-flow animation pattern — concept is established, exact node-path implementation needs validation

### Tertiary (LOW confidence)
- Settlement animation timing constants (6s USD, 3s USDC) — reasonable estimates for demo pacing, need live validation
- Score weight distribution (price 30%, delivery 20%, etc.) — plausible for government procurement context, but not derived from real procurement standards

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
