'use strict';

(() => {
  const STORAGE_KEY = 'flashcard-flurry-site-theme';
  const MODES = ['system', 'light', 'dark'];
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function savedMode() {
    const value = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(value) ? value : 'system';
  }

  function initialMode() {
    const param = new URLSearchParams(window.location.search).get('clawpilotTheme');
    if (param === 'light' || param === 'dark') return param;
    return savedMode();
  }

  function resolvedTheme(mode) {
    return mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
  }

  function updateButtons(mode) {
    const labels = {
      system: ['◐', 'System'],
      light: ['☀', 'Light'],
      dark: ['☾', 'Dark'],
    };
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const [icon, label] = labels[mode];
      const iconEl = button.querySelector('[data-theme-icon]');
      const labelEl = button.querySelector('[data-theme-label]');
      if (iconEl) iconEl.textContent = icon;
      if (labelEl) labelEl.textContent = label;
      button.setAttribute('aria-label', `Theme: ${label}. Change theme`);
      button.title = `Theme: ${label}`;
    });
  }

  function applyMode(mode, persist = false) {
    const next = MODES.includes(mode) ? mode : 'system';
    document.documentElement.dataset.theme = resolvedTheme(next);
    document.documentElement.dataset.themeMode = next;
    if (persist) localStorage.setItem(STORAGE_KEY, next);
    updateButtons(next);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = getComputedStyle(document.documentElement)
        .getPropertyValue('--cp-bg')
        .trim();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyMode(initialMode());
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const current = document.documentElement.dataset.themeMode || savedMode();
        const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
        const url = new URL(window.location.href);
        if (url.searchParams.has('clawpilotTheme')) {
          url.searchParams.delete('clawpilotTheme');
          history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        }
        applyMode(next, true);
      });
    });
  });

  media.addEventListener('change', () => {
    if ((document.documentElement.dataset.themeMode || savedMode()) === 'system') {
      applyMode('system');
    }
  });
})();
