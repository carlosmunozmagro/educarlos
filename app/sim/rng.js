/* Stateless seeded randomness.

   Nothing here holds state. Every draw is a pure hash of (seed, tick, salt),
   so the value at tick 900 is computable without replaying ticks 0..899, and
   fast-forwarding through an absence is exactly equal to having been present.

   A stateful PRNG stream would break that: it would make every draw depend on
   how many draws came before it, and the order of those draws depends on the
   branches taken, which is the one thing we cannot promise is stable. So:
   no streams, no Math.random, anywhere under app/sim/. */

/* murmur3 finalizer - cheap, and avalanches well enough that adjacent ticks
   produce unrelated values, which is the only property we actually need. */
function fmix32(h) {
  h = h >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/* FNV-1a. Turns a reader's seed phrase, or a salt name, into a uint32. */
export function seedFrom(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* Salts are named at the call site for readability and hashed once. Two draws
   at the same tick must never share a salt, or they return the same number. */
const salts = new Map();
export function salt(name) {
  let v = salts.get(name);
  if (v === undefined) { v = seedFrom(name); salts.set(name, v); }
  return v;
}

export function hash(seed, tick, saltName) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = fmix32((h ^ (tick | 0)) >>> 0);
  h = fmix32((h + salt(saltName)) >>> 0);
  return h;
}

/* [0, 1) */
export function unit(seed, tick, saltName) {
  return hash(seed, tick, saltName) / 4294967296;
}

/* [0, n) */
export function int(seed, tick, saltName, n) {
  return n <= 0 ? 0 : hash(seed, tick, saltName) % n;
}

export function pick(seed, tick, saltName, arr) {
  return arr[int(seed, tick, saltName, arr.length)];
}

/* Fisher-Yates, drawing each swap from its own tick index so the result
   depends on the whole seed rather than on one draw. */
export function shuffle(seed, saltName, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = int(seed, i, saltName, i + 1);
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

export function range(n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = i;
  return out;
}
