// map.js — Interactive Map uppertab.
//
// Loads D3 + TopoJSON lazily (vendored under scripts/lib/) the first time
// the user navigates into the map panel. After load, it draws a Natural Earth
// world map, a combobox for picking jurisdictions, a direction toggle,
// statistics, a connected-countries list, the citation flow arcs, and the
// cases pane on the right. URL state is mirrored in the hash.

import { $, $$, el, fetchJSON, debounce, formatCount, clamp } from './utils.js';

// ---------- Script loader -----------------------------------------------

const loadedScripts = new Map();
function loadScript(src) {
  if (loadedScripts.has(src)) return loadedScripts.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
  loadedScripts.set(src, p);
  return p;
}

// ---------- State -------------------------------------------------------

const state = {
  countries: [],            // [{name, region, lat, lon, ...}]
  countryByName: new Map(), // name -> country
  flows: [],                // [{id, source, target, count, ...}]
  cases: [],                // [{source_case_name, country, cited_cases, ...}]
  selection: new Set(),     // canonical names
  direction: 'in',          // 'in' | 'out'
  casesSearch: '',
  casesSort: 'citations',
  ready: false,
  // d3 + svg refs
  svg: null,
  width: 0, height: 0,
  projection: null,
  pathGen: null,
  zoom: null,
  zoomK: 1,
  countryFeaturesByName: new Map(),
  baseArcWidth: 2.2,
  baseMarkerR: 4,
};

const REGION_LABELS = {
  'Global North': 'NORTH',
  'Global South': 'SOUTH',
  International: 'INTL',
};

// ---------- Computation -------------------------------------------------

function flowsForSelection() {
  if (state.selection.size === 0) return [];
  const seen = new Set();
  const out = [];
  for (const flow of state.flows) {
    const matchesEndpoint = state.direction === 'in'
      ? state.selection.has(flow.target)
      : state.selection.has(flow.source);
    if (!matchesEndpoint) continue;
    if (seen.has(flow.id)) continue;
    seen.add(flow.id);
    out.push(flow);
  }
  return out;
}

function statsForFlows(flows) {
  const sel = state.selection;
  const totalCitations = flows.reduce((acc, f) => acc + f.count, 0);
  const otherCountries = new Set();
  let north = 0, south = 0;
  for (const f of flows) {
    const otherName = state.direction === 'in' ? f.source : f.target;
    if (!sel.has(otherName)) otherCountries.add(otherName);
    const otherRegion = state.direction === 'in' ? f.source_region : f.target_region;
    if (otherRegion === 'Global North') north += f.count;
    else if (otherRegion === 'Global South') south += f.count;
  }
  return {
    citations: totalCitations,
    countries: otherCountries.size,
    north,
    south,
    otherSet: otherCountries,
  };
}

function casesForFlows(flows) {
  // De-dup source-cases by name across all included flows.
  if (state.selection.size === 0) return [];
  const sel = state.selection;
  const dir = state.direction;
  const out = [];
  for (const c of state.cases) {
    // Inclusion rule: a source case is included if it cites OR is cited by
    // anything in the current selection per direction semantics.
    let include = false;
    if (dir === 'in') {
      // "Cited by selected": include source cases whose citing country produces
      // a flow into a selected target. Equivalently: case's source-country is
      // ANY country, and at least one of its cited cases has country ∈ selection.
      include = c.cited_cases.some(cc => sel.has(cc.country));
    } else {
      // "Cites from selected": include cases authored by a selected country.
      include = sel.has(c.source_case_country);
    }
    if (!include) continue;
    out.push(c);
  }
  return out;
}

// ---------- Land map ----------------------------------------------------

function ensureSize() {
  const wrap = $('.map-canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  state.width = rect.width;
  state.height = rect.height;
  state.svg.attr('viewBox', `0 0 ${state.width} ${state.height}`);
  if (state.projection) {
    const proj = d3.geoNaturalEarth1()
      .fitExtent([[18, 18], [state.width - 18, state.height - 18]], { type: 'Sphere' });
    state.projection = proj;
    state.pathGen = d3.geoPath(proj);
    redrawLand();
    redrawArcs();
  }
}

function drawLand(topology) {
  const land = topojson.feature(topology, topology.objects.countries);
  // Pre-bin features by their topojson properties.name for selection-class lookup.
  for (const f of land.features) {
    state.countryFeaturesByName.set(f.properties.name, f);
  }
  // Graticule
  const graticule = d3.geoGraticule10();
  state.svg.select('.graticule-layer').selectAll('path').remove();
  state.svg.select('.graticule-layer').append('path').attr('d', state.pathGen(graticule));
  // Land
  const sel = state.svg.select('.land-layer')
    .selectAll('path')
    .data(land.features, d => d.properties.name)
    .join('path')
    .attr('d', state.pathGen);
  sel.on('mouseenter', (event, d) => showTooltip(event, d.properties.name))
     .on('mousemove', moveTooltip)
     .on('mouseleave', hideTooltip)
     .on('click', (event, d) => {
       const name = canonicalize(d.properties.name);
       if (state.countryByName.has(name)) toggleCountry(name);
     });
}

function redrawLand() {
  if (!state.svg) return;
  state.svg.select('.land-layer').selectAll('path').attr('d', state.pathGen);
  state.svg.select('.graticule-layer').selectAll('path').attr('d', state.pathGen(d3.geoGraticule10()));
}

function applyLandClasses() {
  const implied = new Set();
  for (const f of flowsForSelection()) {
    const other = state.direction === 'in' ? f.source : f.target;
    if (!state.selection.has(other)) implied.add(other);
  }
  state.svg.select('.land-layer').selectAll('path')
    .classed('has-data', d => {
      const n = canonicalize(d.properties.name);
      return state.countryByName.has(n) && implied.has(n);
    })
    .classed('is-selected', d => state.selection.has(canonicalize(d.properties.name)));
}

// World-atlas uses the natural-earth English names. Some don't match our dataset.
const WORLD_ATLAS_RENAMES = {
  'United States of America': 'United States',
  'Czech Republic': 'Czechia',
  'Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
};

function canonicalize(name) {
  return WORLD_ATLAS_RENAMES[name] || name;
}

// ---------- Arcs --------------------------------------------------------

function arcPath(src, tgt) {
  const a = state.projection([src.lon, src.lat]);
  const b = state.projection([tgt.lon, tgt.lat]);
  if (!a || !b) return '';
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  // perpendicular offset proportional to distance — gives the arc its arc-ness.
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy);
  const off = Math.min(dist * 0.22, 160);
  const cx = mx - (dy / Math.max(dist, 1e-6)) * off;
  const cy = my + (dx / Math.max(dist, 1e-6)) * off;
  return `M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`;
}

function redrawArcs() {
  if (!state.svg) return;
  const flows = flowsForSelection();
  const maxCount = Math.max(1, ...flows.map(f => f.count));
  const widthScale = d3.scaleSqrt().domain([1, maxCount]).range([1.2, 5.6]);
  state.baseArcWidth = 1; // counter-scale handles k

  const sel = state.svg.select('.arc-layer')
    .selectAll('path')
    .data(flows, d => d.id);
  sel.exit().remove();
  const enter = sel.enter().append('path')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-linecap', 'round')
    .attr('marker-end', 'url(#arc-arrow)')
    .on('mouseenter', (e, d) => showTooltip(e, `${d.source}  →  ${d.target}  ·  ${formatCount(d.count)} citations`))
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip);
  const merged = enter.merge(sel);
  merged
    .attr('d', d => arcPath(state.countryByName.get(d.source), state.countryByName.get(d.target)))
    .attr('stroke-width', d => widthScale(d.count) / state.zoomK)
    .attr('opacity', 0.8);

  // Markers (origin dot per flow) — drawn under the arc
  const markerData = uniqueEndpoints(flows);
  const m = state.svg.select('.marker-layer')
    .selectAll('circle')
    .data(markerData, d => d.name);
  m.exit().remove();
  const mEnter = m.enter().append('circle')
    .attr('fill', d => d.role === 'selected' ? 'var(--accent-warm)' : 'currentColor')
    .attr('r', 0);
  mEnter.merge(m)
    .attr('cx', d => state.projection([d.lon, d.lat])[0])
    .attr('cy', d => state.projection([d.lon, d.lat])[1])
    .attr('fill', d => d.role === 'selected' ? 'var(--accent-warm)' : 'currentColor')
    .attr('r', state.baseMarkerR / state.zoomK);
}

function uniqueEndpoints(flows) {
  const map = new Map();
  for (const f of flows) {
    const sName = f.source, tName = f.target;
    for (const n of [sName, tName]) {
      const c = state.countryByName.get(n);
      if (!c) continue;
      const role = state.selection.has(n) ? 'selected' : 'other';
      if (!map.has(n) || (map.get(n).role !== 'selected' && role === 'selected')) {
        map.set(n, { name: n, lat: c.lat, lon: c.lon, role });
      }
    }
  }
  return [...map.values()];
}

// ---------- Tooltip -----------------------------------------------------

function showTooltip(event, content) {
  const tip = $('.map-tooltip');
  if (!tip) return;
  tip.textContent = content;
  tip.hidden = false;
  moveTooltip(event);
}
function moveTooltip(event) {
  const tip = $('.map-tooltip');
  if (!tip || tip.hidden) return;
  const wrap = $('.map-canvas-wrap').getBoundingClientRect();
  const offX = 15, offY = 15;
  let x = event.clientX - wrap.left + offX;
  let y = event.clientY - wrap.top + offY;
  // flip horizontally near right edge
  if (x + tip.offsetWidth + 12 > wrap.width) x = event.clientX - wrap.left - tip.offsetWidth - offX;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}
function hideTooltip() {
  const tip = $('.map-tooltip');
  if (tip) tip.hidden = true;
}

// ---------- Sidebar UI: combobox, chips, direction, stats, list --------

function renderChips() {
  const stack = $('.js-chips');
  stack.innerHTML = '';
  for (const name of [...state.selection].sort()) {
    const c = state.countryByName.get(name);
    const region = c ? c.region : '';
    const chip = el('span', { class: 'chip', dataset: { region }, role: 'option' }, [
      name,
      el('button', {
        type: 'button',
        class: 'chip-remove',
        'aria-label': `Remove ${name}`,
        onclick: () => toggleCountry(name),
      }, '×'),
    ]);
    stack.appendChild(chip);
  }
  const clear = $('.js-clear-countries');
  if (clear) clear.hidden = state.selection.size === 0;
}

function renderConnected() {
  const ul = $('.js-connected');
  ul.innerHTML = '';
  const flows = flowsForSelection();
  const byCountry = new Map();
  for (const f of flows) {
    const other = state.direction === 'in' ? f.source : f.target;
    if (state.selection.has(other)) continue;
    byCountry.set(other, (byCountry.get(other) || 0) + f.count);
  }
  const items = [...byCountry.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (items.length === 0) {
    ul.appendChild(el('li', { class: 'muted small', style: { padding: 'var(--sp-3) 0', gridColumn: '1 / -1' } }, [
      'No connected countries yet — pick a jurisdiction to begin.',
    ]));
    return;
  }
  for (const [name, count] of items) {
    const c = state.countryByName.get(name);
    const region = c ? c.region : 'International';
    const li = el('li', {
      dataset: { region },
      'aria-selected': 'false',
      tabIndex: 0,
      onclick: () => toggleCountry(name),
      onkeydown: (e) => { if (e.key === 'Enter') toggleCountry(name); },
    }, [
      el('span', { class: 'stripe' }),
      el('span', {}, name),
      el('span', { class: 'badge' }, formatCount(count)),
    ]);
    ul.appendChild(li);
  }
}

function renderStats() {
  const flows = flowsForSelection();
  const s = statsForFlows(flows);
  $('.js-stat-citations').textContent = formatCount(s.citations);
  $('.js-stat-countries').textContent = formatCount(s.countries);
  $('.js-stat-north').textContent = formatCount(s.north);
  $('.js-stat-south').textContent = formatCount(s.south);
  const total = s.north + s.south || 1;
  $('.js-stat-north-pct').textContent = s.citations ? `${Math.round((s.north / total) * 100)}%` : '';
  $('.js-stat-south-pct').textContent = s.citations ? `${Math.round((s.south / total) * 100)}%` : '';
  const live = $('.map-aria-live');
  if (live && state.selection.size) {
    const sel = [...state.selection].join(', ');
    const verb = state.direction === 'in' ? 'cited by' : 'citing';
    live.textContent = `Showing ${formatCount(s.citations)} citations ${verb} ${sel} across ${formatCount(s.countries)} other countries.`;
  } else if (live) {
    live.textContent = '';
  }
}

// ---------- Cases pane -------------------------------------------------

function renderCasesPane() {
  const list = $('.js-cases-list');
  const emptyHint = $('.js-cases-empty');
  const countLabel = $('.js-cases-count');
  list.innerHTML = '';
  if (state.selection.size === 0) {
    emptyHint.hidden = false;
    countLabel.textContent = '';
    return;
  }
  emptyHint.hidden = true;
  const flows = flowsForSelection();
  const totalCitations = flows.reduce((a, f) => a + f.count, 0);
  let cases = casesForFlows(flows);
  const q = state.casesSearch.trim().toLowerCase();
  if (q) {
    cases = cases.filter(c => {
      const blob = [c.source_case_name, c.source_case_country, ...(c.cited_cases || []).map(cc => `${cc.name} ${cc.country}`)].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }
  const sort = state.casesSort;
  cases = [...cases].sort((a, b) => {
    if (sort === 'name') return a.source_case_name.localeCompare(b.source_case_name);
    if (sort === 'year') {
      const ay = Math.max(0, ...(a.cited_cases || []).map(c => c.year || 0));
      const by = Math.max(0, ...(b.cited_cases || []).map(c => c.year || 0));
      return by - ay;
    }
    // citation count = number of relevant cited cases (filtered by direction selection)
    return countRelevant(b) - countRelevant(a);
  });

  countLabel.textContent = `${formatCount(cases.length)} cases · ${formatCount(totalCitations)} citations`;

  if (cases.length === 0) {
    list.appendChild(el('div', { class: 'cases-empty' },
      'No cases match the current filter. Try clearing the search box or another jurisdiction.'));
    return;
  }

  for (const c of cases) {
    const li = el('li', { class: 'case-card' });
    const titleRow = el('div', { class: 'case-card-title' }, [
      c.source_case_url
        ? el('a', { href: c.source_case_url, target: '_blank', rel: 'noopener' }, c.source_case_name)
        : el('span', {}, c.source_case_name),
    ]);
    const meta = el('div', { class: 'case-card-meta' }, [
      el('span', { class: 'tag', dataset: { region: c.source_case_region || 'International' } }, c.source_case_country || 'Unknown'),
      el('span', { class: 'tag' }, REGION_LABELS[c.source_case_region] || c.source_case_region),
      el('span', { class: 'tag' }, `${countRelevant(c)} citations`),
    ]);
    const cited = c.cited_cases || [];
    const relevantCited = cited.filter(cc => isRelevantCited(c, cc));
    const ul = el('ul', { class: 'case-cited-list' });
    for (const cc of relevantCited.slice(0, 6)) {
      const item = el('li', {});
      if (cc.url) item.appendChild(el('a', { href: cc.url, target: '_blank', rel: 'noopener' }, cc.name));
      else item.appendChild(el('span', {}, cc.name));
      if (cc.country) item.appendChild(el('span', { class: 'mono', style: { color: 'var(--text-muted)', marginLeft: 'var(--sp-2)' } }, `${cc.country}${cc.year ? ` · ${cc.year}` : ''}`));
      ul.appendChild(item);
    }
    if (relevantCited.length > 6) {
      ul.appendChild(el('li', { class: 'small', style: { color: 'var(--text-muted)' } }, `+${relevantCited.length - 6} more`));
    }
    li.appendChild(titleRow);
    li.appendChild(meta);
    li.appendChild(ul);
    list.appendChild(li);
  }
}

function isRelevantCited(parent, citedCase) {
  if (state.selection.size === 0) return true;
  if (state.direction === 'in') return state.selection.has(citedCase.country);
  return state.selection.has(parent.source_case_country);
}
function countRelevant(parent) {
  return (parent.cited_cases || []).filter(cc => isRelevantCited(parent, cc)).length;
}

// ---------- Combobox ---------------------------------------------------

function setupCombobox() {
  const input = $('.combobox-input');
  const menu = $('.combobox-menu');
  const combobox = $('.combobox');
  function open() { menu.hidden = false; combobox.setAttribute('aria-expanded', 'true'); }
  function close() { menu.hidden = true; combobox.setAttribute('aria-expanded', 'false'); }
  function refresh() {
    const q = input.value.trim().toLowerCase();
    menu.innerHTML = '';
    const items = state.countries
      .filter(c => c.incoming_total > 0 || c.outgoing_total > 0)
      .filter(c => !state.selection.has(c.name))
      .filter(c => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 40);
    if (items.length === 0) {
      menu.appendChild(el('li', { class: 'muted small', style: { padding: 'var(--sp-2) var(--sp-3)' } }, 'No matches'));
      return;
    }
    for (const c of items) {
      menu.appendChild(el('li', {
        role: 'option',
        dataset: { name: c.name },
        onclick: () => { addCountry(c.name); input.value = ''; refresh(); input.focus(); },
      }, [
        el('span', {}, c.name),
        el('span', { class: 'region-pill' }, REGION_LABELS[c.region] || c.region),
      ]));
    }
  }
  input.addEventListener('focus', () => { open(); refresh(); });
  input.addEventListener('input', refresh);
  input.addEventListener('blur', () => setTimeout(close, 120)); // give clicks time to register
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; close(); }
    else if (e.key === 'ArrowDown') {
      const first = menu.querySelector('li[role="option"]');
      if (first) first.focus();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const first = menu.querySelector('li[role="option"]');
      if (first) { first.click(); }
      e.preventDefault();
    }
  });
  refresh();
  $('.js-clear-countries').addEventListener('click', () => {
    state.selection.clear();
    sync();
  });
}

// ---------- Direction toggle + legend ----------------------------------

function setupDirectionToggle() {
  $$('.direction-toggle button').forEach(btn => {
    btn.addEventListener('click', () => setDirection(btn.dataset.dir));
  });
  $$('.legend-row').forEach(btn => {
    btn.addEventListener('click', () => setDirection(btn.dataset.dir));
  });
}

function setDirection(dir) {
  if (state.direction === dir) return;
  state.direction = dir;
  document.querySelector('.map-canvas-wrap').dataset.flowDir = dir;
  $$('.direction-toggle button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.dir === dir)));
  $$('.legend-row').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dir === dir)));
  sync();
}

// ---------- Zoom -------------------------------------------------------

function setupZoom() {
  state.zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', (event) => {
    state.zoomK = event.transform.k;
    state.svg.select('.land-layer').attr('transform', event.transform);
    state.svg.select('.graticule-layer').attr('transform', event.transform);
    state.svg.select('.arc-layer').attr('transform', event.transform);
    state.svg.select('.marker-layer').attr('transform', event.transform);
    // Counter-scale strokes so visual thickness stays constant.
    state.svg.select('.arc-layer').selectAll('path')
      .attr('stroke-width', d => {
        const max = Math.max(1, ...flowsForSelection().map(f => f.count));
        return d3.scaleSqrt().domain([1, max]).range([1.2, 5.6])(d.count) / state.zoomK;
      });
    state.svg.select('.marker-layer').selectAll('circle')
      .attr('r', state.baseMarkerR / state.zoomK);
    state.svg.select('.land-layer').selectAll('path')
      .attr('vector-effect', 'non-scaling-stroke');
  });
  state.svg.call(state.zoom);
  $('.js-zoom-in').addEventListener('click', () => state.svg.transition().duration(220).call(state.zoom.scaleBy, 1.6));
  $('.js-zoom-out').addEventListener('click', () => state.svg.transition().duration(220).call(state.zoom.scaleBy, 1 / 1.6));
  $('.js-zoom-reset').addEventListener('click', () => state.svg.transition().duration(280).call(state.zoom.transform, d3.zoomIdentity));
  window.addEventListener('keydown', (e) => {
    // Only when map panel is the active uppertab and not inside an input.
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
    const panel = $('.uppertab-panel[data-panel="map"]');
    if (!panel || panel.hasAttribute('hidden')) return;
    if (e.key === '+' || e.key === '=') { state.svg.transition().duration(180).call(state.zoom.scaleBy, 1.6); e.preventDefault(); }
    else if (e.key === '-' || e.key === '_') { state.svg.transition().duration(180).call(state.zoom.scaleBy, 1 / 1.6); e.preventDefault(); }
    else if (e.key === '0') { state.svg.transition().duration(180).call(state.zoom.transform, d3.zoomIdentity); e.preventDefault(); }
  });
}

// ---------- N/S explainer popover --------------------------------------

const NS_COPY = {
  north: {
    title: 'Global North',
    body: 'A working category covering high-income, industrialised states — typically Western Europe, the United States, Canada, Australia, New Zealand, Japan, and South Korea.',
  },
  south: {
    title: 'Global South',
    body: 'A working category covering low- and middle-income states whose colonial and post-colonial histories produce structural disadvantages in international institutions — typically Latin America, Africa, much of Asia, and the Caribbean.',
  },
};
const NS_CITATION_HTML = 'Source: Dados, R. & Connell, R. (2012). “The Global South”. <em>Contexts</em>, 11(1), 12–13. <a href="https://doi.org/10.1177/1536504212436479" target="_blank" rel="noopener">doi.org/10.1177/1536504212436479</a>.';

function setupExplainer() {
  const popover = $('#ns-explainer-popover');
  function showFor(btn) {
    const region = btn.dataset.region;
    const def = NS_COPY[region];
    if (!def) return;
    popover.innerHTML = '';
    popover.appendChild(el('h4', {}, def.title));
    popover.appendChild(el('p', {}, def.body));
    popover.appendChild(el('cite', { html: NS_CITATION_HTML }));
    popover.appendChild(el('p', { class: 'small', style: { marginTop: 'var(--sp-3)', color: 'var(--text-muted)' } }, [
      'These are working categories. The full discussion lives in the ',
      el('a', { href: '#/landing/methodology' }, 'Methodology'),
      ' section.',
    ]));
    const r = btn.getBoundingClientRect();
    popover.style.left = Math.min(window.innerWidth - 320, r.left) + 'px';
    popover.style.top = (r.bottom + 8) + 'px';
    popover.hidden = false;
    requestAnimationFrame(() => popover.classList.add('is-visible'));
  }
  function hide() {
    popover.classList.remove('is-visible');
    setTimeout(() => { popover.hidden = true; }, 200);
  }
  $$('.ns-explainer').forEach(btn => {
    btn.addEventListener('mouseenter', () => showFor(btn));
    btn.addEventListener('focus', () => showFor(btn));
    btn.addEventListener('mouseleave', hide);
    btn.addEventListener('blur', hide);
  });
  // Close on Escape from anywhere in the map panel.
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
}

// ---------- State updates ----------------------------------------------

function toggleCountry(name) {
  if (state.selection.has(name)) state.selection.delete(name);
  else state.selection.add(name);
  sync();
}
function addCountry(name) {
  state.selection.add(name);
  sync();
}

function pushHash() {
  const dir = state.direction === 'in' ? 'incoming' : 'outgoing';
  const country = [...state.selection].join('|');
  let url = '#/map';
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  if (dir !== 'incoming') params.set('dir', dir);
  const q = params.toString();
  if (q) url += '?' + q;
  if (location.hash !== url) history.replaceState(null, '', url);
}

function readHash(params) {
  if (params.country) {
    state.selection = new Set(params.country.split('|').filter(Boolean));
  }
  if (params.dir === 'outgoing') {
    state.direction = 'out';
    document.querySelector('.map-canvas-wrap').dataset.flowDir = 'out';
    $$('.direction-toggle button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.dir === 'out')));
    $$('.legend-row').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dir === 'out')));
  }
  sync();
}

function sync() {
  renderChips();
  renderStats();
  renderConnected();
  renderCasesPane();
  applyLandClasses();
  redrawArcs();
  pushHash();
}

// ---------- Cases pane controls ----------------------------------------

function setupCasesPaneControls() {
  $('.js-cases-search').addEventListener('input', debounce(e => {
    state.casesSearch = e.target.value;
    renderCasesPane();
  }, 200));
  $('.js-cases-sort').addEventListener('change', e => {
    state.casesSort = e.target.value;
    renderCasesPane();
  });
}

// ---------- Init -------------------------------------------------------

export async function initMap() {
  if (state.ready) {
    document.dispatchEvent(new CustomEvent('map:ready'));
    return;
  }
  // Lazy-load D3 + TopoJSON
  await Promise.all([
    loadScript('scripts/lib/d3.v7.min.js'),
    loadScript('scripts/lib/topojson.v3.min.js'),
  ]);

  const [countries, flows, cases, topology] = await Promise.all([
    fetchJSON('data/countries.json'),
    fetchJSON('data/flows.json'),
    fetchJSON('data/cases.json'),
    fetchJSON('data/world-110m.json'),
  ]);
  state.countries = countries;
  state.flows = flows;
  state.cases = cases;
  for (const c of countries) state.countryByName.set(c.name, c);

  // Set up the svg.
  const svgNode = document.getElementById('map-canvas');
  state.svg = d3.select(svgNode);
  const wrap = $('.map-canvas-wrap');
  wrap.dataset.flowDir = state.direction;
  const rect = wrap.getBoundingClientRect();
  state.width = rect.width || 800;
  state.height = rect.height || 600;
  state.svg.attr('viewBox', `0 0 ${state.width} ${state.height}`).attr('preserveAspectRatio', 'xMidYMid meet');
  state.projection = d3.geoNaturalEarth1()
    .fitExtent([[18, 18], [state.width - 18, state.height - 18]], { type: 'Sphere' });
  state.pathGen = d3.geoPath(state.projection);

  drawLand(topology);
  setupCombobox();
  setupDirectionToggle();
  setupZoom();
  setupExplainer();
  setupCasesPaneControls();

  state.ready = true;
  // Initial render (empty selection → empty state).
  sync();

  // React to resize.
  window.addEventListener('resize', debounce(ensureSize, 150));

  document.addEventListener('map:hashstate', (e) => readHash(e.detail || {}));

  document.dispatchEvent(new CustomEvent('map:ready'));
}
