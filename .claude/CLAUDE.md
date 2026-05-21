# CLAUDE.md — climatecaselab (subproject of phdMutley)

> Scope: this file applies **only** to work inside `phdMutley/climatecaselab/`. It is loaded **in addition** to the parent `phdMutley/.claude/CLAUDE.md` and the workspace-level / global `CLAUDE.md` files. On conflict, this file wins.

---

## What this subproject is

**climatecaselab** is the public-facing companion website to the **phdMutley** doctoral research on transnational citation patterns in climate litigation. The parent project does the heavy lifting (data extraction, citation classification, sixfold typology, network analysis); this subproject is a **static, single-page web app** that showcases a curated slice of those findings to a non-technical audience (legal scholars, journalists, the curious public).

**Co-author / collaborator:** Lucas (frontend lead). Gustavo owns the research and data; Lucas owns most of the implementation. Treat the spec doc in `specs/specs.md` as the contract between them.

**Status:** Specs-in-progress. No code yet. Mockups in `refs/mockups/`. Single data source: `refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx` (Sabin Center Global Trends export, May 2026 snapshot, single sheet `Planilha1`, ~690 rows × 29 columns).

---

## Architecture (target)

```
climatecaselab/
├── .claude/CLAUDE.md          ← this file
├── specs/
│   └── specs.md               ← the spec doc (source of truth)
├── refs/                       ← reference material, NOT shipped
│   ├── data/*.xlsx             ← raw Sabin export
│   ├── mockups/*.html          ← visual + functional references
│   └── specs/
│       ├── specs-seed.md       ← original seed (do not edit)
│       └── landing-content.md  ← prose copy for the Landing uppertab
├── src/                        ← app source (planned)
│   ├── index.html              ← single-page shell with 3 uppertabs
│   ├── styles/                 ← CSS (tokens, themes, components)
│   ├── scripts/                ← JS modules (map, dashboard, theme, nav)
│   └── data/                   ← compiled JSON consumed by the front-end
├── build/
│   └── xlsx_to_json.py         ← XLSX → JSON pipeline
└── docs/                       ← published by GitHub Pages (built from src/ via `make publish`)
```

**No framework yet.** The seed and mockups suggest vanilla HTML/CSS/JS + D3.js is enough. If Lucas wants Vite/React/Astro, that's a design call to log in the spec — don't introduce a bundler unilaterally.

---

## Stack & dependencies

| Layer       | Choice                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| HTML/CSS/JS | Vanilla, ES modules. No framework unless the spec is amended.                                              |
| Visuals     | **D3.js v7** + **TopoJSON v3** for the citation map (same as mockup).                                      |
| Build       | Python script (`build/xlsx_to_json.py`) converts the XLSX to multiple JSON files committed to `src/data/`. |
| Hosting      | GitHub Pages, static, served from `/docs` on `main` (custom domain `climatecaselab.org`).                 |
| Fonts       | Google Fonts — see spec for the families (serif for titles, geometric for body).                           |
| Theming     | CSS custom properties on `:root` and `[data-theme="dark"]`.                                                |

---

## Conventions (subproject-local)

1. **All UI text in English.** This is for an international academic audience. (Parent phdMutley uses pt-BR; this subproject does not.)
2. **Single source of truth for tokens.** Colors, fonts, spacing, radii, theme deltas — all in `src/styles/tokens.css`. Never hard-code a hex in a component.
3. **Data is read-only at runtime.** The site never writes to the spreadsheet or to its derived JSON. The "Collaboration" subtab is the only path that produces output (a form submission), and it does so via an external service (`mailto:` or a serverless function — TBD in spec).
4. **No build is required to view the site locally** — `python -m http.server` over `src/` must work. The build pipeline runs **before** committing, not at runtime.
5. **Mockups are reference, not source.** Do not import HTML from `refs/mockups/`. Re-implement, clean up, and align with the design system.
6. **Aesthetic is academic, not corporate.** Lean, high-contrast, generous whitespace. Avoid drop-shadow stacks, gradient bling, and "fintech dashboard" vibes — see the design tokens section of the spec.

---

## How to think about edits

| If you are…            | Then…                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Editing the spec       | Update `specs/specs.md` only. Cross-reference seed sections by `§` so reviewers can map back.        |
| Adding new mockups     | Drop them in `refs/mockups/` and link from the spec. Never inline mockup HTML into `src/`.           |
| Writing landing copy   | Edit `refs/specs/landing-content.md`. The spec defers all body copy of the Landing uppertab there.   |
| Implementing a feature | The spec is the contract; the seed is the origin story. If they disagree, the spec wins, but log it. |
| Touching the data      | Edit `build/xlsx_to_json.py` (when it exists). Regenerate `src/data/*.json`. Commit both.            |
| Adding a dependency    | First-paint impact matters more than DX — the site must load fast on a slow connection. Justify it.  |

---

## Deploy routine (GitHub Pages)

The site is served from `docs/` on the `main` branch — Pages source is set to `main` → `/docs` in the repo Settings. `docs/CNAME` carries `climatecaselab.org`. **Never hand-edit files in `docs/`** — it's a build output. Edit `src/` and re-run `make publish`.

**Edit → preview → ship loop:**

```bash
# 1. edit src/...                       ← human edits live here
# 2. (if you touched the XLSX or build/*.json) regenerate data:
make build         # writes src/data/*.json from refs/data/*.xlsx
# 3. preview locally before staging:
make serve         # http://127.0.0.1:8080 over src/
# 4. stage the published bytes:
make publish       # wipes docs/, copies src/. into docs/, writes docs/CNAME
# 5. commit both source and rendered output, then push:
git add src/ docs/ && git commit -m "..." && git push origin main
```

GitHub Pages auto-deploys within ~1 min of the push.

**Why `src/` AND `docs/` are both committed:** `src/` is the editable source of truth (Lucas works here); `docs/` is the byte-for-byte published output (what `climatecaselab.org` serves). Committing both makes the diff between source and rendered output reviewable in PRs.

**Gotchas:**

- If `docs/CNAME` is missing after a build, the custom domain breaks. `make publish` re-writes it every time — trust the Makefile.
- `dist/` no longer exists. The old `make dist` target was renamed to `make publish` (and now targets `docs/` instead of `dist/`).
- `refs/data/*.xlsx` is gitignored per [What NOT to do](#what-not-to-do). If a teammate needs the raw spreadsheet, hand it off out-of-band — never commit it.

---

## Relationship to parent (phdMutley)

- **Parent owns:** PostgreSQL database, sixfold classifier, citation extraction pipeline, full network analysis JSON (`analysis_output/network_data/`).
- **This subproject owns:** Curated public narrative, simplified visualizations, the catalytic-cases dashboard.
- **Data hand-off:** for v1, climatecaselab reads only from the `refs/data/*.xlsx` snapshot. It does **not** depend on the parent's live Postgres. (Future versions may; out of scope for now.)
- **No circular imports.** Parent scripts must not depend on `climatecaselab/`; this subproject may reference parent docs read-only.

---

## What NOT to do

- Don't add a backend, a database, or auth. This is a static showcase site.
- Don't translate UI to pt-BR (parent rule overridden for this subproject — audience is international).
- Don't ship the XLSX file or any unredacted research notes. Only the compiled JSON is published.
- Don't introduce a JS framework without explicit spec amendment.
- Don't fight the spec's design tokens; propose token changes via spec PR instead.

---

## Push notifications

Inherited from the global rule — the parent `phdMutley/.claude/CLAUDE.md` already wires the Stop hook. Nothing to add here.
