/* Router + views. Three routes:
     #/                        library
     #/c/:courseId             course map
     #/c/:courseId/l/:lessonId lesson player                       */

import { renderScreen } from './render.js';
import { inline, escapeHtml } from './mdlite.js';
import { t } from './i18n.js';
import { NAME, MARK, punField } from './brand.js';
import * as P from './progress.js';
import * as Theme from './theme.js';

const app = document.getElementById('app');
const cache = { index: null, sections: null, courses: new Map(), lessons: new Map(), svgs: new Map() };
let punfield = null;   // only the library mounts one

/* ---------------------------------------------------------- data */

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.json();
}

async function getIndex() {
  if (!cache.index) cache.index = await getJSON('content/index.json');
  return cache.index;
}
async function getCourse(id) {
  if (!cache.courses.has(id)) cache.courses.set(id, await getJSON('content/' + id + '/course.json'));
  return cache.courses.get(id);
}
async function getLesson(courseId, lessonId) {
  const k = courseId + '/' + lessonId;
  if (!cache.lessons.has(k)) cache.lessons.set(k, await getJSON('content/' + courseId + '/lessons/' + lessonId + '.json'));
  return cache.lessons.get(k);
}

/* Inline SVGs so they inherit currentColor and CSS variables.
   Strip anything executable - visuals are static art, never scripts. */
async function preloadSVGs(lesson) {
  const srcs = [];
  for (const s of lesson.screens || [])
    for (const b of s.blocks || [])
      if (b.type === 'visual' && b.src && !cache.svgs.has(b.src)) srcs.push(b.src);

  await Promise.all([...new Set(srcs)].map(async src => {
    try {
      const r = await fetch(src, { cache: 'no-cache' });
      let txt = r.ok ? await r.text() : '';
      txt = txt.replace(/<\?xml[\s\S]*?\?>/g, '')
               .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
               .replace(/<script[\s\S]*?<\/script>/gi, '')
               .replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
      cache.svgs.set(src, txt.trim() || null);
    } catch { cache.svgs.set(src, null); }
  }));
}

/* ---------------------------------------------------------- chrome */

function ring(pct, label) {
  const r = 19, c = 2 * Math.PI * r;
  return '<svg class="ring" viewBox="0 0 46 46" aria-hidden="true">'
    + '<circle class="track" cx="23" cy="23" r="' + r + '"/>'
    + '<circle class="fill" cx="23" cy="23" r="' + r + '" stroke-dasharray="' + c
    + '" stroke-dashoffset="' + (c * (1 - pct)) + '" transform="rotate(-90 23 23)"/>'
    + '<text x="23" y="23" text-anchor="middle" dominant-baseline="central">' + escapeHtml(label) + '</text></svg>';
}

const BACK_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3L5 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GO_ICON = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M7 3l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TICK = '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M6 13.5l5 5L20 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* View-transition names must be CSS idents and must be unique on the page.
   Deriving them from the id keeps the same element paired across two views,
   which is what makes the badge fly and the title settle instead of both
   just cross-fading. */
function vtName(prefix, id) {
  return prefix + '-' + String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function setChrome(course) {
  Theme.apply(Theme.stored());
  document.documentElement.lang = course?.lang || 'en';
  document.title = course ? course.title : NAME;
  app.style.setProperty('--accent', course?.accent || '#f0a13a');
}

/* ------------------------------------------------------- sections */

/* A section is a shelf on the home screen. Sections are declared in
   content/index.json; one with a "lang" collects every course in that
   language automatically, so adding a course to "courses" files it without
   touching anything else. One with its own "courses" list uses exactly that. */
const DEFAULT_SECTIONS = [
  { id: 'en', badge: 'EN', title: 'Courses in English', lang: 'en' },
  { id: 'es', badge: 'ES', title: 'Cursos en espanol',  lang: 'es' }
];

async function getSections() {
  if (cache.sections) return cache.sections;
  const idx = await getIndex();
  const all = await Promise.all((idx.courses || []).map(getCourse));
  const byId = new Map(all.map(c => [c.id, c]));
  cache.sections = (idx.sections || DEFAULT_SECTIONS).map(d => ({
    ...d,
    courses: d.courses
      ? d.courses.map(id => byId.get(id)).filter(Boolean)
      : all.filter(c => (c.lang || 'en') === d.lang)
  }));
  return cache.sections;
}

async function sectionOf(courseId) {
  const secs = await getSections();
  return secs.find(s => s.courses.some(c => c.id === courseId)) || null;
}

/* Accent-insensitive, so "espana" finds "España" and "impuesto" finds
   "Impuesto". Spanish content makes this non-optional. */
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function searchIndex(course) {
  const lessons = [];
  for (const ch of course.chapters || [])
    for (const ls of ch.lessons || [])
      lessons.push({
        id: ls.id, title: ls.title, status: ls.status, chapter: ch.title,
        hay: norm([ls.title, ls.summary, ch.title].join(' '))
      });
  return { course, lessons, hay: norm([course.title, course.subtitle, course.description].join(' ')) };
}

/* ---------------------------------------------------------- views */

function courseCard(c, i = 0) {
  const st = P.courseStats(c);
  const label = st.total ? st.done + '/' + st.total : '0';
  return '<a class="course-card" href="#/c/' + encodeURIComponent(c.id) + '"'
    + ' data-rise style="--i:' + i + ';--accent:' + escapeHtml(c.accent || '#f0a13a') + '">'
    + '<div class="meta"><h2 style="view-transition-name:' + vtName('course', c.id) + '">'
    + inline(c.title) + '</h2>'
    + '<div class="desc">' + inline(c.subtitle || '') + '</div>'
    + '<span class="tag">' + escapeHtml((c.lang || 'en').toUpperCase()) + ' &middot; ' + st.total + ' ' + t(c.lang)(st.total === 1 ? 'lessonOne' : 'lessons') + '</span></div>'
    + ring(st.pct, label) + '</a>';
}

/* Home: one full screen of brand, one of shelves, snapped like a lesson. */
async function viewHome() {
  const sections = await getSections();
  setChrome(null);
  app.style.removeProperty('--accent');
  document.documentElement.lang = 'en';

  const shelves = sections.map((s, i) => {
    const n = s.courses.length;
    const tr = t(s.lang || 'en');
    const count = n ? n + ' ' + tr(n === 1 ? 'courseOne' : 'courses') : tr('planned');
    // Three course names, each in its own accent: a shelf you can read the
    // spines of before you pull it open.
    const rail = s.courses.slice(0, 3).map(c =>
        '<span class="chip" style="--accent:' + escapeHtml(c.accent || '#f0a13a') + '">'
        + '<span class="txt">' + inline(c.title) + '</span></span>').join('')
      + (n > 3 ? '<span class="chip more">+' + (n - 3) + '</span>' : '');
    return '<a class="section-card' + (n ? '' : ' soon') + '" href="#/s/' + encodeURIComponent(s.id) + '"'
      + ' data-anim style="--i:' + (i + 1) + '">'
      + '<span class="badge" style="view-transition-name:' + vtName('shelf', s.id) + '">'
      + escapeHtml(s.badge || '&middot;') + '</span>'
      + '<div class="meta"><h2>' + inline(s.title) + '</h2>'
      + (s.subtitle ? '<div class="desc">' + inline(s.subtitle) + '</div>' : '')
      + (rail ? '<div class="rail">' + rail + '</div>' : '')
      + '<span class="tag">' + escapeHtml(count) + '</span></div>'
      + '<span class="go">' + GO_ICON + '</span></a>';
  }).join('');

  app.innerHTML = '<div class="deck home" id="home">'
    + '<section class="screen in" data-kind="hero"><div class="wrap hero">'
    + '<div class="lockup-xl" data-anim>' + MARK + NAME + '</div>'
    + '<div class="hero-def" data-anim style="--i:1">'
    + '<span class="pos">v.</span>'
    + '<span class="d1">to educate them</span>'
    + '<span class="d2">One screen at a time.</span>'
    + '</div>'
    + '</div><div class="hint">' + t('en')('swipe') + '</div>'
    + '<div class="corner">' + Theme.button('en') + '</div></section>'
    + '<section class="screen" data-kind="shelves"><div class="wrap">'
    + '<div class="sec-head" data-anim>' + t('en')('sections') + '</div>'
    + '<div class="section-list">' + shelves + '</div>'
    + '</div></section></div>';

  punfield = punField();
  app.insertAdjacentElement('afterbegin', punfield);
  wireHome();
}

/* The field is the hero's backdrop; it steps back once you swipe past it.
   Driven by scroll position rather than an observer: the shelves start
   hidden for their entrance, and must never depend on a callback to appear. */
function wireHome() {
  const home = document.getElementById('home');
  const screens = [...home.querySelectorAll('.screen')];

  // Two layout reads and a class toggle - cheap enough to run inline, and
  // it cannot be starved the way a frame callback can.
  const update = () => {
    const y = home.scrollTop, h = home.clientHeight || 1;
    app.classList.toggle('past-hero', y > h * 0.25);
    for (const s of screens) if (s.offsetTop < y + h * 0.75) s.classList.add('in');
  };

  home.addEventListener('scroll', update, { passive: true });
  update();
}

/* A section: its courses, filtered live. The query also reaches lesson
   titles, so "IVA" or "hash" lands you on the lesson, not just the course. */
async function viewSection(id) {
  const sections = await getSections();
  const sec = sections.find(s => s.id === id);
  if (!sec) throw new Error('No section "' + id + '".');
  const lang = sec.lang || 'en';
  const tr = t(lang);

  setChrome(null);
  app.style.removeProperty('--accent');
  document.documentElement.lang = lang;
  document.title = sec.title + ' · ' + NAME;

  const index = sec.courses.map(searchIndex);

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/" aria-label="' + tr('home') + '">' + BACK_ICON + '</a>'
    + '<div class="crumb">' + tr('home') + '</div>'
    + '<div class="count">' + sec.courses.length + '</div>'
    + Theme.button(lang)
    + '</div></div>'
    + '<div class="page has-bar"><div class="wrap">'
    + '<div class="map-head sec-hero">'
    + '<span class="badge" style="view-transition-name:' + vtName('shelf', sec.id) + '">'
    + escapeHtml(sec.badge || '&middot;') + '</span>'
    + '<h1>' + inline(sec.title) + '</h1>'
    + (sec.subtitle ? '<div class="desc">' + inline(sec.subtitle) + '</div>' : '') + '</div>'
    + (index.length
        ? '<div class="searchbox"><input id="q" type="search" autocomplete="off" spellcheck="false"'
          + ' placeholder="' + escapeHtml(tr('search')) + '" aria-label="' + escapeHtml(tr('search')) + '">'
          + '</div>'
        : '')
    + '<div class="card-list" id="results"></div>'
    + '</div></div>';

  const results = document.getElementById('results');
  const input = document.getElementById('q');

  const draw = () => {
    const q = norm(input ? input.value.trim() : '');
    if (!index.length) {
      results.innerHTML = '<div class="empty">' + escapeHtml(tr('planned')) + '</div>';
      return;
    }
    const hits = index.map(ix => {
      if (!q) return { ix, lessons: [] };
      const lessons = ix.lessons.filter(l => l.hay.includes(q));
      return (ix.hay.includes(q) || lessons.length) ? { ix, lessons } : null;
    }).filter(Boolean);

    if (!hits.length) {
      results.innerHTML = '<div class="empty">' + escapeHtml(tr('noResults')) + '</div>';
      return;
    }
    results.innerHTML = hits.map(({ ix, lessons }, ci) => {
      const rows = lessons.slice(0, 4).map(l => {
        const label = '<span class="hit-ch">' + escapeHtml(l.chapter) + '</span>' + inline(l.title);
        return l.status === 'planned'
          ? '<div class="hit planned">' + label + '</div>'
          : '<a class="hit" href="#/c/' + encodeURIComponent(ix.course.id) + '/l/' + encodeURIComponent(l.id) + '">'
            + label + '</a>';
      }).join('');
      const more = lessons.length > 4
        ? '<div class="hit more">+' + (lessons.length - 4) + '</div>' : '';
      return courseCard(ix.course, ci) + (rows ? '<div class="hits">' + rows + more + '</div>' : '');
    }).join('');
  };

  draw();
  if (input) input.addEventListener('input', draw);
}

async function viewCourse(courseId) {
  const course = await getCourse(courseId);
  const tr = t(course.lang);
  setChrome(course);
  const st = P.courseStats(course);

  const chapters = (course.chapters || []).map((ch, ci) => {
    const rows = (ch.lessons || []).map(ls => {
      const body = '<span class="dot"></span>'
        + '<div class="t">' + inline(ls.title) + '</div>'
        + (ls.summary ? '<div class="s">' + inline(ls.summary) + '</div>' : '');
      // Planned lessons are shown so the curriculum is visible, but they
      // are not links - there is nothing to open yet.
      if (ls.status === 'planned') {
        return '<div class="lesson-row planned">' + body
          + '<div class="soon">' + tr('planned') + '</div></div>';
      }
      const state = st.state[ls.id] || 'new';
      return '<a class="lesson-row ' + state + '" href="#/c/' + encodeURIComponent(course.id) + '/l/' + encodeURIComponent(ls.id) + '">'
        + body + '</a>';
    }).join('');
    return '<div class="chapter" data-rise style="--i:' + (ci + 1) + '"><div class="chapter-title"><span class="n">'
      + tr('chapter') + ' ' + (ci + 1) + '</span><span>' + inline(ch.title) + '</span></div>'
      + '<div class="spine">' + rows + '</div></div>';
  }).join('');

  const sec = await sectionOf(course.id);
  const up = sec ? '#/s/' + encodeURIComponent(sec.id) : '#/';
  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="' + up + '" aria-label="' + tr('backToLibrary') + '">' + BACK_ICON + '</a>'
    + '<div class="crumb">' + tr('backToLibrary') + '</div>'
    + '<div class="count">' + st.done + ' ' + tr('of') + ' ' + st.total + '</div>'
    + Theme.button(course.lang)
    + '</div><div class="pbar"><i style="width:' + (st.pct * 100) + '%"></i></div></div>'
    + '<div class="page has-bar"><div class="wrap">'
    + '<div class="map-head"><h1 style="view-transition-name:' + vtName('course', course.id) + '">'
    + inline(course.title) + '</h1>'
    + (course.description ? '<div class="desc">' + inline(course.description) + '</div>' : '') + '</div>'
    + (chapters || '<div class="empty">No lessons yet.</div>')
    + (course.disclaimer ? '<div class="disclaimer">' + inline(course.disclaimer) + '</div>' : '')
    + '</div></div>';
}

async function viewLesson(courseId, lessonId) {
  const course = await getCourse(courseId);
  const lesson = await getLesson(courseId, lessonId);
  const tr = t(course.lang);
  setChrome(course);
  await preloadSVGs(lesson);

  const ctx = { t: tr, svg: (src) => cache.svgs.get(src) || null };
  const order = P.lessonOrder(course);
  const pos = order.findIndex(o => o.lesson.id === lessonId);
  const next = pos >= 0 && pos < order.length - 1 ? order[pos + 1].lesson : null;
  const chapterTitle = pos >= 0 ? order[pos].chapter.title : '';

  const screens = (lesson.screens || []).map(s => renderScreen(s, ctx)).join('');

  const outro = '<section class="screen" data-kind="outro"><div class="wrap outro">'
    + '<div data-anim><div class="mark">' + TICK + '</div>'
    + '<h2>' + tr(next ? 'complete' : 'courseComplete') + '</h2></div>'
    + '<div class="btns" data-anim style="--i:1">'
    + (next ? '<a class="cta" href="#/c/' + encodeURIComponent(course.id) + '/l/' + encodeURIComponent(next.id) + '">' + tr('nextLesson') + '</a>' : '')
    + '<a class="cta ghost" href="#/c/' + encodeURIComponent(course.id) + '">' + tr('backToMap') + '</a>'
    + '</div></div></section>';

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/c/' + encodeURIComponent(course.id) + '" aria-label="' + tr('backToMap') + '">' + BACK_ICON + '</a>'
    + '<div class="crumb">' + escapeHtml(chapterTitle) + '</div>'
    + '<div class="count"><span id="cur">1</span> ' + tr('of') + ' <span id="tot">1</span></div>'
    + '</div><div class="pbar"><i id="pfill"></i></div></div>'
    + '<div class="deck" id="deck">' + screens + outro + '</div>';

  wireDeck(course, lesson, tr);
}

/* ------------------------------------------------- deck behaviour */

function wireDeck(course, lesson, tr) {
  const deck = document.getElementById('deck');
  const sections = [...deck.querySelectorAll('.screen')];
  const total = sections.length;
  const fill = document.getElementById('pfill');
  const cur = document.getElementById('cur');
  document.getElementById('tot').textContent = total;

  // A scroll cue on the opening screen, removed once the reader moves.
  if (total > 1) {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = tr('scroll');
    sections[0].appendChild(hint);
  }

  let active = 0, saveTimer = null;
  const save = (patch) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => P.setLesson(course.id, lesson.id, patch), 250);
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      const i = sections.indexOf(e.target);
      if (i < 0) continue;
      active = i;
      cur.textContent = i + 1;
      fill.style.width = ((i + 1) / total * 100) + '%';
      if (i > 0) sections[0].querySelector('.hint')?.remove();
      save({ lastScreen: i, screens: total, completed: i >= total - 1 });
    }
  }, { root: deck, threshold: 0.55 });

  sections.forEach(s => io.observe(s));

  // Resume where the reader left off, without animating the scroll.
  const saved = P.getLesson(course.id, lesson.id);
  if (saved.lastScreen > 0 && saved.lastScreen < total - 1 && !saved.completed) {
    requestAnimationFrame(() => { deck.scrollTop = sections[saved.lastScreen].offsetTop; });
  } else {
    sections[0].classList.add('in');
  }

  // Arrow keys / space for anyone reading on a laptop.
  deck.tabIndex = -1;
  deck.addEventListener('keydown', (e) => {
    const step = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (!step) return;
    const target = sections[Math.min(total - 1, Math.max(0, active + step))];
    if (target) { e.preventDefault(); deck.scrollTo({ top: target.offsetTop, behavior: 'smooth' }); }
  });
}

/* ---------------------------------------------------------- route */

/* How deep in the app a route sits. The difference between two of these is
   the direction of travel, which is all the transition needs to know. */
function depthOf(parts) {
  if (parts[0] === 'c' && parts[2] === 'l' && parts[3]) return 3;
  if (parts[0] === 'c') return 2;
  if (parts[0] === 's') return 1;
  return 0;
}

/* Warm the caches before the transition starts. A view transition freezes the
   old frame while its callback runs, so any fetch left inside it would show up
   as the screen hanging on the way out. */
async function prefetch(parts) {
  try {
    if (parts[0] === 'c' && parts[2] === 'l' && parts[3]) {
      await getCourse(parts[1]);
      await preloadSVGs(await getLesson(parts[1], parts[3]));
    } else if (parts[0] === 'c' && parts[1]) {
      await getCourse(parts[1]);
    } else {
      await getSections();
    }
  } catch { /* let the view report it */ }
}

async function render(parts) {
  window.scrollTo(0, 0);
  punfield?.dispose();
  punfield = null;
  try {
    if (parts[0] === 'c' && parts[2] === 'l' && parts[3]) await viewLesson(parts[1], parts[3]);
    else if (parts[0] === 'c' && parts[1]) await viewCourse(parts[1]);
    else if (parts[0] === 's' && parts[1]) await viewSection(parts[1]);
    else await viewHome();
  } catch (err) {
    console.error(err);
    app.innerHTML = '<div class="page"><div class="wrap"><div class="empty">'
      + escapeHtml(err.message || 'Something went wrong.')
      + '<br><br><a href="#/">Educarlos</a></div></div></div>';
  }
}

const canAnimate = () =>
  typeof document.startViewTransition === 'function'
  && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Run a DOM change as a view transition, tagged so the stylesheet knows which
   way the page is travelling. Falls back to the plain change where the API is
   missing or motion is unwelcome. */
let vtToken = 0;
async function transition(kind, mutate) {
  if (!canAnimate()) return mutate();
  const root = document.documentElement;
  const token = ++vtToken;
  root.dataset.nav = kind;
  try {
    await document.startViewTransition(mutate).finished;
  } catch { /* a superseded transition is not an error */ }
  // Only the newest transition clears the flag: a tap during a navigation
  // supersedes it, and the loser must not strip the winner's direction.
  finally { if (token === vtToken) delete root.dataset.nav; }
}

let depth = -1;

async function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean).map(decodeURIComponent);
  const to = depthOf(parts);
  const dir = depth < 0 || to === depth ? null : (to > depth ? 'forward' : 'back');
  depth = to;

  if (!dir) return render(parts);
  await prefetch(parts);
  await transition(dir, () => render(parts));
}

/* One listener for every toggle the views mount. The swap itself runs as a
   transition, so light and dark wash across the page instead of snapping.

   The next preference is worked out here rather than inside the callback: a
   transition defers its mutation by a frame, so two quick taps would otherwise
   both read the same stored value and land on the same theme. */
let themePref = Theme.stored();
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-toggle]');
  if (!btn) return;
  e.preventDefault();
  themePref = Theme.next(themePref);
  const pref = themePref;
  transition('theme', () => {
    Theme.set(pref);
    Theme.refreshButtons(document.documentElement.lang);
  });
});

addEventListener('hashchange', route);
Theme.apply(Theme.stored());
route();
