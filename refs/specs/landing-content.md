# Landing — content blocks

> Section anchors below match the IDs declared in `specs/specs.md §2.3` — do not rename without updating the spec. All text in English.

---

## §about — About this project

### Hero title

Climate Litigation Across Borders

We have created this website to share our ongoing doctoral research on transnational citation patterns in climate litigation. This research we have been developing, and the tools that inform it, is an ongoing effort to map citations across borders. We wanted to understand whether courts were actually using foreign case law and under which conditions. The use of natural language processing tools was a pre-requisite for a large-scale investigation. Our methodology has been improving for the past eight months, since we began this endeavor. As new cases arise every other day, this is an ongoing and probably never-ending effort. As the technology we use improves, and as new data comes to light, we want to update the findings produced through the tooling this research applies. For that reason, we know we will never have a final version subject to a crystalized publication under a paper or any other form.

As firm believers of the collaboration between researchers, we understand this data could be useful for researchers in climate litigation, but such peers could also be helpful in our task, contributing with improvements and manual review of thousands of documents and information that we could never do by ourselves — regardless of how many natural language processing tools we apply. We have decided to share what we have found so far to push this research further.

We hope you find this data useful, and please let us know if you would like to chat about it or have any contributions of any kind.

### Authorship & affiliation footer

Lucas Biasetton, doctoral researcher at the University of São Paulo (USP).

Gustavo Rodrigues, LL.B. (USP), independent researcher in computer sciences.

---

## §methodology — Research Methodology

<!-- The three "###" subsection headings below render on-page, nested one level under this section's H1. -->

This research examines how courts acting in climate litigation cases engage with foreign case law and the conditions under which they do so. Its empirical basis is the Climate Case Chart, the litigation database maintained by the Sabin Center for Climate Change Law at Columbia Law School, from which our most recent survey identified around 2,924 judicial decisions across roughly 102 jurisdictions.

The Climate Case Chart is a public repository designed for consultation rather than for computational analysis, and work at this scale requires a different foundation. Our first step was therefore to ingest the full set of relevant documents into a structured local database that we design, organize, and maintain ourselves. Holding the corpus locally allows us to query, cross-reference, and process thousands of decisions under uniform and reproducible conditions that manual consultation of the original site would never allow. Within this database we restrict the analysis to judicial decisions and exclude procedural filings and other materials that fall outside the scope of this study for now.

### Definitions and classification

Within this corpus, a citation is any reference made by the reasoning of one court to the reasoning of another, whether expressed as a formal citation, a narrative reference, or a shorthand allusion. A citation is transnational if its two endpoints belong to different jurisdictions.

Each transnational citation is assigned to one of six categories through a classification that rests on two criteria. The first criterion records whether each endpoint is a national court or an international tribunal; and the second, which applies only where an international tribunal is involved, records whether the relevant national party is itself a member of that tribunal, or subject to its jurisdiction. The combination of these two criteria yields the six categories set out below.

1. Foreign Citation. A national court cites the case law of another national court, i.e. another national jurisdiction.
2. International Citation. A national court cites an international tribunal and the state of that court is a member of such international tribunal.
3. Foreign International Citation. A national court cites an international tribunal of which the state of the citing court is not a member.
4. Inter-System Citation. An international tribunal cites case law of another international tribunal.
5. Member-State Citation. An international tribunal cites a national court of one of its member states.
6. Non-Member Citation. An international tribunal cites a national court of a state outside its membership.

### The processing pipeline

What we are naming as pipeline is a structured sequence of scripts, coded in python and whose outputs and inputs are sequentially piped among each other. Such scripts feature a connection to the local database that contains the raw texts of all the relevant decisions, which define the corpus, and such decisions are processed through the pipeline under a succession of analytical operations.

The pipeline first distinguishes judicial decisions from the remaining document types and sets the latter aside. For each decision it then resolves the citing court's jurisdiction by reference to the case metadata featured in the Sabin's original database, after which it reads the full text from all filtered decisions to then extract every reference to case law, drawing on twelve distinct textual patterns that range from conventional citations and parallel reporters to single-word allusions such as "the Urgenda case" or "as in Abraham."

All extracted citations are then filtered under the goal of scrapping any citation that does not fit in this research parameters — citations not deemed as cross-border, mainly. The origin court of each cited case is then identified through a three-tier procedure that combines a dictionary of more than eighty courts, a model-assisted resolution where the dictionary proves insufficient, and, in later iterations, a web-search fallback. Each candidate is subsequently assigned to one of the six categories defined above and verified against the source text from which it was drawn, receiving a confidence score that routes any result below the established threshold to manual review.

The final achieved state produced by the pipeline is a recording of all the captured citations in a dedicated database, segregated from the local database containing the raw texts of all relevant decisions. Such dedicated database features not only the text of which each citation is composed, but also its classification labels and a set of metadata relating to each one, to the decision that contains it, and to the court that renders such decision.

The tools published in this website are a translation of a portion of the data featured in the dedicated final database, aimed at visualization and condensation of some of the findings that arose from the current state of the research. The interactive map presently displays only Foreign Citations, that is, instances in which a national court cites the case law of a national court in another jurisdiction, while the remaining five categories, although already recorded in the underlying data on the dedicated database, are reserved for future updates.

### Refinement of the methodology

The methodology continues to evolve as the underlying technology matures and as we iterate through the research process, learning and evolving on the way and discovering and applying new toolsets. An earlier single-pass design asked one model to extract and classify citations within a single call on each decision document, an arrangement that tended to produce confident but fabricated output. The current architecture deliberately separates recall from precision, so that the initial stages extract every plausible reference even at the cost of admitting noise, and later stages perform verification steps, with more reasoning effort and precision, to each candidate against the source text from which it derives.

Because an early commitment to a commercial frontier model proved incompatible with a doctoral budget, the pipeline now tiers less expensive models for cost-gating and reserves heavier reasoning for the stages that genuinely require it. Successive revisions introduced explicit anti-hallucination filters and formatting refinements, after early audits surfaced a small number of plausibly fabricated citations and misidentifications that no single prompt design proved able to eliminate.

Full methodology paper: forthcoming.

---

## §acknowledgements — Acknowledgements

This research would not be possible without the work of the Sabin Center for Climate Change Law at Columbia Law School in building and maintaining the Climate Case Chart. Every piece of information used here, and every link to case law, traces back to that database.

We also thank our colleagues at the Grantham Research Institute on Climate Change and the Environment, especially Prof. Joana Setzer and Catherine Higham, for their valuable contributions to our methodology and our conclusions so far; and Professor Alberto do Amaral Junior, from the University of São Paulo as the supervisor of the research.

---

## §collaboration — Spotted an error? Got an improvement?

Spotted an error? Got an improvement?

The processing of a corpus of nearly three thousand decisions will contain errors. A case name may be misspelled; a citation may be missed, mislabelled, or mis-attributed to the wrong origin court; a recent decision may not yet be ingested; a methodological choice may, on reflection, deserve a second look. If you notice one — or have a broader remark on the analysis, the typology, or the visualisations on this site — please write to us. We read every message, and we reply when a question warrants one.

The most useful messages identify the case (full name, and ideally a link to its Climate Case Chart page), the nature of the issue, and what you would expect to see in its place or what refinement or correction it deserves.

Email us any correction or suggestion to hello@climatecaselab.org

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
