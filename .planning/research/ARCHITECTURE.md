# Architecture Research: GovProcure AI

## Component Map

```
app/
├── layout.tsx              ← Root layout (AppProvider, role switcher, sidebar)
├── page.tsx                ← Redirect → /dashboard
├── dashboard/page.tsx      ← Financial KPIs, charts, quick actions
├── suppliers/
│   ├── page.tsx            ← Supplier registry list
│   └── [id]/page.tsx       ← Supplier profile detail
├── rfp/
│   ├── page.tsx            ← RFP list + create button
│   ├── new/page.tsx        ← RFP creation form
│   └── [id]/
│       ├── page.tsx        ← RFP detail + bid list
│       └── evaluate/page.tsx ← AI scoring + decision dashboard
├── payment/
│   └── [rfpId]/page.tsx    ← Checkout + settlement animation
├── transactions/page.tsx   ← All transactions with filter
├── notifications/page.tsx  ← Notification history
└── audit/page.tsx          ← Audit trail + PDF export

components/
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx          ← Role switcher here
│   └── AppShell.tsx
├── dashboard/
│   ├── StatCard.tsx
│   ├── SpendChart.tsx
│   └── PaymentBreakdown.tsx (PieChart)
├── suppliers/
│   ├── SupplierCard.tsx
│   └── SupplierProfile.tsx
├── rfp/
│   ├── RFPCard.tsx
│   └── BidCard.tsx
├── ai/
│   ├── ScoringPanel.tsx    ← Ranked list + score breakdown
│   ├── ExplainabilityPanel.tsx ← "Why this supplier" narrative
│   └── ScoreRadar.tsx      ← Radar chart per supplier
├── payment/
│   ├── PaymentSelector.tsx ← USD vs USDC choice
│   ├── SettlementFlow.tsx  ← Animated state machine
│   ├── USDFlow.tsx         ← Bank → Visa → Bank animation
│   └── USDCFlow.tsx        ← Wallet → Polygon → Wallet animation
└── shared/
    ├── StatusBadge.tsx
    ├── Timeline.tsx
    └── NotificationToast.tsx

lib/
├── mock-data/
│   ├── suppliers.ts        ← 8-10 mock suppliers with all fields
│   ├── rfps.ts             ← 5-6 mock RFPs in various states
│   └── transactions.ts     ← Historical transaction records
├── ai/
│   └── scoring-engine.ts   ← Pure function: bids[] → ranked results
├── payment/
│   ├── visa-simulator.ts   ← Mock Visa authorization + settlement
│   └── usdc-simulator.ts   ← Mock Polygon tx hash + confirmation
└── pdf/
    └── report-generator.ts ← html2canvas + jsPDF

context/
└── AppContext.tsx           ← Global state: role, rfps, bids, transactions, notifications
```

## Data Flow

### Procurement Flow
```
Mock Suppliers (lib/mock-data/suppliers.ts)
    ↓
AppContext (hydrated on mount)
    ↓
Gov creates RFP → AppContext.rfps updated
    ↓
Suppliers submit bids → AppContext.bids[rfpId] updated
    ↓
AI Scoring Engine (lib/ai/scoring-engine.ts)
    Input: bids[], suppliers[]
    Output: { rankedSuppliers, scores, recommendation, narrative }
    ↓
Decision Dashboard renders ranked results
    ↓
Gov selects winner → AppContext.selectedWinner[rfpId]
```

### Payment + Settlement Flow (State Machine)
```
State: idle → method-selected → initiating → authorized → processing → settled

USD Path:
  initiating: visa-simulator.authorize() → 1.5s delay
  authorized: status update + notification
  processing: 2s delay (simulating T+1 clearing)
  settled: final notification + transaction record added to AppContext

USDC Path:
  initiating: usdc-simulator.submit() → 0.5s delay (instant blockchain)
  authorized: tx hash generated + displayed
  processing: 1s delay (1 block confirmation)
  settled: final notification + blockchain hash stored
```

### Notification Flow
```
Payment state change → dispatch notification to AppContext.notifications
    ↓
react-hot-toast fires immediately (transient)
    ↓
Notification persists in AppContext.notifications[] (permanent history)
    ↓
Notification bell badge count increments
```

## Build Order (Phase Dependencies)

```
Phase 1: Foundation
  - Project scaffold (Next.js, Tailwind, Framer Motion)
  - AppContext with mock data
  - Layout (sidebar, header, role switcher)
  - Shared components (StatusBadge, Timeline)

Phase 2: Core Procurement + AI
  - Supplier registry page + profiles
  - RFP creation + bid management
  - AI scoring engine (pure function)
  - Decision dashboard + explainability panel

Phase 3: Payments + Polish
  - Payment selector + checkout
  - Settlement animation (USD + USDC flows)
  - Notifications system
  - Financial dashboard (charts, balances)
  - Audit trail + PDF export
```

## Key Architecture Decisions

### Mock Data Strategy
- All mock data lives in `lib/mock-data/` as TypeScript constants
- AppContext hydrates from mock data on mount
- Mutations (create RFP, submit bid, complete payment) update AppContext in memory
- No localStorage — data resets on refresh (acceptable for demo)

### Settlement State Machine
- State lives in `SettlementFlow.tsx` component (local, not global)
- Uses `useEffect` with `setTimeout` chains for timed progression
- Abort controller to cancel if user navigates away
- Each state transition triggers AppContext notification dispatch

### AI Scoring Engine
```typescript
// lib/ai/scoring-engine.ts
interface BidScore {
  supplierId: string;
  price: number;        // 0-100
  delivery: number;     // 0-100
  reliability: number;  // 0-100
  compliance: number;   // 0-100
  risk: number;         // 0-100 (inverted — lower risk = higher score)
  composite: number;    // weighted sum
  rank: number;
}

// Weights
const WEIGHTS = {
  price: 0.30,
  delivery: 0.20,
  reliability: 0.25,
  compliance: 0.15,
  risk: 0.10,
}
```

### Role-Based Views
- `AppContext.role`: 'gov' | 'supplier' | 'auditor'
- Header has role switcher dropdown
- Pages conditionally render sections based on role
- No route protection needed (demo)
