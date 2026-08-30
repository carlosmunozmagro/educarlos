/* Brand: the mark, and the field of puns behind the library.

   The name is a real Spanish word - "educarlos", to educate them - that
   happens to contain the author's whole name. Every word in PUNS does the
   same trick, either by ending in -carlos or by swallowing Carl-. The
   background prints them faintly and tints the shared syllable, so the
   joke is legible only to someone who stops to look. */

export const NAME = 'Educarlos';

/* An open C holding one bright screen in its mouth. Same drawing language
   as the lesson diagrams: one arc, one accent bar, nothing else. */
export const MARK =
  '<svg class="mark-c" viewBox="0 0 64 64" fill="none" aria-hidden="true">'
  + '<path d="M42.9 16.44 A 19 19 0 1 0 42.9 47.56" stroke="currentColor"'
  + ' stroke-width="3.6" stroke-linecap="round"/>'
  + '<rect x="36" y="24" width="7" height="16" rx="3.5" fill="var(--accent)"/></svg>';

/* "|" marks the syllable that gets the accent tint. */
const PUNS = [
  'edu|carlos', 'expli|carlos', 'practi|carlos', 'apli|carlos', 'publi|carlos',
  'verifi|carlos', 'simplifi|carlos', 'comuni|carlos', 'identifi|carlos',
  'ejemplifi|carlos', 'justifi|carlos', 'planifi|carlos', 'clasifi|carlos',
  'codifi|carlos', 'repli|carlos', 'unifi|carlos', 'cuantifi|carlos',
  'califi|carlos', 'rectifi|carlos', 'certifi|carlos', 'notifi|carlos',
  'clarifi|carlos', 'amplifi|carlos', 'dedi|carlos', 'indi|carlos',
  'ubi|carlos', 'enfo|carlos', 'colo|carlos', 'desta|carlos', 'abar|carlos',
  'evo|carlos', 'provo|carlos', 'fabri|carlos', 'impli|carlos', 'compli|carlos',
  'multipli|carlos', 'mar|carlos', 'bus|carlos', 'to|carlos', 'sa|carlos',
  'criti|carlos', 'modifi|carlos', 'convo|carlos', 'magnifi|carlos',
  'Carl|ture', 'Carlo|teca', 'Carli|cultura', 'Carlos|idades', 'Carlo|magno',
  'Carl|culus', 'Carl|gebra', 'Carl|gorithm', 'Carl|chemy', 'Carl|ectura',
  'Carl|ección', 'Carl|ossary', 'Carl|cademia', 'Carl|endario', 'Carl|ografía',
  'Carl|pítulo', 'Carl|bulario', 'Carl|opedia', 'Carl|ecture', 'Carlo|sofía'
];

const WORDS_PER_ROW = 7;
const ROW_HEIGHT = 58;          // roughly one line, used only to count rows

function word(spec, i) {
  const [pre, hot] = spec.split('|');
  return '<span class="pun" style="--d:' + (i % 5) + '">' + pre
    + '<b>' + hot + '</b></span>';
}

/* Deterministic offset per row so the columns never line up into a grid. */
function row(index, dir) {
  const start = (index * WORDS_PER_ROW + index * 3) % PUNS.length;
  const set = [];
  for (let i = 0; i < WORDS_PER_ROW; i++) set.push(word(PUNS[(start + i) % PUNS.length], i));
  const html = set.join('');
  const dur = 78 + (index % 4) * 26;
  return '<div class="pun-row"><div class="pun-track" style="animation-duration:' + dur + 's;'
    + 'animation-direction:' + (dir ? 'normal' : 'reverse') + '">'
    + '<span class="pun-set">' + html + '</span><span class="pun-set">' + html + '</span>'
    + '</div></div>';
}

/* Enough rows to cover the viewport, rebuilt when it changes shape. */
export function punField() {
  const el = document.createElement('div');
  el.className = 'punfield';
  el.setAttribute('aria-hidden', 'true');

  let count = 0;
  const build = () => {
    const n = Math.ceil(window.innerHeight / ROW_HEIGHT) + 2;
    if (n === count) return;
    count = n;
    let html = '';
    for (let i = 0; i < n; i++) html += row(i, i % 2 === 0);
    el.innerHTML = html;
  };
  build();

  let timer = null;
  const onResize = () => { clearTimeout(timer); timer = setTimeout(build, 200); };
  addEventListener('resize', onResize);
  // The library is torn down on every route change; stop listening with it.
  el.dispose = () => { removeEventListener('resize', onResize); clearTimeout(timer); };
  return el;
}
