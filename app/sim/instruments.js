/* What the reader is permitted to see.

   Every view of the world goes through here. The console never touches
   world.js directly, so there is exactly one place where "what is true" is
   narrowed to "what is observable", and one place to check that we have not
   accidentally handed the answer over. */

import { bandLevels, modelLevels } from './world.js';

/* Three bands at full resolution. The rest of the spectrum comes back as a
   handful of group totals - four bands summed into one number each.

   The groups are the search gradient, and the design does not work without
   them. A single global aggregate was the first cut: it makes the spectrum
   unsearchable, which sounds like admirable severity and is actually just a
   dead end. Three slots, sixteen bands, no direction, and the only sonar a
   ping that costs a charge and evicts whatever it finds - a reader would
   point at random forever and never hear anything.

   Groups fix it without giving the spectrum away. A hot group says roughly
   where to look; it never says which of its four bands, because the total is
   a sum. One loud band and three quiet ones read the same as four middling
   ones. So attention still has to be spent - it just now has somewhere to be
   spent on purpose. This is also how the instrument would really work, which
   is the argument that settles it. */
export function observe(world, state) {
  const levels = bandLevels(world, state);
  const size = world.cfg.coarseGroupSize;
  const fine = {};
  const groups = Math.ceil(world.cfg.bands / size);
  const coarse = new Array(groups).fill(0);
  /* How many bands each total actually pools. Watched bands are reported
     finely and drop out of their group, so a group is not always `size`
     wide - and anything reasoning about the total needs to know that.

     It also means a reader who spends all three slots inside one group learns
     the fourth band exactly, by subtraction. That is a real tactic, honestly
     available, and it costs them every other group to use. Left in. */
  const coarseCount = new Array(groups).fill(0);
  for (let b = 0; b < world.cfg.bands; b++) {
    if (state.attention.includes(b)) fine[b] = levels[b];
    else { coarse[Math.floor(b / size)] += levels[b]; coarseCount[Math.floor(b / size)]++; }
  }
  return {
    tick: state.tick,
    attention: state.attention.slice(),
    fine,
    coarse,
    coarseCount,
    coarseSize: size,
    charges: state.charges,
    regen: state.regen,
    damp: state.damp.map(d => (d > state.tick ? d - state.tick : 0))
  };
}

/* Layer two's instrument, and it stays sealed until layer one is solved.
   Actual minus the harmonic model. Under the model the remainder should be
   noise; it is not. It is the reader's own pings, delayed and permuted.

   Gated here rather than in the view: an instrument the reader has not
   earned should not be one CSS rule away from being readable. */
export function residual(world, state, layer) {
  if (layer < 2) return null;
  const actual = bandLevels(world, state);
  const model = modelLevels(world, state);
  return actual.map((v, i) => v - model[i]);
}

/* A prediction is a tick and optionally a band, so it scores without anyone
   parsing prose. The world either arrives or it does not. */
export function scorePrediction(world, prediction, events, tick) {
  const near = Math.abs(tick - prediction.tick) <= (world.cfg.predictTolerance ?? 2);
  if (!near) return null;
  const hit = events.some(e =>
    (prediction.of === 'conjunction' && e.kind === 'conjunction') ||
    (prediction.of === 'echo' && e.kind === 'echo' &&
      (prediction.band === undefined || e.band === prediction.band)));
  return hit ? 'correct' : null;
}
