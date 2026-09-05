/* One renderer per block type. Each returns an HTML string.
   All author text goes through mdlite so nothing is injected raw. */

import { inline, paragraphs, escapeHtml, math } from './mdlite.js?v=20260905195433';

const CHEV = '<svg class="chev" width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true"><path d="M2 1l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Deliberately small highlighter: comments, strings, numbers, keywords.
   Order matters - comments and strings are consumed first so their
   contents are never re-tokenised. */
const S = String.fromCharCode(1);
const KEYWORDS = /\b(function|const|let|var|return|if|else|for|while|class|import|from|export|def|print|new|await|async|true|false|null|None|True|False)\b/g;
// Placeholder is padded with letters so the number/keyword passes below
// cannot match the index inside it (no \b boundary between H and a digit).
const HELD_RE = new RegExp(S + 'H(\\d+)Z' + S, 'g');

function highlight(code) {
  const held = [];
  const hold = (cls, txt) => {
    held.push('<span class="tok-' + cls + '">' + escapeHtml(txt) + '</span>');
    return S + 'H' + (held.length - 1) + 'Z' + S;
  };

  let s = String(code)
    .replace(/(#[^\n]*|\/\/[^\n]*)/g, m => hold('c', m))
    .replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, m => hold('s', m));

  s = escapeHtml(s)
    .replace(KEYWORDS, '<span class="tok-k">$1</span>')
    .replace(/\b(0x[0-9a-fA-F]+|\d+)\b/g, '<span class="tok-n">$1</span>');

  return s.replace(HELD_RE, (m, i) => held[+i]);
}

const R = {
  prose(b) {
    let h = '';
    if (b.eyebrow) h += '<h3>' + inline(b.eyebrow) + '</h3>';
    if (b.heading) h += '<h2>' + inline(b.heading) + '</h2>';
    if (b.text) h += paragraphs(b.text);
    return '<div class="b-prose">' + h + '</div>';
  },

  visual(b, ctx) {
    const svg = ctx.svg(b.src);
    const art = svg
      ? '<div class="art" role="img" aria-label="' + escapeHtml(b.alt || '') + '">' + svg + '</div>'
      : '<div class="art empty">' + escapeHtml(b.alt || 'missing visual') + '</div>';
    const cap = b.caption ? '<figcaption>' + inline(b.caption) + '</figcaption>' : '';
    return '<div class="b-visual"><figure>' + art + cap + '</figure></div>';
  },

  formula(b) {
    const cap = b.caption ? '<figcaption>' + inline(b.caption) + '</figcaption>' : '';
    return '<figure class="b-visual" style="margin:0"><div class="b-formula">' + math(b.tex, true) + '</div>' + cap + '</figure>';
  },

  code(b) {
    const lbl = b.label ? '<span class="lbl">' + escapeHtml(b.label) + '</span>' : '';
    return '<div class="b-code">' + lbl + '<pre><code>' + highlight(b.code) + '</code></pre></div>';
  },

  table(b) {
    const cols = b.columns || [];
    const head = '<thead><tr>' + cols.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>';
    // data-label carries the column name so narrow screens can restack
    // each row as a labelled card instead of scrolling sideways.
    const body = '<tbody>' + (b.rows || []).map(r =>
      '<tr>' + r.map((cell, i) =>
        '<td data-label="' + escapeHtml(String(cols[i] || '').replace(/[*_`]/g, '')) + '">'
        + inline(cell) + '</td>').join('') + '</tr>').join('') + '</tbody>';
    const cap = b.caption ? '<caption>' + inline(b.caption) + '</caption>' : '';
    // Two-column tables are figure lists, not comparisons: they fit as-is on a
    // phone, and restacking them as cards just repeats the header four times.
    return '<div class="b-table" data-cols="' + cols.length + '"><div class="scroller"><table>'
      + head + body + '</table></div>' + cap + '</div>';
  },

  callout(b) {
    const tone = ['key', 'note', 'warning', 'gotcha'].includes(b.tone) ? b.tone : 'key';
    const lbl = b.title ? '<span class="lbl">' + inline(b.title) + '</span>' : '';
    return '<div class="b-callout" data-tone="' + tone + '">' + lbl + paragraphs(b.text) + '</div>';
  },

  steps(b) {
    const items = (b.items || []).map(it => {
      const title = it.title ? '<b>' + inline(it.title) + '</b><br>' : '';
      return '<li>' + title + inline(it.text) + '</li>';
    }).join('');
    return '<div class="b-steps"><ol>' + items + '</ol></div>';
  },

  reveal(b, ctx) {
    return '<details class="b-reveal">'
      + '<summary><div class="q">' + inline(b.question) + '</div>'
      + '<div class="cue">' + CHEV + '<span>' + ctx.t('reveal') + '</span></div></summary>'
      + '<div class="a">' + paragraphs(b.answer) + '</div>'
      + '</details>';
  },

  sources(b, ctx) {
    const items = (b.items || []).map(s => {
      const label = s.url
        ? '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.title) + '</a>'
        : escapeHtml(s.title);
      return '<li>' + label + (s.note ? ' &mdash; ' + inline(s.note) : '') + '</li>';
    }).join('');
    return '<div class="b-sources"><span class="lbl">' + ctx.t('sources') + '</span><ol>' + items + '</ol></div>';
  }
};

export function renderBlock(block, ctx, i) {
  const fn = R[block.type];
  if (!fn) { console.warn('unknown block type:', block.type); return ''; }
  return '<div data-anim style="--i:' + i + '">' + fn(block, ctx) + '</div>';
}

export function renderScreen(screen, ctx) {
  const blocks = (screen.blocks || []).map((b, i) => renderBlock(b, ctx, i)).join('');
  const kind = screen.kind ? ' data-kind="' + escapeHtml(screen.kind) + '"' : '';
  return '<section class="screen"' + kind + '><div class="wrap">' + blocks + '</div></section>';
}
