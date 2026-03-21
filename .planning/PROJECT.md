# GovProcure AI

## What This Is

GovProcure AI is a modern government procurement platform powered by AI-driven decision-making and hybrid payment rails (Visa + USDC on Polygon). It enables government entities to create RFPs, receive supplier bids, get AI-ranked recommendations with transparent scoring, and settle payments instantly via traditional USD or blockchain-based USDC. Built as a working prototype for demo purposes, it showcases the convergence of AI procurement intelligence and programmable payments.

## Core Value

AI ranks suppliers and recommends the best value — then pays instantly via Visa or USDC — eliminating weeks of manual procurement with a transparent, auditable, animated flow.

## Requirements

### Validated

- ✓ Next.js 14 app scaffolded with App Router, TailwindCSS, and Framer Motion — Validated in Phase 1: Foundation & App Shell
- ✓ App shell renders with sidebar (nav links), header (role switcher), and main content area — Validated in Phase 1
- ✓ Role switcher toggles between Gov Officer, Supplier, and Auditor views — Validated in Phase 1
- ✓ AppContext (3 slices: Procurement, Payment, UI) provides global state to all pages — Validated in Phase 1
- ✓ Mock data seeded: 8 suppliers with varied profiles (32-pt score spread), 5 RFPs, historical transactions — Validated in Phase 1

### Validated

- ✓ Supplier registration with credentials, certifications, and pricing catalogs — Validated in Phase 2: Procurement & AI Engine
- ✓ Supplier profiles with rating score, past performance, compliance status, and pricing history — Validated in Phase 2
- ✓ Government users can create procurement requests (RFPs) — Validated in Phase 2
- ✓ Suppliers can submit bids on RFPs — Validated in Phase 2
- ✓ AI engine evaluates bids on price, delivery time, reliability score, historical performance, and risk — Validated in Phase 2
- ✓ AI outputs ranked supplier list with "Best Value" recommendation and scoring breakdown — Validated in Phase 2
- ✓ Decision dashboard with ranked suppliers, visual score breakdown, and AI explanation — Validated in Phase 2
- ✓ Manual override by government officer — Validated in Phase 2

### Validated

- ✓ Hybrid checkout flow: "Pay with USD" or "Pay with USDC (Polygon)" — Validated in Phase 3: Payments, Settlement & Polish
- ✓ Visual animated settlement flow showing fund movement step-by-step — Validated in Phase 3
- ✓ USD settlement: Government Bank → Visa Network → Supplier Bank (~6s animated) — Validated in Phase 3
- ✓ USDC settlement: Government Wallet → Polygon Network → Supplier Wallet (~3s, instant, blockchain hash) — Validated in Phase 3
- ✓ Real-time notifications: payment initiated, authorized, settled — with timestamps and tx IDs — Validated in Phase 3
- ✓ Financial dashboard: USD/USDC balances, active/completed orders, total spend, savings — Validated in Phase 3
- ✓ Payment breakdown chart: % via Visa vs % via USDC (SVG donut) — Validated in Phase 3
- ✓ AI explainability panel ("Why this supplier was selected") — Validated in Phase 2
- ✓ Role-based access (Gov, Supplier, Auditor) — Validated in Phase 1
- ✓ Audit trail for compliance — Validated in Phase 3
- ✓ Export reports (PDF) — Validated in Phase 3

### Out of Scope

- Real Visa API integration — simulated only for demo
- Real blockchain deployment — Polygon/USDC interactions are mocked
- Real authentication — role switching via UI selector, no real auth
- Database backend — mock data and client-side state only
- Mobile responsiveness — desktop-first for demo

## Context

- **Purpose**: Hackathon demo prototype — must tell a compelling story in under 3 minutes
- **Domain**: Government procurement with AI + hybrid payments
- **Prior project**: "GovPay Disruptors" was initialized but not built — this is a clean rebuild with a more comprehensive spec
- **Key demo story**: Create RFP → Suppliers bid → AI evaluates & recommends → Gov officer approves → Choose USD or USDC → Watch animated settlement → See notifications & dashboard update
- **Personas**: Government Procurement Officer (primary), Supplier, Auditor

## Constraints

- **Tech**: Next.js (React) + TailwindCSS + Framer Motion required
- **Payments**: Mock Visa API + mock Polygon/USDC (ethers.js patterns, no real tx)
- **AI**: Simulated scoring engine + LLM-style narrative (no real API key required for demo)
- **Design**: Sleek fintech aesthetic (Stripe / Ramp / Brex style) with animations
- **Demo**: Full procurement-to-settlement flow completable in < 3 minutes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern React, fast SSR for demo | — Pending |
| TailwindCSS + Framer Motion | Rapid UI + smooth animations for settlement flow | — Pending |
| Simulated Visa + USDC | No external dependencies, always works in demo | — Pending |
| Mock AI scoring (weighted formula) | Deterministic, explainable, no API cost | — Pending |
| Role switcher (no real auth) | Demo speed — judges can toggle roles | — Pending |
| Coarse phases (3-5) | Hackathon speed — fewer, broader delivery increments | — Pending |

---
*Last updated: 2026-03-21 after Phase 3: Payments, Settlement & Polish complete — all 3 phases done, v1.0 milestone complete*
