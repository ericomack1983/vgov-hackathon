# GovPay Disruptors

## What This Is

A hackathon-ready MVP for a next-generation government procurement platform focused on healthcare equipment. Powered by AI agents and programmable payments (Visa + USDC on Polygon), it demonstrates how procurement can move from months to minutes using automation, compliance intelligence, and instant settlement.

## Core Value

An AI agent autonomously manages the full procurement lifecycle — from detecting needs, evaluating suppliers, selecting winners with auditable reasoning, to locking and releasing funds instantly via simulated Visa virtual cards or blockchain escrow.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] AI-driven procurement lifecycle automation (detect need → quote → evaluate → select → pay)
- [ ] Simulated Visa virtual card payments with MCC restrictions (healthcare 5047)
- [ ] Blockchain-based USDC escrow payments on Polygon (deposit → confirm → release)
- [ ] Dashboard with KPIs, pipeline visualization, and recent activity
- [ ] Procurement Requests page (create/view with urgency and progress tracking)
- [ ] Supplier Registry with compliance scores, certifications, and wallet addresses
- [ ] Transactions page showing Visa and blockchain payment records
- [ ] AI Decision Panel with guided 7-step demo flow
- [ ] AI scoring model (Price 40%, Delivery 25%, Compliance 35%)
- [ ] LLM-style audit narrative explaining AI procurement decisions
- [ ] Apple-style UI with Inter font, soft shadows, rounded cards, smooth animations
- [ ] README with demo script and technical documentation

### Out of Scope

- Real Visa API integration — simulated only for hackathon MVP
- Real blockchain deployment — all Polygon/USDC interactions are mocked
- Authentication / user management — prototype, no real auth needed
- Database backend — mock data and client-side state only
- Mobile responsiveness — desktop-first for demo purposes

## Context

- **Event**: Hackathon project, must demo in under 3 minutes
- **Domain**: Government procurement for healthcare equipment
- **Prior work**: Previous prototype exists at `/Users/ericorodrigues/Desktop/HackatonVGS` — this is a clean rebuild using GSD methodology
- **Key personas**: Government Procurement Officer (primary demo user)

## Constraints

- **Tech**: Next.js (React) + TailwindCSS — required stack
- **Timeline**: Hackathon speed — must be demoable quickly
- **Complexity**: All APIs simulated — no external dependencies
- **Design**: Apple-style aesthetic — clean, minimal, premium feel
- **Demo**: Full flow must complete in under 3 minutes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js with App Router | Modern React framework, required by hackathon spec | — Pending |
| TailwindCSS for styling | Rapid UI development, utility-first | — Pending |
| Simulated Visa/blockchain | No external API dependencies for hackathon demo | — Pending |
| Mock data with client-side state | Speed of development, no backend needed | — Pending |
| 7-step guided demo flow | Tells the procurement story linearly for judges | — Pending |
| Weighted scoring model (40/25/35) | Realistic procurement evaluation criteria | — Pending |

---
*Last updated: 2026-03-18 after initialization*
