# climatecaselab v1 — Implementation Plan

> **SIP mode:** Specified — Autonomous (gates suppressed per user request)
> **Spec:** `specs/specs-v1.md`
> **Content source:** `refs/specs/landing-content.md`
> **Data source:** `refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx`
> **Tasks tracked in TaskCreate (IDs 1–7).** This file is the single artifact containing the full task breakdown.

**Goal:** A static, single-page web app showcasing the doctoral research on transnational climate-litigation citation patterns — Landing, Interactive Map, Catalytic Cases — deployable to GitHub Pages at `climatecaselab.org`.

**Architecture:** Vanilla HTML/CSS/JS + ES modules + D3.js v7 + TopoJSON v3. No bundler. Data is pre-built into a small set of stable JSON contracts in `src/data/`. The shell loads on first paint with critical CSS inlined; the Map module and Cases module are imported lazily on first navigation into their uppertabs.

**Aesthetic direction:** Editorial-academic minimalism. Warm off-white surface (`#FBF8F1`), Source Serif 4 headings, IBM Plex Sans body, JetBrains Mono for data labels. High contrast, generous whitespace, restrained motion (320ms ease-in-out; 180ms ease-out under `prefers-reduced-motion`). Map signature: counter-scaled stroke widths so arc thickness reads constant at every zoom level. Cases signature: FLIP-animated sibling reflow.

---

## File map

```
climatecaselab/
├── build/
│   ├── xlsx_to_json.py            ← data pipeline (Python)
│   ├── country_aliases.json        ← name normalization
│   ├── region_map.json             ← N/S classification
│   └── catalytic_exclusions.json   ← cases excluded from top-5 (EU procedural, etc.)
├── src/
│   ├── index.html                  ← single-page shell
│   ├── styles/
│   │   ├── tokens.css              ← :root + [data-theme="dark"] CSS vars
│   │   ├── base.css                ← reset + typography + utilities
│   │   ├── shell.css               ← header, uppertab track, layout
│   │   ├── landing.css
│   │   ├── map.css
│   │   └── cases.css
│   ├── scripts/
│   │   ├── main.js                 ← bootstrap, routing, scroll-spy, theme persistence
│   │   ├── theme-preload.js        ← inline-before-paint theme picker
│   │   ├── nav.js                  ← uppertab + subtab UI
│   │   ├── landing.js              ← mailto / clipboard fallback / toast
│   │   ├── cases.js                ← catalytic cases dashboard (lazy)
│   │   ├── map.js                  ← interactive map (lazy)
│   │   ├── lib/d3.v7.min.js        ← local D3
│   │   ├── lib/topojson.v3.min.js  ← local TopoJSON
│   │   └── utils.js                ← shared helpers
│   ├── data/                       ← generated JSON (committed)
│   │   ├── countries.json
│   │   ├── flows.json
│   │   ├── cases.json
│   │   ├── catalytic.json
│   │   ├── manifest.json
│   │   └── world-110m.json         ← TopoJSON basemap
│   └── assets/                     ← favicon, og image (if any)
├── docs/superpowers/plans/2026-05-21-climatecaselab-v1.md  ← this file
├── Makefile                        ← build / serve / verify
└── README.md
```

---

## Phasing

The seven tasks in the TaskList map 1-to-1 onto the spec's milestones:

| Task | Spec milestone | Output |
| ---- | -------------- | ------ |
| T1   | M1 — Data pipeline | `build/xlsx_to_json.py` + 5 JSON files in `src/data/` |
| T2   | M0 — Skeleton | HTML shell, tokens, fonts, theme toggle, uppertab routing |
| T3   | (within M0/M5) Landing content | 3 subtabs (About / Methodology / Collaboration) |
| T4   | M2 — Catalytic Cases | 5-card grid with FLIP reflow + expanded content |
| T5   | M3 — Map base | Single-country end-to-end with controls, arcs, cases pane |
| T6   | M4 — Map enhancements | Multi-select union, counter-scaled zoom, N/S explainer |
| T7   | M5 — Polish + deploy | Footer, accessibility, motion check, launch dev server |

Data pipeline runs **first** because the UI tasks all consume its output.

---

## Autonomous decisions (logged here; full audit in `.claude/sip-state/sip-v1.json`)

| # | Decision | Rationale | Reversibility |
|---|----------|-----------|---------------|
| D1 | Use **`uv`** to create the Python build venv (project-local `.venv/`) | `pip` not installed system-wide; `uv` is already on the path. Standard Python tooling in 2026. | trivially reversible |
| D2 | **Vendor D3 v7 + TopoJSON v3 locally** under `src/scripts/lib/` | Spec requires offline-first; the static site must work without a CDN. ~95KB combined, well within budget. | trivially reversible |
| D3 | **Top-5 catalytic cases** computed by Foreign-Citation-only count, with an explicit `catalytic_exclusions.json` removing EU institutional cases (`Commission v *`, `Parliament v *`, `Iberdrola and Others`) that aren't climate-doctrine cases | Raw top-5 in the dataset includes EU competition/agriculture cases that don't fit the spec's "climate jurisprudence" framing. The exclusion list is small, explicit, and trivially editable. The set this produces (Urgenda, Mass v. EPA, Neubauer, Shell, Leghari) is close to the spec's exemplar 5. | one-line edit |
| D4 | **TopoJSON file:** vendor `world-atlas@2/countries-110m.json` locally (~95KB) under `src/data/world-110m.json` | Spec calls for it; offline-first | trivially reversible |
| D5 | **Footer**: ship CC-BY 4.0 + MIT links inline (per §12 row 5); LICENSE files added at repo root | Closed decision in the spec. | trivially reversible |
| D6 | **Combobox**: build a JS-enhanced one on top of a hidden `<select multiple>` (a11y fallback) — no third-party combobox component | The spec asks for a11y fallback; rolling our own is ~50 lines and avoids a dep. | trivially reversible |
| D7 | **Mini-timeline** in expanded catalytic cards: hand-rolled D3 stacked bar (year × N/S region) — share the same module already loaded for the map | Avoids second chart library. | trivially reversible |
| D8 | **No bundler / no minifier.** Ship ES modules raw. | Spec says "no build is required to view the site locally" and "no framework yet — vanilla suffices". | trivially reversible (add Vite later) |
| D9 | **Use `<select>` + ARIA combobox upgrade** as the multi-select; do not import a third-party widget | Vanilla principle + a11y fallback requirement | trivially reversible |
| D10 | **Routing**: implement hash routing in `nav.js` ourselves (no library) | 100 lines max for hash parse/serialise + subscriber pattern. | trivially reversible |

---

## Verification strategy

After **each** task:

1. Pipeline (T1): run `python build/xlsx_to_json.py` and verify all 5 JSON files exist, are valid JSON, the manifest counts agree with `wc -l` checks, and `qa_report.md` shows zero dropped rows or only known-and-explained dropped rows.
2. UI tasks (T2–T6): boot a local `python -m http.server` and curl `index.html` plus each data file (HTTP 200). Then run a **headless smoke check** with a tiny `curl` + grep to verify the critical DOM strings render in the served HTML.
3. After T7: launch the dev server and hand control to the user.

**Iteration loop on failures:** test → debug → fix → retest, **up to 3 attempts** per failure. After 3 attempts, stop and report to the user rather than thrash. Per the spec's `prefers-reduced-motion` and accessibility requirements, also do a manual pass that toggles the OS setting in the DevTools and confirms motion is softened, not removed.

---

## Stop criteria

The plan is complete when:

- All 7 tasks marked `completed` in TaskList.
- `python build/xlsx_to_json.py` runs clean.
- The dev server serves `index.html` with all three uppertabs functional (Landing scroll-spy, Map flows render, Cases expand+reflow).
- No console errors on initial load or on uppertab switch.
- A user can reach the email button on the Collaboration subtab and click it (mailto fires or clipboard-copy fallback shows the toast).

When stop criteria are met, T7 ends by launching `python -m http.server` in the background and reporting the URL.
