/* Theme: system, light, or dark.

   Three states, not two. "System" is the default and follows the phone, which
   on iOS means the app dims itself at sunset along with everything else; the
   toggle only overrides that once the reader asks. The choice lives in
   localStorage under one key, and index.html applies it inline before first
   paint so the dark theme never flashes white on the way in. */

const KEY = 'educarlos:theme';

/* Light first, and light by default: a reader who has never touched the
   toggle gets the paper theme the icon promises, whatever the phone is set
   to. "System" is the third stop, for anyone who wants the app to follow the
   phone after all. */
const ORDER = ['light', 'dark', 'system'];
const DEFAULT = 'light';

/* Painted behind the status bar and in the iOS app switcher. Matches --bg. */
const BAR = { light: '#fbfbfa', dark: '#0b0d10' };

export function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return ORDER.includes(v) ? v : DEFAULT;
  } catch { return DEFAULT; }
}

/* What the reader actually sees, once "system" is resolved. */
export function effective(pref = stored()) {
  if (pref !== 'system') return pref;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function apply(pref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BAR[effective(pref)]);
}

export function set(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* private mode: this session only */ }
  apply(pref);
}

/* light -> dark -> system -> light. Cycling beats a binary switch here: it
   keeps "follow the phone" reachable instead of stranding the reader on
   whichever side they last tapped. */
export function next(pref = stored()) {
  return ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
}

const ICON = {
  /* A circle half filled: the app taking the phone's side, whichever it is. */
  system: '<circle cx="10" cy="10" r="6.4" fill="none"/>'
        + '<path d="M10 3.6a6.4 6.4 0 0 1 0 12.8z"/>',
  light:  '<circle cx="10" cy="10" r="4"/>'
        + '<path d="M10 1.7v1.9M10 16.4v1.9M1.7 10h1.9M16.4 10h1.9M4.2 4.2l1.35 1.35'
        + 'M14.45 14.45l1.35 1.35M15.8 4.2l-1.35 1.35M5.55 14.45L4.2 15.8" fill="none"/>',
  dark:   '<path d="M15.6 12.4A6.6 6.6 0 0 1 7.6 4.4a6.8 6.8 0 1 0 8 8z"/>'
};

const LABEL = {
  en: { system: 'System theme', light: 'Light theme', dark: 'Dark theme' },
  es: { system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' }
};

/* Rendered as a string so every view can drop it into its own markup; one
   delegated listener in main.js does the switching. */
export function button(lang = 'en') {
  const pref = stored();
  const label = (LABEL[lang] || LABEL.en)[pref];
  return '<button class="theme-toggle" data-theme-toggle type="button"'
    + ' aria-label="' + label + '" title="' + label + '">'
    + '<svg viewBox="0 0 20 20" aria-hidden="true">' + ICON[pref] + '</svg></button>';
}

/* Repaint every mounted toggle after a change, without re-rendering the view. */
export function refreshButtons(lang = 'en') {
  const pref = stored();
  const label = (LABEL[lang] || LABEL.en)[pref];
  for (const el of document.querySelectorAll('[data-theme-toggle]')) {
    el.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true">' + ICON[pref] + '</svg>';
    el.setAttribute('aria-label', label);
    el.setAttribute('title', label);
    el.classList.remove('spun');
    void el.offsetWidth;          // restart the spin on every tap
    el.classList.add('spun');
  }
}

/* Following the phone means following it as it changes, mid-session. */
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (stored() === 'system') apply('system');
});
