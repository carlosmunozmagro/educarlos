/* The console. Phase two: read-only, plus where to point.

   Three surfaces, and between them they are the whole argument of the design:

     the waterfall  where the signal has been, at the resolution the reader
                    had at the time
     the strip      sixteen bands, three of which they are listening to
     the pulse      the same signal now, continuous, moving

   Near-wordless on purpose. The only glyphs are hexadecimal band numbers and
   a tick count, so this sits outside the EN/ES split and says nothing that
   could explain itself. */

import * as Theme from '../theme.js';
import { createWorld, replay, advance, applyAction, trace } from './engine.js';
import { bandLevelAt } from './world.js';
import { observe } from './instruments.js';
import * as Journal from './journal.js';

const HEX = '0123456789ABCDEF';

/* The pulse is an oscilloscope, and these two numbers are what make it one.

   The world's fastest event is a peak, which takes about forty minutes to
   rise. Plotted directly, the trace moves less than a pixel a second: the
   "live pulse" was, on first build, a still picture. So the pulse draws what a
   receiver draws - a carrier, with the band's level as its envelope.

   The carrier is a display convention, not a phenomenon. Fixed frequency,
   identical in every band, never varying with anything in the world, so it
   cannot be mistaken for information and there is nothing in it to deduce. It
   is the same kind of object as the colour ramp or an axis. Everything that
   means anything is in the envelope, and the envelope is the signal. */
const CARRIER_HZ = 0.5;
const WINDOW_SEC = 5;
const BACK = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3L5 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hexToRGB(s) {
  const m = /^#?([0-9a-f]{6})$/i.exec((s || '').trim());
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function mount(app, cfg, simId) {
  const now = Date.now();
  const tickMs = cfg.tickMinutes * 60000;

  /* One number decides both how deep the waterfall runs and how long the
     world had been running when the reader first opened it. They are the same
     number because they are the same span: the console shows exactly the
     history it has. */
  const ROWS = cfg.historyTicks;
  const run = Journal.load(simId, now, ROWS * tickMs);

  const wcfg = { ...cfg, epoch: new Date(run.startedAt).toISOString() };
  const tickNow = () => Math.max(0, Math.floor((Date.now() - run.startedAt) / tickMs));
  const secNow = () => Math.max(0, (Date.now() - run.startedAt) / 1000);

  /* Display levels, not raw ones. Two corrections, and without either the
     waterfall lies about what is there.

     A group total carries four bands' worth of noise, so dividing it by four
     to spread it across the columns leaves real signal dimmer than a single
     watched band and the coarse half of the spectrum reads as dead. Instead
     take out the noise the other three bands contribute: what remains is the
     signal in the group, at the same scale as a band, spread across the four
     columns it might be in. Same brightness, no location - which is exactly
     what the reader knows.

     Then the floor. Noise is not information, and a ramp that starts at zero
     spends its first third rendering it, so an empty watched band looks much
     like one with a voice humming in it. Subtracting most of the floor puts
     empty back at empty and leaves just enough grain to read as a receiver
     rather than a chart. */
  const NOISE_MEAN = cfg.noiseFloor / 2;
  const FLOOR = cfg.noiseFloor * 0.6;

  function levelOf(obs, band) {
    if (band in obs.fine) return obs.fine[band];
    const g = Math.floor(band / obs.coarseSize);
    const pooled = obs.coarseCount[g] || 1;
    return Math.max(0, obs.coarse[g] - (pooled - 1) * NOISE_MEAN);
  }

  const world = createWorld(wcfg, run.seed);
  let tick = tickNow();
  let state = replay(world, run.log, tick);

  /* History is recomputed, never stored. Two days away renders in full. */
  let rows = trace(world, run.log, Math.max(0, tick - ROWS + 1), tick, observe);

  document.documentElement.lang = 'en';
  document.title = 'Educarlos';
  app.style.setProperty('--accent', cfg.accent || '#7f8fd6');

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/s/misterio" aria-label="Back">' + BACK + '</a>'
    + '<div class="crumb mono" id="sim-clock"></div>'
    + '<div class="count mono" id="sim-charges"></div>'
    + Theme.button('en')
    + '</div></div>'
    + '<div class="sim">'
    + '<canvas id="sim-fall" class="sim-fall"></canvas>'
    + '<div class="sim-strip" id="sim-strip">'
    + Array.from({ length: cfg.bands }, (_, b) =>
        '<button class="sim-band" data-band="' + b + '" type="button">'
        + '<span class="g">' + HEX[b] + '</span><span class="m"></span></button>').join('')
    + '</div>'
    + '<canvas id="sim-pulse" class="sim-pulse"></canvas>'
    + '</div>';

  const fall = document.getElementById('sim-fall');
  const pulse = document.getElementById('sim-pulse');
  const strip = document.getElementById('sim-strip');
  const clock = document.getElementById('sim-clock');
  const charges = document.getElementById('sim-charges');
  const fx = fall.getContext('2d');
  const px = pulse.getContext('2d');

  let lo = [30, 36, 48], hi = [200, 210, 255], dead = [11, 13, 16];
  let faint = '#6f7c8a';
  function palette() {
    const cs = getComputedStyle(fall);
    lo = hexToRGB(cs.getPropertyValue('--sim-lo'));
    hi = hexToRGB(cs.getPropertyValue('--sim-hi'));
    dead = hexToRGB(cs.getPropertyValue('--sim-dead'));
    faint = cs.getPropertyValue('--text-faint').trim() || faint;
  }

  /* The signal's useful range is not linear in the eye. Above the floor, a
     hum sits near 0.2 and a peak near 1.0, so a straight ramp spends its
     contrast on levels that never occur and renders everything as pale wash.
     The gamma pulls the low end up: a hum lands about a third along, quietly
     present, and a peak still has the top half to arrive into.

     Used for the pulse's height as well as the waterfall's colour, so the two
     surfaces agree about what "loud" looks like. */
  const shape = (level) =>
    Math.pow(clamp01((level - FLOOR) / (1.05 - FLOOR)), 0.6);

  /* Three stops: dead, present, peaking. The tokens swap between themes; the
     ramp does not. */
  function ink(level) {
    const k = shape(level);
    const c = k < 0.45
      ? [0, 1, 2].map(i => dead[i] + (lo[i] - dead[i]) * (k / 0.45))
      : [0, 1, 2].map(i => lo[i] + (hi[i] - lo[i]) * ((k - 0.45) / 0.55));
    return 'rgb(' + c.map(v => Math.round(v)).join(',') + ')';
  }

  let dpr = 1, fw = 0, fh = 0, pw = 0, ph = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const fr = fall.getBoundingClientRect();
    const pr = pulse.getBoundingClientRect();
    fw = Math.max(1, Math.round(fr.width));
    fh = Math.max(1, Math.round(fr.height));
    pw = Math.max(1, Math.round(pr.width));
    ph = Math.max(1, Math.round(pr.height));
    fall.width = fw * dpr; fall.height = fh * dpr;
    pulse.width = pw * dpr; pulse.height = ph * dpr;
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    px.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* Newest at the top, history falling away below - the way a receiver's
     waterfall has always run. */
  function drawFall() {
    const n = rows.length;
    if (!n) return;
    const colW = fw / cfg.bands;
    const rowH = fh / ROWS;
    fx.fillStyle = 'rgb(' + dead.join(',') + ')';
    fx.fillRect(0, 0, fw, fh);
    for (let i = 0; i < n; i++) {
      const obs = rows[n - 1 - i];
      const y = i * rowH;
      for (let b = 0; b < cfg.bands; b++) {
        fx.fillStyle = ink(levelOf(obs, b));
        fx.fillRect(b * colW, y, colW + 0.5, rowH + 0.5);
      }
    }
    /* A hairline under the bands being listened to, so the sharp columns are
       findable at a glance without labelling them. */
    const att = rows[n - 1].attention;
    fx.fillStyle = 'rgb(' + hi.join(',') + ')';
    for (const b of att) fx.fillRect(b * colW, 0, colW, 2);
  }

  /* One lane per watched band, so the three are compared rather than
     overlaid. A lane with nothing in it is a flat line; a lane with a voice
     humming breathes; a lane with a voice peaking fills. */
  function drawPulse(nowSec) {
    px.clearRect(0, 0, pw, ph);
    const att = state.attention;
    const lanes = att.length || 1;
    const laneH = ph / lanes;
    const steps = Math.min(pw, 220);

    px.lineWidth = 1.4;
    px.lineJoin = 'round';
    px.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
    px.textBaseline = 'middle';

    att.forEach((b, i) => {
      const mid = laneH * (i + 0.5);
      const amp = laneH * 0.38;

      px.strokeStyle = faint;
      px.globalAlpha = 0.5;
      px.beginPath();
      px.moveTo(16, mid); px.lineTo(pw - 2, mid);
      px.stroke();

      px.globalAlpha = 1;
      px.fillStyle = faint;
      px.fillText(HEX[b], 4, mid);

      px.strokeStyle = ink(1.05);
      px.beginPath();
      for (let s = 0; s <= steps; s++) {
        const sec = nowSec - WINDOW_SEC + (WINDOW_SEC * s) / steps;
        const tc = (sec * 1000) / tickMs;
        const env = shape(bandLevelAt(world, state, b, tc));
        const x = 16 + ((pw - 18) * s) / steps;
        const y = mid - env * amp * Math.sin(2 * Math.PI * CARRIER_HZ * sec);
        s ? px.lineTo(x, y) : px.moveTo(x, y);
      }
      px.stroke();
    });
  }

  function drawStrip() {
    const att = state.attention;
    for (const el of strip.children) {
      el.classList.toggle('on', att.includes(Number(el.dataset.band)));
    }
  }

  function drawChrome() {
    const d = Math.floor((tick * cfg.tickMinutes) / 1440);
    const h = Math.floor(((tick * cfg.tickMinutes) % 1440) / 60);
    clock.textContent = String(d) + 'd ' + String(h).padStart(2, '0') + 'h';
    charges.textContent = '·'.repeat(state.charges) || '—';
  }

  /* Attention is free, but it is still a choice and it is still logged: what
     the reader was listening to at each tick is part of the run, and it is
     what decides whether a voice noticed them. */
  function point(band) {
    const att = state.attention.slice();
    const i = att.indexOf(band);
    if (i >= 0) { if (att.length <= 1) return; att.splice(i, 1); }
    else { att.push(band); while (att.length > 3) att.shift(); }
    const action = { tick, kind: 'listen', bands: att };
    Journal.append(simId, run, action);
    state = applyAction(world, state, action);
    rows[rows.length - 1] = observe(world, state);
    drawStrip(); drawFall();
  }

  strip.addEventListener('click', (e) => {
    const btn = e.target.closest('.sim-band');
    if (btn) point(Number(btn.dataset.band));
  });

  /* Wall-clock time crossing a tick boundary is the only thing that advances
     the world. Caught here rather than on a timer, so a phone that slept for
     six hours catches up on the next frame instead of missing them. */
  function catchUp() {
    const t = tickNow();
    if (t === tick) return false;
    state = advance(world, state, t, run.log);
    for (let k = tick + 1; k <= t; k++) {
      rows.push(k === t ? observe(world, state) : null);
    }
    /* Anything skipped over is filled by recomputing the span exactly. */
    if (rows.some(r => r === null)) {
      rows = trace(world, run.log, Math.max(0, t - ROWS + 1), t, observe);
    }
    while (rows.length > ROWS) rows.shift();
    tick = t;
    Journal.seen(simId, run, tick);
    return true;
  }

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, alive = true;

  function frame() {
    if (!alive) return;
    if (catchUp()) { drawFall(); drawChrome(); }
    drawPulse(secNow());
    if (!still) raf = requestAnimationFrame(frame);
  }

  function relayout() { size(); palette(); drawFall(); drawPulse(secNow()); }

  const onResize = () => relayout();
  addEventListener('resize', onResize);

  /* A repaint after the theme swap, since the ramp is read from CSS. */
  const onTheme = () => setTimeout(relayout, 0);
  document.addEventListener('click', onTheme);

  size(); palette();
  drawFall(); drawStrip(); drawChrome();
  Journal.seen(simId, run, tick);
  frame();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener('resize', onResize);
    document.removeEventListener('click', onTheme);
  };
}
