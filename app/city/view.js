/* The environment: chrome, gestures, and the clock that turns years.

   Nothing is explained on screen. The dock has six things a reader can do to
   the place, and the city answers over the following decades. That delay is
   the point: a park is not a decoration you place, it is a decision the city
   spends forty years arguing with. */

import * as City from './sim.js';
import { createPainter } from './paint.js';

const KEY = 'educarlos:city.v1';
const HINT_KEY = 'educarlos:city.seen';
const YEAR_MS = 1150;
const AWAY_YEARS_PER_HOUR = 3;     // the city keeps going while the app is shut
const AWAY_CAP = 45;

const TOOLS = [
  { id: 'road',    label: 'Road',    icon: 'M4 17c3-2 3-10 6-12M11 19c3-2 3-10 6-12' },
  { id: 'park',    label: 'Park',    icon: 'M10 18v-4M10 14 5.5 8h3L5 3.5h10L11.5 8h3L10 14z' },
  { id: 'works',   label: 'Works',   icon: 'M3 17h14V9l-4 2.6V9l-4 2.6V9L5 11.6V4H3z' },
  { id: 'station', label: 'Station', icon: 'M6 3h8v9H6zM6 12l-2 5M14 12l2 5M4 8h12' },
  { id: 'tower',   label: 'Tower',   icon: 'M7 18V4h6v14M9 7h2M9 10h2M9 13h2' },
  { id: 'raze',    label: 'Clear',   icon: 'M4 16 16 4M4 4l12 12' }
];

const SVG = (d) => '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + d + '"/></svg>';

const nf = new Intl.NumberFormat('en-GB');

export function mount(root, { back, themeButton }) {
  root.innerHTML = ''
    + '<div class="topbar city-bar"><div class="row">'
    + '<a class="back" href="' + back + '" aria-label="Back">'
    + '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">'
    + '<path d="M11 3L5 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'
    + '<div class="crumb">The City</div>'
    + '<div class="count" id="city-stat">year 0</div>'
    + '<button class="theme-toggle" id="city-speed" type="button" aria-label="Speed"></button>'
    + themeButton
    + '</div></div>'
    + '<div class="city" id="city">'
    + '<canvas id="city-canvas" aria-label="An isometric city, building itself"></canvas>'
    + '<div class="city-chron" id="city-chron" aria-live="polite"></div>'
    + '<div class="city-dock" id="city-dock" role="toolbar" aria-label="Interfere">'
    + TOOLS.map((t, i) =>
        '<button class="tool' + (i === 0 ? ' on' : '') + '" data-tool="' + t.id + '" type="button"'
        + ' aria-label="' + t.label + '" aria-pressed="' + (i === 0) + '">'
        + SVG(t.icon) + '<span>' + t.label + '</span></button>').join('')
    + '</div>'
    + '<button class="city-recenter" id="city-recenter" type="button" aria-label="Frame the city" hidden>'
    + '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v3M10 13v3M4 10h3M13 10h3"/>'
    + '<circle cx="10" cy="10" r="3.2"/></svg></button>'
    + '<div class="city-hint" id="city-hint" hidden>It builds itself.<br>Tap to interfere.</div>'
    + '</div>';

  const canvas = root.querySelector('#city-canvas');
  const recenterBtn = root.querySelector('#city-recenter');
  const statEl = root.querySelector('#city-stat');
  const chronEl = root.querySelector('#city-chron');
  const dock = root.querySelector('#city-dock');
  const speedBtn = root.querySelector('#city-speed');

  const painter = createPainter(canvas);
  let s = load();
  let tool = 'road';
  let cam = { z: 1, px: 0, py: 0 };
  let follow = true, target = null, reframe = true;
  let pulses = [];
  let speed = 1;                   // 0 paused, 1 a year a beat, 3 impatient
  let acc = 0, last = performance.now(), raf = 0;
  let shownEvent = -1, saveAt = 0;
  let alive = true;

  /* ------------------------------------------------------ storage */

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* fresh city */ }
    const city = raw && City.decode(raw);
    if (!city) return City.create();

    // Years pass while the app is closed. Coming back to a city that moved on
    // without you is most of why it is worth coming back.
    const hours = Math.max(0, (Date.now() - (raw.at || Date.now())) / 3.6e6);
    const away = Math.min(AWAY_CAP, Math.floor(hours * AWAY_YEARS_PER_HOUR));
    if (away > 0) {
      for (let i = 0; i < away; i++) City.step(city);
      for (let i = 0; i < City.N * City.N; i++) city.hgt[i] = city.lvl[i];
      city.events.push({ year: city.year, text: away + ' years passed while you were away.' });
    }
    return city;
  }

  function save(force) {
    const now = Date.now();
    if (!force && now - saveAt < 4000) return;
    saveAt = now;
    try { localStorage.setItem(KEY, JSON.stringify(City.encode(s))); }
    catch { /* private mode: this city lives for one sitting */ }
  }

  /* -------------------------------------------------------- chrome */

  function stat() {
    statEl.textContent = 'year ' + s.year + ' · ' + nf.format(s.pop);
  }

  function chronicle() {
    const last = s.events.length - 1;
    if (last < 0 || last === shownEvent) return;
    shownEvent = last;
    const e = s.events[last];
    chronEl.textContent = e.text;
    chronEl.classList.remove('in');
    void chronEl.offsetWidth;
    chronEl.classList.add('in');
  }

  /* The button shows what tapping it will do, not what the clock is doing:
     paused offers to run, running offers to hurry, hurrying offers to stop. */
  const PLAY  = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z"/></svg>';
  const HOLD  = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z"/></svg>';
  const HURRY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 4l7 6-7 6zM11 4l7 6-7 6z"/></svg>';
  const NEXT = { 0: [PLAY, 'Run the years'], 1: [HURRY, 'Hurry the years'], 3: [HOLD, 'Hold the years'] };

  function paintSpeed() {
    const [icon, label] = NEXT[speed];
    speedBtn.innerHTML = icon;
    speedBtn.setAttribute('aria-label', label);
    speedBtn.title = label;
  }

  speedBtn.addEventListener('click', () => {
    speed = speed === 0 ? 1 : speed === 1 ? 3 : 0;
    paintSpeed();
  });

  dock.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]');
    if (!b) return;
    tool = b.dataset.tool;
    for (const other of dock.querySelectorAll('.tool')) {
      const on = other === b;
      other.classList.toggle('on', on);
      other.setAttribute('aria-pressed', String(on));
    }
  });

  /* ------------------------------------------------------ gestures */

  const pointers = new Map();
  let pinch = null, moved = 0, downAt = 0;

  function handsOn() {
    if (!follow) return;
    follow = false;
    recenterBtn.hidden = false;
  }

  function clampCam() {
    const { W, H } = painter.size;
    cam.z = Math.min(3, Math.max(0.35, cam.z));
    const span = City.N * (30 / 2) * cam.z;             // half the grid, in px
    cam.px = Math.min(W + span * 0.8, Math.max(-span * 0.8, cam.px));
    cam.py = Math.min(H + span * 0.5, Math.max(-span * 1.2, cam.py));
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { moved = 0; downAt = performance.now(); }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;

    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 10) handsOn();
      cam.px += dx; cam.py += dy;
      clampCam(); painter.invalidate();
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = canvas.getBoundingClientRect();
      const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
      const z0 = cam.z;
      handsOn();
      cam.z = pinch.z * (d / (pinch.d || d));
      clampCam();
      const k = cam.z / z0;
      cam.px = mx - (mx - cam.px) * k;
      cam.py = my - (my - cam.py) * k;
      clampCam(); painter.invalidate();
      moved += 40;
    }
  });

  function release(e) {
    const wasSingle = pointers.size === 1;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!wasSingle) return;
    if (moved > 10 || performance.now() - downAt > 600) return;

    const r = canvas.getBoundingClientRect();
    const cell = painter.pick(e.clientX - r.left, e.clientY - r.top, cam);
    if (cell.x < 0 || cell.y < 0 || cell.x >= City.N || cell.y >= City.N) return;
    const ok = City.place(s, tool, cell.x, cell.y);
    pulses.push({ x: cell.x, y: cell.y, t: performance.now(), color: ok ? null : 'rgba(150,150,150,.5)' });
    if (ok) {
      painter.invalidate();
      reframe = true;
      chronicle();
      save(true);
      if (navigator.vibrate) try { navigator.vibrate(8); } catch { /* not everywhere */ }
    }
    root.querySelector('#city-hint')?.setAttribute('hidden', '');
  }

  canvas.addEventListener('pointerup', release);

  recenterBtn.addEventListener('click', () => {
    follow = true; reframe = true;
    recenterBtn.hidden = true;
  });
  canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); pinch = null; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    handsOn();
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const z0 = cam.z;
    cam.z *= Math.exp(-e.deltaY * 0.0016);
    clampCam();
    const k = cam.z / z0;
    cam.px = mx - (mx - cam.px) * k;
    cam.py = my - (my - cam.py) * k;
    clampCam(); painter.invalidate();
  }, { passive: false });

  /* ---------------------------------------------------------- loop */

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (speed > 0) {
      acc += dt * 1000 * speed;
      let turns = 0;
      while (acc >= YEAR_MS && turns < 4) { acc -= YEAR_MS; City.step(s); turns++; }
      if (turns) { painter.invalidate(); reframe = true; stat(); chronicle(); save(false); }
    }

    // The camera pulls back as the city outgrows the screen - eased, so the
    // reader reads it as the place growing rather than as the view jumping.
    if (follow) {
      if (reframe || !target) { target = painter.frame(s); reframe = false; }
      const ck = 1 - Math.exp(-dt * 1.7);
      const dz = target.z - cam.z, dx = target.px - cam.px, dy = target.py - cam.py;
      if (Math.abs(dz) > 1e-4 || Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        cam.z += dz * ck; cam.px += dx * ck; cam.py += dy * ck;
        painter.invalidate();
      }
    }

    // Buildings ease toward the height their land allows, so a year of
    // densification arrives as growth rather than as a jump.
    const k = 1 - Math.exp(-dt * 2.4);
    const { hgt, lvl } = s;
    for (let i = 0; i < City.N * City.N; i++) {
      const d = lvl[i] - hgt[i];
      if (d > 0.0004 || d < -0.0004) hgt[i] += d * k;
      else hgt[i] = lvl[i];
    }

    if (pulses.length) pulses = pulses.filter(p => now - p.t < 640);
    painter.draw(s, cam, pulses, now);
    raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------- lifecycle */

  const onResize = () => {
    painter.resize();
    reframe = true;
    if (follow) painter.fit(cam, s);
    painter.invalidate();
  };
  const onTheme = () => { painter.palette(); };
  const onHide = () => { if (document.hidden) save(true); };

  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onHide);
  const themeWatch = new MutationObserver(onTheme);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  painter.resize();
  painter.fit(cam, s);
  paintSpeed();
  stat();
  chronicle();

  if (!localStorage.getItem(HINT_KEY)) {
    const hint = root.querySelector('#city-hint');
    hint.removeAttribute('hidden');
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* fine */ }
    setTimeout(() => hint.setAttribute('hidden', ''), 5200);
  }

  raf = requestAnimationFrame(frame);

  return function dispose() {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onHide);
    themeWatch.disconnect();
    save(true);
  };
}
