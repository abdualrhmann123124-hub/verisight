# VeriSight

**Verify Reality. Reveal the Truth.**

An AI-assisted digital media verification platform. Submit an image or video and
receive a **confidence-based** assessment of whether it appears authentic or
AI-generated, supported by explainable forensic evidence.

Designed & developed by **Abdulrahman Al-Anazi** — Founder & Creator.

---

## What this is, and what it is not

VeriSight estimates. It does not adjudicate.

No output ever states that media *is* authentic or *is* generated. Results are
positions on a five-band confidence spectrum, always accompanied by the evidence
behind them and the limits of that evidence. **"Inconclusive" is a legitimate
result**, not a failure — when the signals genuinely disagree, saying so is the
correct answer.

The governing rule for every contributor: **every number shown to a user must
trace back to a real measurement from a real analyzer.** Where signals are
combined by weighting, the weights are documented and calibrated. Nothing is
invented to make output look more confident than the evidence supports.

---

## Architecture

Two applications, one repository.

```
verisight/
├── web/    Next.js 16 — UI, BFF, persistence (owns Prisma + PostgreSQL)
└── api/    FastAPI — stateless analysis engine   [Phase 4]
```

**`web` owns all persistence; `api` is pure compute.** Prisma is TypeScript-native
and FastAPI is Python, so pointing both at one schema would mean either a fragile
Python Prisma client or duplicated SQLAlchemy models. Instead the analysis service
holds no database connection and no user state: it receives media, runs the
pipeline, and returns a structured report that `web` persists. One schema, one
migration history, and an analysis engine that can be scaled or replaced behind a
stable contract.

The boundary is a versioned REST API validated from both sides — Pydantic schemas
in Python, mirrored by Zod schemas in TypeScript.

---

## Getting started

Requires **Node ≥ 20.9**. (`api` additionally needs Python 3.12+, from Phase 4.)

```bash
git clone https://github.com/abdualrhmann123124-hub/verisight.git
cd verisight
npm run setup        # installs dependencies — once only
npm run dev          # http://localhost:3000
```

Run every command from the **repository root**. The root scripts forward to
`web/`, so there is no need to remember which directory holds the app.

| Script | Purpose |
| --- | --- |
| `npm run setup` | Install dependencies (first time only) |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run verify` | Typecheck + lint + format check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Apply Prettier |

If port 3000 is busy, Next.js picks the next free port and prints it — or set
one explicitly with `npm run dev -- -p 3005`.

### Design-system gallery

```
http://localhost:3000/dev/design-system
```

Every primitive in every state, in both themes. It is the fastest way to spot a
regression — a spacing or contrast change that is easy to miss on a product page
is obvious with the whole system side by side. The route returns 404 in
production and is marked `noindex`.

---

## Design system

Tokens live in [`web/styles/tokens.css`](web/styles/tokens.css) and are bound to
Tailwind utilities in [`web/app/globals.css`](web/app/globals.css).

**No component may declare a raw colour, radius, duration, or shadow.**

Three layers: primitives (raw palette, never used directly) → semantic tokens
(`--canvas`, `--surface`, `--ink`, `--accent`) → Tailwind utilities
(`bg-surface`, `text-ink-muted`, `border-line`). A single `[data-theme]` swap
re-themes the entire app with no class churn.

- **Dark-first.** Never pure black — `#0B0D10` carries a faint graphite cast, and
  depth comes from surface lightness and border contrast rather than drop
  shadows, which are invisible against a near-black page.
- **Type.** Instrument Sans (display) · Inter (body) · JetBrains Mono
  (technical values). Self-hosted via `next/font` — no external request, no CLS.
- **Spacing.** Strict 8pt grid.
- **Motion.** `motion` v12 — this is Framer Motion under its current package
  name. Springs preferred; the shared vocabulary is in
  [`web/lib/motion.ts`](web/lib/motion.ts).
- **Components.** Unstyled Radix primitives for behaviour, with a hand-written
  VeriSight styling layer on top. No shadcn CLI, no inherited default look —
  accessible dialogs and tabs are genuinely hard to build correctly, and
  hand-rolled modals nearly always leak focus.
- **Icons.** Lucide only, 1.5px stroke, never mixed with another set.

### Accessibility

Non-negotiable, and verified rather than assumed:

- **All 60 colour pairs meet WCAG AA** in both themes (worst case 4.53:1).
  The accent button uses a near-black label because white on the electric blue
  measures 3.81:1 — below AA for text.
- Colour is never the only signal. Every verdict band renders as colour + icon +
  label, so meaning survives colour-blindness and greyscale.
- Focus is never removed, only replaced. Visible ring on every interactive element.
- Touch targets ≥ 44px, extended via pseudo-elements where a control is visually
  smaller.
- `prefers-reduced-motion` is honoured in **both** halves: `MotionConfig` covers
  JS-driven motion, and a global CSS rule covers keyframes and transitions.
  Spinners are a deliberate exception — a frozen spinner reads as a hung app.

---

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation — tooling, tokens, theme, UI + motion primitives | ✅ Complete |
| 2 | Layout shell + landing page | Next |
| 3 | Upload & URL input experience |  |
| 4 | FastAPI analysis engine — forensics, inference, explainability |  |
| 5 | Report page — confidence card, findings, timeline |  |
| 6 | History, dashboard, search, PDF export |  |
| 7 | Persistence, OWASP hardening, rate limiting |  |
| 8 | Accessibility + Lighthouse pass, refactor, docs |  |

---

© Abdulrahman Al-Anazi. All rights reserved.
