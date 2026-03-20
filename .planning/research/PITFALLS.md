# Pitfalls Research: GovProcure AI

## Critical Pitfalls

### 1. Settlement Animation Gets Stuck / Race Conditions
**Warning signs:** Timer-based animations that don't reset when re-triggered; "settled" state that persists across navigation
**Why it happens:** `setTimeout` chains without cleanup; animation state not reset on re-mount
**Prevention:**
- Use `useEffect` cleanup functions to clear all timeouts on unmount
- Store timeout IDs in `useRef`, cancel in cleanup
- Reset settlement state to `idle` when payment page mounts
- Test: navigate away mid-animation, return — should reset cleanly

**Phase:** Payment & Settlement (Phase 3)

---

### 2. AI Scoring Looks Arbitrary to Judges
**Warning signs:** Scores don't correlate to visible bid data; "Best Value" winner has higher price than others
**Why it happens:** Random or hard-coded scores disconnected from mock bid data
**Prevention:**
- Score MUST be computable from visible bid attributes (price, delivery days, supplier rating)
- Show the formula: "Price (30%) + Delivery (20%) + Reliability (25%) + Compliance (15%) + Risk (10%)"
- Display both raw bid values AND derived scores
- Recommendation narrative must reference specific numbers: "SupplierX won because their $45,000 bid is 23% below average and their 98% compliance score..."

**Phase:** AI Procurement Engine (Phase 2)

---

### 3. Framer Motion Performance on Dashboard
**Warning signs:** Jank when switching tabs; chart re-animates on every render
**Why it happens:** Animating too many elements simultaneously; charts inside `AnimatePresence` re-mount
**Prevention:**
- Use `layout` prop sparingly (only for list reordering)
- Wrap charts in `React.memo` to prevent re-renders
- Use `initial={false}` on `AnimatePresence` to skip enter animation on first render
- Avoid animating SVG paths for charts — animate container opacity instead

**Phase:** Foundation + Dashboard (Phase 1/3)

---

### 4. Mock Blockchain Hashes Look Fake
**Warning signs:** `0x123abc` instead of real-looking 64-char hex hashes
**Why it happens:** Developers use short random strings
**Prevention:**
```typescript
const mockTxHash = () => `0x${Array.from({length: 64}, () =>
  Math.floor(Math.random() * 16).toString(16)).join('')}`
```
- Always show correct format: `0x` + 64 hex characters
- Show block number, gas used (mock), confirmation count
- Link text: "View on Polygonscan" (href="#" is fine for demo)

**Phase:** Payment simulators (Phase 3)

---

### 5. Role Switcher Breaks Page State
**Warning signs:** Switching from Gov to Supplier shows Gov's private data; switching back shows stale state
**Why it happens:** Role change doesn't trigger re-render of role-gated sections
**Prevention:**
- Role stored in AppContext, changing it triggers re-render via `useContext`
- Use `key={role}` on role-sensitive page sections to force remount
- Test each role transition explicitly before demo

**Phase:** Foundation (Phase 1)

---

### 6. PDF Export Captures Wrong DOM State
**Warning signs:** PDF shows unstyled content, missing charts, or incorrect layout
**Why it happens:** `html2canvas` struggles with: CSS variables, Tailwind JIT classes not loaded, SVG charts
**Prevention:**
- Target a specific `ref` element for capture (not `document.body`)
- Use `html2canvas` options: `{ scale: 2, useCORS: true, logging: false }`
- For charts in PDF: render a simplified non-SVG version, or use `recharts` `toBase64Image()`
- Test PDF export early in Phase 3

**Phase:** Audit + Polish (Phase 3)

---

### 7. Demo Flow Too Long / Can't Complete in 3 Minutes
**Warning signs:** More than 7 clicks to go from RFP to settled payment
**Why it happens:** Too many form fields, manual steps, or realistic delays
**Prevention:**
- Pre-seed 1 "demo-ready" RFP with bids already submitted
- AI evaluation should trigger with 1 click (not multi-step)
- Settlement animation total duration: max 8 seconds (USD) / 4 seconds (USDC)
- Add "Demo Mode" button that pre-fills forms instantly
- Keep all delays short: USD settlement ~6s total, USDC ~3s total

**Phase:** All phases (design for demo speed from day 1)

---

### 8. AppContext Re-Renders Kill Performance
**Warning signs:** Every state update re-renders the entire app; adding a notification re-mounts the sidebar
**Why it happens:** Single large Context with many consumers
**Prevention:**
- Split contexts: `ProcurementContext` (rfps, suppliers, bids) | `PaymentContext` (transactions, notifications) | `UIContext` (role, sidebar state)
- Use `useMemo` for derived values (filtered lists, computed totals)
- Memoize context value object to prevent unnecessary re-renders

**Phase:** Foundation (Phase 1) — get this right early

---

### 9. Notifications Fire Multiple Times
**Warning signs:** "Payment settled" toast appears 3 times during demo
**Why it happens:** React StrictMode double-invokes effects; settlement `useEffect` dependency array changes
**Prevention:**
- Use a `hasSettled` ref to guard one-time notification dispatch
- Disable StrictMode for settlement components if double-fire persists
- Add deduplication in notification dispatch: check last notification type before adding

**Phase:** Payment & Settlement (Phase 3)

---

### 10. Supplier Scores Not Varied Enough
**Warning signs:** All suppliers score within 5 points of each other; no clear winner
**Why it happens:** Mock data lacks spread; all suppliers are similarly good
**Prevention:**
- Design mock suppliers with deliberately varied profiles: one cheap + slow + low compliance, one expensive + fast + high compliance, one middle-ground "best value"
- Ensure composite score spread is at least 15 points between 1st and last
- "Best Value" winner should win on at least 2 dimensions, lose on at most 1

**Phase:** Mock data design (Phase 1)

---

## Quick Wins to Implement Early

1. Settlement animation timer durations as constants — easy to tune for demo timing
2. "Demo Reset" function in AppContext to restore initial state during presentation
3. All mock tx hashes pre-generated (not random on render) for stable display
4. Pre-populate one complete RFP workflow in initial mock data
