// cases.js — Catalytic Cases dashboard.
//
// Renders 5 cards. Each is collapsed by default; clicking the title (or its
// header) toggles an in-place vertical accordion. Only one card may be
// expanded at a time. Sibling reflow uses the FLIP technique to glide cards
// into their new grid positions instead of jumping.

import { $, $$, el, fetchJSON, formatCount } from './utils.js';

const HOLDINGS = {
  // Placeholder copy per landing-content.md §catalytic-case holdings. Real
  // holdings text will replace these when Gustavo finalises the draft.
  case_urgenda: [
    'A state owes a duty of care to its citizens to mitigate dangerous anthropogenic climate change.',
    'Court-set emissions-reduction targets are judicially reviewable against international and constitutional law.',
    'Inaction in the face of a known risk constitutes a breach of human-rights obligations under the ECHR.',
  ],
  case_shell: [
    'A private corporation can be held to a quantifiable emissions-reduction obligation under tort law.',
    'Corporate human-rights responsibilities extend to greenhouse-gas reduction along the value chain.',
    'Tort doctrine — informed by international soft law — can produce a binding emissions trajectory.',
  ],
  case_mass_v_epa: [
    'CO₂ and other GHGs are “air pollutants” within the meaning of the U.S. Clean Air Act.',
    'States have standing to challenge a federal agency’s failure to regulate climate-causing emissions.',
    'An agency must offer a reasoned, science-based explanation when declining to regulate.',
  ],
  case_neubauer: [
    'Constitutional rights protect future generations from disproportionate climate burdens.',
    'Vague long-term emissions targets without near-term steps are constitutionally inadequate.',
    'Intergenerational equity is enforceable as a positive duty on the legislature.',
  ],
  case_klimaseniorinnen: [
    'States have a positive obligation under Article 8 ECHR to mitigate climate change.',
    'Vulnerable groups have a justiciable interest in effective climate policy.',
    'Effective climate protection includes quantified targets and credible pathways to meet them.',
  ],
  case_leghari: [
    'A state’s failure to implement its climate policy violates the constitutional right to life.',
    'Courts may convene standing climate-change commissions to oversee state compliance.',
    'Climate-change litigation is anchored in justiciable fundamental rights — not just environmental statute.',
  ],
  case_notre_affaire: [
    'A government’s failure to meet its own emissions trajectory is a justiciable “fault”.',
    'Ecological prejudice from climate inaction is a recognisable, compensable harm.',
    'Courts may issue injunctive orders to make up for past climate-policy underperformance.',
  ],
};

const REGION_LABELS = {
  'Global North': 'NORTH',
  'Global South': 'SOUTH',
  International: 'INTL',
};

// ---------- Rendering ----------------------------------------------------

function topBars(juris, total) {
  const top = juris.slice(0, 5);
  const max = Math.max(1, ...top.map(j => j.count));
  const grid = el('div', { class: 'juris-bars', 'aria-label': 'Top citing jurisdictions' });
  for (const j of top) {
    grid.appendChild(el('span', { class: 'name' }, j.name));
    grid.appendChild(el('div', { class: 'bar', 'aria-hidden': 'true' }, [
      el('i', { style: { width: `${(j.count / max * 100).toFixed(0)}%` } }),
    ]));
    grid.appendChild(el('span', { class: 'count' }, formatCount(j.count)));
  }
  return grid;
}

function jurisdictionsTable(juris) {
  const total = juris.reduce((acc, j) => acc + j.count, 0) || 1;
  const tbl = el('table', { class: 'juris-table' });
  const thead = el('thead', {}, [
    el('tr', {}, [
      el('th', {}, 'Jurisdiction'),
      el('th', {}, 'Region'),
      el('th', { class: 'count' }, 'Citations'),
      el('th', { class: 'count' }, '% of total'),
    ]),
  ]);
  const tbody = el('tbody');
  for (const j of juris) {
    tbody.appendChild(el('tr', {}, [
      el('td', {}, j.name),
      el('td', {}, [el('span', { class: 'tag', dataset: { region: j.region } }, REGION_LABELS[j.region] || j.region)]),
      el('td', { class: 'count' }, formatCount(j.count)),
      el('td', { class: 'count' }, `${(j.count / total * 100).toFixed(0)}%`),
    ]));
  }
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  return tbl;
}

function holdingsBlock(holdingsSlug) {
  const list = HOLDINGS[holdingsSlug];
  const ul = el('ul', { class: 'holdings-list' });
  if (!list || !list.length) {
    ul.appendChild(el('li', {}, [el('i', {}, 'Holdings summary forthcoming.')]));
  } else {
    for (const h of list) ul.appendChild(el('li', {}, h));
  }
  return ul;
}

function citingGroups(citing) {
  const byCountry = new Map();
  for (const c of citing) {
    const k = c.country || 'Unknown';
    if (!byCountry.has(k)) byCountry.set(k, []);
    byCountry.get(k).push(c);
  }
  const wrap = el('div');
  const sortedCountries = [...byCountry.keys()].sort((a, b) => byCountry.get(b).length - byCountry.get(a).length);
  for (const country of sortedCountries) {
    const cases = byCountry.get(country).sort((a, b) => (b.year || 0) - (a.year || 0));
    const group = el('div', { class: 'citing-group' }, [
      el('h5', {}, `${country} · ${cases.length}`),
    ]);
    const ul = el('ul');
    for (const c of cases) {
      const liChildren = [];
      if (c.url) {
        liChildren.push(el('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.name));
      } else {
        liChildren.push(el('span', {}, c.name));
      }
      liChildren.push(el('span', { class: 'yr' }, c.year ? String(c.year) : '—'));
      ul.appendChild(el('li', {}, liChildren));
    }
    group.appendChild(ul);
    wrap.appendChild(group);
  }
  return wrap;
}

function timelineSVG(yearly) {
  // Minimal stacked-bar by year × region — no external lib.
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'timeline-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Year-by-year citations of this case');
  svg.setAttribute('preserveAspectRatio', 'none');

  if (!yearly || !yearly.length) {
    svg.appendChild(textNode(ns, 'No yearly data.', 8, 24));
    return svg;
  }

  const years = yearly.map(y => y.year);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const span = Math.max(1, maxY - minY);
  const maxStack = Math.max(1, ...yearly.map(y => (y.north || 0) + (y.south || 0) + (y.international || 0)));

  const padL = 28, padR = 8, padT = 8, padB = 24;
  const w = 600, h = 160;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const barW = Math.max(4, plotW / Math.max(yearly.length, span + 1) * 0.7);

  // Y-axis tick marks (just 0 and max)
  const axis = document.createElementNS(ns, 'g');
  axis.setAttribute('font-family', 'var(--font-mono)');
  axis.setAttribute('font-size', '9');
  axis.setAttribute('fill', 'currentColor');
  axis.appendChild(textNode(ns, '0', 4, padT + plotH));
  axis.appendChild(textNode(ns, String(maxStack), 4, padT + 9));
  svg.appendChild(axis);

  // Bars
  const stackColors = {
    north: 'var(--region-north)',
    south: 'var(--region-south)',
    international: 'var(--region-international)',
  };
  for (const y of yearly) {
    const xCoord = padL + ((y.year - minY) / span) * plotW - barW / 2;
    let yCursor = padT + plotH;
    for (const k of ['south', 'north', 'international']) {
      const val = y[k] || 0;
      if (val <= 0) continue;
      const barH = (val / maxStack) * plotH;
      yCursor -= barH;
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', String(xCoord));
      rect.setAttribute('y', String(yCursor));
      rect.setAttribute('width', String(barW));
      rect.setAttribute('height', String(barH));
      rect.setAttribute('fill', stackColors[k]);
      rect.setAttribute('opacity', '0.95');
      svg.appendChild(rect);
    }
    // year label
    const t = textNode(ns, String(y.year), xCoord + barW / 2, padT + plotH + 14);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'var(--font-mono)');
    t.setAttribute('font-size', '9');
    t.setAttribute('fill', 'currentColor');
    svg.appendChild(t);
  }
  return svg;
}

function textNode(ns, str, x, y) {
  const t = document.createElementNS(ns, 'text');
  t.setAttribute('x', String(x));
  t.setAttribute('y', String(y));
  t.appendChild(document.createTextNode(str));
  return t;
}

function buildCard(c) {
  const card = el('article', {
    class: 'catalytic-card',
    role: 'listitem',
    dataset: { id: c.id, rank: String(c.rank) },
    style: { '--case-color': `var(${c.color_token})` },
  });

  const titleBtn = el('button', {
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': `expanded-${c.id}`,
  }, c.name);

  const headerLeft = el('div', {}, [
    el('h3', { class: 'case-title' }, [titleBtn]),
    el('p', { class: 'case-origin' }, `Origin · ${c.origin_country}${c.year ? ` · ${c.year}` : ''}`),
  ]);

  let externalLink = null;
  if (c.sabin_url) {
    externalLink = el('a', {
      class: 'external-link',
      href: c.sabin_url,
      target: '_blank',
      rel: 'noopener',
      'aria-label': `Open ${c.name} on climatecasechart.com`,
    }, [
      // Lucide external-link
      svgIcon('M14 3h7v7M21 3l-9 9M5 5v14h14V11'),
    ]);
  }

  const header = el('header', { class: 'card-header' }, [headerLeft, externalLink]);

  const summary = el('p', { class: 'case-summary' },
    `${formatCount(c.total_citing_decisions)} citing decisions across ${formatCount(c.total_jurisdictions)} jurisdictions`,
  );

  const bars = topBars(c.jurisdictions, c.total_citing_decisions);
  const moreCount = Math.max(0, c.total_jurisdictions - 5);
  const moreHint = moreCount > 0
    ? el('p', { class: 'more-hint' }, `+${moreCount} more — expand for full list →`)
    : null;

  const expandedId = `expanded-${c.id}`;
  const expanded = el('div', {
    id: expandedId,
    class: 'card-expanded',
    role: 'region',
    'aria-label': `Expanded detail for ${c.name}`,
  }, [
    // Top collapse handle — always visible at the top of the expanded area.
    el('div', { class: 'expanded-top-bar' }, [
      el('button', {
        type: 'button',
        class: 'collapse-handle js-collapse',
        'aria-label': `Collapse ${c.name}`,
      }, '↑ Collapse'),
    ]),
    el('div', { class: 'expanded-section full' }, [
      el('h4', {}, 'Key holdings'),
      holdingsBlock(c.holdings_slug),
    ]),
    el('div', { class: 'expanded-section' }, [
      el('h4', {}, 'Citing jurisdictions'),
      jurisdictionsTable(c.jurisdictions),
    ]),
    el('div', { class: 'expanded-section' }, [
      el('h4', {}, 'Citations by year'),
      timelineSVG(c.yearly_citations),
      el('div', { class: 'timeline-legend' }, [
        el('span', { class: 'north' }, 'Global North'),
        el('span', { class: 'south' }, 'Global South'),
        el('span', { class: 'international' }, 'International'),
      ]),
    ]),
    el('div', { class: 'expanded-section full' }, [
      el('h4', {}, 'Citing decisions'),
      citingGroups(c.citing_cases),
    ]),
    el('button', {
      type: 'button',
      class: 'collapse-handle js-collapse',
      'aria-label': `Collapse ${c.name}`,
    }, 'Collapse ↑'),
  ]);

  card.appendChild(header);
  card.appendChild(summary);
  card.appendChild(bars);
  if (moreHint) card.appendChild(moreHint);
  card.appendChild(expanded);

  return card;
}

function svgIcon(d) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

// ---------- FLIP-driven expand/collapse ---------------------------------

let openId = null;
let grid = null;

function captureRects() {
  const rects = new Map();
  for (const card of $$('.catalytic-card', grid)) {
    rects.set(card.dataset.id, card.getBoundingClientRect());
  }
  return rects;
}

function flipReflow(prevRects) {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Soft reflow: just opacity-blink the affected siblings; no transform play.
    for (const card of $$('.catalytic-card', grid)) {
      card.animate(
        [{ opacity: 0.6 }, { opacity: 1 }],
        { duration: 180, easing: 'ease-out' },
      );
    }
    return;
  }
  // Read --dur and --ease-out from the design tokens so FLIP timing matches
  // the CSS max-height transition. Falls back to sensible defaults.
  const cs = getComputedStyle(document.documentElement);
  const dur = (cs.getPropertyValue('--dur') || '560ms').trim();
  const ease = (cs.getPropertyValue('--ease-out') || 'cubic-bezier(0.22, 1, 0.36, 1)').trim();
  const transition = `transform ${dur} ${ease}`;
  requestAnimationFrame(() => {
    for (const card of $$('.catalytic-card', grid)) {
      const prev = prevRects.get(card.dataset.id);
      if (!prev) continue;
      const next = card.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) continue;
      card.classList.add('is-animating');
      card.style.transform = `translate(${dx}px, ${dy}px)`;
      // Force layout to lock the transform start, then transition back.
      card.getBoundingClientRect();
      card.style.transition = transition;
      card.style.transform = '';
      card.addEventListener('transitionend', function done() {
        card.style.transition = '';
        card.classList.remove('is-animating');
        card.removeEventListener('transitionend', done);
      });
    }
  });
}

function setOpen(card, open) {
  const id = card.dataset.id;
  const titleBtn = card.querySelector('.case-title button');
  if (open) {
    card.classList.add('is-expanded');
    titleBtn.setAttribute('aria-expanded', 'true');
    openId = id;
  } else {
    card.classList.remove('is-expanded');
    titleBtn.setAttribute('aria-expanded', 'false');
    if (openId === id) openId = null;
  }
}

function toggleCard(card) {
  const prev = captureRects();
  const willOpen = !card.classList.contains('is-expanded');
  // Auto-close any currently-open sibling
  for (const other of $$('.catalytic-card.is-expanded', grid)) {
    if (other !== card) setOpen(other, false);
  }
  setOpen(card, willOpen);
  flipReflow(prev);
  // Sync URL
  const hash = willOpen ? `#/cases?open=${encodeURIComponent(card.dataset.id)}` : '#/cases';
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function openById(id) {
  if (!grid) return;
  const card = grid.querySelector(`.catalytic-card[data-id="${CSS.escape(id)}"]`);
  if (!card) return;
  if (card.classList.contains('is-expanded')) return;
  toggleCard(card);
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// ---------- Entry --------------------------------------------------------

export async function initCases() {
  grid = $('.js-catalytic-grid');
  if (!grid || grid.dataset.ready === '1') {
    document.dispatchEvent(new CustomEvent('cases:ready'));
    return;
  }
  let data;
  try {
    data = await fetchJSON('data/catalytic.json');
  } catch (e) {
    grid.innerHTML = `<p class="muted small">Could not load catalytic cases (${e.message}).</p>`;
    return;
  }
  for (const c of data) {
    const card = buildCard(c);
    grid.appendChild(card);
    card.addEventListener('click', (e) => {
      // Don't toggle when the user clicked the external link or interactive element.
      if (e.target.closest('a, button.js-collapse, .collapse-handle')) return;
      if (e.target.closest('button.case-title button')) {
        // explicit title button click — handled separately
        toggleCard(card);
        return;
      }
      // If they clicked anywhere on the card (header, summary, bars), treat as toggle.
      // But don't double-fire when the user clicks the title's <button> (covered above).
      const onTitleBtn = e.target.closest('.case-title');
      if (onTitleBtn) { toggleCard(card); return; }
      // For all other clicks inside the card, only toggle when collapsed
      // (so users can interact with expanded content without collapsing).
      if (!card.classList.contains('is-expanded')) toggleCard(card);
    });
    card.querySelector('.case-title button').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
    card.querySelectorAll('.js-collapse').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCard(card);
        card.querySelector('.case-title button').focus();
      });
    });
  }
  grid.dataset.ready = '1';

  document.addEventListener('cases:open', (e) => {
    openById(e.detail.id);
  });

  // Click anywhere OUTSIDE the expanded card collapses it.
  // - Inside the expanded card itself: keep open.
  // - On another card (collapsed): let the per-card handler swap the expansion.
  // - Anywhere else (grid gap, intro block, header, page background): collapse.
  document.addEventListener('click', (e) => {
    const open = grid.querySelector('.catalytic-card.is-expanded');
    if (!open) return;
    if (open.contains(e.target)) return;
    if (e.target.closest('.catalytic-card')) return;
    toggleCard(open);
  });

  // Pressing Escape also collapses the open card.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = grid.querySelector('.catalytic-card.is-expanded');
    if (open) {
      toggleCard(open);
      open.querySelector('.case-title button').focus();
    }
  });

  document.dispatchEvent(new CustomEvent('cases:ready'));
}
