# Features Research: GovProcure AI

## Table Stakes (Must Have — Users/Judges Expect These)

### Procurement Core
- RFP creation form (title, description, budget, deadline, category)
- Supplier list/registry with profiles (name, rating, certifications, past performance)
- Bid submission per RFP
- Bid comparison view (side-by-side or ranked list)

### AI Decision
- Ranked supplier output after bid evaluation
- Score breakdown per supplier (price, delivery, reliability, compliance, risk)
- "Best Value" recommendation highlight
- Natural language explanation of why top supplier won

### Payment Flow
- Payment method selection (USD vs USDC)
- Order confirmation / checkout summary
- Settlement status indicators (authorized → processing → settled)

### Financial Dashboard
- Total spend metric
- Active vs completed orders count
- Recent transactions list
- Balance display (USD + USDC)

### Notifications
- Toast/banner for payment events (initiated, authorized, settled)
- Timestamp + transaction ID per notification

## Differentiators (Competitive Advantage for Demo)

### Animated Settlement Visualization
- **Animated fund flow**: Moving nodes/arrows showing money traveling between entities
- **Side-by-side comparison**: USD rail (slow, T+1/T+2) vs USDC rail (instant, seconds)
- **Step-by-step progression**: Each settlement stage animates in sequence
- This is the key "wow factor" — no competitor shows this visually

### AI Explainability Panel
- "Why this supplier?" breakdown with specific data points
- Radar/spider chart showing scoring dimensions
- Audit-ready narrative with numbers and reasoning
- Manual override capability (Gov officer can pick different supplier with override note)

### Hybrid Payment Rails
- Single checkout, two payment options
- Clear UX distinction: traditional (slow, guaranteed) vs blockchain (instant, transparent)
- Blockchain hash display for USDC transactions

### Role-Based Views
- Gov Officer: sees RFPs, approvals, payment initiation
- Supplier: sees their bids, status, payment receipts
- Auditor: sees all transactions, audit trail, export controls

### Audit Trail
- Timestamped log of all procurement events
- Exportable as PDF report

### Savings Metric
- "AI Optimization Savings" — difference between highest bid and winning bid
- Shows ROI of AI-powered procurement

## Anti-Features (Do NOT Build for Hackathon)

| Feature | Why Not |
|---------|---------|
| Real authentication (OAuth, JWT) | Takes hours, adds no demo value |
| Database (Postgres, MongoDB) | Mock data is sufficient and faster |
| Real Visa API calls | External dependency, can fail in demo |
| Real Polygon transactions | Gas fees, wallet setup, can fail |
| Email notifications | Infrastructure overhead |
| Mobile responsiveness | Desktop demo, judges won't test mobile |
| Search/filter across tables | Nice-to-have, not core story |
| Supplier onboarding flow | Pre-seed mock suppliers instead |
| Multi-currency beyond USD/USDC | Scope creep |

## Feature Dependencies

```
Suppliers data → Bid submission → AI Scoring → Payment flow → Settlement animation
     ↓                                              ↓
 RFP creation                              Notifications
     ↓                                              ↓
  Bid listing                             Financial Dashboard
                                                    ↓
                                              Audit Trail + PDF
```

## Complexity Notes

| Feature | Complexity | Notes |
|---------|-----------|-------|
| Supplier registry | Low | Static mock data |
| RFP creation | Low | Form + state |
| Bid evaluation AI | Medium | Weighted formula, deterministic |
| Settlement animation | High | State machine + Framer Motion |
| Financial dashboard | Medium | Derived from transaction state |
| PDF export | Medium | html2canvas pitfalls |
| Role switcher | Low | Context + UI toggle |
| Notifications | Low | react-hot-toast |
