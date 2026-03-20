# GovProcure AI

## What This Is

GovProcure AI is a modern government procurement platform powered by AI-driven decision-making and hybrid payment rails (Visa + USDC on Polygon). It enables government entities to create RFPs, receive supplier bids, get AI-ranked recommendations with transparent scoring, and settle payments instantly via traditional USD or blockchain-based USDC. Built as a working prototype for demo purposes, it showcases the convergence of AI procurement intelligence and programmable payments.

## Core Value

AI ranks suppliers and recommends the best value — then pays instantly via Visa or USDC — eliminating weeks of manual procurement with a transparent, auditable, animated flow.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Supplier registration with credentials, certifications, and pricing catalogs
- [ ] Supplier profiles with rating score, past performance, compliance status, and pricing history
- [ ] Government users can create procurement requests (RFPs)
- [ ] Suppliers can submit bids on RFPs
- [ ] AI engine evaluates bids on price, delivery time, reliability score, historical performance, and risk
- [ ] AI outputs ranked supplier list with "Best Value" recommendation and scoring breakdown
- [ ] Decision dashboard with ranked suppliers, visual score breakdown, and AI explanation
- [ ] Manual override by government officer
- [ ] Hybrid checkout flow: "Pay with USD" or "Pay with USDC (Polygon)"
- [ ] Visual animated settlement flow showing fund movement step-by-step
- [ ] USD settlement: Government Bank → Visa Network → Supplier Bank (T+1/T+2)
- [ ] USDC settlement: Government Wallet → Polygon Network → Supplier Wallet (instant)
- [ ] Real-time notifications: payment initiated, authorized, settled — with timestamps and tx IDs
- [ ] Financial dashboard: USD/USDC balances, active/completed orders, total spend, savings
- [ ] Payment breakdown chart: % via Visa vs % via USDC
- [ ] AI explainability panel ("Why this supplier was selected")
- [ ] Role-based access (Gov, Supplier, Auditor)
- [ ] Audit trail for compliance
- [ ] Export reports (PDF)

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
*Last updated: 2026-03-20 after initialization*
