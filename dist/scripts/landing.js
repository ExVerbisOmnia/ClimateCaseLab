// landing.js — renders content into the static Landing skeleton.
// Pulls copy from src/data/landing-content.json (a pre-baked JSON view of
// refs/specs/landing-content.md — see build/build_landing_content.py).
// To keep the v1 build pipeline tight, the copy is inlined here.

import { $, $$, el, toast, fetchJSON } from './utils.js';

const COPY = {
  lede: "This site is a public-facing companion to a doctoral study on transnational citation patterns in climate litigation. It condenses, for a wider audience, the patterns of cross-border judicial dialogue that emerge from a recent snapshot of the world's climate cases — who cites whom, how often, and along which fault lines.",
  tiles: [
    {
      title: 'Interactive Map',
      body: "A country-level view of citation flows between national and international courts. Select one or several jurisdictions, switch between cited-by and cites directions, and read the cases that produce each connection. Useful for spotting where doctrinal transplantation is dense — and where it is conspicuously absent.",
      cta: 'Explore the map →',
      href: '#/map',
    },
    {
      title: 'Catalytic Cases',
      body: "Five decisions whose reasoning has travelled furthest: Urgenda, Neubauer, Massachusetts v. EPA, Shell PLC v. Netherlands, and KlimaSeniorinnen. Each card unfolds into the full ecology of citing jurisdictions, a year-by-year timeline of uptake, and a short summary of the case's central holdings.",
      cta: 'See the five cases →',
      href: '#/cases',
    },
    {
      title: 'Methodology',
      body: "A seven-phase data-processing pipeline turns the Climate Case Chart corpus (Sabin) into structured citation data: documents are filtered to judicial decisions, every reference to case law is extracted, each cited court's origin is identified, and the resulting pair is sorted under a sixfold typology of court-to-court relations.",
      cta: 'Read the methodology →',
      href: '#/landing/methodology',
    },
  ],
  pullquote: {
    text: '“The map of climate jurisprudence remains, for now, an asymmetric one: roughly ninety-six per cent of cross-border citations travel between courts of the Global North. The South appears mostly as a place that reads — less than as a place that is read.”',
    cite: '— climatecaselab, from the May 2026 corpus snapshot',
  },
  methodology: {
    standfirst: "A citation, in this corpus, is any reference by one court's reasoning to the reasoning of another — formal, narrative, or shorthand. A transnational citation is one whose two endpoints sit in different legal systems. Counting them allows us to read the silent geography of climate jurisprudence: where doctrines travel, where they are received, and where the borders prove inconvenient.",
    paragraphs: [
      "The corpus is the Sabin Center's Climate Case Chart, May 2026 snapshot — some 2,924 judicial decisions across roughly 102 jurisdictions. Not every entry in the chart is itself a judicial decision (the chart also catalogues pleadings, administrative notices, and settlements), so the first task is always to filter the corpus down to documents that actually contain a court's reasoning.",
      "What follows is a seven-phase pipeline carried out document by document. Phase 0 separates judicial decisions from the rest. Phase 1 identifies the citing court's jurisdiction by metadata lookup. Phase 2 reads the full text and extracts every reference to case law — across twelve textual patterns, from traditional citations and parallel reporters down to one-word shorthand (“the Urgenda case”, “as in Abraham”). Phase 3 classifies how each citation is being used in the citing court's reasoning, following Nollkaemper's functional typology. Phase 4 identifies the cited case's origin court through a three-tier procedure: a dictionary of more than eighty courts, a model-assisted lookup, and (in future iterations) a web-search fallback. Phase 5 applies the sixfold typology that captures whether each endpoint is a national or international court — and, for international tribunals, whether the citing party is a member state. Phase 6 verifies each candidate citation against the source text, with a confidence score that flags any below-threshold output for manual review.",
      "The pipeline was not its first draft. An earlier single-pass version asked one model to extract and classify in a single call, which encouraged confident-sounding inventions; the current design deliberately separates recall (extract every plausible reference, even at the price of noise) from precision (verify each candidate against the source text it allegedly came from). An initial commitment to a frontier model proved incompatible with a doctoral budget, so the pipeline now tiers cheaper models for cost-gating and reserves heavier reasoning for the phases that demand it. Subsequent passes added explicit anti-hallucination filters — pipe-format and anachronism detectors — after early audits surfaced a small number of plausibly fabricated citations that no single prompt could be persuaded to stop producing.",
      "What the analysis surfaces, in headline form, is a striking asymmetry. Of the cross-jurisdictional citations in the corpus, roughly ninety-six per cent travel between courts of the Global North; the Global South appears overwhelmingly as a place that reads, less than as a place that is read. The interactive map and the catalytic-cases dashboard on this site are two ways of looking at that pattern at different scales — country-to-country at one, case-to-case at the other.",
    ],
    caption: 'A condensed reading of the seven-phase pipeline — filter the corpus to judicial decisions, extract every case reference, classify its functional use, origin court, and sixfold type, and verify each result against the source text.',
  },
  collaboration: {
    heading: 'Spotted an error? Got an improvement?',
    body: "A corpus of nearly three thousand decisions will contain errors. A case name may be misspelled; a citation may be missed, mislabelled, or mis-attributed to the wrong origin court; a recent decision may not yet be ingested; a methodological choice may, on reflection, deserve a second look. If you notice one — or have a broader remark on the analysis, the typology, or the visualisations on this site — please write to us. We read every message, and we reply when a question warrants one.",
    instructions: 'The most useful messages identify the case (full name, and ideally a link to its Climate Case Chart page), the nature of the issue, and what you would expect to see in its place.',
    contact_email: 'hello@climatecaselab.org',
  },
  citedLiterature: {
    title: 'Cited literature',
    intro: 'A short reading list of the works this project leans on most directly. Grouped by role.',
    groups: [
      {
        heading: 'Corpus and snapshot',
        items: [
          'Sabin Center for Climate Change Law & Grantham Research Institute on Climate Change and the Environment (LSE). <em>Climate Change Litigation Databases</em>. Columbia Law School. <a href="https://climatecasechart.com/" target="_blank" rel="noopener">climatecasechart.com</a>',
          'Setzer, J., & Higham, C. (2024). <em>Global Trends in Climate Change Litigation: 2024 Snapshot</em>. Grantham Research Institute, LSE.',
          'Tigre, M. A. (2023). <em>Global Climate Litigation Report: 2023 Status Review</em>. United Nations Environment Programme.',
        ],
      },
      {
        heading: 'Transnational judicial dialogue and citation analysis',
        items: [
          'Slaughter, A.-M. (2003). “A Global Community of Courts”. <em>Harvard International Law Journal</em>, 44(1), 191–219.',
          'Nollkaemper, A. (2011). <em>National Courts and the International Rule of Law</em>. Oxford University Press. — source of the functional typology applied in Phase 3.',
          'Peel, J., & Lin, J. (2019). “Transnational Climate Litigation: The Contribution of the Global South”. <em>American Journal of International Law</em>, 113(4), 679–726.',
        ],
      },
      {
        heading: 'Climate doctrine and judicial reasoning',
        items: [
          'Burgers, L. (2020). “Should Judges Make Climate Change Law?”. <em>Transnational Environmental Law</em>, 9(1), 55–75.',
          'Bodansky, D. (2017). <em>The Art and Craft of International Environmental Law</em>. Harvard University Press.',
          'IPCC (2023). <em>Climate Change 2023: Synthesis Report</em> (Sixth Assessment Report). H. Lee &amp; J. Romero (eds.). IPCC, Geneva.',
        ],
      },
    ],
  },
};

function renderAbout(root) {
  $('.landing-lede', root).textContent = COPY.lede;
  const tiles = $$('.tile', root);
  COPY.tiles.forEach((t, i) => {
    const tile = tiles[i];
    if (!tile) return;
    tile.querySelector('h3').textContent = t.title;
    tile.querySelector('p').textContent = t.body;
    tile.querySelector('.tile-cta').textContent = t.cta;
    tile.setAttribute('href', t.href);
  });
  const pq = $('.landing-pullquote', root);
  pq.querySelector('p').textContent = COPY.pullquote.text;
  pq.querySelector('cite').textContent = COPY.pullquote.cite;
}

function renderMethodology(root) {
  const prose = $('.methodology-prose', root);
  prose.innerHTML = '';
  prose.appendChild(el('p', { class: 'methodology-standfirst' }, COPY.methodology.standfirst));
  for (const p of COPY.methodology.paragraphs) {
    prose.appendChild(el('p', {}, p));
  }
  $('.methodology-caption', root).textContent = COPY.methodology.caption;
}

function renderCollaboration(root) {
  $('.collab-heading', root).textContent = COPY.collaboration.heading;
  $('.collab-body', root).textContent = COPY.collaboration.body;
  $('.collab-instructions', root).textContent = COPY.collaboration.instructions;
  const btn = $('.collab-mailto', root);
  btn.dataset.contactEmail = COPY.collaboration.contact_email;
  $('.mailto-address', btn).textContent = COPY.collaboration.contact_email;

  const lit = $('.cited-literature', root);
  lit.innerHTML = '';
  lit.appendChild(el('h2', {}, COPY.citedLiterature.title));
  lit.appendChild(el('p', { class: 'small', style: { color: 'var(--text-muted)' } }, COPY.citedLiterature.intro));
  for (const group of COPY.citedLiterature.groups) {
    lit.appendChild(el('h3', {}, group.heading));
    const ul = el('ul');
    for (const item of group.items) {
      ul.appendChild(el('li', { html: item }));
    }
    lit.appendChild(ul);
  }
}

function wireMailto() {
  const btn = $('.collab-mailto');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const address = btn.dataset.contactEmail;
    const subject = encodeURIComponent('climatecaselab — feedback');
    const href = `mailto:${address}?subject=${subject}`;
    // Try the mailto link by simulating a navigation; if no scheme handler picks
    // it up (no mail client), the page stays put and the user sees the toast.
    let opened = false;
    try {
      const w = window.open(href, '_self');
      opened = !!w;
    } catch (_) { opened = false; }
    if (!opened) {
      try {
        await navigator.clipboard.writeText(address);
        toast(`Email address copied — ${address}`);
      } catch (_) {
        // last resort: select a hidden input for old browsers
        const tmp = document.createElement('textarea');
        tmp.value = address;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
        toast(`Email address copied — ${address}`);
      }
    }
  });
}

async function maybeRenderManifest() {
  try {
    const m = await fetchJSON('data/manifest.json');
    $$('.site-footer [data-snapshot-label]').forEach(n => { n.textContent = m.snapshot_label; });
  } catch (_) { /* non-fatal */ }
}

export async function initLanding() {
  const root = document.querySelector('.uppertab-panel[data-panel="landing"]');
  if (!root) return;
  renderAbout(root);
  renderMethodology(root);
  renderCollaboration(root);
  wireMailto();
  maybeRenderManifest();
  document.dispatchEvent(new CustomEvent('landing:ready'));
}
