/* The hidden rules.

   Pure. No DOM, no clock, no randomness that is not a hash of the seed. This
   file is the answer to the mystery, written as code. A reader who finds it
   learns the physics - that the voices are harmonic, that the residual is a
   delayed echo - but not their own P, their multiples, their delay or their
   permutation. Those come from the seed. The theory is free; the measurement
   is still theirs to do.

   See docs/MISTERIO.md for the same thing in prose. */

import { seedFrom, unit, int, pick, shuffle, range } from './rng.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm2 = (a, b) => (a / gcd(a, b)) * b;
export const lcmAll = (xs) => xs.reduce(lcm2, 1);

/* ------------------------------------------------------------- creation */

/* Every voice's period is an integer multiple of one base period P. That is
   the whole of layer one. Because the multiples share factors, partial
   alignments happen several times a day - the training set - and all five
   coincide once per lcm(multiples) x P, which is the grand conjunction.

   The families are chosen so that lcm lands between four and six days, and
   so that exactly one voice has a period of exactly 24 hours. That voice
   sings at the same wall-clock time every day, and it is the first thread
   anyone pulls. It is a gift, and it is deliberate. */
export function createWorld(cfg, seedPhrase) {
  const seed = seedFrom(seedPhrase);
  const mults = pick(seed, 0, 'family', cfg.multipleFamilies);
  const P = cfg.basePeriod;
  const cycle = lcmAll(mults) * P;

  /* One offset, shared by every voice, so the alignment structure is exact
     rather than approximate. The reader cannot see it directly: it is only
     ever inferable from when things coincide. */
  const offset = int(seed, 0, 'offset', cycle);

  const homes = shuffle(seed, 'homes', range(cfg.bands)).slice(0, mults.length);
  const voices = mults.map((m, i) => ({
    id: i,
    mult: m,
    period: m * P,
    home: homes[i],
    amp: 0.72 + unit(seed, i, 'amp') * 0.28
  }));

  /* Layer two. The echo delay is deliberately not a multiple of P, so that an
     echo can never be mistaken for part of the harmonic family - the residual
     has to look aperiodic against the model, or the layers would blur.

     The band map is affine, pi(b) = (mult*b + add) mod bands, with mult odd so
     it is a genuine permutation of a 16-band spectrum. A reader who plots
     "band I pinged" against "band that answered" gets a straight line. That is
     the intended moment of discovery, so the map must be simple enough to
     survive being plotted by hand. */
  const delay = pick(seed, 0, 'delay', cfg.echo.delays);
  const map = {
    mult: pick(seed, 0, 'mapMult', cfg.echo.mapMults),
    add: int(seed, 0, 'mapAdd', cfg.bands)
  };

  return { seed, cfg, mults, P, cycle, offset, voices, delay, map };
}

export const echoBand = (world, band) =>
  (world.map.mult * band + world.map.add) % world.cfg.bands;

/* --------------------------------------------------------------- signal */

/* A voice hums continuously and peaks periodically. The peak is a Gaussian in
   tick-space, about five ticks wide at the default settings.

   The hum matters more than it looks. Without it a voice only exists during
   its peak, which is a few per cent of its period - so a reader watching
   three bands of sixteen would find an empty spectrum on nearly every visit
   and reasonably conclude the thing was broken. With it, a band that has a
   voice in it always shows something, finding one is a reward in itself, and
   the puzzle moves to where it belongs: not "is anything there" but "what is
   the period of the thing that is".

   `tick` is deliberately not required to be an integer. The state machine
   steps every eight minutes, but the signal is continuous, so the console can
   evaluate this at sixty frames a second and show a peak visibly rising
   during a short visit. That is the live pulse, and it is the same function -
   not a decorative animation layered over a frozen state. */
export function voiceLevel(world, voice, tick) {
  const p = voice.period;
  let d = ((tick - world.offset) % p + p) % p;
  if (d > p / 2) d -= p;
  const w = world.cfg.peakWidth;
  const hum = world.cfg.humFloor;
  return voice.amp * (hum + (1 - hum) * Math.exp(-(d * d) / (2 * w * w)));
}

export const isPeaking = (world, voice, tick) =>
  voiceLevel(world, voice, tick) / voice.amp >= world.cfg.peakThreshold;

/* How many voices are peaking together. The reader can never see this number
   directly - they can watch three bands of sixteen - but it is what they are
   ultimately trying to predict. */
export function alignment(world, tick) {
  let n = 0;
  for (const v of world.voices) if (isPeaking(world, v, tick)) n++;
  return n;
}

export const isConjunction = (world, tick) =>
  ((tick - world.offset) % world.cycle + world.cycle) % world.cycle === 0;

/* The next tick, strictly after `tick`, at which every voice peaks at once. */
export function nextConjunction(world, tick) {
  const c = world.cycle;
  const since = ((tick - world.offset) % c + c) % c;
  return tick + (c - since);
}

/* --------------------------------------------------------------- levels */

/* One band, at any moment - including between ticks.

   This is what the live pulse draws. `at` is a tick position and may be
   fractional: the state machine steps every eight minutes, but the signal it
   describes is continuous, so a reader watching for two minutes sees a peak
   visibly rising rather than a frozen frame. Same function, same world, finer
   sampling - the motion on screen is the signal, not an animation of it.

   Noise is left out deliberately. It is defined per whole tick, and stepping
   it at sixty frames a second would either strobe or have to be invented
   between ticks, which would be the one bit of the picture that is not true. */
export function bandLevelAt(world, state, band, at) {
  if (state.damp[band] > state.tick) return 0;   // a damped band returns nothing
  let v = 0;
  for (const vo of world.voices) {
    if (state.bands[vo.id] === band) v += voiceLevel(world, vo, at);
  }
  for (const tr of state.transients) {
    if (tr.band !== band) continue;
    const age = at - tr.start;
    if (age >= 0 && age < tr.ring) v += tr.amp * Math.exp(-age / (tr.ring / 3));
  }
  return v;
}

/* Derived, never stored. Keeping the per-band signal out of state is what
   makes a replay cheap: state carries only what cannot be recomputed. */
export function bandLevels(world, state) {
  const n = world.cfg.bands;
  const out = new Array(n).fill(0);
  for (let b = 0; b < n; b++) {
    out[b] = bandLevelAt(world, state, b, state.tick)
      + unit(world.seed, state.tick, 'noise' + b) * world.cfg.noiseFloor;
  }
  return out;
}

/* The harmonic model alone - what a reader who has solved layer one can
   predict. Actual minus this is the residual, and the residual is the echo. */
export function modelLevels(world, state) {
  const n = world.cfg.bands;
  const out = new Array(n).fill(0);
  for (const v of world.voices) {
    const b = state.bands[v.id];
    if (state.damp[b] > state.tick) continue;
    out[b] += voiceLevel(world, v, state.tick);
  }
  return out;
}
