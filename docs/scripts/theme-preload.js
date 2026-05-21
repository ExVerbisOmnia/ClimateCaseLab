// theme-preload.js — runs inline BEFORE first paint to set data-theme on <html>
// so the page never flashes the wrong theme. Kept tiny on purpose.
(function () {
  try {
    var stored = localStorage.getItem('climatecaselab.theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {
    // localStorage can throw in some sandboxes. Fall back to system pref or light.
    var fallback = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', fallback);
  }
})();
