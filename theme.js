(() => {
  const storageKey = '408-color-scheme';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const validTheme = value => value === 'light' || value === 'dark';
  let preference = null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (validTheme(saved)) preference = saved;
  } catch {
    // The toggle still works when browser storage is unavailable.
  }

  const preferredTheme = () => preference ?? (systemTheme.matches ? 'dark' : 'light');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#212833' : '#f1f4f8';
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    button.hidden = false;
    button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    button.querySelector('[data-theme-label]').textContent = nextTheme === 'dark' ? 'Dark mode' : 'Light mode';
  }

  // Run before the stylesheet paints so a saved dark theme never flashes light.
  applyTheme(preferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(preferredTheme());
    document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // Keep the choice for this page even if it cannot be saved.
      }
    });
  });

  systemTheme.addEventListener('change', () => {
    if (!preference) applyTheme(preferredTheme());
  });

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validTheme(event.newValue) ? event.newValue : null;
    applyTheme(preferredTheme());
  });
})();
