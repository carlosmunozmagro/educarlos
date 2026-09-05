/* The painter. An isometric view of the grid: flat land and roads on a cached
   layer that only redraws when something changes, buildings on top every
   frame because they are always in the middle of growing.

   Colours come from the stylesheet, so the city is light or dark for the same
   reason every other screen is. */

import { N, EMPTY, HOME, SHOP, WORKS, PARK, STATION, TOWER } from './sim.js';

const TW = 30, TH = 15;      // tile width and height at zoom 1
const HU = 46;               // pixels of height for one full level
const INSET = 0.86;          // plot footprint, leaving the street visible

const VARS = ['ground', 'ground-2', 'road', 'water', 'home', 'shop', 'works', 'park',
              'station', 'tower', 'edge', 'lit', 'cold', 'hot'];

function hex(c) {
  c = c.trim();
  if (c.startsWith('#')) {
    const h = c.slice(1);
    const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  const m = c.match(/[\d.]+/g) || [0, 0, 0];
  return [+m[0], +m[1], +m[2]];
}
const rgb = ([r, g, b]) => 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
const shade = (c, k) => c.map(v => (k >= 0 ? v + (255 - v) * k : v * (1 + k)));

export function createPainter(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const ground = document.createElement('canvas');
  const gctx = ground.getContext('2d');
  let dirty = true;
  let pal = null;

  function palette() {
    const cs = getComputedStyle(canvas);
    const raw = {};
    for (const v of VARS) raw[v] = hex(cs.getPropertyValue('--city-' + v) || '#888');
    pal = {
      raw,
      face: {},
      night: (cs.getPropertyValue('--city-night') || '0').trim() === '1'
    };
    for (const k of ['home', 'shop', 'works', 'park', 'station', 'tower']) {
      pal.face[k] = {
        top:   rgb(shade(raw[k], 0.16)),
        left:  rgb(shade(raw[k], -0.16)),
        right: rgb(shade(raw[k], -0.34))
      };
    }
    dirty = true;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ground.width = W * dpr; ground.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    palette();
  }

  /* Camera: zoom, plus the screen point the grid's origin lands on.

     The frame follows the built area rather than the grid. For most of a
     city's life the grid is mostly empty land, and a camera that insisted on
     showing all of it would spend forty years showing a village the size of a
     thumbnail. So the view is computed from what exists, and the reader
     watches it pull back as the place outgrows the screen. */
  function bounds(s) {
    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (!s.road[i] && !s.kind[i]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return { x0: 0, y0: 0, x1: N - 1, y1: N - 1 };
    const pad = 2.5;
    return {
      x0: Math.max(0, x0 - pad), y0: Math.max(0, y0 - pad),
      x1: Math.min(N - 1, x1 + pad), y1: Math.min(N - 1, y1 + pad)
    };
  }

  /* Where the camera would sit if it were framing the city right now.
     `top` and `bottom` are the chrome the city must not hide behind. */
  function frame(s, top = 62, bottom = 112) {
    const b = bounds(s);
    const spanX = ((b.x1 - b.x0) + (b.y1 - b.y0) + 1) * TW / 2;
    const spanY = ((b.x1 + b.y1) - (b.x0 + b.y0) + 1) * TH / 2;
    const usable = Math.max(80, H - top - bottom);
    // Capped: a village of six houses framed to fill a phone would be a
    // close-up of nothing. Pinching past this is the reader's business.
    const z = Math.min(1.5, Math.max(0.3,
      Math.min(W * 0.94 / spanX, (usable - 44) / spanY)));
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    return {
      z,
      px: W / 2 - (cx - cy) * TW / 2 * z,
      py: top + usable / 2 + 14 - (cx + cy) * TH / 2 * z
    };
  }

  function fit(cam, s) {
    Object.assign(cam, frame(s));
    return cam;
  }

  const sxOf = (x, y, cam) => (x - y) * TW / 2 * cam.z + cam.px;
  const syOf = (x, y, cam) => (x + y) * TH / 2 * cam.z + cam.py;

  /* Screen point back to a plot, reading the ground plane (height ignored:
     a finger aims at what it is over, not at what leans over it). */
  function pick(px, py, cam) {
    const a = (px - cam.px) / (TW / 2 * cam.z);
    const b = (py - cam.py) / (TH / 2 * cam.z);
    return { x: Math.floor((b + a) / 2), y: Math.floor((b - a) / 2) };
  }

  function diamond(c, sx, sy, w, h) {
    c.beginPath();
    c.moveTo(sx, sy - h / 2);
    c.lineTo(sx + w / 2, sy);
    c.lineTo(sx, sy + h / 2);
    c.lineTo(sx - w / 2, sy);
    c.closePath();
  }

  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* The flat layer: land, roads, parks. Cached, because most years it is the
     same picture.

     In overlay mode the same layer paints the land value field instead of the
     land: the number every other rule in the model reads, made a colour. It is
     the only way to see a park working before the buildings around it grow. */
  function paintGround(s, cam, overlay) {
    const w = TW * cam.z, h = TH * cam.z;
    gctx.clearRect(0, 0, W, H);

    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const sx = sxOf(x, y, cam), sy = syOf(x, y, cam);
      if (sx < -w || sx > W + w || sy < -h * 2 || sy > H + h * 2) continue;
      const i = y * N + x;
      const k = s.kind[i];
      const wet = s.water[i];
      let col;
      if (overlay && !wet) {
        col = mix(pal.raw.cold, pal.raw.hot, Math.min(1, s.val[i]));
        if (s.road[i]) col = shade(col, -0.16);
      }
      else if (wet) col = shade(pal.raw.water, (s.tint[i] - 0.5) * 0.09);
      else if (s.road[i]) col = pal.raw.road;
      else if (k === PARK) col = pal.raw.park;
      else col = s.tint[i] > 0.5 ? pal.raw.ground : pal.raw['ground-2'];
      // Land that is worth something is warmer, even before it is built on.
      if (!wet && !s.road[i] && k === EMPTY) col = shade(col, s.val[i] * 0.06 - 0.02);
      gctx.fillStyle = rgb(col);
      diamond(gctx, sx, sy, w, h);
      gctx.fill();
      // Stroking the same colour closes the antialiased seam between plots,
      // which is invisible on land and a grid of hairlines over a value field.
      gctx.strokeStyle = gctx.fillStyle;
      gctx.lineWidth = 1;
      gctx.stroke();

      // A road over water is a bridge: the same surface, held above the river,
      // with the gap under it doing the explaining.
      if (wet && s.road[i]) {
        const lift = Math.max(2, h * 0.34);
        gctx.fillStyle = rgb(shade(pal.raw.road, -0.42));
        diamond(gctx, sx, sy - lift * 0.45, w * 0.9, h * 0.9);
        gctx.fill();
        gctx.fillStyle = rgb(pal.raw.road);
        diamond(gctx, sx, sy - lift, w * 0.9, h * 0.9);
        gctx.fill();
      }

      if (k === PARK && !overlay) {
        gctx.fillStyle = rgb(shade(pal.raw.park, 0.22));
        for (let t = 0; t < 3; t++) {
          const a = (s.tint[i] * 7 + t) % 1, b = (s.tint[i] * 13 + t * 0.37) % 1;
          const tx = sx + (a - 0.5) * w * 0.5, ty = sy + (b - 0.5) * h * 0.5;
          gctx.beginPath();
          gctx.arc(tx, ty - h * 0.18, Math.max(1.1, w * 0.07), 0, 6.284);
          gctx.fill();
        }
      }
    }
    dirty = false;
  }

  function prism(c, sx, sy, w, h, ht, f) {
    // Left face, right face, then the roof: three quads is enough to read as
    // a solid, and cheap enough to draw a thousand of them.
    c.fillStyle = f.left;
    c.beginPath();
    c.moveTo(sx - w / 2, sy);
    c.lineTo(sx, sy + h / 2);
    c.lineTo(sx, sy + h / 2 - ht);
    c.lineTo(sx - w / 2, sy - ht);
    c.closePath(); c.fill();

    c.fillStyle = f.right;
    c.beginPath();
    c.moveTo(sx + w / 2, sy);
    c.lineTo(sx, sy + h / 2);
    c.lineTo(sx, sy + h / 2 - ht);
    c.lineTo(sx + w / 2, sy - ht);
    c.closePath(); c.fill();

    c.fillStyle = f.top;
    diamond(c, sx, sy - ht, w, h);
    c.fill();
  }

  const FACE_OF = { [HOME]: 'home', [SHOP]: 'shop', [WORKS]: 'works', [STATION]: 'station', [TOWER]: 'tower' };

  function paintBuildings(s, cam) {
    const w = TW * cam.z, h = TH * cam.z;
    const lit = pal.night;
    ctx.fillStyle = rgb(pal.raw.lit);

    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const k = s.kind[i];
      if (!k || k === PARK) continue;
      const ht = s.hgt[i] * HU * cam.z;
      if (ht < 0.4) continue;
      const sx = sxOf(x, y, cam), sy = syOf(x, y, cam);
      if (sx < -w || sx > W + w || sy < -ht - h * 2 || sy > H + h * 2) continue;

      const fw = w * INSET, fh = h * INSET;
      prism(ctx, sx, sy, fw, fh, ht, pal.face[FACE_OF[k]]);

      // After dark, the tall ones are the ones with anybody left in them.
      if (lit && ht > h * 1.2 && k !== WORKS) {
        ctx.fillStyle = rgb(pal.raw.lit);
        const rows = Math.min(5, Math.floor(ht / (h * 0.9)));
        for (let r = 0; r < rows; r++) {
          if (((s.tint[i] * 977 + r * 31) | 0) % 3 === 0) continue;
          const ry = sy + fh / 2 - ht + r * (ht / rows) + ht / (rows * 2.4);
          const rw = Math.max(1, fw * 0.09), rh = Math.max(1, fh * 0.16);
          ctx.fillRect(sx + fw * 0.17, ry - rh, rw, rh);
          ctx.fillRect(sx + fw * 0.32, ry - rh, rw, rh);
        }
      }
    }
  }

  /* The tap itself: a ring on the ground where the finger landed, so a
     placement that takes a year to show up still answers immediately. */
  function paintPulses(pulses, cam, now) {
    const w = TW * cam.z, h = TH * cam.z;
    for (const p of pulses) {
      const t = (now - p.t) / 620;
      if (t < 0 || t > 1) continue;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = p.color || rgb(pal.raw.edge);
      ctx.lineWidth = 2;
      diamond(ctx, sxOf(p.x, p.y, cam), syOf(p.x, p.y, cam), w * (0.6 + t * 2.4), h * (0.6 + t * 2.4));
      ctx.stroke();
      ctx.restore();
    }
  }

  function draw(s, cam, pulses, now, overlay = false) {
    if (dirty) paintGround(s, cam, overlay);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(ground, 0, 0, W, H);
    // Over the field, the city is there to locate you, not to be read.
    ctx.globalAlpha = overlay ? 0.34 : 1;
    paintBuildings(s, cam);
    ctx.globalAlpha = 1;
    paintPulses(pulses, cam, now);
  }

  return {
    resize, draw, fit, frame, pick, palette,
    invalidate() { dirty = true; },
    get size() { return { W, H }; }
  };
}
