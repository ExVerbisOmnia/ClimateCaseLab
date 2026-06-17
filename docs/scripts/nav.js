// nav.js — uppertab + subtab navigation with hash routing.
// URL shape (from spec §2.6):
//   #/                       → Landing → About
//   #/landing/methodology    → Landing, scrolled to Methodology
//   #/landing/collaboration  → Landing, scrolled to Collaboration
//   #/map                    → Interactive Map
//   #/cases                  → Catalytic Cases
//   #/map?country=Brazil&dir=outgoing
//   #/cases?open=urgenda

import { $, $$ } from './utils.js';

export const PANELS = ['landing', 'map', 'cases'];
const SUBTABS = ['about', 'methodology', 'acknowledgements', 'collaboration'];

const listeners = new Set();
let current = { panel: 'landing', subtab: 'about', params: {} };

function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  if (!raw) return { panel: 'landing', subtab: 'about', params: {} };
  const [path, query = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean);
  const panel = PANELS.includes(segments[0]) ? segments[0] : 'landing';
  let subtab = 'about';
  if (panel === 'landing' && segments[1] && SUBTABS.includes(segments[1])) {
    subtab = segments[1];
  }
  const params = {};
  if (query) {
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (!k) continue;
      params[decodeURIComponent(k)] = v == null ? '' : decodeURIComponent(v);
    }
  }
  return { panel, subtab, params };
}

function serialize(state) {
  let url = '#/' + state.panel;
  if (state.panel === 'landing' && state.subtab && state.subtab !== 'about') {
    url += '/' + state.subtab;
  }
  const entries = Object.entries(state.params || {}).filter(([, v]) => v !== '' && v != null);
  if (entries.length) {
    url += '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }
  return url;
}

function emit() {
  for (const fn of listeners) fn(current);
}

let suppressObserver = 0;
export function isObserverSuppressed() { return suppressObserver > 0; }
function suppressObserverFor(ms) {
  suppressObserver += 1;
  setTimeout(() => { suppressObserver -= 1; }, ms);
}

function applyPanel(panel, opts = {}) {
  const idx = PANELS.indexOf(panel);
  if (idx < 0) return;
  document.documentElement.style.setProperty('--track-offset', `-${idx * 100}vw`);
  $$('.uppertab-bar button').forEach(btn => {
    btn.setAttribute('aria-selected', String(btn.dataset.panel === panel));
    btn.tabIndex = btn.dataset.panel === panel ? 0 : -1;
  });
  // Keep all panels rendered (flex track requires them all to stay in flow),
  // but mark non-active ones inert so they don't trap focus or screen readers.
  $$('.uppertab-panel').forEach(p => {
    const isActive = p.dataset.panel === panel;
    p.removeAttribute('hidden');
    if (isActive) {
      p.removeAttribute('inert');
      p.removeAttribute('aria-hidden');
    } else {
      p.setAttribute('inert', '');
      p.setAttribute('aria-hidden', 'true');
    }
  });
  if (panel === 'landing' && opts.subtab) {
    applySubtab(opts.subtab, opts.scroll !== false);
  }
}

function applySubtab(subtab, scroll = true) {
  $$('.subtab-bar button').forEach(btn => {
    btn.setAttribute('aria-current', String(btn.dataset.subtab === subtab));
  });
  if (scroll) {
    const panel = $('.uppertab-panel[data-panel="landing"]');
    const target = $(`#section-${subtab}`, panel);
    if (target && panel) {
      suppressObserverFor(400);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function navigate(state, { push = true } = {}) {
  current = { ...current, ...state };
  if (push) {
    const url = serialize(current);
    if (url !== location.hash) {
      history.pushState(null, '', url);
    }
  }
  applyPanel(current.panel, { subtab: current.subtab });
  emit();
}

export function onNavigate(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function go(target) {
  navigate(typeof target === 'string' ? parseHashLike(target) : target);
}

export function getState() { return { ...current }; }

function parseHashLike(s) {
  const tmp = location.hash;
  location.hash = s;
  const parsed = parseHash();
  location.hash = tmp;
  return parsed;
}

export function initNav() {
  // Wire uppertab buttons.
  $$('.uppertab-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate({ panel: btn.dataset.panel, subtab: 'about', params: {} });
    });
    btn.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = PANELS.indexOf(btn.dataset.panel);
      const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + PANELS.length) % PANELS.length;
      const target = $(`.uppertab-bar button[data-panel="${PANELS[next]}"]`);
      if (target) {
        target.focus();
        navigate({ panel: PANELS[next], subtab: 'about', params: {} });
      }
      e.preventDefault();
    });
  });

  // Wire subtab buttons.
  $$('.subtab-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate({ panel: 'landing', subtab: btn.dataset.subtab, params: current.params });
    });
  });

  // Scroll-spy.
  const panel = $('.uppertab-panel[data-panel="landing"]');
  if (panel && 'IntersectionObserver' in window) {
    const sections = SUBTABS.map(s => $(`#section-${s}`, panel)).filter(Boolean);
    if (sections.length) {
      const io = new IntersectionObserver(entries => {
        if (isObserverSuppressed()) return;
        let bestId = null;
        let bestRatio = 0;
        for (const e of entries) {
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            bestId = e.target.id;
          }
        }
        if (!bestId) return;
        const subtab = bestId.replace(/^section-/, '');
        if (subtab !== current.subtab) {
          current.subtab = subtab;
          $$('.subtab-bar button').forEach(btn => {
            btn.setAttribute('aria-current', String(btn.dataset.subtab === subtab));
          });
          if (current.panel === 'landing') {
            const url = serialize(current);
            if (url !== location.hash) history.replaceState(null, '', url);
          }
        }
      }, {
        root: panel,
        rootMargin: '-72px 0px -65% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });
      sections.forEach(s => io.observe(s));
    }
  }

  // React to back/forward.
  window.addEventListener('hashchange', () => {
    const next = parseHash();
    if (next.panel === current.panel && next.subtab === current.subtab) return;
    navigate(next, { push: false });
  });
  window.addEventListener('popstate', () => navigate(parseHash(), { push: false }));

  // Initial.
  navigate(parseHash(), { push: false });
}
