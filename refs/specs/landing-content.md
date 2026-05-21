# Landing — content blocks

> **Status:** v0.1 prose draft. Section anchors below match the IDs declared in `specs/specs.md §2.3` — do not rename without updating the spec. All text in English.

---

## §about — About this project

### Hero title

Climate Litigation Across Borders

### Lede paragraph

This site is a public-facing companion to a doctoral study on transnational citation patterns in climate litigation. It condenses, for a wider audience, the patterns of cross-border judicial dialogue that emerge from a recent snapshot of the world's climate cases — who cites whom, how often, and along which fault lines.

### Tile 1 — Interactive Map

A country-level view of citation flows between national and international courts. Select one or several jurisdictions, switch between *cited-by* and *cites* directions, and read the cases that produce each connection. Useful for spotting where doctrinal transplantation is dense — and where it is conspicuously absent.

CTA: Explore the map →

### Tile 2 — Catalytic Cases

Five decisions whose reasoning has travelled furthest: *Urgenda*, *Neubauer*, *Massachusetts v. EPA*, *Leghari*, and *Notre Affaire à Tous*. Each card unfolds into the full ecology of citing jurisdictions, a year-by-year timeline of uptake, and a short summary of the case's central holdings.

CTA: See the five cases →

### Tile 3 — Methodology

A seven-phase data-processing pipeline turns the Climate Case Chart corpus (Sabin) into structured citation data: documents are filtered to judicial decisions, every reference to case law is extracted, each cited court's origin is identified, and the resulting pair is sorted under a sixfold typology of court-to-court relations.

CTA: Read the methodology →

### Pull-quote

> "The map of climate jurisprudence remains, for now, an asymmetric one: roughly ninety-six per cent of cross-border citations travel between courts of the Global North. The South appears mostly as a place that reads — less than as a place that is read."

— *climatecaselab*, from the May 2026 corpus snapshot

### Authorship & affiliation footer

Lucas Biasetton — Ph.D. researcher, University of São Paulo and the Grantham Research Institute on Climate Change and the Environment, London School of Economics.

Gustavo dos Santos Rodrigues da Silva, LL.B. (University of São Paulo) — independent researcher in data and computer sciences.

**Data snapshot:** Sabin Center for Climate Change Law — *Climate Change Litigation Databases*, Global Trends export, May 2026.

---

## §methodology — Research Methodology

### One-paragraph standfirst

A *citation*, in this corpus, is any reference by one court's reasoning to the reasoning of another — formal, narrative, or shorthand. A *transnational* citation is one whose two endpoints sit in different legal systems. Counting them allows us to read the silent geography of climate jurisprudence: where doctrines travel, where they are received, and where the borders prove inconvenient.

### Synthesis

The corpus is the Sabin Center's *Climate Case Chart*, May 2026 snapshot — some 2,924 judicial decisions across roughly 102 jurisdictions. Not every entry in the chart is itself a judicial decision (the chart also catalogues pleadings, administrative notices, and settlements), so the first task is always to filter the corpus down to documents that actually contain a court's reasoning.

What follows is a seven-phase pipeline carried out document by document. Phase 0 separates judicial decisions from the rest. Phase 1 identifies the citing court's jurisdiction by metadata lookup. Phase 2 reads the full text and extracts every reference to case law — across twelve textual patterns, from traditional citations and parallel reporters down to one-word shorthand ("the *Urgenda* case", "as in *Abraham*"). Phase 3 classifies how each citation is being *used* in the citing court's reasoning, following Nollkaemper's functional typology. Phase 4 identifies the cited case's *origin* court through a three-tier procedure: a dictionary of more than eighty courts, a model-assisted lookup, and (in future iterations) a web-search fallback. Phase 5 applies the *sixfold* typology that captures whether each endpoint is a national or international court — and, for international tribunals, whether the citing party is a member state. Phase 6 verifies each candidate citation against the source text, with a confidence score that flags any below-threshold output for manual review.

The pipeline was not its first draft. An earlier single-pass version asked one model to extract and classify in a single call, which encouraged confident-sounding inventions; the current design deliberately separates *recall* (extract every plausible reference, even at the price of noise) from *precision* (verify each candidate against the source text it allegedly came from). An initial commitment to a frontier model proved incompatible with a doctoral budget, so the pipeline now tiers cheaper models for cost-gating and reserves heavier reasoning for the phases that demand it. Subsequent passes added explicit anti-hallucination filters — pipe-format and anachronism detectors — after early audits surfaced a small number of plausibly fabricated citations that no single prompt could be persuaded to stop producing.

The model layer itself has been mobile. The first working chain ran on Claude Opus; a cost crisis in early May 2026 pushed extraction and verification down the model ladder to Sonnet, then again to a phased extractor/verifier pair under Gemini 2.5. An ongoing companion project, *gemma-lab*, is porting the LLM-assisted stages onto a local Gemma chain on commodity hardware — with the modest ambition of taking a full corpus re-run to zero in API fees and making the analysis straightforwardly reproducible.

What the analysis surfaces, in headline form, is a striking asymmetry. Of the cross-jurisdictional citations in the corpus, roughly ninety-six per cent travel between courts of the Global North; the Global South appears overwhelmingly as a place that reads, less than as a place that is read. The interactive map and the catalytic-cases dashboard on this site are two ways of looking at that pattern at different scales — country-to-country at one, case-to-case at the other.

### 4-box pipeline diagram caption

A condensed reading of the seven-phase pipeline — *filter* the corpus to judicial decisions, *extract* every case reference, *classify* its functional use, origin court, and sixfold type, and *verify* each result against the source text.

### CTA

A long-form treatment of the methodology is forthcoming, to be published alongside the thesis. This section will link to it once available.

---

## §collaboration — Spotted an error? Got an improvement?

### Headline

This is a living dataset. You are welcomed to tell us where we might impove.

### Body paragraph

A corpus of nearly three thousand decisions will contain errors. A case name may be misspelled; a citation may be missed, mislabelled, or mis-attributed to the wrong origin court; a recent decision may not yet be ingested; a methodological choice may, on reflection, deserve a second look. If you notice one — or have a broader remark on the analysis, the typology, or the visualisations on this site — please write to us. We read every message, and we reply when a question warrants one.Tell 

### Contact

The most useful messages identify the case (full name, and ideally a link to its Climate Case Chart page), the nature of the issue, and what you would expect to see in its place.

- **Write to:** *[MAIL] (placeholder — confirm before launch)*

### Cited literature

A short reading list of the works this project leans on most directly. Grouped by role.

**Corpus and snapshot**

- Sabin Center for Climate Change Law & Grantham ResA submission form, with structured fields for errors, methodological questions, new cases, and general suggestions, may follow in a later release.
  
   Submit confirmation message
  Reserved for future use, when a structured submission form is added. Tentative copy:
  
  Thank you — we read every submission, and we will reply if your message needs a reply.earch Institute on Climate Change and the Environment (LSE). *Climate Change Litigation Databases*. Columbia Law School. https://climatecasechart.com/
- Setzer, J., & Higham, C. (2024). *Global Trends in Climate Change Litigation: 2024 Snapshot*. Grantham Research Institute, LSE.
- Tigre, M. A. (2023). *Global Climate Litigation Report: 2023 Status Review*. United Nations Environment Programme.

**Transnational judicial dialogue and citation analysis**

- Slaughter, A.-M. (2003). 'A Global Community of Courts'. *Harvard International Law Journal*, 44(1), 191–219.
- Nollkaemper, A. (2011). *National Courts and the International Rule of Law*. Oxford University Press. — source of the functional typology applied in Phase 3.
- Peel, J., & Lin, J. (2019). 'Transnational Climate Litigation: The Contribution of the Global South'. *American Journal of International Law*, 113(4), 679–726.

**Climate doctrine and judicial reasoning**

- Burgers, L. (2020). 'Should Judges Make Climate Change Law?'. *Transnational Environmental Law*, 9(1), 55–75.
- Bodansky, D. (2017). *The Art and Craft of International Environmental Law*. Harvard University Press.
- IPCC (2023). *Climate Change 2023: Synthesis Report* (Sixth Assessment Report). H. Lee & J. Romero (eds.). IPCC, Geneva.

---

## Catalytic-case holdings (used by the Cases uppertab)

> Each block fills the "Key holdings" bullets in the expanded card (spec §5.4 item 3).
> Use the slug exactly — it is referenced by `id` in `catalytic.json`.
> 
> **Placeholder copy.** These five blocks are intentionally left as *dolorem ipsum* until the holdings drafts are finalised. Replace each block with 2–4 bullets, each ≤ 20 words.

### case_urgenda — Urgenda Foundation v. State of the Netherlands

- *Dolorem ipsum dolor sit amet, consectetur adipiscing elit.*
- *Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.*

### case_neubauer — Neubauer et al. v. Germany

- *Dolorem ipsum dolor sit amet, consectetur adipiscing elit.*
- *Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.*

### case_mass_v_epa — Massachusetts v. EPA

- *Dolorem ipsum dolor sit amet, consectetur adipiscing elit.*
- *Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.*

### case_leghari — Leghari v. Federation of Pakistan

- *Dolorem ipsum dolor sit amet, consectetur adipiscing elit.*
- *Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.*

### case_notre_affaire — Notre Affaire à Tous v. France

- *Dolorem ipsum dolor sit amet, consectetur adipiscing elit.*
- *Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.*
