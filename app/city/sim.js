/* The city model.

   A grid that develops itself. Nothing here draws: this file only knows how
   land becomes valuable, how roads reach for it, and what a reader's
   interference does to both.

   The loop each year is the same four moves:

     fields   what the land is worth, from access and from what is near it
     roads    tips of the network push into land worth reaching
     develop  a plot beside a road, worth building on, gets built on
     densify  what is built grows toward the ceiling its land allows

   Every one of those reads the value field, and every one of them writes
   something that changes it next year. That circularity is the whole
   mechanism: a reader who drops a park in the north is not decorating, they
   are moving where the roads go for the next forty years. */

export const N = 44;

export const EMPTY = 0, HOME = 1, SHOP = 2, WORKS = 3, PARK = 4, STATION = 5, TOWER = 6;

const idx = (x, y) => y * N + x;
const inB = (x, y) => x > 0 && y > 0 && x < N - 1 && y < N - 1;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* mulberry32: a seeded generator, so a city can be replayed from its seed. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/* ------------------------------------------------------------ state */

export function create(seed = (Math.random() * 1e9) | 0) {
  const s = {
    seed, rnd: rng(seed), year: 0,
    road:  new Uint8Array(N * N),
    water: new Uint8Array(N * N),
    kind:  new Uint8Array(N * N),
    lvl:   new Float32Array(N * N),   // built height the plot is aiming at
    hgt:   new Float32Array(N * N),   // height actually drawn; eases toward lvl
    val:   new Float32Array(N * N),
    acc:   new Float32Array(N * N),
    amen:  new Float32Array(N * N),
    tmp:   new Float32Array(N * N),
    age:   new Uint16Array(N * N),
    tint:  new Float32Array(N * N),   // per-plot jitter, fixed for the city's life
    tips:  [],
    poles: [{ x: N >> 1, y: N >> 1, w: 1, r: 12 }],
    pop: 0, jobs: 0, homes: 0, demand: 0.5,
    events: [], marks: {}
  };
  for (let i = 0; i < N * N; i++) s.tint[i] = s.rnd();
  river(s);
  found(s);
  fields(s);
  census(s);
  return s;
}

/* A river, drawn before anything is built, because the water was here first.

   A meander: one sine crossing another, walked from one edge of the map to the
   other, two or three plots wide. It is a wall the roads cannot pass, which is
   why the far bank stays empty until somebody bridges it - and why bridging it
   is the most consequential thing in the dock that does not look like a
   decision. */
function river(s) {
  const vertical = s.rnd() < 0.5;
  // Off to one side, and never through the founding crossroads: a river that
  // ran under the first four houses would be a river with a hole in it.
  const side = s.rnd() < 0.5 ? -1 : 1;
  const mid = (N >> 1) + side * (10 + s.rnd() * 4);
  const a1 = 2 + s.rnd() * 2.4, a2 = 0.8 + s.rnd() * 1.4;
  const k1 = 0.09 + s.rnd() * 0.06, k2 = 0.21 + s.rnd() * 0.1;
  const ph = s.rnd() * 6.28;
  const c = N >> 1;

  for (let t = 0; t < N; t++) {
    let u = mid + Math.sin(t * k1 + ph) * a1 + Math.sin(t * k2) * a2;
    const half = 1 + (Math.sin(t * 0.13 + ph) > 0.35 ? 1 : 0);   // it widens and narrows
    for (let d = -half; d <= half; d++) {
      const x = vertical ? Math.round(u + d) : t;
      const y = vertical ? t : Math.round(u + d);
      if (!inB(x, y)) continue;
      // Belt and braces: the founding crossroads is on dry land whatever the
      // meander does.
      if (Math.abs(x - c) <= 5 && Math.abs(y - c) <= 5) continue;
      s.water[idx(x, y)] = 1;
    }
  }
}

/* A crossroads and four carts' worth of houses. Everything else follows. */
function found(s) {
  const c = N >> 1;
  for (let d = -4; d <= 4; d++) { s.road[idx(c + d, c)] = 1; s.road[idx(c, c + d)] = 1; }
  for (const [dx, dy] of N4) s.tips.push(tip(s, c + dx * 4, c + dy * 4, dx, dy, 1));
  for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -2]]) {
    const i = idx(c + dx, c + dy);
    s.kind[i] = HOME; s.lvl[i] = 0.12;
  }
  say(s, 'A crossroads, and four houses that will regret it.');
}

function tip(s, x, y, dx, dy, vigor) {
  return { x, y, dx, dy, run: 0, block: 4 + ((s.rnd() * 4) | 0), vigor, dead: false };
}

/* ----------------------------------------------------------- fields */

/* Access: one at every road cell, falling off with each step away. Three
   sweeps forward and three back, so the falloff is not biased by scan order. */
function access(s) {
  const { acc, road } = s;
  for (let i = 0; i < N * N; i++) acc[i] = road[i] ? 1 : 0;
  const D = 0.74;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = idx(x, y);
      const m = D * Math.max(acc[i - 1], acc[i - N], acc[i + 1], acc[i + N]);
      if (m > acc[i]) acc[i] = m;
    }
    for (let y = N - 2; y > 0; y--) for (let x = N - 2; x > 0; x--) {
      const i = idx(x, y);
      const m = D * Math.max(acc[i - 1], acc[i - N], acc[i + 1], acc[i + N]);
      if (m > acc[i]) acc[i] = m;
    }
  }
}

/* Amenity: what a plot's neighbours do to it. Parks and water lift, the works
   push down, and three blurs spread each of them about four plots out. */
function amenity(s) {
  const { amen, kind, tmp } = s;
  for (let i = 0; i < N * N; i++) {
    const k = kind[i];
    amen[i] = s.water[i] ? 0.55
      : k === PARK ? 1 : k === WORKS ? -1.15 : k === STATION ? 0.3 : k === TOWER ? 0.2 : 0;
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = idx(x, y);
      tmp[i] = (amen[i] * 2 + amen[i - 1] + amen[i + 1] + amen[i - N] + amen[i + N]) / 6;
    }
    amen.set(tmp);
  }
}

function poleAt(s, x, y) {
  let p = 0;
  for (const q of s.poles) {
    const d = Math.hypot(x - q.x, y - q.y);
    const v = q.w * Math.exp(-d / q.r);
    if (v > p) p = v;
  }
  return p;
}

function fields(s) {
  access(s);
  amenity(s);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y);
    s.val[i] = s.water[i] ? 0
      : clamp(0.55 * s.acc[i] + 0.72 * poleAt(s, x, y) + 0.45 * s.amen[i], 0, 1);
  }
}

/* ------------------------------------------------------------ roads */

function nearRoads(s, x, y, skipX, skipY) {
  let n = 0;
  for (const [dx, dy] of N8) {
    const nx = x + dx, ny = y + dy;
    if (nx === skipX && ny === skipY) continue;
    if (inB(nx, ny) && s.road[idx(nx, ny)]) n++;
  }
  return n;
}

function growRoads(s) {
  const { rnd } = s;
  for (const tp of s.tips) {
    if (tp.dead) continue;
    if (rnd() > 0.78) continue;

    // Once in a while a tip turns toward whatever is pulling hardest: the
    // centre early on, a station once one exists.
    if (rnd() < 0.07) {
      const ahead = poleAt(s, tp.x + tp.dx * 4, tp.y + tp.dy * 4);
      const px = -tp.dy, py = tp.dx;
      const left = poleAt(s, tp.x + px * 4, tp.y + py * 4);
      const right = poleAt(s, tp.x - px * 4, tp.y - py * 4);
      if (left > ahead * 1.15) { tp.dx = px; tp.dy = py; tp.run = 0; }
      else if (right > ahead * 1.15) { tp.dx = -px; tp.dy = -py; tp.run = 0; }
    }

    const nx = tp.x + tp.dx, ny = tp.y + tp.dy;
    if (!inB(nx, ny)) { tp.dead = true; continue; }
    const i = idx(nx, ny);
    if (s.water[i]) { tp.dead = true; continue; }            // the far bank waits
    if (s.road[i]) { tp.dead = true; continue; }             // ran into the network
    if (nearRoads(s, nx, ny, tp.x, tp.y) > 1) { tp.dead = true; continue; }  // too close to it

    s.road[i] = 1;
    if (s.kind[i]) { s.kind[i] = EMPTY; s.lvl[i] = 0; }       // the road wins
    tp.x = nx; tp.y = ny; tp.run++;

    // Blocks come from branching on a rhythm, not from a plan.
    if (tp.run >= tp.block) {
      tp.run = 0;
      tp.block = 4 + ((rnd() * 4) | 0);
      const px = -tp.dy, py = tp.dx;
      const pull = 0.3 + 0.5 * s.val[i];
      if (rnd() < pull && s.tips.length < 26) s.tips.push(tip(s, tp.x, tp.y, px, py, tp.vigor * 0.93));
      if (rnd() < pull * 0.6 && s.tips.length < 26) s.tips.push(tip(s, tp.x, tp.y, -px, -py, tp.vigor * 0.93));
    }
    if (rnd() < 0.035 * (1.25 - tp.vigor)) tp.dead = true;
  }
  s.tips = s.tips.filter(t => !t.dead);

  // A network that has stalled restarts from wherever the land is worth most.
  // Without this the city would finish itself in forty years and then sit
  // there; with it, the edge of town keeps looking for somewhere to go.
  for (let restart = s.tips.length; restart < 5; restart++) {
    let best = -1, bi = -1;
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
      const i = idx(x, y);
      if (!s.road[i]) continue;
      let open = 0;
      for (const [dx, dy] of N4) if (!s.road[idx(x + dx, y + dy)] && !s.kind[idx(x + dx, y + dy)]) open++;
      if (!open) continue;
      const v = s.val[i] + 0.35 * s.rnd();
      if (v > best) { best = v; bi = i; }
    }
    if (bi < 0) break;
    const rx = bi % N, ry = (bi / N) | 0;
    let dir = null;
    for (const [dx, dy] of N4) {
      const j = idx(rx + dx, ry + dy);
      if (!s.road[j] && !s.kind[j] && (!dir || s.val[j] > s.val[idx(rx + dir[0], ry + dir[1])])) dir = [dx, dy];
    }
    if (!dir) break;
    s.tips.push(tip(s, rx, ry, dir[0], dir[1], 0.95));
  }
}

/* ---------------------------------------------------------- bridges */

/* Lay a crossing from a bank, if the water here is narrow enough to cross.
   Returns the far-side plot, or null when the river is too wide at this point:
   where the city ends up crossing is a fact about the shape of the water, not
   about anybody's intention. */
function bridge(s, x, y, span = 4) {
  if (!s.water[idx(x, y)]) return null;
  for (const [dx, dy] of N4) {
    const bx = x - dx, by = y - dy;
    if (!inB(bx, by) || s.water[idx(bx, by)]) continue;      // must start on a bank
    const cells = [];
    let cx = x, cy = y;
    for (let n = 0; n <= span; n++) {
      if (!inB(cx, cy)) { cells.length = 0; break; }
      if (!s.water[idx(cx, cy)]) break;
      cells.push(idx(cx, cy));
      cx += dx; cy += dy;
    }
    if (!cells.length || !inB(cx, cy) || s.water[idx(cx, cy)]) continue;
    for (const j of cells) { s.road[j] = 1; s.kind[j] = EMPTY; s.lvl[j] = 0; }
    s.road[idx(bx, by)] = 1;
    return { x: cx, y: cy, dx, dy };
  }
  return null;
}

/* Left alone, the city eventually crosses on its own - but only once there is
   enough pressure to justify it, and only where the water is narrow. */
function maybeBridge(s) {
  if (s.year < 22 || s.rnd() > 0.06 * s.demand) return;

  // Every point where a road already runs up to the water is a place the city
  // has been thinking about crossing. One of them, at random, is where it does.
  const banks = [];
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = idx(x, y);
    if (!s.water[i] || s.road[i]) continue;
    for (const [dx, dy] of N4) {
      if (s.road[idx(x + dx, y + dy)] && !s.water[idx(x + dx, y + dy)]) { banks.push([x, y]); break; }
    }
  }
  while (banks.length) {
    const k = (s.rnd() * banks.length) | 0;
    const [x, y] = banks.splice(k, 1)[0];
    const far = bridge(s, x, y, 3);
    if (!far) continue;
    if (s.tips.length < 26) s.tips.push(tip(s, far.x, far.y, far.dx, far.dy, 0.96));
    s.bridges = (s.bridges || 0) + 1;
    if (s.bridges === 1) say(s, 'A bridge, at last. The far bank stops being scenery.');
    else if (s.bridges === 2) say(s, 'A second crossing. The far bank is part of town now.');
    else if (s.bridges % 3 === 0) say(s, 'Another crossing, further down the water.');
    return;
  }
}

/* -------------------------------------------------------- buildings */

function nextToRoad(s, x, y) {
  for (const [dx, dy] of N4) if (s.road[idx(x + dx, y + dy)]) return true;
  return false;
}

function pickKind(s, i, v) {
  const r = s.rnd();
  const shortOfWork = s.jobs < s.pop * 0.42;
  if (s.amen[i] < -0.3) return r < 0.5 ? WORKS : HOME;      // nobody else wants it
  if (v > 0.74 && r < 0.5) return SHOP;
  if (shortOfWork && r < 0.42) return SHOP;
  if (r < 0.035 && s.amen[i] < 0.2 && v > 0.3) return PARK;  // the city plants its own
  return HOME;
}

function develop(s) {
  const { rnd } = s;
  for (let k = 0; k < 190; k++) {
    const x = 1 + ((rnd() * (N - 2)) | 0), y = 1 + ((rnd() * (N - 2)) | 0), i = idx(x, y);
    if (s.road[i] || s.kind[i] || s.water[i]) continue;
    if (!nextToRoad(s, x, y)) continue;
    if (s.val[i] * 1.15 + s.demand * 0.5 - 0.55 * rnd() < 0.62) continue;
    s.kind[i] = pickKind(s, i, s.val[i]);
    s.lvl[i] = 0.05;
    s.age[i] = 0;
  }
}

/* The ceiling a plot's land allows. Height is land value made visible: the
   same tower is impossible on the edge and inevitable in the middle. */
function ceiling(s, i, k) {
  const v = s.val[i];
  if (k === HOME) return 0.16 + 0.55 * v * v;
  if (k === SHOP) return 0.3 + 0.95 * v * v;
  if (k === WORKS) return 0.26;
  if (k === TOWER) return 1.15;
  if (k === STATION) return 0.3;
  return 0.04;
}

function densify(s) {
  let dark = 0;
  for (let i = 0; i < N * N; i++) {
    const k = s.kind[i];
    if (!k || k === PARK) continue;
    if (s.age[i] < 65535) s.age[i]++;
    const cap = ceiling(s, i, k);
    s.lvl[i] += (cap - s.lvl[i]) * 0.07;

    // A plot the city has stopped wanting empties out, and the land goes back
    // to being land. This is how a works quarter hollows its own neighbours.
    if ((k === HOME || k === SHOP) && s.val[i] < 0.17 && s.age[i] > 22 && s.rnd() < 0.02) {
      s.kind[i] = EMPTY; s.lvl[i] = 0; s.age[i] = 0; dark++;
    }
  }
  if (dark >= 4) say(s, 'A few streets empty out. Nobody announces it.');
}

function census(s) {
  let pop = 0, jobs = 0, homes = 0, built = 0, tall = 0;
  for (let i = 0; i < N * N; i++) {
    const k = s.kind[i];
    if (k) { built++; if (s.lvl[i] > tall) tall = s.lvl[i]; }
    if (k === HOME) { pop += 6 + s.lvl[i] * 250; homes++; }
    else if (k === SHOP) jobs += 8 + s.lvl[i] * 190;
    else if (k === WORKS) jobs += 70;
    else if (k === STATION) jobs += 25;
    else if (k === TOWER) jobs += 220;
  }
  s.pop = Math.round(pop); s.jobs = Math.round(jobs); s.homes = homes;
  s.built = built; s.tall = tall;
  s.demand = clamp(0.46 + 0.34 * Math.tanh(s.year / 55) + 0.1 * (s.poles.length - 1)
    + (jobs > pop * 0.5 ? 0.12 : 0), 0, 1.25);

  quiet(s);

  for (const n of [500, 2000, 10000, 40000]) {
    if (s.pop >= n && !s.marks['p' + n]) {
      s.marks['p' + n] = true;
      say(s, 'Population passes ' + n.toLocaleString('en-GB') + '.');
    }
  }
}

/* Decades where nobody interferes are still decades. Rather than let the
   chronicle go stale, the city reports on itself: what it did with the last
   twenty years is read off the difference between then and now, so the line
   is an observation and never a slogan. */
function quiet(s) {
  const last = s.events.length ? s.events[s.events.length - 1].year : 0;
  if (s.year - last < 20 || s.year < 12) return;
  const was = s.snap || { built: 0, tall: 0, pop: 0 };
  const grew = s.built - was.built, rose = s.tall - was.tall;
  s.snap = { built: s.built, tall: s.tall, pop: s.pop };

  if (s.jobs > s.pop * 0.62)
    say(s, 'More work here than people. Somebody else is doing the sleeping.');
  else if (grew < 6 && rose > 0.05)
    say(s, 'The centre has stopped spreading and started stacking.');
  else if (grew > 26)
    say(s, 'The edge of town moves another few streets out.');
  else if (s.pop < was.pop)
    say(s, 'Fewer people than twenty years ago. Nobody agrees on why.');
  else
    say(s, 'Twenty quiet years. The blocks fill in behind the roads.');
}

/* ------------------------------------------------------------- year */

export function step(s) {
  s.year++;
  fields(s);
  growRoads(s);
  maybeBridge(s);
  develop(s);
  densify(s);
  census(s);
}

/* -------------------------------------------------------- the reader */

const QUARTER = (x, y) => (y < N / 2 ? 'north' : 'south') + (x < N / 2 ? 'west' : 'east');

export const TOOLS = ['road', 'park', 'works', 'station', 'tower', 'raze'];

export function place(s, tool, x, y) {
  if (!inB(x, y)) return false;
  const i = idx(x, y), q = QUARTER(x, y);

  if (tool === 'road') {
    if (s.water[i]) {
      const far = bridge(s, x, y, 4);
      if (!far) return false;                                // too wide here
      if (s.tips.length < 26) s.tips.push(tip(s, far.x, far.y, far.dx, far.dy, 0.98));
      say(s, 'You throw a bridge across, ' + q + '. Everything follows a bridge.');
      return true;
    }
    if (s.road[i]) return false;
    s.road[i] = 1; s.kind[i] = EMPTY; s.lvl[i] = 0;
    // A road laid where there is no network founds a second one: four tips,
    // and a hamlet that will not know it was meant to be a suburb.
    let touching = 0;
    for (const [dx, dy] of N8) if (inB(x + dx, y + dy) && s.road[idx(x + dx, y + dy)]) touching++;
    if (touching === 0) {
      for (const [dx, dy] of N4) s.tips.push(tip(s, x, y, dx, dy, 0.95));
      say(s, 'A road in the ' + q + ', going nowhere yet.');
    } else if (s.tips.length < 26) {
      for (const [dx, dy] of N4) if (!s.road[idx(x + dx, y + dy)]) { s.tips.push(tip(s, x, y, dx, dy, 0.9)); break; }
    }
    return true;
  }

  if (tool === 'raze') {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = idx(clamp(x + dx, 1, N - 2), clamp(y + dy, 1, N - 2));
      if (s.water[j]) continue;
      if (s.kind[j]) { n++; s.kind[j] = EMPTY; s.lvl[j] = 0; s.hgt[j] = 0; s.age[j] = 0; }
    }
    s.poles = s.poles.filter(p => Math.hypot(p.x - x, p.y - y) > 1.5 || p.r > 11);
    if (n) say(s, 'Cleared, ' + q + '. The land does not stay empty.');
    fields(s);
    return n > 0;
  }

  if (s.water[i]) return false;      // the river is not a plot

  const was = s.kind[i];
  s.road[i] = 0;
  s.age[i] = 0;

  if (tool === 'park') {
    s.kind[i] = PARK; s.lvl[i] = 0;
    say(s, 'A park, ' + q + '. Rents around it start climbing.');
  } else if (tool === 'works') {
    s.kind[i] = WORKS; s.lvl[i] = 0.26;
    say(s, 'The works open, ' + q + '. Work arrives; so does the smell.');
  } else if (tool === 'station') {
    s.kind[i] = STATION; s.lvl[i] = 0.3; s.road[i] = 1;
    s.poles.push({ x, y, w: 0.85, r: 9 });
    for (const [dx, dy] of N4) if (s.tips.length < 26) s.tips.push(tip(s, x, y, dx, dy, 0.98));
    say(s, 'A station, ' + q + '. The city has a second centre now.');
  } else if (tool === 'tower') {
    s.kind[i] = TOWER; s.lvl[i] = 0.5;
    s.poles.push({ x, y, w: 0.45, r: 6 });
    say(s, 'A tower, ' + q + '. Everything beside it grows to meet it.');
  } else {
    s.kind[i] = was; return false;
  }
  fields(s);
  return true;
}

function say(s, text) {
  s.events.push({ year: s.year, text });
  if (s.events.length > 60) s.events.splice(0, s.events.length - 60);
}

/* ---------------------------------------------------------- storage */

const CH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function encode(s) {
  let a = '', b = '';
  for (let i = 0; i < N * N; i++) {
    a += CH[s.kind[i] * 4 + s.road[i] * 2 + s.water[i]];
    b += CH[clamp(Math.round(s.lvl[i] * 40), 0, 61)];
  }
  return {
    v: 2, seed: s.seed, year: s.year, at: Date.now(),
    poles: s.poles.map(p => [p.x, p.y, p.w, p.r]),
    tips: s.tips.map(t => [t.x, t.y, t.dx, t.dy, t.run, t.block, +t.vigor.toFixed(3)]),
    marks: s.marks,
    events: s.events.slice(-8),
    a, b
  };
}

export function decode(raw) {
  if (!raw || raw.v !== 2 || typeof raw.a !== 'string' || raw.a.length !== N * N) return null;
  const s = create(raw.seed | 0);
  s.road.fill(0); s.kind.fill(0); s.lvl.fill(0); s.hgt.fill(0); s.age.fill(0); s.water.fill(0);
  for (let i = 0; i < N * N; i++) {
    const c = CH.indexOf(raw.a[i]);
    if (c < 0) return null;
    s.kind[i] = c >> 2; s.road[i] = (c >> 1) & 1; s.water[i] = c & 1;
    s.lvl[i] = Math.max(0, CH.indexOf(raw.b[i])) / 40;
    s.hgt[i] = s.lvl[i];
    s.age[i] = 40;
  }
  s.year = raw.year | 0;
  s.poles = (raw.poles || []).map(([x, y, w, r]) => ({ x, y, w, r }));
  if (!s.poles.length) s.poles = [{ x: N >> 1, y: N >> 1, w: 1, r: 12 }];
  s.tips = (raw.tips || []).map(([x, y, dx, dy, run, block, vigor]) =>
    ({ x, y, dx, dy, run, block, vigor, dead: false }));
  s.marks = raw.marks || {};
  s.events = (raw.events || []).slice(-8);
  fields(s);
  census(s);
  return s;
}
