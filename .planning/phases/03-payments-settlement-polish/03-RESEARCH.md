# Phase 3: Payments, Settlement & Polish - Research

**Researched:** 2026-03-21
**Domain:** Payment checkout, animated settlement visualization, toast notifications, charting, audit trail, PDF export
**Confidence:** HIGH

## Summary

Phase 3 is the "wow moment" of the hackathon demo -- it takes the awarded RFP from Phase 2 and delivers a complete payment-to-settlement flow with animated fund visualization, real-time toast notifications, a financial dashboard with charts, and an auditable compliance trail with PDF export.

The existing codebase is well-prepared: `PaymentContext` already has `addTransaction`, `addNotification`, and `markNotificationRead` actions with correct types (`Transaction`, `Notification`). The `Transaction` type already includes `method` (USD/USDC), `status` (Pending/Authorized/Processing/Settled), `txHash`, and `orderId` fields. Mock transactions are seeded. The Header already has a Bell icon (no badge yet). All target pages (`/payment`, `/dashboard`, `/audit`, `/notifications`, `/transactions`) exist as placeholders ready to be replaced.

The highest-risk component is the settlement animation state machine. This is best implemented as a `useReducer`-based state machine driving Framer Motion `<motion.div>` and `<motion.circle>` animations on an inline SVG, with `setTimeout` progression through states. The second risk is PDF export -- `jsPDF` + `html2canvas` is the pragmatic choice for a hackathon, generating a rasterized PDF from a rendered DOM element. For the dashboard charts (pie/donut and area chart), raw SVG is the established project pattern (Phase 2 used raw SVG for radar chart and sparklines), so continue that approach with SVG `<path>` elements for both chart types.

**Primary recommendation:** Build the settlement animation as a self-contained `useSettlement` hook that manages a state machine (idle -> authorized -> processing -> settled for USD; idle -> submitted -> confirmed -> settled for USDC) driving both the SVG animation and toast notifications. Use raw SVG for all charts. Use `jsPDF` + `html2canvas` for PDF export (2 new dependencies only). Extend `PaymentContext` minimally -- it already has all needed actions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAYM-01 | Payment selector: "Pay with USD" and "Pay with USDC (Polygon)" | Payment checkout page with two method cards; reads awarded RFP from ProcurementContext |
| PAYM-02 | Checkout summary: supplier name, amount, method, order ID | Summary card composed from RFP + selected winner data |
| PAYM-03 | Confirming payment triggers settlement animation | "Confirm Payment" button calls `useSettlement` hook which starts state machine |
| PAYM-04 | Completed transactions added to AppContext history | On settlement complete, call `addTransaction` from PaymentContext |
| SETL-01 | USD animated flow: Gov Bank -> Visa Network -> Supplier Bank | Inline SVG with 3 labeled nodes and animated moving circle using Framer Motion |
| SETL-02 | USD states: Authorized -> Processing -> Settled (~6s) with status updates | State machine with setTimeout (2s per step), toast at each transition |
| SETL-03 | USDC animated flow: Gov Wallet -> Polygon Network -> Supplier Wallet with hash | Same SVG pattern with blockchain hash display below nodes |
| SETL-04 | USDC states: Submitted -> Confirmed -> Settled Instantly (~3s) | Faster state machine (1.5s per step), same toast pattern |
| SETL-05 | State machine resets cleanly; no stuck states or double-fire | useReducer with explicit reset action; cleanup in useEffect return; guard against re-entry |
| SETL-06 | Side-by-side comparison: "Traditional Rail (T+2)" vs "Blockchain Rail (Instant)" | Static comparison panel rendered after settlement completes |
| NOTF-01 | Toast on each settlement state change | react-hot-toast (already installed) called from settlement hook |
| NOTF-02 | Notification includes timestamp, method, txId/hash | Compose Notification object with all fields before dispatch |
| NOTF-03 | Notification history page, reverse chronological | Replace /notifications placeholder; read from PaymentContext.notifications |
| NOTF-04 | Notification bell with unread count badge | Extend Header component; PaymentContext already exposes `unreadCount` |
| DASH-01 | USD balance, USDC balance, active orders, completed orders | Computed from transactions array in PaymentContext |
| DASH-02 | Total spend and AI optimization savings | Savings = sum of (budget ceiling - winning bid amount) across awarded RFPs |
| DASH-03 | Payment breakdown pie/donut chart (Visa vs USDC %) | Raw SVG donut chart using conic-gradient or arc paths |
| DASH-04 | Spend-over-time area chart | Raw SVG area chart with path element |
| DASH-05 | Recent transactions list with method badge, amount, supplier, status | Table component reading from PaymentContext.transactions |
| AUDT-01 | Audit trail: timestamped log of all procurement events | New AuditEvent type; aggregate from procurement + payment context data |
| AUDT-02 | Auditor role can view all transactions across all RFPs | Role-gated page; reads all transactions from PaymentContext |
| AUDT-03 | "Export PDF" generates downloadable procurement report | jsPDF + html2canvas rendering a hidden report div to PDF |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.0 | App Router, file-system routing | Already installed |
| react | 19.2.4 | UI components, hooks | Already installed |
| tailwindcss | ^4 | Utility-first styling | Already installed |
| framer-motion | ^11.18.2 | Settlement animation, page transitions, SVG animation | Already installed; `motion.circle`, `motion.path` for fund flow |
| lucide-react | ^0.400.0 | Icons (CreditCard, Wallet, Building, Globe, Bell, etc.) | Already installed |
| react-hot-toast | ^2.6.0 | Toast notifications for settlement state changes | Already installed; NOTF-01 requirement |
| uuid | ^9.0.1 | Generate order IDs and transaction IDs | Already installed |
| date-fns | ^3.6.0 | Timestamp formatting for audit trail and notifications | Already installed |
| clsx + tailwind-merge | installed | `cn()` utility for conditional classes | Already installed |

### New Dependencies (2 packages)

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| jspdf | ^4.2.1 | PDF document generation | AUDT-03 requires downloadable PDF; lightest option for client-side PDF |
| html2canvas | ^1.4.1 | Render DOM element to canvas for PDF | Captures styled HTML (including Tailwind) as image for jsPDF |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jspdf + html2canvas | @react-pdf/renderer | Better text quality but requires completely separate React component tree for PDF layout; too much effort for hackathon |
| jspdf + html2canvas | react-to-pdf | Wrapper around same libs; adds unnecessary abstraction |
| Raw SVG charts | Recharts/Chart.js | Would add 50-100KB for 2 simple charts; project pattern is raw SVG (Phase 2 radar + sparklines) |
| useReducer state machine | XState | XState is overkill for 3-4 linear states; useReducer + setTimeout is sufficient |

**Installation:**
```bash
npm install jspdf html2canvas
npm install -D @types/html2canvas
```

**Version verification:** jspdf 4.2.1 (current on npm), html2canvas 1.4.1 (current on npm). Note: @types/html2canvas may not be needed as html2canvas 1.4.1 includes its own TypeScript declarations -- verify at install time.

## Architecture Patterns

### Route Structure (replacing placeholders)

```
src/app/
  payment/
    page.tsx              # Payment checkout (replace placeholder)
    [rfpId]/
      page.tsx            # Payment flow for specific RFP (checkout + settlement)
  dashboard/
    page.tsx              # Financial dashboard (replace placeholder)
  notifications/
    page.tsx              # Notification history (replace placeholder)
  transactions/
    page.tsx              # All transactions list (replace placeholder)
  audit/
    page.tsx              # Audit trail + PDF export (replace placeholder)
```

### Component Structure

```
src/components/
  payment/
    PaymentMethodSelector.tsx   # Two cards: USD and USDC
    CheckoutSummary.tsx         # Supplier, amount, method, order ID
    SettlementAnimation.tsx     # SVG fund-flow animation (main component)
    SettlementNode.tsx          # Individual labeled node in the flow
    ComparisonPanel.tsx         # Side-by-side T+2 vs Instant comparison
  dashboard/
    StatCard.tsx                # Individual metric card (balance, count, etc.)
    DonutChart.tsx              # SVG donut for payment breakdown
    AreaChart.tsx               # SVG area chart for spend-over-time
    RecentTransactions.tsx      # Transaction list table
  audit/
    AuditEventRow.tsx           # Single audit event in the timeline
    ExportPDFButton.tsx         # Button that triggers PDF generation
  notifications/
    NotificationItem.tsx        # Single notification card
    NotificationBell.tsx        # Bell icon with unread badge (for Header)
```

### Library Module

```
src/lib/
  settlement-engine.ts         # Settlement state machine types and logic
  audit-utils.ts               # Aggregate procurement events into audit log
  chart-utils.ts               # SVG path computation for donut and area charts
```

### Pattern 1: Settlement State Machine with useReducer

**What:** A linear state machine that progresses through settlement states, driving animation and notifications.

**When to use:** SETL-01 through SETL-05.

**Example:**
```typescript
// src/lib/settlement-engine.ts
type USDSettlementState = 'idle' | 'authorized' | 'processing' | 'settled';
type USDCSettlementState = 'idle' | 'submitted' | 'confirmed' | 'settled';

type SettlementState = {
  method: 'USD' | 'USDC';
  currentState: string;
  progress: number; // 0-100 for animation
  txHash?: string;
  orderId: string;
};

type SettlementAction =
  | { type: 'START'; payload: { method: 'USD' | 'USDC'; orderId: string } }
  | { type: 'ADVANCE' }  // move to next state
  | { type: 'RESET' };

function settlementReducer(state: SettlementState, action: SettlementAction): SettlementState {
  switch (action.type) {
    case 'START':
      return {
        method: action.payload.method,
        currentState: action.payload.method === 'USD' ? 'authorized' : 'submitted',
        progress: 0,
        orderId: action.payload.orderId,
        txHash: action.payload.method === 'USDC'
          ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
          : undefined,
      };
    case 'ADVANCE': {
      const transitions: Record<string, { next: string; progress: number }> = {
        authorized: { next: 'processing', progress: 50 },
        processing: { next: 'settled', progress: 100 },
        submitted: { next: 'confirmed', progress: 50 },
        confirmed: { next: 'settled', progress: 100 },
      };
      const t = transitions[state.currentState];
      if (!t) return state;
      return { ...state, currentState: t.next, progress: t.progress };
    }
    case 'RESET':
      return { method: 'USD', currentState: 'idle', progress: 0, orderId: '' };
    default:
      return state;
  }
}
```

### Pattern 2: useSettlement Hook (encapsulates animation + notifications)

**What:** Custom hook that combines the state machine, setTimeout progression, and toast notifications.

**When to use:** SettlementAnimation component consumes this hook.

**Example:**
```typescript
// src/hooks/useSettlement.ts
function useSettlement(onComplete: (tx: Transaction) => void) {
  const [state, dispatch] = useReducer(settlementReducer, initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((method: 'USD' | 'USDC', orderId: string) => {
    dispatch({ type: 'START', payload: { method, orderId } });
  }, []);

  // Auto-advance through states with cleanup
  useEffect(() => {
    if (state.currentState === 'idle' || state.currentState === 'settled') return;

    const delay = state.method === 'USD' ? 2000 : 1500;
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'ADVANCE' });
    }, delay);

    // Fire toast for current state
    toast.success(`${state.method}: ${state.currentState}`, {
      icon: state.method === 'USDC' ? '⛓' : '🏦',
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.currentState, state.method]);

  // Handle settlement completion
  useEffect(() => {
    if (state.currentState === 'settled') {
      onComplete(/* build Transaction from state */);
    }
  }, [state.currentState, onComplete]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, start, reset };
}
```

### Pattern 3: SVG Fund-Flow Animation with Framer Motion

**What:** Inline SVG with labeled nodes connected by a path, with an animated circle moving along it.

**When to use:** SETL-01, SETL-03.

**Example:**
```typescript
// SettlementAnimation.tsx
// 3 nodes at x=80, x=300, x=520 on a 600x200 SVG
// Connecting line between nodes
// Animated circle moves from node to node based on progress

<svg viewBox="0 0 600 200" className="w-full max-w-2xl">
  {/* Connection line */}
  <line x1={80} y1={100} x2={520} y2={100}
    stroke="#e2e8f0" strokeWidth={2} />

  {/* Nodes */}
  {nodes.map((node, i) => (
    <g key={i}>
      <circle cx={node.x} cy={100} r={30}
        fill={isActive(i) ? '#4f46e5' : '#f1f5f9'}
        stroke={isActive(i) ? '#4f46e5' : '#cbd5e1'} strokeWidth={2} />
      <text x={node.x} y={150} textAnchor="middle"
        className="text-xs fill-slate-600">{node.label}</text>
    </g>
  ))}

  {/* Animated fund indicator */}
  <motion.circle
    cx={80}
    cy={100}
    r={8}
    fill="#4f46e5"
    animate={{ cx: progressToX(state.progress) }}
    transition={{ duration: 1, ease: 'easeInOut' }}
  />
</svg>
```

### Pattern 4: SVG Donut Chart (no library)

**What:** SVG circle with `stroke-dasharray` and `stroke-dashoffset` for segments.

**When to use:** DASH-03.

**Example:**
```typescript
// DonutChart.tsx
// Using SVG circle with stroke-dasharray technique
const circumference = 2 * Math.PI * radius;
const usdcPercent = usdcTotal / totalSpend;
const visaPercent = 1 - usdcPercent;

<svg viewBox="0 0 200 200">
  {/* Background circle */}
  <circle cx={100} cy={100} r={radius}
    fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
  {/* USDC segment */}
  <circle cx={100} cy={100} r={radius}
    fill="none" stroke="#8b5cf6" strokeWidth={strokeWidth}
    strokeDasharray={`${usdcPercent * circumference} ${circumference}`}
    transform="rotate(-90 100 100)" />
  {/* Visa segment */}
  <circle cx={100} cy={100} r={radius}
    fill="none" stroke="#4f46e5" strokeWidth={strokeWidth}
    strokeDasharray={`${visaPercent * circumference} ${circumference}`}
    strokeDashoffset={`-${usdcPercent * circumference}`}
    transform="rotate(-90 100 100)" />
</svg>
```

### Pattern 5: SVG Area Chart (no library)

**What:** SVG path element for spend-over-time.

**When to use:** DASH-04.

**Example:**
```typescript
// AreaChart.tsx
// Convert transaction data to points, build SVG path
function buildAreaPath(points: { x: number; y: number }[], width: number, height: number): string {
  const line = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}
```

### Pattern 6: PDF Export with jsPDF + html2canvas

**What:** Render a hidden DOM element to canvas, then add to PDF.

**When to use:** AUDT-03.

**Example:**
```typescript
// ExportPDFButton.tsx
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportPDF(elementRef: HTMLElement) {
  const canvas = await html2canvas(elementRef, {
    scale: 2,           // Higher quality
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('procurement-report.pdf');
}
```

### Anti-Patterns to Avoid

- **XState for 3-4 linear states:** XState adds complexity and bundle size for what is a simple linear progression. `useReducer` + `setTimeout` is sufficient and matches the project pattern.
- **Using a charting library for 2 simple charts:** The project already uses raw SVG for the radar chart and sparklines. Adding Recharts for a donut and area chart would be inconsistent and add 50-100KB.
- **Storing settlement animation state in context:** Settlement state is ephemeral, UI-only state. Keep it in component-local `useReducer`, not in PaymentContext. Only the final settled transaction goes to context.
- **Creating a new context for audit events:** Audit data is derived from ProcurementContext (RFP lifecycle events) + PaymentContext (transactions). Compute it at render time, don't duplicate state.
- **Rendering hidden content for PDF at all times:** Only mount the PDF-target div when export is triggered to avoid unnecessary DOM overhead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas-to-PDF pipeline | `jspdf` + `html2canvas` | Well-tested, handles DPI scaling, page sizing |
| Toast notifications | Custom notification popups | `react-hot-toast` (already installed) | Already wired, consistent with Phase 2 |
| Unique IDs | Timestamp or counter | `uuid` v4 (already installed) | Collision-free for order IDs and tx IDs |
| Date formatting | Manual string ops | `date-fns` `format()` (already installed) | Locale-safe, handles ISO strings |
| SVG animation | CSS keyframes or manual requestAnimationFrame | `framer-motion` `motion.circle`/`motion.path` | Already installed; declarative, interruptible |
| Class merging | String concatenation | `cn()` utility (already installed) | Handles Tailwind conflicts |

**Key insight:** Phase 3 only needs 2 new npm packages (jspdf, html2canvas). Everything else is already installed or better built as raw SVG following the established project pattern.

## Common Pitfalls

### Pitfall 1: Settlement State Machine Double-Fire
**What goes wrong:** Toast notifications fire twice, animation replays, or transaction gets added to context twice.
**Why it happens:** React strict mode double-mounts effects; setTimeout callbacks outlive component unmount; re-renders re-trigger effects.
**How to avoid:** (1) Store timerRef and clear on cleanup in useEffect return. (2) Use a `hasCompleted` ref to guard the onComplete callback. (3) Use `useRef` for the timer, not state. (4) Reset state explicitly before starting a new settlement.
**Warning signs:** Two toasts for the same state, two transactions appearing in history.

### Pitfall 2: html2canvas and Tailwind v4
**What goes wrong:** PDF renders with missing styles -- broken layout, no colors, wrong fonts.
**Why it happens:** html2canvas works by reading computed styles, but Tailwind v4 uses `@layer` and CSS custom properties heavily. Some JIT-generated utilities may not be computed at capture time.
**How to avoid:** (1) Use inline styles or a dedicated PDF-ready div with explicit CSS values, not Tailwind utilities. (2) Set `backgroundColor: '#ffffff'` explicitly in html2canvas options. (3) Use `scale: 2` for readability. (4) Test early -- this is flagged as a known risk.
**Warning signs:** Blank or unstyled PDF output, missing backgrounds.

### Pitfall 3: Payment Flow Entry Point Ambiguity
**What goes wrong:** No clear navigation path from "Award Supplier" to payment checkout.
**Why it happens:** Phase 2's RFP detail page changes status to "Awarded" but doesn't redirect or show a payment CTA.
**How to avoid:** After awarding, show a "Proceed to Payment" button on the RFP detail page that links to `/payment/[rfpId]`. Alternatively, the `/payment` page can show a list of awarded-but-unpaid RFPs.
**Warning signs:** User awards supplier but doesn't know how to pay.

### Pitfall 4: Notification Context Re-renders During Animation
**What goes wrong:** Adding notifications during settlement animation causes PaymentContext re-render, potentially disrupting the animation.
**Why it happens:** `addNotification` updates PaymentContext state, triggering re-renders for all PaymentContext consumers.
**How to avoid:** The settlement animation should use component-local state (useReducer), not context, for its animation state. Only the final transaction result writes to context. Toasts are independent (react-hot-toast has its own render tree).
**Warning signs:** Animation stutters when notifications fire.

### Pitfall 5: Audit Event Aggregation Inconsistency
**What goes wrong:** Audit trail shows duplicate events, missing events, or events in wrong order.
**Why it happens:** Aggregating from two separate contexts (Procurement + Payment) without a unified timeline.
**How to avoid:** Create a pure function `buildAuditTrail(rfps, transactions)` that merges events by timestamp. Each RFP status change and each transaction creates an audit event. Sort by timestamp descending.
**Warning signs:** Events appear out of order, duplicates from re-renders.

### Pitfall 6: SVG viewBox vs Container Sizing
**What goes wrong:** Charts render too small, too large, or get clipped.
**Why it happens:** Mismatch between SVG `viewBox` dimensions and the container's CSS width/height.
**How to avoid:** Always set `viewBox` explicitly on SVG elements. Use `className="w-full"` on the SVG and let the container div control the max width. Do not set `width`/`height` attributes directly on the SVG element.
**Warning signs:** Charts are clipped, wrong aspect ratio, or invisible.

## Code Examples

### Settlement Hook Usage

```typescript
// In SettlementAnimation.tsx
'use client';
import { useSettlement } from '@/hooks/useSettlement';
import { usePayment } from '@/context/PaymentContext';

function SettlementAnimation({ rfp, supplier, amount, method }: Props) {
  const { addTransaction, addNotification } = usePayment();

  const handleComplete = useCallback((tx: Transaction) => {
    addTransaction(tx);
    addNotification({
      id: `notif-${tx.id}`,
      type: 'payment',
      title: `Payment ${tx.method} Settled`,
      message: `$${tx.amount.toLocaleString()} to ${tx.supplierName}`,
      timestamp: new Date().toISOString(),
      read: false,
      transactionId: tx.id,
      txHash: tx.txHash,
    });
  }, [addTransaction, addNotification]);

  const { state, start, reset } = useSettlement(handleComplete);

  return (
    <div>
      {state.currentState === 'idle' && (
        <button onClick={() => start(method, `ORD-${Date.now()}`)}>
          Confirm Payment
        </button>
      )}
      {state.currentState !== 'idle' && (
        <FundFlowSVG state={state} method={method} />
      )}
    </div>
  );
}
```

### Notification Bell with Badge

```typescript
// NotificationBell.tsx - extends existing Header
import { Bell } from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount } = usePayment();

  return (
    <Link href="/notifications" className="relative text-slate-400 hover:text-slate-50 transition-colors">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
```

### Audit Trail Aggregation

```typescript
// src/lib/audit-utils.ts
interface AuditEvent {
  id: string;
  timestamp: string;
  type: 'rfp_created' | 'rfp_published' | 'bid_submitted' | 'evaluation_run'
       | 'supplier_awarded' | 'override_applied' | 'payment_initiated'
       | 'payment_settled';
  description: string;
  rfpId: string;
  rfpTitle: string;
  actor: string; // role that performed action
  metadata?: Record<string, string>;
}

function buildAuditTrail(rfps: RFP[], transactions: Transaction[]): AuditEvent[] {
  const events: AuditEvent[] = [];

  // Extract events from RFP lifecycle
  for (const rfp of rfps) {
    events.push({
      id: `audit-${rfp.id}-created`,
      timestamp: rfp.createdAt,
      type: 'rfp_created',
      description: `RFP "${rfp.title}" created`,
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      actor: 'Gov Officer',
    });
    // ... add events for each status transition, bids, evaluation, etc.
  }

  // Extract events from transactions
  for (const tx of transactions) {
    events.push({
      id: `audit-${tx.id}`,
      timestamp: tx.createdAt,
      type: 'payment_initiated',
      description: `${tx.method} payment of $${tx.amount.toLocaleString()} to ${tx.supplierName}`,
      rfpId: tx.rfpId,
      rfpTitle: '', // lookup from rfps
      actor: 'Gov Officer',
      metadata: { txHash: tx.txHash || '', orderId: tx.orderId },
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
```

### Dashboard Metric Computation

```typescript
// Computed from context data -- no new state needed
function useDashboardMetrics(transactions: Transaction[], rfps: RFP[]) {
  return useMemo(() => {
    const usdBalance = 10_000_000; // Starting balance
    const usdcBalance = 500_000;
    const totalSpent = transactions.filter(t => t.status === 'Settled').reduce((s, t) => s + t.amount, 0);
    const usdSpent = transactions.filter(t => t.method === 'USD' && t.status === 'Settled').reduce((s, t) => s + t.amount, 0);
    const usdcSpent = transactions.filter(t => t.method === 'USDC' && t.status === 'Settled').reduce((s, t) => s + t.amount, 0);
    const activeOrders = transactions.filter(t => t.status !== 'Settled').length;
    const completedOrders = transactions.filter(t => t.status === 'Settled').length;

    // AI savings: sum of (budget - winning bid) for awarded RFPs
    const aiSavings = rfps
      .filter(r => r.status === 'Awarded' || r.status === 'Paid')
      .reduce((sum, rfp) => {
        const winningBid = rfp.bids.find(b => b.supplierId === rfp.selectedWinnerId);
        return sum + (winningBid ? rfp.budgetCeiling - winningBid.amount : 0);
      }, 0);

    return {
      usdBalance: usdBalance - usdSpent,
      usdcBalance: usdcBalance - usdcSpent,
      totalSpent,
      usdSpent,
      usdcSpent,
      activeOrders,
      completedOrders,
      aiSavings,
    };
  }, [transactions, rfps]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XState for all state machines | useReducer for simple linear flows, XState for complex ones | Ongoing convention | Simpler code, smaller bundle for linear state machines |
| Recharts/Chart.js for all charts | Raw SVG for simple charts (donut, area), library for complex interactive ones | Project convention from Phase 2 | Zero bundle cost, full control |
| Server-side PDF generation | Client-side jsPDF + html2canvas | Established pattern | No server dependency, works in demo/hackathon context |
| `params` as sync object | `params` as Promise (use `use()` or `await`) | Next.js 15+ | All dynamic route pages must unwrap params |

## Open Questions

1. **Payment Page Entry Flow**
   - What we know: User awards a supplier on `/rfp/[id]`, then needs to navigate to payment
   - What's unclear: Whether `/payment` is a list of payable RFPs or `/payment/[rfpId]` is accessed via button on RFP detail
   - Recommendation: Add "Proceed to Payment" button on RFP detail page (status === 'Awarded'), linking to `/payment/[rfpId]`. The `/payment` page can also list awarded-but-unpaid RFPs as a secondary entry point.

2. **Mock Balances and Starting State**
   - What we know: Dashboard needs USD and USDC balances
   - What's unclear: Starting balance amounts
   - Recommendation: Use reasonable demo values: USD $10,000,000, USDC $500,000. Subtract settled transactions to show "live" balance.

3. **Audit Event Granularity**
   - What we know: Audit trail needs "all procurement events"
   - What's unclear: How granular -- every bid submission? Every status change? Or just major milestones?
   - Recommendation: Include major lifecycle events: RFP created, published, bids submitted, evaluation run, supplier awarded, override applied, payment initiated, payment settled. Skip draft edits.

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
| SETL-05 | Settlement state machine resets cleanly, no stuck states | unit | `npx vitest run src/lib/settlement-engine.test.ts` | No -- Wave 0 |
| SETL-02 | USD settlement progresses through 3 states in ~6s | unit | `npx vitest run src/lib/settlement-engine.test.ts` | No -- Wave 0 |
| SETL-04 | USDC settlement progresses through 3 states in ~3s | unit | `npx vitest run src/lib/settlement-engine.test.ts` | No -- Wave 0 |
| PAYM-04 | Completed transaction added to context | manual-only | Visual verification in browser | N/A |
| DASH-02 | AI savings computed correctly | unit | `npx vitest run src/lib/dashboard-utils.test.ts` | No -- Wave 0 |
| AUDT-01 | Audit events aggregated in correct order | unit | `npx vitest run src/lib/audit-utils.test.ts` | No -- Wave 0 |
| AUDT-03 | PDF export generates downloadable file | manual-only | Visual verification in browser | N/A |
| NOTF-04 | Bell shows unread count | manual-only | Visual verification in browser | N/A |

### Sampling Rate
- **Per task commit:** Manual browser verification (hackathon UI project)
- **Per wave merge:** `npx vitest run` if test infra added
- **Phase gate:** All 5 success criteria verified manually in browser

### Wave 0 Gaps
- [ ] `vitest` -- install if unit testing settlement state machine (optional for hackathon)
- [ ] `src/lib/settlement-engine.test.ts` -- covers SETL-02, SETL-04, SETL-05 state transitions
- [ ] `src/lib/audit-utils.test.ts` -- covers AUDT-01 event ordering
- [ ] Note: The settlement state machine is the highest-value unit test target in this phase. Dashboard metrics and audit aggregation are also pure functions suitable for testing.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/context/PaymentContext.tsx` -- already has addTransaction, addNotification, markNotificationRead, unreadCount
- Existing codebase: `src/context/ProcurementContext.tsx` -- already has setEvaluation, setOverride, updateRFP for status changes
- Existing codebase: `src/lib/mock-data/types.ts` -- Transaction, Notification types already defined with all needed fields
- Existing codebase: `src/lib/mock-data/transactions.ts` -- 3 mock transactions seeded with USD and USDC methods
- Existing codebase: `src/components/layout/Header.tsx` -- Bell icon exists but needs badge wiring
- Existing codebase: `src/components/layout/Sidebar.tsx` -- All Phase 3 routes already in nav (payment, dashboard, audit, notifications, transactions)
- Existing codebase: `src/app/rfp/[id]/page.tsx` -- Award button sets status to "Awarded" and selectedWinnerId
- Framer Motion docs: SVG animation with motion.circle, motion.path for fund flow

### Secondary (MEDIUM confidence)
- [jsPDF npm](https://www.npmjs.com/package/jspdf) -- version 4.2.1 verified
- [html2canvas npm](https://www.npmjs.com/package/html2canvas) -- version 1.4.1 verified
- [Framer Motion SVG animation](https://motion.dev/docs/react-svg-animation) -- motion components for SVG elements
- [React Flow animated edges](https://reactflow.dev/ui/components/animated-svg-edge) -- pattern reference for node-based flow visualization (not using React Flow library, just the visual pattern)

### Tertiary (LOW confidence)
- html2canvas + Tailwind v4 compatibility -- no specific documentation found on Tailwind v4 support; flagged as risk in Pitfall 2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core dependencies already installed; only 2 new packages needed (jspdf, html2canvas) with verified versions
- Architecture: HIGH - follows established Phase 1/2 patterns; PaymentContext already has all needed actions; settlement state machine is a well-understood pattern
- Settlement animation: HIGH - Framer Motion SVG animation is well-documented; linear state machine with useReducer is straightforward
- Charts: HIGH - project already uses raw SVG (radar chart, sparklines); donut and area charts follow same pattern
- PDF export: MEDIUM - jsPDF + html2canvas is standard approach, but Tailwind v4 compatibility is unverified; flagged as risk
- Pitfalls: HIGH - state machine double-fire is a known React pattern problem; solutions are well-established

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable -- jsPDF and html2canvas are mature libraries with infrequent breaking changes)
