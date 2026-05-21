# climatecaselab — Web App Spec (v1)

> **Source of truth.** This doc supersedes both `refs/specs/specs-seed.md` and the earlier `specs/specs.md` draft. Cross-references back to the seed are marked `(seed §X)` for reviewers.
> 
> **Out of scope for v1:** authentication, backend services, real-time data feeds, mobile native apps, internationalization, content management UI, submission forms. The site is read-only, static, single-page, English-only.

### 

---

## 0. Quick Summary

A static, single-page web app showcasing highlights from doctoral research on transnational citation patterns in climate litigation. Three top-level sections ("uppertabs"): a **Landing** narrative, an **Interactive Map** of citation flows, and a **Catalytic Cases** dashboard. Built as vanilla HTML/CSS/JS + D3.js, data sourced from a single Sabin Center XLSX snapshot, deployed to GitHub Pages at `climatecaselab.org`.

---

## 1. Goals & Non-Goals

### 1.1 Goals (v1)

1. Communicate the **what** of the research (citation flow asymmetries, transnational dialogue) to a non-technical audience in under 60 seconds of scrolling.
2. Let an interested visitor **explore** the citation network interactively, drilling from a country → its connected jurisdictions → the actual cases.
3. Highlight the **five catalytic cases** (top-cited) with enough depth that a journalist or law student can write about any of them without leaving the site.
4. Invite **community contribution** by exposing a clear email contact so visitors can flag errors or suggest improvements.
5. Hold a credible, restrained **academic visual identity** that signals "research project," not "startup."

### 1.2 Non-goals (v1)

- Full case database (link out to Sabin Center for the deep dive).
- Per-user state, accounts, bookmarks, saved views.
- Submission forms or any server-handled input from the public — collaboration runs through email.
- Server-side rendering or SEO beyond the basics (title, OG tags, sitemap).
- WCAG AAA. We target AA: keyboard-navigable, color contrast ≥ 4.5:1 on body text, focus-visible states.
- Print stylesheet. Optional polish, not blocking.

### 1.3 Success criteria

- Lighthouse Performance ≥ 90 on a throttled "Slow 4G" mobile profile.
- Total transfer size on first paint < 600 KB (gzipped) excluding the world topojson (which is lazy-loaded for the map uppertab only).
- Time-to-interactive on the Landing uppertab < 2 s on a mid-range laptop.
- Lucas can ship a new map dataset by re-running the build script and committing JSON — no other developer involvement needed.

---

## 2. Information Architecture

### 2.1 Uppertabs (top-level navigation)

| Order | Uppertab            | Default landing? | Purpose                                                   |
| ----- | ------------------- | ---------------- | --------------------------------------------------------- |
| 1     | **Landing**         | ✅ yes            | Project overview, methodology summary, collaboration call |
| 2     | **Interactive Map** | —                | Country-level citation flow explorer                      |
| 3     | **Catalytic Cases** | —                | Dashboard of the five most-cited source cases             |

The uppertab bar is **fixed to the top** of the viewport, always visible. Each uppertab is a button (semantically `<button role="tab">`) and the panels are `<section role="tabpanel">`. The three panels are laid out **horizontally** in a `.uppertab-track` container (3 × 100vw wide), and switching uppertabs animates the track via `transform: translateX(-100vw * N)` — the "switching workspaces" feel called out in the seed (seed §after-Catalytic-Cases). See §6.2 for transition details.

### 2.2 Subtabs of the Landing uppertab

The Landing uppertab is a single long scrollable section subdivided by **subtabs** (`#about`, `#methodology`, `#collaboration`) that act as scroll-spy anchors.

```
┌──── Uppertab bar (sticky, full width) ──────────────────────┐
│  [ Landing* ]  [ Interactive Map ]  [ Catalytic Cases ]      │
├─────────────────────────────────────────────────────────────┤
│  ┌── Subtab bar (sticky under uppertab bar) ────────────┐    │
│  │  [ About this project ]  [ Methodology ]  [ Collab ] │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│   ## About this project                                       │
│   …                                                           │
│                                                              │
│   ## Methodology                                              │
│   …                                                           │
│                                                              │
│   ## Collaboration                                            │
│   …                                                           │
└─────────────────────────────────────────────────────────────┘
```

- Clicking a subtab → `scrollIntoView({behavior:'smooth', block:'start'})` to the matching anchor, accounting for the fixed header offset.
- Scrolling vertically through the Landing uppertab → an `IntersectionObserver` watches each section and updates `aria-current="true"` on the active subtab so the highlight tracks scroll position.
- Subtabs are only rendered for the Landing uppertab. The Map and Cases uppertabs do not have subtabs (they're each a single full-width panel).

### 2.3 Content blocks per subtab

> All body copy is **deferred** to `refs/specs/landing-content.md`. The spec defines structural slots; the content file fills them.

**About this project** (`#about`)

- H1: project title
- Lede paragraph (1–3 sentences, what + why)
- "What you'll find here" tiles (3 cards linking to Map / Cases / Methodology subtab)
- Authorship & affiliation footer block (Gustavo + Lucas + advisor — see §12 for the locked names + affiliations)
- Optional: a short pull-quote from the thesis abstract.

**Methodology** (`#methodology`)

- H1: "Research Methodology"
- A self-contained **3–5 paragraph** summary of the methodology. Body copy lives in `landing-content.md`; the prose should be lifted/adapted from the standalone `refs/mockups/methodology.html` content but written for a general audience.
- A small inline **diagram** (hand-tuned SVG) illustrating the 7-phase pipeline simplified into ~4 stages for the public. The diagram is decorative-but-meaningful (has `<title>` and `<desc>`).
- v1 does **not** include a "Read full methodology" deep-link. A future version will swap the current placeholder line — `Full methodology paper: forthcoming` — for a real citation + DOI link once the paper is published. Reserve a single slot below the diagram for that line.

**Collaboration** (`#collaboration`)

- H1: "Spotted an error? Got an improvement?"
- 1-paragraph open call (`landing-content.md`).
- A single, prominent **`mailto:` action**:
  - Button label: "Email us a correction or suggestion"
  - Behavior: `mailto:<address>?subject=climatecaselab%20%E2%80%94%20feedback` (URL-encoded so the subject pre-fills).
  - Email address: defined as a single CSS/data constant `--contact-email` and `data-contact-email` attribute on the button — set once, used everywhere. Final address TBD in `landing-content.md`.
  - On platforms without a configured mail client (heuristic: `navigator.userActivation` after click + no scheme handler), fall back to copying the address to the clipboard and showing a 3-second toast `"Email address copied — <address>"`.
- Below the button: a "Cited literature" mini-list (anchored citations of the methodology + Sabin Center + key papers — copy in `landing-content.md`).
- v1 explicitly ships **no form**. The form treatment is logged for a future revision.

### 2.4 Interactive Map uppertab

Single-panel, full-viewport. Three columns. See §4 for full functional spec.

### 2.5 Catalytic Cases uppertab

Single-panel, vertical scroll. A grid of five expandable cards. See §5 for full functional spec.

### 2.6 Routing & URLs

- `#/` or no hash → Landing → About
- `#/landing/methodology` → Landing, scrolled to Methodology
- `#/landing/collaboration` → Landing, scrolled to Collaboration
- `#/map` → Interactive Map
- `#/map?country=Brazil&dir=outgoing` → Map with preselected state
- `#/cases` → Catalytic Cases
- `#/cases?open=urgenda` → Cases with the Urgenda card expanded

URLs use the hash so the site stays purely static. All state is reflected in the hash so a URL can be copy-pasted and reproduce the view.

---

## 3. Landing uppertab — UI details

### 3.1 Layout grid

- Max content width **920px**, centered, ≥24px side padding on mobile.
- Vertical rhythm: section spacing 96px (desktop), 56px (mobile).
- Section anchors offset by `--header-height + --subtab-height` so the smooth scroll lands cleanly under the sticky bars.

### 3.2 Subtab bar

- Three buttons, evenly distributed.
- Active subtab gets a 2px underline in `--accent-warm` (see §7 tokens).
- Sticks immediately below the uppertab bar (combined sticky height becomes the `scrollMarginTop` for sections).
- On mobile (<640px) the subtabs become a horizontal scroller (no wrap), with snap-points.

### 3.3 Collaboration subtab behavior

- The `mailto:` action is the only interactive element in this section.
- Clicking copies the email to the clipboard if the OS lacks a default mail handler (graceful degradation; see §2.3).
- No form, no submission, no validation, no honeypot in v1.

---

## 4. Interactive Map uppertab — Functional spec

> Visual + structural reference: `refs/mockups/climate_litigation_citation_map_v19_05_2026-3.html` — read it for the bones; do NOT copy/paste its dark-mode tokens (those are the wrong palette for this site).

### 4.1 Layout (desktop ≥ 1100px)

Three columns inside the map uppertab panel:

```
┌── 300px ──┬──────── flex 1 ────────┬── 380px ──┐
│  Controls │     World map (SVG)    │   Cases    │
│  pane     │     centered, with     │   pane     │
│  (left)   │     zoom + pan         │   (right)  │
└───────────┴────────────────────────┴────────────┘
```

Below 1100px → stack vertically: controls (collapsed into a top accordion), map (full width, 50vh), cases below.

### 4.2 Left pane — Controls

**(a) Country multi-selector**

- Visually: a search-enabled combobox with chips. Selected countries appear as removable chips.
- A11y: implemented as a `<select multiple>` fallback with a JS-enhanced combobox layered on top.
- Sorted alphabetically; jurisdictions with **no citation data** are omitted from the list.
- A **"Clear all" link sits above the chip stack** (top-aligned, not below), so it's always reachable without scrolling past selections. The link is hidden when no chips are present.

**(b) Citation-direction toggle**

- Two-state toggle: `← Cited by` ↔ `Cites →`.
- Mutually exclusive (radio semantics). Default: `Cited by` (incoming) — incoming flows are the more striking story.
- Tooltip on hover explaining the toggle.

**(c) Statistics card**

A 2 × 2 grid showing four numbers, recomputed live whenever selection or direction changes. Definitions over a **union semantics** model (see §4.6):

- **Citations** — sum of citation counts on all flows in the current union.
- **Countries** — number of distinct *other* countries in those flows (i.e., excluding the user's selection).
- **North** — citations whose *other* endpoint is a Global North country.
- **South** — same for Global South.
- A small percentage delta under North/South ("64% / 36%") so the asymmetry reads at a glance.

**North / South hover-explainer.** Hovering (or focusing, for keyboard users) over either the **North** or **South** number reveals a popover (~300px wide, 200ms fade-in, dismissed on mouseleave/blur) explaining:

- What "Global North" and "Global South" mean in this dataset (a short definition, not a treatise).
- The **citation of the source classification** — author + work — that the project adopts. Default reference, to be confirmed in `landing-content.md`: *Dados, R. & Connell, R. (2012). "The Global South." Contexts, 11(1).* If Gustavo prefers a different authoritative source, swap the citation string only — the popover is purely text + a single inline link to a permalink/DOI.
- A small note: "These are working categories. The full discussion lives in the Methodology section." with a link to `#/landing/methodology`.

The popover is implemented as a `<dialog role="tooltip">` (no JS focus trap; it's content-only) and shares one component across both North and South numbers.

**(d) Connected countries list**

- A scrollable list, one row per other-country in the union.
- Each row: country name, citation count badge, region color stripe (left border).
- Click a row → adds that country to the multi-select (or removes it if already selected) — mirrors the chip UI.

### 4.3 Center pane — Map

**Projection & basemap**

- D3 `geoNaturalEarth1`, scale tuned to fit viewport.
- Basemap: TopoJSON from `world-atlas@2/countries-110m.json`. Bundle a local copy at `src/data/world-110m.json` so the site works offline.
- Antarctica clipped (not interesting for this dataset).
- Graticule rendered subtly behind countries (1px, 8% opacity).

**Country fills**

- Default: `--map-land`.
- Hover (any country): `--map-land-hover`.
- Country is in current selection: `--accent-warm` fill, subtle outline.
- Country is implied by current flows (an "other endpoint"): `--map-land-implied`.
- Click on a country with data → toggles it into/out of the selection.

**Flows**

- Drawn as quadratic Bézier arcs from source centroid → target centroid.
- **Color codes by direction:** `--flow-in` (cool / blue) when toggle = "Cited by"; `--flow-out` (warm / orange) when toggle = "Cites". Switching the toggle re-renders all arcs in the other color — same flows, different storytelling.
- Width scaled by citation count: `wScale = d3.scaleSqrt().domain([1, max]).range([1.2, 5.6])` — squareroot keeps small flows visible.
- Arrowhead at the destination end. Marker definition inherits color from the arc.
- Hover an arc → tooltip with `(source) → (target) · N citations`, the arc bumps to 100% opacity.
- Click an arc → focuses both endpoint countries into the cases pane (right).

**Direction-color legend (on the map)**

- A small floating legend sits in the **top-right of the map canvas** (16px inset, on the map surface, not in the side panes), inside a rounded `--surface-1` chip with subtle border.
- It contains two rows:
  - `── ▶  Cited by` — a 24px-wide swatch in `--flow-in` with the arrowhead glyph, label `Cited by — incoming citations`.
  - `── ▶  Cites`   — a 24px-wide swatch in `--flow-out`, label `Cites — outgoing citations`.
- The row matching the active direction is fully opaque; the inactive row is muted to 50% opacity, so the legend doubles as a direction indicator.
- Clicking a row is equivalent to clicking the corresponding direction button in the left pane (it's a secondary control surface, not a passive label).

**Zoom & pan — and the "constant thickness" constraint (seed §map.middle-pane)**

- D3 `zoom` with `scaleExtent([1, 8])`.
- **Counter-scale rule:** on every zoom event, arcs and node circles must visually retain the same stroke-width / radius regardless of zoom level. Implement by adjusting the SVG attributes via JS on each zoom event, not by counter-transforming the group (which would un-zoom the geography we want zoomed).
  - Concretely: `arcs.attr('stroke-width', baseWidth / k)`, `markers.attr('r', baseR / k)`.
  - Label font-size also stays constant: `labels.style('font-size', baseFontSize/k + 'px')`.
- Pan limited so the map can't be dragged entirely off-screen.

**Zoom controls (bottom-right)**

- `+`, `−`, `⟲` (reset) buttons. Keyboard shortcuts: **`+`**, **`-`**, **`0`**.

**Tooltip**

- One reusable absolutely-positioned div, follows the cursor with a 15px offset.
- Auto-flips horizontally near the right edge.

### 4.4 Right pane — Cases

A vertically-scrolling list of **dynamically-sized case cards**, one per source case whose citation lands in the current flow set.

**Card anatomy** (per seed §map.right-pane):

- **Title** — the case name, as a hyperlink to the Sabin Center page (`source_case_url` field). External link icon, `target="_blank" rel="noopener"`.
- **Sub-meta row** — country chip (color-tagged by Global North / South), year chip, and a "N citations" chip.
- **Citations list** — a bullet list of the cited cases (each link if URL exists).
- **Highlight rule** — when a card's title is hovered, optionally highlight the matching flow arc on the map (defer to v1.1; v1 just hover-highlights the card row).

**Header strip above the list**

- `[N] cases · [M] citations` count summary.
- Search input that filters case cards by case-name substring or country name (debounced 200ms).
- Sort dropdown: `By citation count (desc) · By year (desc) · Alphabetical`.

**Empty state**

- "Select one or more countries to explore the cases" + a small inline diagram of the multi-select flow.

### 4.5 Mobile / tablet

- Below 1100px the three columns stack vertically (Controls → Map → Cases).
- Map takes 60vh, controls collapse into an accordion (closed by default after first selection), cases panel scrolls below.

### 4.6 Multi-selection — Union semantics

When N countries are selected, the displayed flow set is **the union of every flow that touches any selected country** in the chosen direction. Concretely:

- Direction = `Cited by`: every flow `(source → selected)` for every `selected ∈ selection`.
- Direction = `Cites →`: every flow `(selected → target)` for every `selected ∈ selection`.
- Stats aggregate over this union with de-duplication on flow ID.
- Cases pane shows the de-duplicated union of source-cases across all included flows.

Edge cases:

- A flow where both endpoints are in the selection → included once (do not double-count).
- Empty selection → no flows, empty state in cases pane, stats show zeroes.

---

## 5. Catalytic Cases uppertab — Functional spec

> Visual reference: `refs/mockups/Figure_X2_Catalytic_Cases.html`. The mockup shows static figure-style cards; this spec expands them into an interactive dashboard.

### 5.1 What's a "catalytic case"?

The five **top-cited source cases** in the database — i.e., the most influential cases whose holdings have been cited the most across other jurisdictions. The current five (subject to refresh per data snapshot):

1. *Urgenda Foundation v. State of the Netherlands* (Netherlands)
2. *Neubauer et al. v. Germany* (Germany)
3. *Massachusetts v. EPA* (United States)
4. *Leghari v. Federation of Pakistan* (Pakistan)
5. *Notre Affaire à Tous v. France* (France)

The build pipeline (§8.3) recomputes the top-5 from the XLSX; if the ranking shifts in a future snapshot, the cards update automatically. The list of five is not hardcoded.

**Intro block (sits below the section header).** A standalone short text section (`<section class="cases-intro">`), 2–3 paragraphs of body copy, sourced from `refs/specs/landing-content.md` under a new `§cases-intro` anchor (placeholder shipped). Its purpose:

- Explain what "catalytic case" means in this project's terminology.
- Explain *why* these five are highlighted: they are the most-cited source decisions across the corpus; their holdings are the load-bearing arguments other courts borrow.
- Note that the selection is **data-driven** (computed from citation counts) — not editorial — and that the ranking is rebuilt whenever the dataset is refreshed.
- Set expectations: each card reveals progressively more detail when expanded.

Layout: max-width matches the cards grid (full width up to 1240px), 16px below the H1, 32px above the card grid.

### 5.2 Layout

- Section header: "Catalytic Cases — Five Decisions Shaping a Transnational Climate Jurisprudence", with the intro block (above) immediately below it.
- Below: a grid of 5 cards. Desktop ≥ 1240px → 5 columns, equal width. 1024–1239 → 3-2 split. < 1024px → single column.
- Each card is collapsed by default and expands **in-place** (vertical accordion) when clicked.

### 5.3 Collapsed card anatomy

(matches mockup with minor token updates)

```
┌────────────────────────────────────────────┐
│ ● Urgenda v. Netherlands           ↗       │  ← title + external-link button (top right)
│ Origin: Netherlands                         │  ← origin line
│ ────────────────────────────────────────── │
│ 50 citing decisions across 20 jurisdictions │  ← summary
│                                             │
│ Australia   ████████████░░░░░  4            │  ← top-5 jurisdiction bars
│ Belgium     ████████████░░░░░  4            │
│ Brazil      ████████████░░░░░  4            │
│ New Zealand ████████████░░░░░  4            │
│ South Korea ████████████░░░░░  4            │
│ ────────────────────────────────────────── │
│ +15 other jurisdictions →                   │  ← "expand for full list" hint
└────────────────────────────────────────────┘
```

- The top border + dot use the case's signature color (`--case-1` through `--case-5` in tokens; see §7.2).
- The `↗` button is a square external-link button → opens the case page on the Sabin site (`sabin_case_url`).
- Clicking anywhere else on the card (or pressing Enter when focused) toggles the expand state.
- An invisible header `<button>` wraps the title for keyboard a11y; the expansion uses `aria-expanded` and `aria-controls`.

### 5.4 Expanded card content

When expanded, the card grows vertically (siblings push down — **no overlay, no modal**). Expanded content:

1. **Full jurisdictions list** — the complete table of citing jurisdictions and their citation counts (the mockup's footer "other names" plus the top-5 bars combined into one ranked table).
2. **Mini citation timeline** — a small chart (year on X, count on Y) of citations of this case over time. Stacked bars, colored by Global North / South region.
3. **Key holdings** — a 2–4 bullet summary of the case's central legal arguments (sourced from `landing-content.md`'s catalytic-case holdings section; placeholder copy until Gustavo fills it).
4. **Citing-cases list** — a collapsible sub-section listing all citing cases (name, country, year, link to Sabin), grouped by jurisdiction. Up to ~50 rows — virtualize if needed.
5. **Close handle** — a "Collapse ↑" button at the bottom of the expanded area, plus clicking the card header again collapses it.

Only one card may be expanded at a time. Opening a second card auto-collapses the first (smoothly).

**Sibling reflow on expand/collapse.** When a card transitions between collapsed ↔ expanded, the other cards in the grid must smoothly move to their new positions (rather than jump). Implementation:

- Animate the expanding card's measured height with `transition: max-height 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms`.
- For sibling reflow inside the CSS grid, use the **FLIP technique**:
  1. **F**irst — measure each sibling's bounding box before the change.
  2. **L**ast — apply the change, then measure the new box.
  3. **I**nvert — translate each sibling back to its old position via `transform`.
  4. **P**lay — clear the transform with a `transition: transform 320ms cubic-bezier(0.4, 0, 0.2, 1)` to glide it home.
- The expanded card and its siblings share the same easing function so the motion reads as a single coordinated reflow.
- During the transition, set `pointer-events: none` on all cards for the duration (320ms) to prevent click-races mid-animation.

### 5.5 Animations & motion

- **Default behavior:** expand/collapse uses 320ms `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out) on `max-height` + `opacity`. Avoid `height: auto` jank by animating to a measured pixel height computed in JS.
- **Sibling reflow:** FLIP-driven, same 320ms ease-in-out (§5.4).
- **`prefers-reduced-motion: reduce`:** the animation is **softened, not removed**. Use a shorter, gentler curve — 180ms `ease-out` — and skip any non-essential motion (e.g., the FLIP reflow can be omitted in favor of a 1-frame `opacity` crossfade on the affected siblings). The cards never *snap* between states; users with motion sensitivity still get a smooth, calm transition, just briefer.

### 5.6 Empty / error states

- If the build produces fewer than 5 catalytic cases (data error): render whatever exists, with a quiet developer warning in the console. Never hide the section.
- If `key holdings` for a case are missing in `landing-content.md`: show a placeholder italic line "Holdings summary forthcoming."

---

## 6. Navigation & motion — global

### 6.1 Header (sticky)

- 56px tall, full width, `position: sticky; top: 0`.
- Left: site **wordmark** "ClimateCaseLab" (links to `#/`) — see §7.8 for typographic treatment.
- Center: uppertab bar (3 buttons).
- Right: theme toggle (☀ / ☾).
- Backdrop: `backdrop-filter: blur(8px)` over a translucent surface color, so content scrolling under is softly visible.

### 6.2 Uppertab transition — "workspace switch"

- The uppertab panels are laid out in a single horizontal flex track that is 300vw wide.
- Switching uppertabs sets a CSS variable `--track-offset: -100vw * N` and the track CSS transitions `transform: translateX(var(--track-offset))` over 360ms ease-in-out.
- Each panel has `overflow-y: auto` so vertical scroll within a uppertab is independent (and remembered when the user comes back).
- `prefers-reduced-motion: reduce` → shorten to 180ms ease-out (consistent with §5.5 — no instantaneous cuts anywhere in the app).

### 6.3 Scroll-spy (Landing subtabs)

- An `IntersectionObserver` with `rootMargin: "-72px 0px -65% 0px"` (offsets for the sticky bars). The first section whose top has scrolled past the offset is the active subtab.
- Active subtab is reflected in both the underline UI and the URL hash (`#/landing/methodology`).
- Programmatic scrolls (clicking a subtab) temporarily disable the observer for 400ms to avoid flicker.

### 6.4 Keyboard

- `Tab` cycles between uppertab buttons, then into the active panel.
- `←` / `→` on a focused uppertab button switches uppertabs (and updates focus to the next button).
- Map zoom shortcuts (only when map uppertab is active and the map area has focus): `+`, `-`, `0`.

### 6.5 Theme toggle

- **Initial value** mirrors the user's OS / browser preference via `prefers-color-scheme: dark` (no stored choice yet → match system; otherwise honor stored choice).
- The initial pick runs **before first paint** to avoid the "wrong theme flash":
  - Inline a tiny `<script>` in `<head>` (before the stylesheet) that reads `localStorage.getItem('climatecaselab.theme')` and, if absent, reads `window.matchMedia('(prefers-color-scheme: dark)').matches`, then sets `data-theme="dark"|"light"` on `<html>`.
- The toggle, when clicked, **persists** the choice in `localStorage` under key `climatecaselab.theme` (`"light"` | `"dark"`).
- If the user has never clicked the toggle, the site keeps **following** OS changes live (a `matchMedia` listener flips the theme on the fly).
- Toggling animates the swap by transitioning `background-color` and `color` over 200ms on `html`.

---

## 7. UI / Visual Design

### 7.1 Aesthetic North Stars (anchors for token choices)

> Academic, lean, elegant. High color contrast. Generous whitespace. Avoid corporate-dashboard signals (gradients on text, neon glows, drop-shadow stacks). The site should feel like a well-typeset journal that happens to be interactive.

### 7.2 Color palette

Cold blue/lilac base with a few warm pastel accents (per seed §general-ui).

**Brand / semantic tokens (theme-independent role names):**

| Token                   | Role                                                     |
| ----------------------- | -------------------------------------------------------- |
| `--surface`             | Page background                                          |
| `--surface-1`           | Cards, raised panels                                     |
| `--surface-2`           | Inputs, deeper recesses                                  |
| `--border`              | Hairline dividers                                        |
| `--border-strong`       | Active / focused borders                                 |
| `--text`                | Body text                                                |
| `--text-muted`          | Captions, secondary copy                                 |
| `--text-strong`         | Headings, emphasis                                       |
| `--accent-cool`         | Primary accent (titles, links)                           |
| `--accent-cool-2`       | Secondary cool accent (lilac)                            |
| `--accent-warm`         | Highlight / selected state (light orange)                |
| `--accent-warm-2`       | Alert / errors (pastel red)                              |
| `--flow-in`             | "Cited by" arc color                                     |
| `--flow-out`            | "Cites" arc color                                        |
| `--region-north`        | Global North chips & legend                              |
| `--region-south`        | Global South chips & legend                              |
| `--map-land`            | Default country fill on map                              |
| `--map-land-hover`      | Country hover fill                                       |
| `--map-land-implied`    | Country fill when it's the "other end" of a current flow |
| `--case-1` … `--case-5` | Catalytic case signature colors                          |

**Light theme values** (off-white tilted slightly toward warm/desaturated yellow):

| Token                | Hex       | Notes                          |
| -------------------- | --------- | ------------------------------ |
| `--surface`          | `#FBF8F1` | Background — warm off-white    |
| `--surface-1`        | `#FFFFFF` | Cards                          |
| `--surface-2`        | `#F2EEE3` | Recessed surfaces              |
| `--border`           | `#E5DFD0` | Hairlines                      |
| `--border-strong`    | `#B7AE99` | Active borders                 |
| `--text`             | `#1B1F26` | Hard-dark gray, "almost black" |
| `--text-muted`       | `#5C6068` | Secondary copy                 |
| `--text-strong`      | `#0C0F14` | True black for headings        |
| `--accent-cool`      | `#3A5BA0` | Pastel-deep blue (primary)     |
| `--accent-cool-2`    | `#8B7BC4` | Lilac (secondary cool)         |
| `--accent-warm`      | `#E89F6B` | Pastel light orange            |
| `--accent-warm-2`    | `#D97A66` | Pastel red                     |
| `--flow-in`          | `#3A5BA0` | (= accent-cool)                |
| `--flow-out`         | `#E89F6B` | (= accent-warm)                |
| `--region-north`     | `#7A8FBF` | Cool, neutral                  |
| `--region-south`     | `#9F8CC9` | Lilac-leaning                  |
| `--map-land`         | `#ECE7D9` | Slightly warmer than surface   |
| `--map-land-hover`   | `#DCD5C2` |                                |
| `--map-land-implied` | `#D7CBA8` | Faint hint a country has data  |
| `--case-1`           | `#3A5BA0` | Urgenda — blue                 |
| `--case-2`           | `#D97A66` | Neubauer — pastel red          |
| `--case-3`           | `#5C8A6B` | Mass. v. EPA — muted green     |
| `--case-4`           | `#E89F6B` | Leghari — pastel orange        |
| `--case-5`           | `#8B7BC4` | Notre Affaire — lilac          |

**Dark theme values** (grayscale tilted slightly cool, paragraphs off-white):

| Token                   | Hex                                         | Notes                          |
| ----------------------- | ------------------------------------------- | ------------------------------ |
| `--surface`             | `#161A22`                                   | Background — gray w/ blue tilt |
| `--surface-1`           | `#1E232D`                                   | Cards                          |
| `--surface-2`           | `#252B37`                                   | Recessed                       |
| `--border`              | `#2F3543`                                   | Hairlines                      |
| `--border-strong`       | `#4A5266`                                   |                                |
| `--text`                | `#E8EAEE`                                   | Off-white                      |
| `--text-muted`          | `#9AA1B0`                                   |                                |
| `--text-strong`         | `#F4F5F8`                                   | Titles get a brighter shade    |
| `--accent-cool`         | `#7A9CE0`                                   | Lifted blue for dark BG        |
| `--accent-cool-2`       | `#B2A4E0`                                   | Lifted lilac                   |
| `--accent-warm`         | `#F2B187`                                   | Lifted pastel orange           |
| `--accent-warm-2`       | `#E68F7C`                                   |                                |
| `--flow-in`             | `#7A9CE0`                                   |                                |
| `--flow-out`            | `#F2B187`                                   |                                |
| `--region-north`        | `#9DAFCF`                                   |                                |
| `--region-south`        | `#B6A7DC`                                   |                                |
| `--map-land`            | `#252B37`                                   |                                |
| `--map-land-hover`      | `#2E3543`                                   |                                |
| `--map-land-implied`    | `#384057`                                   |                                |
| `--case-1` … `--case-5` | Same hues, lightened 10–15% vs. light theme |                                |

**Contrast rules:**

- Body text ≥ 4.5:1 against `--surface`.
- Title text ≥ 7:1 against `--surface`.
- Accent colors must hit 3:1 against the surface they sit on when used as decorative borders; ≥ 4.5:1 when used as text.

### 7.3 Typography

- **Titles & headings:** a transitional serif. Default proposal: **Source Serif 4** (open-source, broad weight range, paired well with academic content). Fallback chain: `'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif` — the browser uses the first family it has locally before fetching the webfont, so users get a graceful native fallback during font load.
- **Body / paragraphs:** a "square-ish" geometric sans (per seed §general-ui). Default proposal: **Inter** as a pragmatic baseline (familiar, exhaustive glyph coverage). Stronger "square-ish" alternatives if Lucas prefers: **IBM Plex Sans** or **Manrope**. Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Monospaced (data, code-like labels):** **JetBrains Mono** or **IBM Plex Mono**, used sparingly for stat counts, case-tag labels, and timestamps.
- Variable fonts preferred where available (single file, multiple weights).

Type scale (rem, root = 16px):

| Token          | Size     | Weight | Use                                   |
| -------------- | -------- | ------ | ------------------------------------- |
| `--ts-display` | 3.0rem   | 600    | Hero title on Landing                 |
| `--ts-h1`      | 2.0rem   | 600    | Section H1                            |
| `--ts-h2`      | 1.5rem   | 600    | Subsection H2                         |
| `--ts-h3`      | 1.15rem  | 600    | Card title                            |
| `--ts-body`    | 1.0rem   | 400    | Default                               |
| `--ts-small`   | 0.875rem | 400    | Captions                              |
| `--ts-micro`   | 0.75rem  | 500    | Tags, badges (uppercase letter-space) |

Line-height: body 1.6, headings 1.2–1.3.

### 7.4 Spacing scale

8-point grid: `--sp-0` (0) … `--sp-1` (4) … `--sp-2` (8) … `--sp-3` (12) … `--sp-4` (16) … `--sp-6` (24) … `--sp-8` (32) … `--sp-12` (48) … `--sp-16` (64) … `--sp-24` (96).

### 7.5 Radii

- `--r-sm` 4px (chips, tags)
- `--r-md` 8px (cards, panels)
- `--r-lg` 12px (large surfaces)
- `--r-full` 999px (pills)

### 7.6 Elevation (subtle, academic — avoid stacks)

- `--el-1`: `0 1px 2px rgba(0,0,0,0.04)` (cards on light, near-flat)
- `--el-2`: `0 6px 18px rgba(0,0,0,0.06)` (hovered card)
- Dark theme variants use `rgba(0,0,0,0.4)` and a 1px inner border `inset 0 0 0 1px var(--border)` for definition.

### 7.7 Iconography

Use a single icon set — **Lucide** (`lucide.dev`) — imported as inline SVGs (no icon font, no JS sprite). Keep stroke-width 1.5px, size 16px (inline) / 20px (standalone).

### 7.8 Wordmark, imagery & illustration

- **Wordmark (top-left of the sticky header):** the literal text **"ClimateCaseLab"**, set in the title serif family (same chain as headings — `'Source Serif 4', Georgia, 'Times New Roman', serif`). The browser will fall through the chain naturally if a higher-priority family isn't installed locally and hasn't loaded yet; this is the intended dynamic behavior.
  - Weight: 600. Size: 1.125rem. Letter-spacing: -0.01em. Color: `--text-strong`.
  - Acts as the homepage link (`href="#/"`). On hover, the underline of the active letter is `--accent-cool` at 2px offset.
  - The wordmark is single-line "ClimateCaseLab" (camel-cased, no space). When/if a glyph mark is added later (`/refs/brand/`), it'll sit immediately to the left at 24px square.
- The 4-box methodology diagram on the Landing page is a hand-tuned inline SVG (not a chart library).
- No stock photography. No human figures. Maps and data viz only.

---

## 8. Data layer

### 8.1 Source of truth

`refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx` (Sabin Center Global Trends export, single sheet `Planilha1`, ~690 rows × 29 columns).

For v1 this file is the **only** input. The build script reads it, validates it, and produces a fixed set of JSON files committed to `src/data/`.

### 8.2 Compiled JSON contracts

The front-end consumes **only** these files. Their shapes are part of the spec — changes require a version bump.

**`src/data/countries.json`**

```jsonc
[
  {
    "name": "Brazil",
    "iso3": "BRA",
    "region": "Global South",     // "Global North" | "Global South"
    "lat": -12,
    "lon": -51,
    "incoming_total": 30,         // total citations into this country
    "outgoing_total": 0
  }
  // …
]
```

**`src/data/flows.json`**

```jsonc
[
  {
    "id": "f_0001",
    "source": "Brazil",           // citing country
    "target": "Netherlands",      // cited country
    "source_region": "Global South",
    "target_region": "Global North",
    "count": 4
  }
  // …
]
```

**`src/data/cases.json`**

```jsonc
[
  {
    "id": "c_0001",
    "source_case_name": "PSB et al. v. Brazil",
    "source_case_url": "https://climatecasechart.com/case/psb-et-al-v-brazil/",
    "source_case_country": "Brazil",
    "source_case_region": "Global South",
    "source_case_year": 2020,
    "cited_cases": [
      {
        "name": "Urgenda v. Netherlands",
        "url": "https://climatecasechart.com/case/urgenda-foundation-v-kingdom-of-the-netherlands/",
        "country": "Netherlands",
        "region": "Global North"
      }
      // …
    ]
  }
  // …
]
```

**`src/data/catalytic.json`**

```jsonc
[
  {
    "id": "case_urgenda",
    "rank": 1,
    "name": "Urgenda Foundation v. State of the Netherlands",
    "origin_country": "Netherlands",
    "origin_region": "Global North",
    "year": 2015,
    "sabin_url": "https://climatecasechart.com/case/urgenda-foundation-v-kingdom-of-the-netherlands/",
    "color_token": "--case-1",
    "total_citing_decisions": 50,
    "total_jurisdictions": 20,
    "jurisdictions": [
      { "name": "Australia", "count": 4, "region": "Global North" },
      { "name": "Belgium",   "count": 4, "region": "Global North" }
      // … sorted desc
    ],
    "citing_cases": [
      { "name": "…", "country": "Australia", "year": 2022, "url": "…", "region": "Global North" }
      // …
    ],
    "key_holdings": [
      "Government duty of care extends to climate mitigation",
      "Quantifiable emissions reduction targets are judicially reviewable"
    ],
    "yearly_citations": [
      { "year": 2016, "north": 0, "south": 1 },
      { "year": 2017, "north": 2, "south": 0 }
      // …
    ]
  }
  // … five entries
]
```

**`src/data/manifest.json`**

- `snapshot_label`: human-readable e.g. "Sabin Global Trends — May 2026"
- `snapshot_date`: ISO 8601
- `xlsx_source_hash`: SHA-256 of the source XLSX (for reproducibility)
- `case_count`, `country_count`, `flow_count`, `total_citations`

### 8.3 Build pipeline — `build/xlsx_to_json.py`

A standalone Python script (kept inside this subproject, **not** importing from the parent phdMutley pipeline):

1. Read the XLSX with `openpyxl` or `pandas`.
2. Validate required columns are present; abort with a useful message on schema drift.
3. Normalize country names against an explicit `country_aliases.json` map (handles "United Kingdom" vs "UK" etc.).
4. Compute regions (`Global North` / `Global South`) from an explicit `region_map.json` shipped with the build script (do not infer from continent). Source citation for the N/S classification matches the popover in §4.2c — keep them in sync.
5. Emit the four JSON files + `manifest.json`.
6. Pretty-print with stable key order so diffs are reviewable.

CLI:

```bash
python build/xlsx_to_json.py \
  --xlsx refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx \
  --out src/data/
```

### 8.4 Validation & QA

- The build script also emits `build/qa_report.md` summarizing: row counts, dropped rows with reasons, unknown countries, suspiciously low/high citation counts.
- A `make verify` (or `npm run verify`) target exists and fails CI if the QA report shows any dropped rows or unknown countries.

---

## 9. Accessibility

- Semantic HTML first; ARIA only where the role isn't already conveyed.
- All interactive controls reachable by keyboard with visible `focus-visible` rings (2px solid `--accent-cool` + 2px offset).
- Color is never the sole indicator: regions also use a chip label, arc directions also use the arrowhead glyph **and** the on-map legend (§4.3).
- The map provides a text fallback: an `aria-live="polite"` region announcing "Showing N flows from Brazil to 4 other countries" on selection change.
- All decorative SVGs `aria-hidden="true"`; meaningful SVGs have `<title>`.
- The North/South hover-explainer (§4.2c) is also keyboard-reachable: focusing the number reveals the popover, blurring hides it.

---

## 10. Performance budget

| Asset                            | Budget                        |
| -------------------------------- | ----------------------------- |
| Critical CSS (inline)            | ≤ 8 KB                        |
| Main CSS bundle                  | ≤ 40 KB                       |
| Main JS (Landing + nav)          | ≤ 25 KB                       |
| Map JS (loaded on uppertab open) | ≤ 60 KB + D3 (~90 KB gzipped) |
| TopoJSON world map               | ~95 KB (lazy)                 |
| Data JSON (cases + flows + cats) | ≤ 250 KB combined             |
| Initial fonts                    | ≤ 80 KB (subset + WOFF2)      |

Lazy-loading rule: the map and cases modules are imported on first navigation into their uppertabs, not on initial page load.

---

## 11. Deployment

- **Target: GitHub Pages**, served from the **`gh-pages` branch** (clean separation from `main`, avoids polluting source history with built artifacts).
- **Custom domain:** `climatecaselab.org` (already registered) — configured via:
  - A `CNAME` file at the root of the `gh-pages` branch containing `climatecaselab.org`.
  - DNS at the registrar: `A` records pointing the apex to GitHub Pages' IPs (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) **and** a `CNAME` for `www.climatecaselab.org` pointing to `<gh-org>.github.io`.
  - HTTPS enforced in Pages settings ("Enforce HTTPS" checkbox).
- **Build & deploy step:**
  1. `python build/xlsx_to_json.py --xlsx refs/data/<latest>.xlsx --out src/data/`
  2. Build artifact into `dist/` (copy `src/*` over, plus minify CSS/JS if Lucas adds a bundler later).
  3. Publish `dist/` to the `gh-pages` branch (via `gh` CLI, `git subtree push`, or a small GitHub Action).
- A simple `Makefile` orchestrates `build`, `serve` (local `python -m http.server`), `verify`, `deploy`.

---

## 12. Locked decisions

(These were "open questions" in v0.1; v1 closes them. Items are now part of the spec, not pending.)

| #   | Topic                       | Decision (v1)                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Domain                      | `climatecaselab.org` (already registered). DNS + CNAME wiring in §11.                                                                                                                                                                                                                                                                                         |
| 2   | Submission backend          | None. `mailto:` link only (§2.3, §3.3). Form may be added in a later version.                                                                                                                                                                                                                                                                                 |
| 3   | Methodology long-form page  | Not in v1. The Methodology subtab is fully self-contained text + diagrams. A future version will add a citation/DOI link to the published paper.                                                                                                                                                                                                              |
| 4   | Authorship metadata         | **Lucas Biasetton** — Ph.D. Researcher, University of São Paulo & Grantham Research Institute on Climate Change and the Environment, London School of Economics. **Gustavo dos Santos Rodrigues da Silva** — LL.B., University of São Paulo; independent researcher on data and computer sciences. ORCIDs to be added when available; footer slot exists.     |
| 5   | Licensing                   | Follow the standard academic open-research combo — **CC BY 4.0** for content + data, **MIT** for code. The footer shows two short links: `Content & data: CC BY 4.0` and `Code: MIT`. `LICENSE` (code) and `LICENSE-CONTENT.md` (content/data) at the repo root. If Gustavo's advisor prefers a different combo, override here only — no other change needed. |
| 6   | Analytics                   | None in v1. No privacy notice required beyond the standard footer.                                                                                                                                                                                                                                                                                            |
| 7   | Catalytic-case holdings src | Inline in `refs/specs/landing-content.md` under the "Catalytic-case holdings" section (slugs match `catalytic.json` IDs). Placeholder text now, real holdings later.                                                                                                                                                                                          |

---

## 13. Implementation phasing (suggested)

A staged plan, designed to give Lucas a working site at every checkpoint. Numbers below are revised vs. the v0.1 draft (M6 dropped — no methodology long-form page in v1).

1. **M0 — Skeleton (2 days)**: HTML shell, theme toggle (with OS-pref + persistence per §6.5), uppertab routing, sticky bars with the ClimateCaseLab wordmark, fonts + tokens loaded. Landing renders placeholder content from `landing-content.md`.
2. **M1 — Data pipeline (1 day)**: `xlsx_to_json.py` produces all five JSON files; `qa_report.md` lands clean.
3. **M2 — Catalytic cases (3 days)**: read `catalytic.json`, build the card grid + in-place accordion with FLIP-driven sibling reflow (§5.4), integrate the mini-timeline, ship the cases intro block.
4. **M3 — Map base (3 days)**: world map renders, country select + direction toggle wired, single-country selection works end-to-end (stats, list, cases, arcs), on-map direction-color legend ships with this milestone.
5. **M4 — Map multi-select + counter-scaled zoom + N/S explainer (2 days)**: union semantics, constant arc/marker thickness across zoom, North/South hover-explainer popover.
6. **M5 — Collaboration mailto + polish + deploy (2 days)**: mailto button + clipboard fallback, footer (authorship + licensing links), final pass on motion, focus rings, reduced-motion verification, deploy to `gh-pages` and bind `climatecaselab.org` DNS.

Total: ~13 working days, ample contingency.

---

## 14. References

- `refs/specs/specs-seed.md` — origin seed (do not edit; cross-referenced as "seed §X").
- `refs/specs/landing-content.md` — body copy for the Landing uppertab + catalytic-case holdings + cases-intro block.
- `refs/mockups/Figure_X1_Citation_Flow_Map-4.html` — static citation-flow figure (academic styling reference).
- `refs/mockups/Figure_X2_Catalytic_Cases.html` — catalytic-cards visual reference.
- `refs/mockups/climate_litigation_citation_map_v19_05_2026-3.html` — interactive map functional reference (do not lift its tokens — wrong palette).
- `refs/mockups/methodology.html` — methodology pipeline content reference for the synthesized Methodology subtab text.
- Sabin Center for Climate Change Law — Climate Case Chart — `https://climatecasechart.com/` (link-target for case detail).
