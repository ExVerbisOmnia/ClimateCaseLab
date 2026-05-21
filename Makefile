## climatecaselab — make targets
##
## Usage:
##   make build      → regenerate src/data/*.json from refs/data/*.xlsx
##   make serve      → run a local dev server on http://127.0.0.1:8080
##   make verify     → run the build pipeline + fail if QA report has issues
##   make publish    → stage docs/ for GitHub Pages (copies src/* — no minifier yet)
##   make clean      → remove generated data (keeps the topojson basemap)

PY      := .venv/bin/python
XLSX    := refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx
OUT     := src/data
PORT    ?= 8080

.PHONY: build serve verify publish clean help venv

help:  ## show this help
	@awk -F':.*##' '/^[a-z][a-zA-Z0-9_-]+:.*##/{printf "  \033[1m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

venv:  ## (one-off) create .venv with build deps
	@if [ ! -x $(PY) ]; then \
		echo "Creating .venv with uv…"; \
		uv venv .venv && .venv/bin/python -m pip install openpyxl pandas; \
	fi

build: venv  ## regenerate src/data/*.json
	$(PY) build/xlsx_to_json.py --xlsx $(XLSX) --out $(OUT)/

serve:  ## serve src/ on http://127.0.0.1:$(PORT)
	cd src && python3 -m http.server $(PORT) --bind 127.0.0.1

verify: build  ## fail if the QA report shows dropped rows or unknowns
	@if grep -E "^## Unknown countries" build/qa_report.md >/dev/null; then \
		echo "❌ QA report has unknown countries — fix region_map.json / country_aliases.json"; \
		exit 1; \
	fi
	@echo "✓ verify: QA report clean"

publish:  ## stage docs/ for GitHub Pages (Pages source: main /docs)
	rm -rf docs && mkdir -p docs
	cp -r src/. docs/
	@echo "climatecaselab.org" > docs/CNAME
	@echo "✓ docs/ ready (copy of src/, CNAME written)"

clean:
	rm -f src/data/countries.json src/data/flows.json src/data/cases.json src/data/catalytic.json src/data/manifest.json build/qa_report.md
	@echo "✓ cleaned generated data"
