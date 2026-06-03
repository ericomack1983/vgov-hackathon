# Design Brief — /marketplace Hero Rebuild (PanamaCompra × Visa, for MEF)

> **Phase 1 — Research output.** Two reference sites scraped via Firecrawl, each with a *deliberately narrow* extraction goal.
> - **Source A** (`next.gcommerce.glass`) → **layout architecture & structure ONLY** (no copy, no colors, no tone).
> - **Source B** (`panamacompra.gob.pa`) → **content, messaging & base color palette ONLY** (no layout, no structure).
>
> Phase 2 will synthesize: Source A's *skeleton* + Source B's *voice + evolved palette*.
>
> _Note: the task message was truncated before the structure template arrived; this structure follows the two extraction goals as written. Flag if you want it reorganized._

---

# SOURCE A — Layout Architecture & Structure
### `https://www.next.gcommerce.glass`
**Extracted:** grid systems, navigation behavior, section sequencing, component anatomy, interaction hints.
**Deliberately excluded:** their copy, brand colors, content tone. (Stack detected: Next.js + Tailwind, `/_next/image`.)

## A1. Hero Composition
- **Grid system:** single centered container, `max-w ≈ 1200–1280px`, horizontal padding `px-4` (mobile) → `px-6/8` (desktop).
- **Column ratio:** hero content is **left-aligned, single-column** (text block constrained to ~`max-w-3xl` for the H1, ~`max-w-2xl` for the lead). Not a 50/50 split — copy leads, the interactive search element sits beneath it full-width within the container.
- **Vertical rhythm inside hero:** H1 → `mt-6` lead paragraph → `mt-10` search component. Section padding `py-20` (mobile) → `py-28` (desktop).
- **Stacking order:** eyebrow/utility → H1 → subcopy → primary interactive element (search) → suggestion panel → stats strip directly below.

## A2. Navigation Pattern
- **Three stacked bars:**
  1. *Utility/announcement bar* — small text + a scrolling announcement ticker (content repeated → infinite marquee).
  2. *Primary header* — logo left · search center (with toggle affordances) · actions right (`Sign In`, `Favorites`, `Cart`).
  3. *Secondary nav row* — a mega-menu trigger ("All Categories", 14 items) + grouped section links + a support phone number on the far right.
- **Link grouping:** audience-segmented (e.g. "For Governments / For Suppliers / Resources / Company") rather than flat.
- **CTA placement:** primary actions pinned top-right of the header; mega-menu opens a multi-column dropdown.
- **Sticky behavior:** header is designed to stay accessible while scrolling (top bars + search persist as the dominant entry point).

## A3. Section Sequencing & Spacing Scale
Observed top→bottom rhythm (use as a sequencing template, not copy):
1. Announcement ticker → 2. Header/nav → 3. **Hero** → 4. **Animated stats strip** (pipe-delimited metric pairs) → 5. Trust-logo wall → 6. Featured cards rail → 7. Feature/capability section with product mockup → 8. Category chip grid → 9. Image-card grid (programs) → 10. Image-card grid (collections) → 11. Second cards rail + vendor cards → 12. Directory CTA band → 13. Testimonials (looped) → 14. Newsletter → 15. Press/logo wall → 16. Multi-column footer → 17. Floating chat widget.
- **Spacing scale:** Tailwind 4px base unit (4/8/12/16/24/32/48/64). Section-to-section vertical padding ≈ `py-16`→`py-24`.

## A4. Component Anatomy
- **Search bar (hero centerpiece):** white surface card, soft radius (~8px), hairline border, flat (no shadow). Contains: text input (flex-1) + inline toggles with a small "Beta"-style pill badge + a solid primary action button (larger radius ~10px). Optional anchored dropdown: grouped suggestion lists (Top / Recent / Popular), each a titled column.
- **Stat bar:** horizontal row of `value` (bold) + `label` (muted) pairs separated by pipe glyphs; content duplicated 2–3× for a seamless looping marquee.
- **Product/vendor card:** image (next/image, `w`/`q` query params) → category eyebrow → bold name → price → action ("Add to Cart" / "Browse Products"); verified badge variant for vendors.
- **Program/collection card:** image-forward tile with title, 1-line description, and a text CTA ("Shop Now" / "Explore Collection").
- **Radius scale:** global `6px`; input `8px`; primary btn `10px`; soft btn `14px`. **Flat** — no shadows on inputs/buttons.

## A5. Animation / Interaction Hints
- **Infinite horizontal marquees** for: announcement ticker, stats strip, trust-logo wall, testimonials (content arrays are repeated in markup → CSS keyframe scroll or motion loop).
- **Search toggles** swap mode (e.g. text vs. image / "AI" mode) with a Beta pill badge.
- **Mega-menu** hover/click reveal (multi-column).
- **Hover affordances** on cards (image-forward, text CTA reveal).
- Overall motion language: **subtle, continuous, flat** — looping rails rather than scroll-triggered hero animation.

---

# SOURCE B — Content, Messaging & Base Palette
### `https://www.panamacompra.gob.pa`
**Extracted:** Spanish copy (verbatim), value props, section titles, CTA microcopy, trust signals, numbers, base colors.
**Deliberately excluded:** their layout & structure. (Stack: Bootstrap; lang `es-PA`; owner: DGCP.)

## B1. Headline & Tagline Copy (verbatim, Spanish)
- **Brand tagline / hero line:** `Compras públicas, simples, eficaces y transparentes.`
- **Meta/positioning statement:** `PanamaCompra es el Sistema Electrónico de Contrataciones Públicas de la República de Panamá. Compras públicas, simples, eficaces y transparentes.`
- **Owning authority:** `Dirección General de Contrataciones Públicas` (DGCP)

## B2. Value Propositions / Key Benefits (verbatim)
- **PanamaCompra V2:** `En esta versión, podrá realizar los procesos aplicables para Licitación Por Mejor Valor, Licitación para Convenio Marco, Tienda Virtual, Subasta de bienes Públicos, Procedimiento Especial de Adquisiciones de Emergencia, así como finalizar con los trámites de contratación que inició en esta versión.`
- **PanamaCompra V3:** `Nueva versión transaccional, transparente y con novedosas funcionalidades, donde, podrá realizar los procesos aplicables para Cotización en Línea, registro de compra menor (hasta B/.10,000.00), Actos Públicos de Contratación Menor (B/.10,000.00-B/.50,000.00), Licitación Pública, Procedimientos Excepcionales y Especiales de Contratación.`
- **Core value triad** (from tagline): *simples · eficaces · transparentes*. Recurring theme word: **transparente / transparencia**.

## B3. Section Titles & Quick-Access Labels (verbatim)
Primary nav: `Inicio` · `Proveedores` · `Normativa` · `Capacitación`
Quick-access buttons:
- `COTIZACIONES EN LÍNEA`
- `PLAN ANUAL DE COMPRAS`
- `OPORTUNIDADES PARA VENDERLE AL ESTADO`
- `BIBLIOTECA SISTEMATIZADA DE LA DGCP`
- `CONVENIO MARCO`
- `BUSCADOR UNSPSC - RUBROS`
- `REGISTRO PROPONENTES`

Section headings: `Accesos Directos` · `Notificaciones Administrativas` · `Enlaces externos`

## B4. CTA Microcopy (verbatim)
- `Iniciar sesión` (sign in)
- `Acceder al portal` (primary CTA — access the portal)
- `Búsqueda` (search)
- `Acceso Directo`
- `Previous` / `Next` (carousel)
- Help desk: `Mesa de Ayuda` — `+507 515-1555`

## B5. Trust Signals & Compliance Mentions
- Authority: **Dirección General de Contrataciones Públicas (DGCP)**, **República de Panamá**.
- Transparency ecosystem: `Observatorio Digital de Contrataciones Públicas` (panamacompraencifras.gob.pa), `Transparencia` (ANTAI), `Rendición de Cuentas`, `Gaceta Oficial`, `LEGISPAN`.
- Compliance/legal: `Asociaciones Público-Privadas - Ley No. 93`, `Registro de Contratistas Inhabilitados`, `Registro de Contratistas Multados`, `Términos y Condiciones de Uso`, `Política de Privacidad`.
- Security: `Firma Electrónica Calificada del Registro Público` ("ahorrar tiempo, dinero y además garantizar agilidad y fluidez").
- Procurement vehicles (credibility through specificity): Licitación Por Mejor Valor, Convenio Marco, Tienda Virtual, Subasta de Bienes Públicos, Cotización en Línea, Licitación Pública, Contratación Menor.

## B6. Statistics / Numbers Highlighted
- Spending thresholds (monetary anchors): **compra menor hasta `B/.10,000.00`**; **Actos Públicos de Contratación Menor `B/.10,000.00 – B/.50,000.00`**.
- Currency: **Balboa (`B/.`)**, pegged 1:1 to USD — note for Visa context.
- (The live site foregrounds time-sensitive announcements/dates rather than vanity metrics; the *Source A* pattern supplies the stat-strip slot we'll populate with MEF-relevant figures in Phase 2.)

## B7. Base Color Palette (hex) — BASE, to be evolved
| Role | Hex | Notes |
|------|-----|-------|
| **Primary (brand teal)** | `#006C8F` | Confirmed by `theme-color: #006c8f` — the signature PanamaCompra teal |
| Secondary | `#86B7FE` | Light blue (Bootstrap focus tint) |
| Accent / link | `#0D6EFD` | Bootstrap primary blue |
| Secondary btn border | `#0038FF` | Vivid blue outline + `rgba(0,56,255,0.22)` focus ring |
| Text primary | `#212529` | Near-black (Bootstrap body) |
| Background | `#FFFFFF` | White |
| Button (primary, as-built) | bg `#EFEFEF`, text `#000`, border `#000`, radius 6px | Utilitarian, low-contrast |

Type & shape (base): **Fira Sans** (`Fira Sans, sans-serif`), fallbacks Arial / Times New Roman; global border-radius **0px** (Bootstrap squared); 4px spacing base.

```css
/* Source B BASE tokens (pre-evolution) */
--pc-teal:    #006C8F; /* primary brand */
--pc-blue:    #0D6EFD; /* accent / link */
--pc-blue-lt: #86B7FE;
--pc-blue-vivid: #0038FF;
--pc-ink:     #212529;
--pc-bg:      #FFFFFF;
--pc-font:    "Fira Sans", sans-serif;
```

---

## Phase 2 Synthesis Notes (pointers, not yet built)
- **Skeleton** ← Source A (centered container, 3-bar nav, hero = single-column copy + search centerpiece, looping stat strip, marquee trust rails, flat soft-radius cards).
- **Voice + palette** ← Source B (Spanish gov procurement tone; "simples, eficaces y transparentes"; DGCP/MEF trust signals; teal `#006C8F` base).
- **Evolution target:** blend PanamaCompra teal `#006C8F` with **Visa brand blue/gold** for the MEF showcase; keep Spanish copy; adopt Source A's modern rounded/flat component language over Bootstrap's squared `0px` radius.

---

# PHASE 2 — Design System Evolution

**Goal:** transform PanamaCompra's gov palette (`#006C8F` teal, `#0D6EFD` Bootstrap blue, squared `0px`) into a **futurist premium fintech aesthetic** — Stripe × Linear × Apple. Panama identity stays recognizable through an evolved **blue + red flag lineage**; everything else modernizes toward deep-navy → electric-blue → cyan gradients with a single bold **holographic-violet** accent and glassmorphism.

**Lineage map (base → evolved):**
| Source B (gov) | Evolved (futurist) | Rationale |
|----------------|--------------------|-----------|
| `#0D6EFD` Bootstrap blue | `#1B4DFF` electric blue | Panama-flag blue, saturated & modern |
| (flag red, implicit) | `#FF2D55` neon red | keeps red identity, fintech energy |
| `#006C8F` teal | `#22D3EE` cyan | teal → luminous cyan for gradients |
| — | `#7C5CFF` holographic violet | the single bold accent |
| `#FFFFFF` flat bg | `#FAFAFC` light / `#0A0E1A` deep-space dark | dual theme |
| `0px` radius, no blur | 16–28px radius + `backdrop-filter` glass | premium softness |

## Final Design Tokens

```css
/* ============================================================
   PanamaCompra × Visa — Futurist Gov Tokens (Phase 2)
   Drop into globals.css or a CSS module :root / [data-theme].
   ============================================================ */
:root {
  /* ---- Panama lineage (modernized flag blue + red) ---- */
  --pa-blue: #1B4DFF;          /* electric blue  */
  --pa-red:  #FF2D55;          /* neon red       */

  /* ---- Core brand spectrum ---- */
  --c-navy-950: #060912;
  --c-navy-900: #0A0E1A;       /* deep space     */
  --c-navy-800: #0D1326;
  --c-navy-700: #131B33;
  --c-blue-600: #1B4DFF;
  --c-blue-500: #2F6BFF;
  --c-cyan-400: #22D3EE;
  --c-cyan-300: #67E8F9;
  --c-violet-500: #7C5CFF;     /* THE bold accent — holographic violet */
  --c-violet-400: #9B7BFF;
  --c-mint-400: #2DD4BF;       /* secondary accent (sparingly) */

  /* ---- Light theme (default surface = off-white) ---- */
  --bg:          #FAFAFC;
  --bg-elev:     #FFFFFF;
  --text:        #0A0E1A;
  --text-muted:  #5B6478;
  --text-faint:  #8A93A6;
  --border:      rgba(10, 14, 26, 0.08);

  /* ---- Glassmorphism (frosted cards / nav) ---- */
  --glass-bg:     rgba(255, 255, 255, 0.62);
  --glass-border: rgba(255, 255, 255, 0.55);   /* ~0.5px hairline */
  --glass-blur:   blur(20px) saturate(160%);
  --glass-shadow: 0 8px 32px rgba(10, 14, 26, 0.10);

  /* ---- Signature gradients ---- */
  --grad-headline: linear-gradient(100deg, #1B4DFF 0%, #22D3EE 48%, #7C5CFF 100%);
  --grad-cta:      linear-gradient(120deg, #1B4DFF 0%, #7C5CFF 100%);
  --grad-cta-hover:linear-gradient(120deg, #2F6BFF 0%, #9B7BFF 100%);
  --grad-pulse:    radial-gradient(circle, #2DD4BF 0%, #22D3EE 100%);
  /* Mesh / orb depth layers */
  --mesh-1: radial-gradient(60% 60% at 18% 12%, rgba(27,77,255,0.22) 0%, transparent 70%);
  --mesh-2: radial-gradient(50% 50% at 88% 8%, rgba(124,92,255,0.18) 0%, transparent 70%);
  --mesh-3: radial-gradient(55% 55% at 78% 92%, rgba(34,211,238,0.14) 0%, transparent 70%);
  --mesh-4: radial-gradient(45% 45% at 8% 88%, rgba(255,45,85,0.10) 0%, transparent 72%);

  /* ---- Typography (geometric sans; DM Sans already wired in layout) ---- */
  --font-display: var(--font-dm-sans), "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-body:    var(--font-dm-sans), "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-jetbrains-mono), ui-monospace, "JetBrains Mono", monospace;
  --tracking-tight: -0.02em;
  --tracking-tighter: -0.03em;
  --weight-display: 700;       /* 600–700 display */
  --weight-body: 350;          /* Apple-ish lightness (300–400) */
  /* Fluid display scale */
  --fs-display: clamp(2.6rem, 6.2vw, 5rem);
  --fs-h2:      clamp(1.6rem, 3vw, 2.5rem);
  --fs-lead:    clamp(1rem, 1.4vw, 1.25rem);

  /* ---- Shape / spacing / motion ---- */
  --radius-sm: 10px;
  --radius:    16px;
  --radius-lg: 22px;
  --radius-xl: 28px;
  --radius-pill: 999px;
  --space-unit: 4px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 160ms;
  --dur:      220ms;           /* keep all transitions < 250ms */
}

/* ---- Deep-space dark theme ---- */
[data-theme="dark"] {
  --bg:          #0A0E1A;
  --bg-elev:     #0D1326;
  --text:        #F4F6FB;
  --text-muted:  rgba(244, 246, 251, 0.62);
  --text-faint:  rgba(244, 246, 251, 0.40);
  --border:      rgba(255, 255, 255, 0.08);

  --glass-bg:     rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.10);   /* hairline on dark */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}
```

**Usage notes for Phase 3**
- Headline: `background: var(--grad-headline); -webkit-background-clip: text; color: transparent;` + `letter-spacing: var(--tracking-tighter)`.
- Nav & cards: `background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur);`.
- Hero canvas: stack `--mesh-1..4` as layered background-images on the dark section for orb depth.
- Pulse dot: `--grad-pulse` + a `<250ms`-friendly infinite keyframe (opacity/scale only — GPU-cheap).
- Default the marketplace hero to **dark (deep space)** for the fintech feel; tokens support a light flip via `[data-theme]`.

---
✅ **Phase 1 & 2 complete** in `design-brief.md`. Proceeding to Phase 3 build.
