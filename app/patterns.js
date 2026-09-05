/* Patterns: things you make with your hands, not things you read.

   A course is read once, in order, with both eyes. A crochet pattern is
   worked over days with a hook in one hand, glanced at every twenty seconds,
   and the only questions it ever has to answer are "which round am I on" and
   "what does it say". So this half of the app inverts the lesson player:
   nothing scrolls, one round fills the screen, and the whole screen is the
   button that advances it.

     #/p/:patternId              the object - materials, stitches, pieces
     #/p/:patternId/t/:pieceId   the workshop - one round at a time          */

import { inline, escapeHtml } from './mdlite.js?v=202609051941';
import { t } from './i18n.js?v=202609051941';
import * as P from './progress.js?v=202609051941';
import * as Theme from './theme.js?v=202609051941';
import { BACK_ICON, TICK, ring, fillRings, vtName } from './ui.js?v=202609051941';

const cache = new Map();

export async function getPattern(id) {
  if (!cache.has(id)) {
    const r = await fetch('content/patterns/' + id + '.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('content/patterns/' + id + '.json -> ' + r.status);
    cache.set(id, await r.json());
  }
  return cache.get(id);
}

/* ------------------------------------------------------------- rounds */

/* One authored round can stand for several worked ones: "3-8: 1 pb en cada
   punto" is six identical rounds, and a worker needs to know which of the six
   they are on. reps is taken from the field when given, otherwise read off a
   "3-8" label, otherwise one. */
function repsOf(rd) {
  if (Number.isFinite(rd.reps)) return Math.max(1, rd.reps);
  const m = /^\s*(\d+)\s*[-–—]\s*(\d+)\s*$/.exec(String(rd.n ?? ''));
  if (m) return Math.max(1, (+m[2]) - (+m[1]) + 1);
  return 1;
}

/* First worked round number of an authored round, so the header can say
   "Vuelta 5" on the third of rounds 3-8 rather than "Vuelta 3-8". */
function firstOf(rd) {
  const m = /^\s*(\d+)/.exec(String(rd.n ?? ''));
  return m ? +m[1] : null;
}

function prepare(piece) {
  let worked = 0;
  const rounds = (piece.rounds || []).map((rd, i) => {
    const reps = repsOf(rd);
    const from = firstOf(rd) ?? worked + 1;
    worked += reps;
    return { ...rd, i, reps, from, to: from + reps - 1 };
  });
  return { rounds, worked };
}

/* Position within a piece as one number, for the progress bar and the ring. */
function workedBefore(rounds, i, r) {
  let n = r;
  for (let k = 0; k < i && k < rounds.length; k++) n += rounds[k].reps;
  return n;
}

/* ------------------------------------------------------- pattern page */

function pieceRow(pattern, piece, state, tr, li) {
  const { rounds, worked } = prepare(piece);
  const pos = P.getPiece(pattern.id, piece.id);
  const at = pos.done ? worked : workedBefore(rounds, pos.i, pos.r);
  const label = state === 'done' ? '✓' : (at ? at + '/' + worked : String(worked));
  const sub = [
    piece.qty && piece.qty > 1 ? '×' + piece.qty : '',
    piece.color || '',
    worked + ' ' + tr('rounds')
  ].filter(Boolean).join(' · ');

  return '<a class="piece-row ' + state + '" style="--i:' + li + '"'
    + ' href="#/p/' + encodeURIComponent(pattern.id) + '/t/' + encodeURIComponent(piece.id) + '">'
    + '<div class="t"><span class="ttl" style="view-transition-name:' + vtName('piece', pattern.id + '-' + piece.id) + '">'
    + inline(piece.title) + '</span>'
    + '<span class="s">' + escapeHtml(sub) + '</span></div>'
    + ring(worked ? at / worked : 0, label) + '</a>';
}

function list(title, items, cls) {
  if (!items || !items.length) return '';
  return '<div class="pat-block ' + cls + '" data-rise><h2>' + escapeHtml(title) + '</h2>'
    + '<ul>' + items.join('') + '</ul></div>';
}

export async function viewPattern(app, patternId) {
  const pattern = await getPattern(patternId);
  const lang = pattern.lang || 'es';
  const tr = t(lang);
  const st = P.patternStats(pattern);

  Theme.apply(Theme.stored());
  document.documentElement.lang = lang;
  document.title = pattern.title;
  app.style.setProperty('--accent', pattern.accent || '#f0a13a');

  const pieces = (pattern.pieces || [])
    .map((p, i) => pieceRow(pattern, p, st.state[p.id] || 'new', tr, i)).join('');

  const materials = list(tr('materials'),
    (pattern.materials || []).map(m => typeof m === 'string'
      ? '<li>' + inline(m) + '</li>'
      : '<li><b>' + inline(m.label) + '</b> ' + inline(m.value) + '</li>'), 'materials');

  const abbr = (pattern.abbr || []).length
    ? '<div class="pat-block abbr" data-rise><h2>' + escapeHtml(tr('abbrev')) + '</h2>'
      + '<dl>' + pattern.abbr.map(a =>
          '<div><dt>' + inline(a.k) + '</dt><dd>' + inline(a.name)
          + (a.note ? ' <span class="n">' + inline(a.note) + '</span>' : '') + '</dd></div>').join('')
      + '</dl></div>'
    : '';

  const notes = list(tr('notes'), (pattern.notes || []).map(n => '<li>' + inline(n) + '</li>'), 'notes');
  const assembly = list(tr('assembly'), (pattern.assembly || []).map(a => '<li>'
    + (a.title ? '<b>' + inline(a.title) + '</b><br>' : '') + inline(a.text || a) + '</li>'), 'assembly');

  const src = pattern.source
    ? '<div class="pat-source">' + escapeHtml(tr('source')) + ' '
      + (pattern.source.url
          ? '<a href="' + escapeHtml(pattern.source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(pattern.source.title) + '</a>'
          : escapeHtml(pattern.source.title)) + '</div>'
    : '';

  const facts = [
    pattern.level ? '<span class="fact">' + escapeHtml(pattern.level) + '</span>' : '',
    pattern.size ? '<span class="fact">' + escapeHtml(pattern.size) + '</span>' : '',
    pattern.hook ? '<span class="fact">' + escapeHtml(pattern.hook) + '</span>' : ''
  ].join('');

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/s/' + encodeURIComponent(pattern.section || 'punto') + '" aria-label="' + escapeHtml(tr('allPatterns')) + '">' + BACK_ICON + '</a>'
    + '<div class="crumb">' + escapeHtml(tr('allPatterns')) + '</div>'
    + '<div class="count">' + st.done + ' ' + tr('of') + ' ' + st.total + '</div>'
    + Theme.button(lang)
    + '</div><div class="pbar"><i style="width:' + (st.pct * 100) + '%"></i></div></div>'
    + '<div class="page has-bar"><div class="wrap">'
    + '<div class="map-head"><h1 style="view-transition-name:' + vtName('pattern', pattern.id) + '">'
    + inline(pattern.title) + '</h1>'
    + (facts ? '<div class="facts">' + facts + '</div>' : '')
    + (pattern.description ? '<div class="desc">' + inline(pattern.description) + '</div>' : '') + '</div>'
    // Pieces first: a pattern is opened far more often to get back to work
    // than to re-read the materials.
    + '<div class="pat-block pieces" data-rise><h2>' + escapeHtml(tr('pieces')) + '</h2>'
    + '<div class="piece-list">' + (pieces || '<div class="empty">—</div>') + '</div></div>'
    + notes + materials + abbr + assembly + src
    + '</div></div>';

  fillRings(app);
}

/* ------------------------------------------------------------ workshop */

/* The screen must not go dark mid-round: both hands are busy and waking a
   phone with a hook in them is the one thing this view exists to avoid.
   Best-effort - unsupported browsers and denied requests just fall through,
   and the lock is re-taken after the tab comes back. */
function wakeLock() {
  let lock = null, want = true;
  const supported = 'wakeLock' in navigator;

  const take = async () => {
    if (!supported || !want || lock) return;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } catch { /* denied, or not allowed while hidden */ }
  };
  const drop = async () => { try { await lock?.release(); } catch {} lock = null; };
  const onVis = () => { if (document.visibilityState === 'visible') take(); };

  document.addEventListener('visibilitychange', onVis);
  take();

  return {
    supported,
    get on() { return want; },
    toggle() { want = !want; want ? take() : drop(); return want; },
    dispose() { document.removeEventListener('visibilitychange', onVis); want = false; drop(); }
  };
}

/* A short buzz on every advance, so a glance is optional: you can feel that
   the tap landed. Android honours it; iOS ignores it, which is fine. */
function buzz(ms) { try { navigator.vibrate?.(ms); } catch {} }

const EYE = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.1" fill="none"/><path d="M10 3.4c-3.6 0-6.6 2.4-8 6.6 1.4 4.2 4.4 6.6 8 6.6s6.6-2.4 8-6.6c-1.4-4.2-4.4-6.6-8-6.6z" fill="none"/></svg>';
const UNDO = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6.5h7.5a4.5 4.5 0 1 1 0 9H7" fill="none"/><path d="M6.8 3.4 3.6 6.5l3.2 3.1" fill="none"/></svg>';
const KEY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.2h13M3.5 10h13M3.5 14.8h8" fill="none"/></svg>';

export async function viewWorkshop(app, patternId, pieceId) {
  const pattern = await getPattern(patternId);
  const piece = (pattern.pieces || []).find(p => p.id === pieceId);
  if (!piece) throw new Error('No piece "' + pieceId + '".');

  const lang = pattern.lang || 'es';
  const tr = t(lang);
  const { rounds, worked } = prepare(piece);
  const pieces = pattern.pieces || [];
  const nextPiece = pieces[pieces.findIndex(p => p.id === pieceId) + 1] || null;
  const home = '#/p/' + encodeURIComponent(pattern.id);

  Theme.apply(Theme.stored());
  document.documentElement.lang = lang;
  document.title = piece.title + ' · ' + pattern.title;
  app.style.setProperty('--accent', pattern.accent || '#f0a13a');

  const saved = P.getPiece(pattern.id, piece.id);
  let i = saved.done ? rounds.length : Math.min(saved.i, rounds.length);
  let r = saved.done ? 0 : Math.min(saved.r, Math.max(0, (rounds[i]?.reps || 1) - 1));
  let tally = 0;

  app.innerHTML = '<div class="shop">'
    + '<div class="shop-bar">'
    + '<a class="back" href="' + home + '" aria-label="' + escapeHtml(tr('backToPattern')) + '">' + BACK_ICON + '</a>'
    + '<div class="crumb"><b>' + inline(piece.title) + '</b>'
    + (piece.color ? '<span> · ' + escapeHtml(piece.color) + '</span>' : '') + '</div>'
    + '<button class="chip-btn" data-awake type="button" aria-pressed="true"'
    + ' aria-label="' + escapeHtml(tr('keepAwake')) + '" title="' + escapeHtml(tr('keepAwake')) + '">' + EYE + '</button>'
    + Theme.button(lang)
    + '</div>'
    + '<div class="shop-pbar"><i id="sfill"></i></div>'
    + '<button class="shop-main" id="adv" type="button"></button>'
    + '<div class="shop-foot">'
    + '<button class="foot-btn" data-prev type="button" aria-label="' + escapeHtml(tr('undo')) + '">' + UNDO + '</button>'
    + '<button class="tally-btn" data-tally type="button" title="' + escapeHtml(tr('tallyReset')) + '"></button>'
    + '<button class="foot-btn" data-key type="button" aria-label="' + escapeHtml(tr('abbrev')) + '">' + KEY + '</button>'
    + '</div>'
    + '<div class="sheet" id="sheet" hidden><div class="sheet-in">'
    + '<h2>' + escapeHtml(tr('abbrev')) + '</h2><dl>'
    + (pattern.abbr || []).map(a => '<div><dt>' + inline(a.k) + '</dt><dd>' + inline(a.name)
        + (a.note ? ' <span class="n">' + inline(a.note) + '</span>' : '') + '</dd></div>').join('')
    + '</dl></div></div>'
    + '</div>';

  const main = app.querySelector('#adv');
  const fill = app.querySelector('#sfill');
  const tallyBtn = app.querySelector('[data-tally]');
  const sheet = app.querySelector('#sheet');
  const lock = wakeLock();
  const awakeBtn = app.querySelector('[data-awake]');
  if (!lock.supported) awakeBtn.hidden = true;

  const save = () => P.setPiece(pattern.id, piece.id, { i, r, done: i >= rounds.length });

  function paintTally() {
    const rd = rounds[i];
    const goal = rd?.count;
    tallyBtn.disabled = i >= rounds.length;
    tallyBtn.innerHTML = '<b>' + tally + '</b>' + (goal ? '<span>/' + goal + '</span>' : '');
    tallyBtn.classList.toggle('full', !!goal && tally >= goal);
  }

  function paint() {
    const at = i >= rounds.length ? worked : workedBefore(rounds, i, r);
    fill.style.width = (worked ? (at / worked) * 100 : 100) + '%';

    if (i >= rounds.length) {
      const fin = (piece.finish || []).map(f => '<li>' + inline(f) + '</li>').join('');
      main.innerHTML = '<div class="done">'
        + '<div class="mark">' + TICK + '</div>'
        + '<h2>' + escapeHtml(tr('pieceDone')) + '</h2>'
        + (fin ? '<div class="finish"><h3>' + escapeHtml(tr('finishing')) + '</h3><ul>' + fin + '</ul></div>' : '')
        + '<div class="btns">'
        + (nextPiece
            ? '<a class="cta" href="#/p/' + encodeURIComponent(pattern.id) + '/t/' + encodeURIComponent(nextPiece.id) + '">'
              + escapeHtml(tr('nextPiece')) + ' · ' + inline(nextPiece.title) + '</a>'
            : '')
        + '<a class="cta ghost" href="' + home + '">' + escapeHtml(tr('backToPattern')) + '</a>'
        + '</div></div>';
      main.classList.add('is-done');
      paintTally();
      return;
    }

    const rd = rounds[i];
    const num = rd.reps > 1 ? rd.from + r : rd.from;
    main.classList.remove('is-done');
    main.innerHTML = '<div class="rd">'
      + '<div class="rnum"><span class="lbl">' + escapeHtml(tr('round')) + '</span>'
      + '<b>' + escapeHtml(String(rd.label || num)) + '</b>'
      + '<span class="tot">' + tr('of') + ' ' + worked + '</span></div>'
      + '<div class="rtext">' + inline(rd.text || '') + '</div>'
      + (rd.count ? '<div class="rcount">' + rd.count + ' <span>p.</span></div>' : '')
      + (rd.reps > 1
          ? '<div class="reps">' + (r + 1) + ' ' + tr('of') + ' ' + rd.reps + ' ' + escapeHtml(tr('sameRound'))
            + '<span class="pips">' + Array.from({ length: rd.reps }, (_, k) =>
                '<i class="' + (k < r ? 'past' : k === r ? 'now' : '') + '"></i>').join('') + '</span></div>'
          : '')
      + (rd.note ? '<div class="rnote">' + inline(rd.note) + '</div>' : '')
      + '</div>'
      + '<div class="rnext">' + (rounds[i + 1] || rd.reps > r + 1
          ? escapeHtml(tr('nextUp')) + ' · ' + inline((rd.reps > r + 1 ? rd : rounds[i + 1]).text || '')
          : escapeHtml(tr('finishing'))) + '</div>'
      + '<div class="rhint">' + escapeHtml(tr('tapNext')) + '</div>';
    paintTally();
  }

  function step(d) {
    if (d > 0) {
      if (i >= rounds.length) return;
      if (r + 1 < rounds[i].reps) r++;
      else { i++; r = 0; }
    } else {
      if (i === 0 && r === 0) return;
      if (r > 0) r--;
      else { i--; r = rounds[i].reps - 1; }
    }
    tally = 0;
    buzz(d > 0 ? 12 : 6);
    save();
    paint();
  }

  // A tap anywhere on the card is the next round; a horizontal drag goes
  // either way. The threshold keeps a hand resting on the phone from
  // counting as a swipe, and a drag never also fires as a tap.
  let x0 = null, y0 = null, moved = false;
  main.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; moved = false; });
  main.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    if (Math.abs(e.clientX - x0) > 12 || Math.abs(e.clientY - y0) > 12) moved = true;
  });
  main.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (main.classList.contains('is-done')) return;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) return step(dx < 0 ? 1 : -1);
    if (!moved) step(1);
  });
  main.addEventListener('pointercancel', () => { x0 = null; });
  // The card is a <button>: keyboards fire click, and that must still advance.
  main.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  app.querySelector('[data-prev]').addEventListener('click', () => step(-1));

  // Tally: tap counts a stitch, a long press puts it back to zero. It is the
  // only place in the app where holding does something the tap does not, and
  // it earns that: losing count at stitch 30 of 36 is the failure it exists
  // to prevent, so undoing a mis-tap must not itself need precision.
  let held = null;
  const startHold = () => { held = setTimeout(() => { held = null; tally = 0; buzz(20); paintTally(); }, 500); };
  const endHold = () => { if (held) { clearTimeout(held); held = null; return true; } return false; };
  tallyBtn.addEventListener('pointerdown', startHold);
  tallyBtn.addEventListener('pointerleave', () => { clearTimeout(held); held = null; });
  tallyBtn.addEventListener('pointerup', () => {
    if (!endHold()) return;                    // the hold already reset it
    const goal = rounds[i]?.count;
    tally++;
    if (goal && tally === goal) buzz([10, 40, 10]);
    paintTally();
  });

  awakeBtn.addEventListener('click', () => {
    const on = lock.toggle();
    awakeBtn.setAttribute('aria-pressed', String(on));
    awakeBtn.classList.toggle('off', !on);
  });

  app.querySelector('[data-key]').addEventListener('click', () => { sheet.hidden = !sheet.hidden; });
  sheet.addEventListener('click', () => { sheet.hidden = true; });

  paint();
  return () => lock.dispose();
}

/* ---------------------------------------------------------------- card */

/* The pattern's shelf card. Same shape as a course card - one accent, one
   ring - so a section of patterns reads as part of the same app. */
export function patternCard(pattern, i = 0) {
  const tr = t(pattern.lang || 'es');
  const st = P.patternStats(pattern);
  const label = st.total ? st.done + '/' + st.total : '0';
  return '<a class="course-card" href="#/p/' + encodeURIComponent(pattern.id) + '"'
    + ' data-rise style="--i:' + i + ';--accent:' + escapeHtml(pattern.accent || '#f0a13a') + '">'
    + '<div class="meta"><h2 style="view-transition-name:' + vtName('pattern', pattern.id) + '">'
    + inline(pattern.title) + '</h2>'
    + '<div class="desc">' + inline(pattern.subtitle || '') + '</div>'
    + '<span class="tag">' + st.total + ' ' + tr(st.total === 1 ? 'pieceOne' : 'pieces')
    + (pattern.level ? ' &middot; ' + escapeHtml(pattern.level) : '') + '</span></div>'
    + ring(st.pct, label) + '</a>';
}

/** Everything searchable about a pattern: its own words plus its piece names. */
export function patternHay(pattern) {
  return [pattern.title, pattern.subtitle, pattern.description,
    ...(pattern.pieces || []).map(p => p.title)].join(' ');
}
