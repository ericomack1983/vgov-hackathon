# Phase 2: Procurement & AI Engine - Research

**Researched:** 2026-03-20
**Domain:** React client-side pages, forms, deterministic scoring engine, SVG data visualization
**Confidence:** HIGH

## Summary

Phase 2 builds the core procurement workflow and AI scoring engine on top of Phase 1's foundation. The existing codebase uses Next.js 16 (App Router), React 19, Tailwind v4, Framer Motion, and a `useReducer`-based `ProcurementContext` that already has `addRFP`, `updateRFP`, and `addBid` actions. All 8 mock suppliers and 5 mock RFPs are seeded with the exact data fields needed for scoring.

The phase requires: (1) replacing placeholder pages with real supplier registry/profile and RFP list/detail/create pages, (2) building a bid submission modal for the supplier role, (3) implementing a deterministic weighted scoring algorithm (no LLM -- pure math on existing supplier data), (4) rendering results with a radar chart (raw SVG), score bars, and a templated natural-language explanation, and (5) supporting manual override with justification logging.

**Primary recommendation:** Keep everything client-side with `'use client'` components. The AI engine is a pure function that takes bids + supplier data and returns scored/ranked results. Use raw SVG for the radar chart -- no charting library needed for a single 5-axis polygon. Extend ProcurementContext with new action types for AI evaluation results and override tracking.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUPP-01 | Supplier registry page lists all suppliers with name, rating, compliance status, certifications | Replace placeholder `/suppliers` page with grid of SupplierCard components reading from `useProcurement().suppliers` |
| SUPP-02 | Supplier profile page shows rating, past performance, pricing history, wallet address, compliance badge | New dynamic route `/suppliers/[id]/page.tsx` using `use(params)` for client component (Next.js 16 params-as-Promise pattern) |
| SUPP-03 | Supplier can submit a bid on an open RFP (bid amount, delivery days, notes) | BidFormModal component + `/bids` page filtered to Open RFPs; uses existing `addBid` action on ProcurementContext |
| PROC-01 | Gov user can create new RFP with title, description, budget ceiling, deadline, category | CreateRFPForm at `/rfp/new/page.tsx`; uses existing `addRFP` action; generate ID with `uuid` (already installed) |
| PROC-02 | RFP list page shows all requests with status badges | Replace placeholder `/rfp` page with table; StatusBadge already exists with correct variants |
| PROC-03 | RFP detail page shows description, bids, status timeline | New dynamic route `/rfp/[id]/page.tsx` with RFPStatusTimeline component and bid table |
| PROC-04 | Gov officer can trigger AI evaluation on RFP with submitted bids | "Run AI Evaluation" button on RFP detail; calls pure scoring function; stores results via new context action |
| AIEN-01 | AI scoring: weighted composite (Price 30%, Delivery 20%, Reliability 25%, Compliance 15%, Risk 10%) | Pure TypeScript function `scoreSuppliers(bids, suppliers, rfp)` returning ranked array with dimension scores |
| AIEN-02 | Decision dashboard shows ranked supplier list with dimension + composite scores | RankedSupplierRow + DimensionScoreGrid components rendered in AI results section of RFP detail |
| AIEN-03 | "Best Value" badge on AI-recommended winner | BestValueBadge component (bg-indigo-600, Sparkles icon from lucide-react) |
| AIEN-04 | AI explainability panel with natural language narrative citing data points | ExplainabilityPanel using template string from UI-SPEC copywriting contract; no LLM needed |
| AIEN-05 | Score radar/bar chart per supplier | ScoreRadarChart as raw SVG (5-axis polygon); ScoreBar as styled div with width percentage |
| AIEN-06 | Gov officer can manually override AI recommendation with justification note | OverrideForm with supplier select + textarea; new context action to track override + preserve original |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.0 | App Router, file-system routing, dynamic routes | Already installed; use `[id]` folder convention |
| react | 19.2.4 | UI components, `use()` hook for params Promise | Already installed; `use(params)` required for client dynamic routes |
| tailwindcss | ^4 | Utility-first styling | Already installed; all UI-SPEC specs use Tailwind classes |
| framer-motion | ^11.18.2 | Page transitions, loading animations | Already installed; continue fade+slide-up pattern from Phase 1 |
| lucide-react | ^0.400.0 | Icons (Sparkles, Bot, ChevronRight, etc.) | Already installed; UI-SPEC specifies Sparkles and Bot icons |
| uuid | ^9.0.1 | Generate IDs for new RFPs and bids | Already installed |
| react-hot-toast | ^2.6.0 | Success/error toasts for form submissions | Already installed |
| clsx + tailwind-merge | installed | `cn()` utility for conditional classes | Already established pattern |
| date-fns | ^3.6.0 | Date formatting for deadlines, timestamps | Already installed |

### No New Dependencies Required

This phase requires zero new npm installs. The radar chart is hand-built SVG. The scoring engine is pure TypeScript math. All UI uses Tailwind utilities. This is intentional -- the project uses no component library (UI-SPEC confirms "hand-built with Tailwind v4").

## Architecture Patterns

### New Route Structure

```
src/app/
  suppliers/
    page.tsx              # Supplier registry grid (replace placeholder)
    [id]/
      page.tsx            # Supplier profile detail
  rfp/
    page.tsx              # RFP list table (replace placeholder)
    new/
      page.tsx            # Create RFP form
    [id]/
      page.tsx            # RFP detail + AI evaluation + override
  bids/
    page.tsx              # Supplier bid list (replace placeholder)
```

### New Component Structure

```
src/components/
  procurement/
    SupplierCard.tsx         # Grid card for registry
    RFPStatusTimeline.tsx    # Horizontal 5-step timeline
    CreateRFPForm.tsx        # 5-field form
    BidFormModal.tsx         # Modal with 3 fields
  ai/
    ScoreBar.tsx             # Horizontal 0-100 bar
    ScoreRadarChart.tsx      # 5-axis SVG radar
    RankedSupplierRow.tsx    # Table row with left-border
    BestValueBadge.tsx       # Indigo badge with Sparkles
    DimensionScoreGrid.tsx   # 5-column score display
    ExplainabilityPanel.tsx  # AI narrative card
    OverrideForm.tsx         # Override with justification
```

### New Library Module

```
src/lib/
  ai-engine.ts              # Pure scoring function + narrative generator
```

### Pattern 1: Next.js 16 Client Dynamic Routes with `use(params)`

**What:** In Next.js 16, `params` is a Promise even in page components. Client components must use React's `use()` hook to unwrap it.

**When to use:** Every `[id]` page in this phase.

**Example:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md
'use client'
import { use } from 'react'

export default function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  // use id to find supplier from context
}
```

### Pattern 2: Deterministic Scoring Engine (Pure Function)

**What:** A stateless function that takes bids, supplier data, and RFP config, and returns ranked results with per-dimension scores.

**When to use:** AIEN-01 through AIEN-04.

**Example:**
```typescript
// src/lib/ai-engine.ts
interface DimensionScores {
  price: number;       // 0-100, lower bid relative to budget = higher score
  delivery: number;    // 0-100, fewer days = higher score
  reliability: number; // 0-100, from supplier.pastPerformance
  compliance: number;  // 0-100, from supplier.complianceStatus + certifications count
  risk: number;        // 0-100, inverted from supplier.riskScore (lower risk = higher score)
}

interface ScoredBid {
  bid: Bid;
  supplier: Supplier;
  dimensions: DimensionScores;
  composite: number; // weighted sum
  rank: number;
  isWinner: boolean;
}

const WEIGHTS = {
  price: 0.30,
  delivery: 0.20,
  reliability: 0.25,
  compliance: 0.15,
  risk: 0.10,
};

function scoreBids(bids: Bid[], suppliers: Supplier[], rfp: RFP): ScoredBid[] {
  // 1. Score each dimension 0-100
  // 2. Compute weighted composite
  // 3. Sort descending by composite
  // 4. Assign ranks, mark winner
}
```

### Pattern 3: Extending ProcurementContext Without Breaking Phase 1

**What:** Add new action types and state fields to handle AI evaluation results and overrides.

**When to use:** Storing evaluation results and override data.

**Example:**
```typescript
// New fields on RFP type (extend existing)
interface RFP {
  // ... existing fields ...
  evaluationResults?: ScoredBid[];
  overrideWinnerId?: string;
  overrideJustification?: string;
}

// New action types
type ProcurementAction =
  | { type: 'ADD_RFP'; payload: RFP }
  | { type: 'UPDATE_RFP'; payload: { id: string; updates: Partial<RFP> } }
  | { type: 'ADD_BID'; payload: { rfpId: string; bid: Bid } }
  | { type: 'SET_EVALUATION'; payload: { rfpId: string; results: ScoredBid[] } }
  | { type: 'SET_OVERRIDE'; payload: { rfpId: string; winnerId: string; justification: string } };
```

### Pattern 4: SVG Radar Chart (No Library)

**What:** A 5-axis radar/spider chart rendered as raw SVG polygon.

**When to use:** AIEN-05.

**Example approach:**
```typescript
// 5 axes at 72-degree intervals (360/5)
// For each axis, plot point at distance = score/100 * radius
// Connect points as SVG <polygon>
// Background grid: concentric pentagons at 25%, 50%, 75%, 100%
const axes = ['price', 'delivery', 'reliability', 'compliance', 'risk'];
const angleStep = (2 * Math.PI) / 5;

function polarToCartesian(score: number, axisIndex: number, radius: number, center: number) {
  const angle = axisIndex * angleStep - Math.PI / 2; // start from top
  const r = (score / 100) * radius;
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}
```

### Anti-Patterns to Avoid

- **Using a charting library for one chart:** Recharts/Chart.js would add 50-100KB for a single radar chart. Raw SVG is ~50 lines of code.
- **Calling an LLM API for "AI" scoring:** The requirements specify deterministic weighted scoring. The "AI" is a branding term for an algorithmic engine. A pure function is correct.
- **Server components for interactive pages:** All Phase 2 pages need context access (useProcurement, useUI) and interactivity. They must all be `'use client'`.
- **Storing evaluation results in separate state:** Keep them on the RFP object itself to maintain data locality and simplify the audit trail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique IDs | Custom counter/timestamp | `uuid` v4 (already installed) | Collision-free, standard |
| Class merging | String concatenation | `cn()` utility (clsx + tailwind-merge) | Handles conflicts correctly |
| Date formatting | Manual string ops | `date-fns` `format()` | Locale-safe, timezone-aware |
| Toast notifications | Custom notification system | `react-hot-toast` (already installed) | Already wired, consistent |
| Page transitions | Manual CSS animations | `framer-motion` `motion.div` | Already established pattern from Phase 1 |

**Key insight:** Phase 2 needs no new libraries. Everything is either already installed or better built as a small pure function/SVG component.

## Common Pitfalls

### Pitfall 1: Next.js 16 `params` is a Promise
**What goes wrong:** Treating `params` as a synchronous object causes runtime errors.
**Why it happens:** Previous Next.js versions had synchronous params. Next.js 16 changed this.
**How to avoid:** Always use `use(params)` in client components or `await params` in server components.
**Warning signs:** "Cannot read property 'id' of undefined" errors on dynamic route pages.

### Pitfall 2: Score Normalization Edge Cases
**What goes wrong:** Division by zero when all bids have the same price, or when a supplier has 0 risk score.
**Why it happens:** Normalizing scores to 0-100 often involves dividing by (max - min).
**How to avoid:** Use absolute scales where possible. For price: score = (1 - bid.amount / rfp.budgetCeiling) * 100 (clamped 0-100). For risk: score = 100 - supplier.riskScore (already 0-100 scale). Guard all divisions.
**Warning signs:** NaN scores, all suppliers getting identical scores.

### Pitfall 3: Context Re-renders on Every Evaluation
**What goes wrong:** Storing evaluation results in context causes all consuming components to re-render.
**Why it happens:** Adding data to context triggers re-renders for all subscribers.
**How to avoid:** The existing 3-slice context architecture already mitigates this. Evaluation results go in ProcurementContext only, so PaymentContext and UIContext subscribers are unaffected. Within the procurement slice, use `useMemo` to prevent unnecessary child re-renders.
**Warning signs:** Sluggish UI after running evaluation.

### Pitfall 4: Modal Focus Trap and Escape Key
**What goes wrong:** BidFormModal doesn't trap focus or close on Escape, failing accessibility requirements.
**Why it happens:** Easy to forget when hand-building modals.
**How to avoid:** Implement `onKeyDown` handler for Escape, `useEffect` for focus trap on mount, and portal rendering. UI-SPEC explicitly requires this.
**Warning signs:** Tab key escapes modal, Escape does nothing.

### Pitfall 5: Supplier Role Can't Access Gov-Only Pages
**What goes wrong:** Supplier navigates to /rfp/new or sees "Run AI Evaluation" button.
**Why it happens:** No role gating on page content.
**How to avoid:** Check `useUI().role` and conditionally render CTAs. Sidebar nav already filters by role, but direct URL access needs guarding.
**Warning signs:** Supplier can create RFPs or trigger evaluations.

## Code Examples

### Scoring Formula Implementation

```typescript
// Source: REQUIREMENTS.md AIEN-01 weights
function computeDimensionScores(bid: Bid, supplier: Supplier, rfp: RFP): DimensionScores {
  // Price: lower bid relative to budget ceiling = higher score
  const priceScore = Math.max(0, Math.min(100,
    (1 - bid.amount / rfp.budgetCeiling) * 100
  ));

  // Delivery: fewer days = higher score (normalize against 90-day baseline)
  const deliveryScore = Math.max(0, Math.min(100,
    (1 - bid.deliveryDays / 365) * 100
  ));

  // Reliability: direct from pastPerformance (already 0-100)
  const reliabilityScore = supplier.pastPerformance;

  // Compliance: based on status + certification count
  const statusScore = supplier.complianceStatus === 'Compliant' ? 60 :
                      supplier.complianceStatus === 'Pending Review' ? 30 : 0;
  const certScore = Math.min(40, supplier.certifications.length * 10);
  const complianceScore = statusScore + certScore;

  // Risk: invert riskScore (lower risk = higher score, already 0-100 scale)
  const riskScore = Math.max(0, 100 - supplier.riskScore);

  return { price: priceScore, delivery: deliveryScore, reliability: reliabilityScore,
           compliance: complianceScore, risk: riskScore };
}

function computeComposite(scores: DimensionScores): number {
  return Math.round(
    scores.price * 0.30 +
    scores.delivery * 0.20 +
    scores.reliability * 0.25 +
    scores.compliance * 0.15 +
    scores.risk * 0.10
  );
}
```

### Narrative Template Generation

```typescript
// Source: UI-SPEC copywriting contract
function generateNarrative(ranked: ScoredBid[]): string {
  const winner = ranked[0];
  const runnerUp = ranked[1];

  const topDimension = Object.entries(winner.dimensions)
    .sort(([,a], [,b]) => b - a)[0];
  const runnerUpWeakest = Object.entries(runnerUp.dimensions)
    .sort(([,a], [,b]) => a - b)[0];

  const gap = winner.composite - runnerUp.composite;

  return `Based on ${winner.supplier.name}'s strong ${topDimension[0]} score of ${topDimension[1]}/100 and competitive pricing at $${winner.bid.amount.toLocaleString()}, they represent the best value. ${runnerUp.supplier.name} scored ${gap} points lower, primarily due to ${runnerUpWeakest[0]}.`;
}
```

### SVG Radar Chart Coordinate Calculation

```typescript
// 5-axis radar at 280x280px (per UI-SPEC)
const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 30; // padding for labels
const AXES = ['price', 'delivery', 'reliability', 'compliance', 'risk'];

function getPoint(score: number, axisIndex: number): string {
  const angle = (axisIndex * 2 * Math.PI) / 5 - Math.PI / 2;
  const r = (score / 100) * RADIUS;
  const x = CENTER + r * Math.cos(angle);
  const y = CENTER + r * Math.sin(angle);
  return `${x},${y}`;
}

// Grid pentagons at 25%, 50%, 75%, 100%
function getGridPolygon(percent: number): string {
  return AXES.map((_, i) => getPoint(percent, i)).join(' ');
}
```

### Page Pattern with Framer Motion (continuing Phase 1)

```typescript
'use client';
import { motion } from 'framer-motion';

export default function SomePhase2Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* page content */}
    </motion.div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as sync object | `params` as Promise (use `use()` or `await`) | Next.js 15+ | All dynamic route pages must unwrap params |
| Tailwind v3 config file | Tailwind v4 CSS-first config | Tailwind v4 | No `tailwind.config.js`; configure via CSS |
| `'use client'` optional | Required for any hook usage | Next.js 13+ (App Router) | All pages using context must be client components |

## Open Questions

1. **RFP Type Extension for Evaluation Results**
   - What we know: The `RFP` type needs `evaluationResults`, `overrideWinnerId`, `overrideJustification` fields
   - What's unclear: Whether to create a separate `EvaluationResult` type in `types.ts` or keep `ScoredBid` as a local type in `ai-engine.ts`
   - Recommendation: Define `ScoredBid` and `DimensionScores` in `types.ts` since they're used across multiple components. Add optional fields to `RFP` interface.

2. **Pricing History Sparkline on Supplier Profile**
   - What we know: UI-SPEC mentions "pricing sparkline" on supplier profile
   - What's unclear: Exact visual spec not detailed
   - Recommendation: Simple SVG polyline (similar to radar chart approach) using the existing `pricingHistory` array. ~20 lines of code.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AIEN-01 | Scoring engine produces correct weighted composite | unit | `npx vitest run src/lib/ai-engine.test.ts` | No -- Wave 0 |
| AIEN-04 | Narrative generator cites correct data points | unit | `npx vitest run src/lib/ai-engine.test.ts` | No -- Wave 0 |
| PROC-01 | RFP creation adds to context with correct status | manual-only | Visual verification in browser | N/A |
| SUPP-03 | Bid submission adds bid to RFP | manual-only | Visual verification in browser | N/A |
| AIEN-06 | Override preserves original recommendation | manual-only | Visual verification in browser | N/A |

### Sampling Rate
- **Per task commit:** Manual browser verification (this is a hackathon UI project)
- **Per wave merge:** `npx vitest run` if test infra added
- **Phase gate:** All 5 success criteria verified manually in browser

### Wave 0 Gaps
- [ ] `vitest` + `@testing-library/react` -- install if unit testing AI engine (optional for hackathon)
- [ ] `src/lib/ai-engine.test.ts` -- covers AIEN-01 scoring correctness
- [ ] Note: Given hackathon context, unit testing the pure scoring function is the highest-value test. UI tests are lower priority.

## Sources

### Primary (HIGH confidence)
- Next.js 16 docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` -- params as Promise, `use()` pattern
- Existing codebase: `src/context/ProcurementContext.tsx` -- reducer pattern, existing actions
- Existing codebase: `src/lib/mock-data/types.ts` -- type definitions including Bid, RFP, Supplier
- Existing codebase: `src/lib/mock-data/suppliers.ts` -- 8 suppliers with all scoring fields populated
- Existing codebase: `src/lib/mock-data/rfps.ts` -- 5 RFPs with pre-seeded bids in various states

### Secondary (MEDIUM confidence)
- UI-SPEC at `.planning/phases/02-procurement-ai-engine/02-UI-SPEC.md` -- component specs, copywriting contract, interaction flows

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed, verified in package.json
- Architecture: HIGH - follows established Phase 1 patterns, extends existing context
- Pitfalls: HIGH - Next.js 16 params-as-Promise verified against shipped docs; scoring edge cases are standard numerical programming concerns
- Scoring engine: HIGH - requirements specify exact weights, supplier data has all needed fields

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- no external dependencies or fast-moving APIs)
