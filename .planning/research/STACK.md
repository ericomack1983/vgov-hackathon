# Stack Research: GovProcure AI

## Recommended Stack (2025)

### Frontend Framework
**Next.js 14+ (App Router)** — Confidence: High
- App Router for layout nesting (sidebar + page content pattern)
- Server Components for fast initial loads; Client Components for interactive state
- API Routes for AI scoring endpoint and payment simulation
- `next/font` for Inter font (fintech standard)

**Do NOT use:** Pages Router — App Router is the 2025 standard and better supports nested layouts

### Styling
**TailwindCSS 3.4+** — Confidence: High
- Utility-first, fast to build fintech UIs
- `tailwind-merge` + `clsx` for conditional classes
- `@tailwindcss/forms` for form inputs

**Do NOT use:** CSS Modules, styled-components — too slow for hackathon

### Animation
**Framer Motion 11+** — Confidence: High
- `motion` component for layout animations
- `AnimatePresence` for mount/unmount transitions
- `useMotionValue` + `useTransform` for animated fund-flow visualizations
- `variants` for orchestrated settlement step animations

### Charts / Data Visualization
**Recharts 2.x** — Confidence: High
- `PieChart` for Visa vs USDC payment breakdown
- `AreaChart` for spend over time
- Works seamlessly with React, no SSR issues with dynamic imports

**Alternative:** `chart.js` with `react-chartjs-2` — similar but heavier bundle

### State Management
**React Context + useReducer** — Confidence: High
- Sufficient for demo scope (mock data, no real persistence)
- `AppContext`: global state for suppliers, RFPs, bids, transactions, notifications
- Settlement state machine: local component state + `useEffect` for step progression
- No need for Zustand/Redux at this scale

### Blockchain / Web3
**ethers.js 6.x** — Confidence: High
- Industry standard for Polygon/EVM interactions
- For demo: import ethers types/utilities only, no real provider connection
- Mock wallet addresses, mock transaction hashes (format: `0x${randomHex(64)}`)
- `formatUnits` / `parseUnits` for USDC (6 decimals) display

**Do NOT use:** wagmi/viem — overkill for mocked demo, adds complexity

### PDF Export
**jsPDF 2.x + html2canvas** — Confidence: Medium
- `html2canvas` captures DOM element → `jsPDF` converts to PDF
- Simple for reports and audit trails
- **Caveat:** can be slow on complex layouts; keep export target simple

**Alternative:** `@react-pdf/renderer` — cleaner API but requires defining PDF layout separately

### Icons
**Lucide React** — Confidence: High
- Clean, consistent icon set used by Stripe/Ramp style UIs
- Tree-shakeable, minimal bundle impact
- `lucide-react` package

### Notifications (UI)
**react-hot-toast** — Confidence: High
- Lightweight toast notifications for payment events
- Easy to customize for fintech aesthetic

### Utility Libraries
- `date-fns` — date formatting for timestamps and T+1/T+2 display
- `uuid` — generating transaction IDs and bid IDs
- `clsx` + `tailwind-merge` — class merging utilities

### Package Versions (2025)
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "framer-motion": "^11.0.0",
  "tailwindcss": "^3.4.0",
  "ethers": "^6.11.0",
  "recharts": "^2.12.0",
  "lucide-react": "^0.400.0",
  "react-hot-toast": "^2.4.1",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "date-fns": "^3.6.0",
  "uuid": "^9.0.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.3.0"
}
```

## What NOT to Use
| Library | Reason |
|---------|--------|
| Redux Toolkit | Overkill for mock data demo |
| wagmi/viem | Too much setup for mocked blockchain |
| Prisma/database | Mock data sufficient |
| NextAuth | Role switcher via UI is faster for demo |
| Styled Components | TailwindCSS covers all needs |
| MUI / Ant Design | Clashes with custom fintech aesthetic |

---
*Research confidence: High for core stack (stable 2025 choices), Medium for PDF (implementation varies)*
