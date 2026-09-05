/* State, stepping, and replay.

   state = fold(rules, seed, choiceLog). Nothing derived is ever stored, and
   nothing stored is ever derived from the wall clock, so:

     replay(0..N)  ===  replay(0..K) then advance(K..N),  split anywhere

   which is the property that lets an absence be fast-forwarded rather than
   simulated in real time. tools/sim_check.mjs asserts it. */

import { int } from './rng.js';
import { createWorld, voiceLevel, isPeaking, echoBand, isConjunction } from './world.js';

export { createWorld };

/* Wall clock enters the system here and nowhere else. Passed a timestamp -
   never reading one - so app/sim/ stays free of Date.now and stays testable. */
export function tickAt(cfg, nowMs) {
  const epoch = Date.parse(cfg.epoch);
  return Math.max(0, Math.floor((nowMs - epoch) / (cfg.tickMinutes * 60000)));
}

export function initState(world) {
  return {
    tick: 0,
    bands: world.voices.map(v => v.home),
    seen: world.voices.map(() => 0),
    charges: world.cfg.charges.max,
    regen: 0,
    damp: new Array(world.cfg.bands).fill(0),
    transients: [],
    pending: [],
    attention: [0, 1, 2],
    events: []
  };
}

const clone = (s) => ({
  tick: s.tick,
  bands: s.bands.slice(),
  seen: s.seen.slice(),
  charges: s.charges,
  regen: s.regen,
  damp: s.damp.slice(),
  transients: s.transients.map(t => ({ ...t })),
  pending: s.pending.map(p => ({ ...p })),
  attention: s.attention.slice(),
  events: []
});

/* Where a dislodged voice goes. Never into a damped band and never on top of
   another voice.

   Whether it avoids the reader's attention depends on why it is moving, and
   this is load-bearing. A voice fleeing because it was watched evades: it
   will not move into a band being listened to. A voice evicted by a ping or a
   damp is not fleeing the reader, and lands wherever it lands.

   Making evasion unconditional was the obvious first cut and it is fatal:
   nothing could ever move into attention, so every voice drifts permanently
   out of view and the world converges on a dead screen. The asymmetry is also
   what makes damping worth a charge - it is the one way to push a voice
   somewhere you can see it, which is the difference between an instrument and
   a decoration. */
function relocate(world, s, voice, why) {
  const taken = new Set(s.bands);
  const evades = why === 'shy';
  const cand = [];
  for (let b = 0; b < world.cfg.bands; b++) {
    if (b === s.bands[voice.id]) continue;
    if (s.damp[b] > s.tick) continue;
    if (taken.has(b)) continue;
    if (evades && s.attention.includes(b)) continue;
    cand.push(b);
  }
  /* Cornered - damped and watched everywhere it could go. It still has to
     move, so the last resort drops the evasion but never the damping, which
     is the rule the reader paid a charge for. */
  if (!cand.length) {
    for (let b = 0; b < world.cfg.bands; b++) {
      if (b !== s.bands[voice.id] && s.damp[b] <= s.tick && !taken.has(b)) cand.push(b);
    }
  }
  if (!cand.length) return;

  const from = s.bands[voice.id];
  const to = cand[int(world.seed, s.tick * 31 + voice.id, 'move', cand.length)];
  s.bands[voice.id] = to;
  s.seen[voice.id] = 0;
  s.events.push({ kind: 'move', voice: voice.id, from, to, why });
}

/* ----------------------------------------------------------------- step */

export function step(world, prev) {
  const s = clone(prev);
  s.tick = prev.tick + 1;
  const cfg = world.cfg;

  /* Charges accrue only while there is room for them, so a full meter does
     not bank time and refill instantly the moment one is spent. The pace of
     the whole thing rests on this. */
  if (s.charges < cfg.charges.max) {
    s.regen++;
    if (s.regen >= cfg.charges.regenTicks) { s.charges++; s.regen = 0; }
  } else {
    s.regen = 0;
  }

  for (let b = 0; b < cfg.bands; b++) {
    if (s.damp[b] && s.damp[b] <= s.tick) {
      s.damp[b] = 0;
      s.events.push({ kind: 'undamp', band: b });
    }
  }

  for (const v of world.voices) {
    if (s.damp[s.bands[v.id]] > s.tick) { relocate(world, s, v, 'damp'); continue; }

    /* Shyness. A voice only notices being watched while it is transmitting -
       it counts the times it was caught mid-peak, not the ticks it spent
       being stared at in silence. So the rule a reader arrives at is
       "it moves after I catch it a few times", which is a sentence somebody
       can actually reach from evidence.

       Counted on the rising edge, so one peak is one catch. Counting every
       peaking tick instead looks identical in the code and is not: a peak is
       about five ticks wide, so a shyness of six was really a shyness of just
       over one, and a voice bolted before a reader could ever watch it peak
       twice. Two successive peaks of the same voice is the minimum evidence
       for a period - the measurement layer one is built on - so that version
       quietly made the whole thing unsolvable.

       No extra state: whether it was peaking a tick ago is a pure function of
       the tick, so the edge is recomputed rather than remembered. */
    const on = isPeaking(world, v, s.tick);
    const was = isPeaking(world, v, s.tick - 1);
    if (on && !was && s.attention.includes(s.bands[v.id])) {
      s.seen[v.id]++;
      if (s.seen[v.id] >= cfg.shyness) relocate(world, s, v, 'shy');
    }
  }

  const due = [];
  s.pending = s.pending.filter(p => (p.at === s.tick ? (due.push(p), false) : p.at > s.tick));
  for (const p of due) {
    s.transients.push({ band: p.band, start: s.tick, ring: cfg.ping.ringTicks,
      amp: cfg.echo.gain, kind: 'echo' });
    s.events.push({ kind: 'echo', band: p.band, of: p.of, at: p.src });
  }

  s.transients = s.transients.filter(tr => s.tick - tr.start < tr.ring);

  if (isConjunction(world, s.tick)) s.events.push({ kind: 'conjunction' });
  return s;
}

/* --------------------------------------------------------------- action */

/* Applied after the tick they are stamped with has been stepped into.
   An action that cannot be afforded is a logged no-op rather than an error:
   the log is a record of what the reader did, including what they tried. */
export function applyAction(world, s, a) {
  const cfg = world.cfg;

  if (a.kind === 'listen') {
    s.attention = a.bands.slice(0, 3);
    s.events.push({ kind: 'listen', bands: s.attention.slice() });
    return s;
  }

  if (s.charges < 1) { s.events.push({ kind: 'refused', of: a.kind }); return s; }

  if (a.kind === 'ping') {
    s.charges--;
    /* Sonar. A ping into an empty band dies quickly; a ping into a band with
       a voice in it rings on. That difference is the only way to learn what
       lives in the thirteen bands nobody is listening to, and it is why a
       reader pings at all - which is what feeds the echo that becomes
       layer two. The instrument and the trap are the same instrument. */
    const occupied = s.bands.includes(a.band) && s.damp[a.band] <= s.tick;
    s.transients.push({
      band: a.band, start: s.tick, amp: 1, kind: 'ping',
      ring: occupied ? cfg.ping.ringTicks : cfg.ping.decayTicks
    });
    for (const v of world.voices) if (s.bands[v.id] === a.band) relocate(world, s, v, 'ping');
    s.pending.push({ at: s.tick + world.delay, band: echoBand(world, a.band), of: a.band, src: s.tick });
    s.events.push({ kind: 'ping', band: a.band, rang: occupied });
    return s;
  }

  if (a.kind === 'damp') {
    s.charges--;
    s.damp[a.band] = s.tick + cfg.damp.durationTicks;
    for (const v of world.voices) if (s.bands[v.id] === a.band) relocate(world, s, v, 'damp');
    s.events.push({ kind: 'damp', band: a.band, until: s.damp[a.band] });
    return s;
  }

  return s;
}

/* ---------------------------------------------------------------- drive */

function applyAt(world, s, log) {
  for (const a of log) if (a.tick === s.tick) s = applyAction(world, s, a);
  return s;
}

export function advance(world, state, toTick, log = []) {
  let s = state;
  while (s.tick < toTick) {
    s = step(world, s);
    s = applyAt(world, s, log);
  }
  return s;
}

export function replay(world, log = [], toTick = 0) {
  let s = applyAt(world, initState(world), log);
  return advance(world, s, toTick, log);
}

/* The past, reconstructed.

   A waterfall shows history, and this is what fills it. Because the world is
   a fold over the log, any past tick can be recomputed exactly rather than
   remembered - so nothing about the trace has to be persisted, and a reader
   who opens the console after two days away gets those two days rendered in
   full instead of a gap.

   It is also what makes the design survive its own arithmetic: a voice peaks
   for about five ticks in a period of sixty to two hundred and seventy, so
   almost nobody would ever be present at a peak. They do not have to be. They
   read it off the trace afterwards, which is what a waterfall is for and how
   the periods actually get measured. */
export function trace(world, log, fromTick, toTick, sample = (w, s) => s) {
  let s = replay(world, log, fromTick);
  const out = [sample(world, s)];
  while (s.tick < toTick) {
    s = step(world, s);
    s = applyAt(world, s, log);
    out.push(sample(world, s));
  }
  return out;
}

/* Everything that must match for two runs to be the same run. Excludes
   `events`, which describe the tick just taken rather than the state. */
export function signature(s) {
  return JSON.stringify([s.tick, s.bands, s.seen, s.charges, s.regen, s.damp,
    s.transients, s.pending, s.attention]);
}
