/* A run: the seed, the choices, and nothing else.

   Everything the reader sees is recomputed from these two facts, so this is
   the whole of what has to survive a reload - and the whole of what has to
   move between devices for a run to be the same run.

   This file and console.js are the impure edge. They are allowed a clock and
   storage; the four files behind them are not, and tools/sim_check.py holds
   that line. */

const KEY = 'educarlos:sim:v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function write(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* private mode */ }
}

/* Seeds come from the platform's CSPRNG rather than Math.random - not for
   secrecy, but because the seed decides which world a reader gets, and two
   readers opening the app in the same second should not get the same one. */
function mint() {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}

/* The run's own start is its epoch, so tick 0 is where this reader's world
   begins. A fixed calendar epoch would make every new reader replay months of
   somebody else's history to reach the present, and would put the offset of
   their first conjunction somewhere arbitrary in the past.

   But tick 0 is not where the reader arrives. `prelude` backdates the epoch
   so the world has already been running for the depth of one waterfall - two
   days or so - before anybody opens the console. Without it a first-time
   visitor gets an empty screen and no reason to come back, which is the
   single likeliest way this whole thing fails.

   Nothing is faked to achieve it: those ticks are computed by the same rules
   as every other tick, from the same seed, with the reader's attention parked
   where it starts. It really was running before they got here. That is also
   the premise of the fiction, so the honest fix and the right one are the
   same fix. */
export function load(simId, nowMs, prelude = 0) {
  const all = read();
  let run = all[simId];
  if (!run) {
    const startedAt = nowMs - prelude;
    run = { seed: mint(), startedAt, log: [], notebook: [], layer: 1, lastSeen: 0 };
    all[simId] = run;
    write(all);
  }
  return run;
}

export function save(simId, run) {
  const all = read();
  all[simId] = run;
  write(all);
}

/* Actions are appended in the order they happened, stamped with the tick they
   happened on. Two on the same tick is normal and replays in log order. */
export function append(simId, run, action) {
  run.log.push(action);
  save(simId, run);
  return run;
}

export function seen(simId, run, tick) {
  run.lastSeen = tick;
  save(simId, run);
}

export function reset(simId) {
  const all = read();
  delete all[simId];
  write(all);
}

/* An escape hatch that matches the one progress already has: a run is small,
   portable, and means the same thing wherever it is replayed. */
export const toJSON = (run) => JSON.stringify(run);

export function fromJSON(simId, text) {
  const run = JSON.parse(text);
  if (!run || typeof run.seed !== 'string' || !Array.isArray(run.log)) {
    throw new Error('Not a run.');
  }
  save(simId, run);
  return run;
}
