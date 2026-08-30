# Visual language

Every SVG in these courses is inlined into the page, so it inherits the theme.
That is the whole reason for the rules below: a visual that hardcodes colour or
size looks broken in one of the two themes, or unreadable on a 375px phone.

---

## 1. Canvas

- `viewBox="0 0 300 H"` — **always 300 wide.** Pick `H` to fit the content.
- **No `width` or `height` attributes.** CSS sets `width: 100%`.
- Left/right margin ≥ 4 units. Nothing may be drawn outside `0 ≤ x ≤ 300`.
- 300 units maps to roughly 328 CSS px on a phone, so one unit ≈ one pixel.
  Judge legibility as if these were pixels.

**Before writing any grid or row of repeated shapes, check it fits:**

```
n * cell + (n - 1) * gap + 2 * margin  <=  300
```

A grid that overflows silently clips its own labels and still looks plausible in
code review. Compute the extent, assert it, then draw.

## 2. Colour — use the shared classes, never literals

The stylesheet defines these on `.b-visual svg`. They are the entire palette.

| Class | Use for |
|---|---|
| `.lbl` | Primary labels — full-strength text |
| *(none)* | Body text in the diagram — sits at `--text-dim` |
| `.dim` | Secondary/caption text inside the art |
| `.accent` | The one thing the reader should look at first |
| `.box` | Filled container: surface fill, subtle border |
| `.line` | Connectors, arrows, axes — stroke only |
| `.stroke-accent` | A **line** in the accent colour. Use this for plotted curves — `.accent` sets `fill`, so a path using it renders as a filled blob, not a line |
| `.hot` | Data cells that are "on", changed, or highlighted |
| `.cold` | Data cells that are "off" or baseline |

The only literal paint values allowed are `none` and `currentColor`.
Any hex colour in an SVG is a bug — it will be wrong in light or dark mode.

## 3. Legibility

- Font sizes: labels `11–12`, body `11`, in-art captions `10`. **Never below 9.**
- Do not set `font-family` — it is inherited so the diagram matches the page.
- **At most ~7 labelled elements.** More than that, split it into two visuals
  across two screens.
- Colour is never the only encoding. Pair `.hot`/`.cold` with position, a label,
  or a count so the diagram survives greyscale and colour-blindness.
- Give arrows a `marker-end`; define the marker once in `<defs>` per file.

## 4. Data-driven visuals must be generated, not hand-written

If a visual encodes real values — hashes, bit patterns, tax brackets, timelines —
**write a Python generator in `tools/visuals/` and run it.** Do not type the
numbers by hand.

- The script prints the values it drew so they can be checked against the lesson text.
- Any figure quoted in the lesson caption comes from that same script run.
- This is not a style preference: hand-typed data in a diagram is how a lesson ends
  up asserting something the diagram contradicts.

See `tools/visuals/avalanche.py` for the reference example.

## 5. Kinds of visual, and when each earns its place

| Kind | Use when |
|---|---|
| **Structure** | Parts and how they connect — a block header, a Merkle tree, a holding company |
| **Flow** | Ordered steps with direction — a transaction, an invoice through IVA |
| **Comparison** | Two or three things differing along one axis — SL vs SA vs autónomo |
| **Quantity / scale** | The point *is* the magnitude — `2^256`, bit flips, a bracket curve |
| **Decision tree** | The reader has to choose — which entity, which régimen |
| **Timeline** | Deadlines and sequence — the fiscal year, filing calendar |

If the visual doesn't carry an idea the prose can't, cut it. Decoration is worse
than nothing: it costs a screen and teaches nothing.

## 6. Alt text and captions do different jobs

- **`alt`** — describes what is drawn, for someone who cannot see it.
  *"Two rows of bits; roughly half of the second row is highlighted as flipped."*
- **`caption`** — states the finding, and may use markdown-lite.
  *"Across the full digest, **131 of 256 bits** flipped — almost exactly half."*

Never write `alt: "diagram"` or a caption that just names the visual.

## 7. Checklist before saving

1. `viewBox` is `0 0 300 H`, no `width`/`height`.
2. Every drawn extent is inside the canvas — grids verified with the formula above.
3. No hex colours; only the shared classes, `none`, `currentColor`.
4. No font sizes below 9; no `font-family`.
5. ≤ 7 labelled elements.
6. If it encodes data, a generator exists in `tools/visuals/` and was run.
7. `alt` describes, `caption` concludes.
8. Referenced by a lesson — `check-content` warns about orphans.
