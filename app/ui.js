/* Chrome shared by the course views and the pattern views: the icons, the
   progress ring, and the view-transition naming rule. Kept out of main.js so
   patterns.js can use it without importing the router that mounts it. */

import { escapeHtml } from './mdlite.js?v=20260905195950';

export const BACK_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3L5 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const GO_ICON = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M7 3l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const TICK = '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M6 13.5l5 5L20 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Drawn empty, with its target parked in a data attribute: fillRings() lets
   the browser paint the empty state once, then hands over the real value, and
   the CSS transition sweeps the arc round. Progress you watch arrive reads as
   yours in a way a static arc never does. */
export function ring(pct, label) {
  const r = 19, c = 2 * Math.PI * r;
  return '<svg class="ring" viewBox="0 0 46 46" aria-hidden="true">'
    + '<circle class="track" cx="23" cy="23" r="' + r + '"/>'
    + '<circle class="fill" cx="23" cy="23" r="' + r + '" stroke-dasharray="' + c
    + '" stroke-dashoffset="' + c + '" data-to="' + (c * (1 - pct))
    + '" transform="rotate(-90 23 23)"/>'
    + '<text x="23" y="23" text-anchor="middle" dominant-baseline="central">' + escapeHtml(label) + '</text></svg>';
}

export function fillRings(root = document) {
  const arcs = [...root.querySelectorAll('.ring .fill[data-to]')];
  if (!arcs.length) return;
  requestAnimationFrame(() => {
    for (const a of arcs) { a.style.strokeDashoffset = a.dataset.to; delete a.dataset.to; }
  });
}

/* View-transition names must be CSS idents and must be unique on the page.
   Deriving them from the id keeps the same element paired across two views,
   which is what makes the badge fly and the title settle instead of both
   just cross-fading. */
export function vtName(prefix, id) {
  return prefix + '-' + String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
