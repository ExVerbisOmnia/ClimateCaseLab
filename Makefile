## climatecaselab — make targets
##
## Usage:
##   make build      → regenerate src/data/*.json from refs/data/*.xlsx
##   make serve      → run a local dev server on http://127.0.0.1:8080
##   make verify     → run the build pipeline + fail if QA report has issues
##   make dist       → assemble the dist/ artifact (copies src/* — no minifier yet)
##   make clean      → remove generated data (keeps the topojson basemap)

PY      := .venv/bin/python
XLSX    := refs/data/7132427v1_Global_Trends_Data_v19.05.2026.xlsx
OUT     := src/data
PORT    ?= 8080

.PHONY: build serve verify dist clean help venv

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

dist:  ## stage dist/ for GitHub Pages
	rm -rf dist && mkdir -p dist
	cp -r src/* dist/
	@echo "✓ dist/ ready (copy of src/)"

clean:
	rm -f src/data/countries.json src/data/flows.json src/data/cases.json src/data/catalytic.json src/data/manifest.json build/qa_report.md
	@echo "✓ cleaned generated data"
