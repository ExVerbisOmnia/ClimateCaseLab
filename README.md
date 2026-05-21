# climatecaselab

A static, single-page web app showcasing highlights from a doctoral study
of transnational citation patterns in climate litigation.

Three top-level sections: a **Landing** narrative, an **Interactive Map**
of citation flows, and a **Catalytic Cases** dashboard. Vanilla HTML/CSS/JS

+ D3.js. No bundler. Deploys to GitHub Pages at `climatecaselab.org`.

## Quickstart

```bash
make build       # regenerate src/data/*.json from refs/data/*.xlsx
make serve       # http://127.0.0.1:8080
```

## Layout

```
.
├── specs/specs-v1.md          ← spec (source of truth)
├── refs/                       ← reference material, not shipped
│   ├── data/*.xlsx
│   ├── mockups/*.html
│   └── specs/{specs-seed,landing-content}.md
├── build/
│   ├── xlsx_to_json.py         ← data pipeline
│   ├── country_aliases.json
│   ├── region_map.json
│   ├── country_centroids.json
│   └── catalytic_exclusions.json
├── src/                        ← the deployable site
│   ├── index.html
│   ├── styles/                 ← tokens, base, shell, landing, map, cases
│   ├── scripts/                ← main, nav, landing, map, cases, utils, lib/
│   └── data/                   ← compiled JSON contracts (committed)
├── Makefile
├── LICENSE                     ← MIT (code)
└── LICENSE-CONTENT.md          ← CC BY 4.0 (content & data)
```

## Data pipeline

`build/xlsx_to_json.py` reads the latest Sabin Center Global Trends XLSX
snapshot, normalises country names, computes regions, picks the top-5
catalytic cases (filtered by `catalytic_exclusions.json`), and emits the
five JSON files in `src/data/` that the front-end consumes.

A `build/qa_report.md` is generated alongside; `make verify` fails CI if it
reports unknown countries or unexpected drops.

## Browser support

Evergreen Chromium, Firefox, Safari (≥ 2024). Uses `inert`, CSS color-mix,
`backdrop-filter`, ES modules, dynamic imports.

## Licence

Code: **MIT** (see `LICENSE`). Content & data: **CC BY 4.0**
(see `LICENSE-CONTENT.md`).
