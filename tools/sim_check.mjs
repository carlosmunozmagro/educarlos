#!/usr/bin/env node
/* Runtime assertions for the simulation. Run via tools/sim_check.py, which
   adds the static checks and the cross-process determinism run.
   Exits non-zero on the first failure. */

import { readFileSync } from 'node:fs';
import { createWorld, replay, advance, step, applyAction, trace, signature, tickAt }
  from '../app/sim/engine.js';
import { lcmAll, isConjunction, nextConjunction, echoBand, voiceLevel, isPeaking }
  from '../app/sim/world.js';
import { observe, residual } from '../app/sim/instruments.js';

const cfg = JSON.parse(readFileSync(new URL('../content/misterio/senal/sim.json', import.meta.url)));
const SEEDS = ['dorada', 'ligera', 'verano', 'quieta', 'the-signal', 'ñu', '1', ''];

let failures = 0;
function ok(name, cond, detail) {
  if (cond) { console.log('  ok   ' + name); return; }
  failures++;
  console.log('  FAIL ' + name + (detail ? '  -> ' + detail : ''));
}

/* A plausible reader: points, holds, pings, damps, and sometimes tries to
   act with an empty meter. */
function log(seed) {
  const out = [];
  for (let d = 0; d < 12; d++) {
    const b = d * 180;
    out.push({ tick: b + 5, kind: 'listen', bands: [(d * 3) % 16, (d * 3 + 4) % 16, (d + 9) % 16] });
    out.push({ tick: b + 44, kind: 'ping', band: (d * 7) % 16 });
    out.push({ tick: b + 45, kind: 'ping', band: (d * 7 + 1) % 16 });
    out.push({ tick: b + 46, kind: 'ping', band: (d * 7 + 2) % 16 });
    out.push({ tick: b + 47, kind: 'ping', band: (d * 7 + 3) % 16 });   // must be refused
    out.push({ tick: b + 120, kind: 'damp', band: (d * 5 + 2) % 16 });
  }
  return out;
}

console.log('world shape');
for (const seed of SEEDS) {
  const w = createWorld(cfg, seed);
  const label = '"' + seed + '"';

  ok('periods are integer multiples of P  ' + label,
    w.voices.every(v => v.period % w.P === 0 && v.period / w.P === v.mult));

  ok('grand cycle is lcm(multiples) x P   ' + label,
    w.cycle === lcmAll(w.mults) * w.P, w.cycle + ' vs ' + lcmAll(w.mults) * w.P);

  /* The gift. Every family must contain a voice whose period is exactly one
     day, so there is always one thread a reader can pull without theory. */
  ok('exactly one voice of exactly 24 h    ' + label,
    w.voices.filter(v => v.period * cfg.tickMinutes === 1440).length === 1,
    w.voices.map(v => v.period * cfg.tickMinutes / 60 + 'h').join(' '));

  /* If the echo delay were a multiple of P it would be indistinguishable from
     the harmonic family, and layer two would dissolve into layer one. */
  ok('echo delay is not a multiple of P    ' + label, w.delay % w.P !== 0);

  const img = new Set(Array.from({ length: cfg.bands }, (_, b) => echoBand(w, b)));
  ok('band map is a permutation           ' + label, img.size === cfg.bands);

  ok('voices start on distinct bands      ' + label,
    new Set(w.voices.map(v => v.home)).size === w.voices.length);
}

console.log('\nconjunctions');
for (const seed of SEEDS.slice(0, 4)) {
  const w = createWorld(cfg, seed);
  const found = [];
  for (let t = 0; t < w.cycle * 3; t++) {
    let n = 0;
    for (const v of w.voices) if (isPeaking(w, v, t)) n++;
    if (n === w.voices.length) found.push(t);
  }
  const centres = found.filter(t => isConjunction(w, t));
  ok('all five peak only around a conjunction  "' + seed + '"',
    centres.length > 0 && found.every(t =>
      Math.abs(t - centres.reduce((a, c) => (Math.abs(t - c) < Math.abs(t - a) ? c : a), centres[0]))
        <= cfg.predictTolerance + 2),
    found.join(','));

  ok('nextConjunction agrees with the sweep    "' + seed + '"',
    centres.every((c, i) => i === 0 || nextConjunction(w, centres[i - 1]) === c));

  ok('conjunctions are exactly one cycle apart "' + seed + '"',
    centres.every((c, i) => i === 0 || c - centres[i - 1] === w.cycle));
}

console.log('\nreplay');
for (const seed of SEEDS.slice(0, 4)) {
  const w = createWorld(cfg, seed);
  const L = log(seed);
  const N = 2000;
  const whole = replay(w, L, N);

  /* The property the whole design rests on: an absence fast-forwarded is
     identical to having been present for it. Split at awkward places -
     on an action tick, on a conjunction, on tick zero. */
  let split = true, where = '';
  for (const k of [1, 44, 45, 46, 47, 120, 500, 860, 1080, 1999]) {
    const s = advance(w, replay(w, L, k), N, L);
    if (signature(s) !== signature(whole)) { split = false; where = String(k); break; }
  }
  ok('replay(0..N) === replay(0..k) + advance  "' + seed + '"', split, 'split at ' + where);

  ok('replay is idempotent                     "' + seed + '"',
    signature(replay(w, L, N)) === signature(whole));

  ok('trace ends where replay ends             "' + seed + '"',
    signature(trace(w, L, 0, N, (_, s) => s).at(-1)) === signature(whole));

  ok('trace length matches the span            "' + seed + '"',
    trace(w, L, 100, 300, (_, s) => s.tick).length === 201);
}

console.log('\ninvariants under a long run');
for (const seed of SEEDS.slice(0, 4)) {
  const w = createWorld(cfg, seed);
  const L = log(seed);
  let s = replay(w, L, 0);
  let chargeOk = true, distinct = true, dampOk = true, refused = 0, echoes = 0;
  const pings = [];

  for (let t = 1; t <= 2200; t++) {
    s = step(w, s);
    for (const a of L) if (a.tick === s.tick) s = applyAction(w, s, a);

    if (s.charges < 0 || s.charges > cfg.charges.max) chargeOk = false;
    if (new Set(s.bands).size !== s.bands.length) distinct = false;
    for (const v of w.voices) if (s.damp[s.bands[v.id]] > s.tick) dampOk = false;
    for (const e of s.events) {
      if (e.kind === 'refused') refused++;
      if (e.kind === 'ping') pings.push({ t: s.tick, band: e.band });
      if (e.kind === 'echo') {
        echoes++;
        const src = pings.find(p => p.t === e.at);
        if (!src || echoBand(w, src.band) !== e.band || e.at + w.delay !== s.tick) echoes = -1e9;
      }
    }
  }

  ok('charges stay within [0, cap]             "' + seed + '"', chargeOk);
  ok('no two voices share a band               "' + seed + '"', distinct);
  ok('no voice sits in a damped band           "' + seed + '"', dampOk);
  ok('a fourth ping in a row is refused        "' + seed + '"', refused > 0, String(refused));
  ok('every echo is a real ping, delayed+mapped "' + seed + '"', echoes > 0, String(echoes));
}

console.log('\nwhat the reader is allowed to see');
{
  const w = createWorld(cfg, 'dorada');
  const s = replay(w, log('dorada'), 900);
  const o = observe(w, s);

  ok('fine resolution on exactly three bands',
    Object.keys(o.fine).length === 3 && o.attention.length === 3);

  ok('coarse groups cover the rest of the spectrum',
    o.coarse.length === cfg.bands / cfg.coarseGroupSize);

  /* Every band is reported exactly once - finely or inside one total. A group
     that forgets how many bands it pooled renders them as empty, which reads
     as "nothing lives here" about a band that was never actually measured. */
  ok('every band is accounted for exactly once',
    o.coarseCount.reduce((a, c) => a + c, 0) + Object.keys(o.fine).length === cfg.bands);

  const tight = replay(w, [{ tick: 10, kind: 'listen', bands: [0, 1, 2] }], 900);
  const to = observe(w, tight);
  ok('a group with one band left pools exactly one', to.coarseCount[0] === 1);

  /* The instrument must not leak the answer before it is earned. */
  ok('residual is sealed below layer two', residual(w, s, 1) === null);
  ok('residual opens at layer two', Array.isArray(residual(w, s, 2)));

  /* Actual minus model leaves the noise floor and nothing else - until an
     echo sounds. Layer two is only deducible if that echo stands clearly
     above the floor, so the gap between the two is asserted, not assumed.
     Set the gain near the noise and the residual becomes genuinely
     ambiguous, which would make the layer unfair rather than hard. */
  const quiet = replay(w, [], 900);
  ok('with no pings, the residual is only noise',
    residual(w, quiet, 2).every(v => Math.abs(v) <= cfg.noiseFloor + 1e-9));

  const pinged = replay(w, [{ tick: 100, kind: 'ping', band: 5 }], 100 + w.delay);
  const r = residual(w, pinged, 2);
  ok('an echo stands well clear of the noise',
    Math.max(...r) > cfg.noiseFloor * 4, Math.max(...r).toFixed(3));
  ok('the echo lands in the mapped band',
    r.indexOf(Math.max(...r)) === echoBand(w, 5));
}

console.log('\nthe clock');
{
  const ms = Date.parse(cfg.epoch);
  const min = cfg.tickMinutes * 60000;
  ok('tick 0 at the epoch', tickAt(cfg, ms) === 0);
  ok('one tick per configured interval', tickAt(cfg, ms + min * 7) === 7);
  ok('mid-tick truncates down', tickAt(cfg, ms + min * 7 + min - 1) === 7);
  ok('before the epoch clamps to zero', tickAt(cfg, ms - 1e9) === 0);
}

console.log('\nsignal shape');
{
  const w = createWorld(cfg, 'dorada');
  const v = w.voices[0];
  ok('a voice is loudest exactly at its peak',
    voiceLevel(w, v, w.offset) > voiceLevel(w, v, w.offset + 1));
  ok('a voice never falls silent between peaks',
    voiceLevel(w, v, w.offset + v.period / 2) >= v.amp * cfg.humFloor - 1e-9);
  /* Continuous in time, not stepped: this is what the live pulse renders. */
  ok('the signal is defined between ticks',
    voiceLevel(w, v, w.offset + 0.5) < voiceLevel(w, v, w.offset)
    && voiceLevel(w, v, w.offset + 0.5) > voiceLevel(w, v, w.offset + 1));
}

console.log('');
if (failures) { console.log(failures + ' FAILED'); process.exit(1); }
console.log('all checks passed');
