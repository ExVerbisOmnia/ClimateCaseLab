// main.js — bootstrap. Wires theme toggle, navigation, and lazy-loads heavy modules.

import { $, $$ } from './utils.js';
import { initNav, onNavigate, getState } from './nav.js';

// --- Theme toggle ---------------------------------------------------------
function initTheme() {
  const btn = $('.theme-toggle');
  if (!btn) return;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const stored = () => localStorage.getItem('climatecaselab.theme');
  function apply(theme, { persist = false } = {}) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem('climatecaselab.theme', theme);
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  // Follow OS pref live unless the user has set a preference.
  mql.addEventListener('change', e => {
    if (!stored()) apply(e.matches ? 'dark' : 'light');
  });
  btn.addEventListener('click', () => {
    const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    apply(next, { persist: true });
  });
  apply(document.documentElement.getAttribute('data-theme') || (mql.matches ? 'dark' : 'light'));
}

// --- Lazy module loading -------------------------------------------------
const loadedPanels = new Set();
async function ensurePanelLoaded(panel) {
  if (loadedPanels.has(panel)) return;
  loadedPanels.add(panel);
  try {
    if (panel === 'cases') {
      const mod = await import('./cases.js');
      await mod.initCases();
    } else if (panel === 'map') {
      const mod = await import('./map.js');
      await mod.initMap();
    } else if (panel === 'landing') {
      const mod = await import('./landing.js');
      await mod.initLanding();
    }
  } catch (e) {
    loadedPanels.delete(panel);
    console.error(`[climatecaselab] failed to load ${panel}:`, e);
  }
}

// --- Bootstrap -----------------------------------------------------------
async function bootstrap() {
  initTheme();

  // Subscribe BEFORE initNav so the initial navigate() emit triggers loading.
  onNavigate(({ panel, params }) => {
    ensurePanelLoaded(panel).then(() => {
      // Re-hand params after load so deep links work.
      if (panel === 'cases' && params.open) {
        document.dispatchEvent(new CustomEvent('cases:open', { detail: { id: params.open } }));
      } else if (panel === 'map') {
        document.dispatchEvent(new CustomEvent('map:hashstate', { detail: params }));
      }
    });
  });

  // Landing always loads on first paint (it's the default view, and other
  // entry points benefit from its content being ready when the user comes back).
  ensurePanelLoaded('landing');

  initNav();
  document.body.classList.add('is-booted');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
