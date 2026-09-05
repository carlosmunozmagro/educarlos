/* Reading progress in localStorage.
   Shape: { "<courseId>/<lessonId>": { lastScreen, screens, completed, updatedAt } } */

const KEY = 'bs.progress.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.warn('progress not saved:', e); }   // private mode / quota
}

const key = (c, l) => c + '/' + l;

export function getLesson(courseId, lessonId) {
  return read()[key(courseId, lessonId)] || { lastScreen: 0, screens: 0, completed: false };
}

export function setLesson(courseId, lessonId, patch) {
  const all = read();
  const k = key(courseId, lessonId);
  all[k] = { ...(all[k] || { lastScreen: 0, screens: 0, completed: false }), ...patch, updatedAt: Date.now() };
  write(all);
  return all[k];
}

/** Flatten a course manifest into an ordered list of { chapter, lesson }. */
export function lessonOrder(course) {
  const out = [];
  for (const ch of course.chapters || [])
    for (const ls of ch.lessons || [])
      if (ls.status !== 'planned') out.push({ chapter: ch, lesson: ls });
  return out;
}

/** Per-lesson state for the course map, plus overall completion. */
export function courseStats(course) {
  const all = read();
  const order = lessonOrder(course);
  const state = {};
  let done = 0, firstUnfinished = null;

  for (const { lesson } of order) {
    const p = all[key(course.id, lesson.id)];
    if (p?.completed) { state[lesson.id] = 'done'; done++; }
    else if (p?.lastScreen > 0) { state[lesson.id] = 'active'; if (!firstUnfinished) firstUnfinished = lesson.id; }
    else { state[lesson.id] = 'new'; if (!firstUnfinished) firstUnfinished = lesson.id; }
  }
  return { total: order.length, done, pct: order.length ? done / order.length : 0, state, current: firstUnfinished };
}

export function exportAll() { return JSON.stringify(read(), null, 2); }

/* ------------------------------------------------------------ patterns

   A pattern is not read, it is worked: what gets remembered is the round the
   hooks are on, and how many of a repeated round are behind you. Same store,
   a "p/" prefix so pattern keys can never collide with "<course>/<lesson>".
   Shape: { "p/<patternId>/<pieceId>": { i, r, done, updatedAt } } where i is
   the round index and r the repeat within it, both 0-based. */

const pkey = (p, piece) => 'p/' + p + '/' + piece;
const BLANK_PIECE = { i: 0, r: 0, done: false };

export function getPiece(patternId, pieceId) {
  return { ...BLANK_PIECE, ...(read()[pkey(patternId, pieceId)] || {}) };
}

export function setPiece(patternId, pieceId, patch) {
  const all = read();
  const k = pkey(patternId, pieceId);
  all[k] = { ...BLANK_PIECE, ...(all[k] || {}), ...patch, updatedAt: Date.now() };
  write(all);
  return all[k];
}

export function resetPiece(patternId, pieceId) {
  const all = read();
  delete all[pkey(patternId, pieceId)];
  write(all);
}

/** Per-piece state for the pattern page, plus overall completion. */
export function patternStats(pattern) {
  const pieces = pattern.pieces || [];
  const state = {};
  let done = 0, current = null;

  for (const piece of pieces) {
    const p = getPiece(pattern.id, piece.id);
    if (p.done) { state[piece.id] = 'done'; done++; }
    else if (p.i > 0 || p.r > 0) { state[piece.id] = 'active'; if (!current) current = piece.id; }
    else { state[piece.id] = 'new'; if (!current) current = piece.id; }
  }
  return { total: pieces.length, done, pct: pieces.length ? done / pieces.length : 0, state, current };
}
