# Patterns

A second content kind, next to courses. A course is read; a pattern is
**worked**, over days, with a hook in one hand. That difference is the whole
design:

- A lesson screen is a page you scroll through. A pattern round is a **state**
  you advance and come back to.
- The reader gets one glance, from arm's length, at an angle. So the round
  fills the screen, and the whole screen is the button that advances it.
- What gets remembered is not "how far you read" but "which round the hook is
  on" — including which of six identical rounds.

```
content/index.json                 { "patterns": ["ledi-la-perrita", ...] }
content/patterns/<id>.json         one object, one file
```

Routes: `#/p/:patternId` is the object page, `#/p/:patternId/t/:pieceId` the
workshop (`t` for _taller_), and `#/p/:patternId/h` the sheet (`h` for _hoja_).
`#/p/:id/t/:piece/:n` opens the workshop at round entry `n`, which is what the
sheet's rows link to; `#/p/:id/h/:piece` opens the sheet scrolled to a piece,
which is what the workshop's crumb links to.

## The file

| Field | |
|---|---|
| `id` | must equal the file name |
| `lang` | `es` or `en` — drives the UI chrome |
| `accent` | `#rrggbb`, the pattern's one accent colour |
| `section` | the section id the back arrow returns to (default `punto`) |
| `title`, `subtitle` | shelf card |
| `description` | top of the object page |
| `level`, `size`, `hook` | the three chips under the title. All optional |
| `materials[]` | `{ label, value }`, or a plain string |
| `abbr[]` | `{ k, name, note? }` — the stitch key, also the workshop's sheet |
| `notes[]` | what to know before casting on |
| `pieces[]` | see below |
| `assembly[]` | `{ title?, text }` — what happens once the pieces exist |
| `source` | `{ title, url? }` — where the pattern came from. Always credit it |

### pieces[]

```json
{
  "id": "cabeza",
  "title": "Cabeza",
  "qty": 2,
  "color": "beige",
  "rounds": [ … ],
  "finish": ["Rellena firme", "Cierra dejando hebra larga"]
}
```

### rounds[]

| Field | |
|---|---|
| `n` | the round number, or a range: `7` / `"7-12"` |
| `text` | the instruction itself, in markdown-lite |
| `count` | total stitches at the end of the round — also the stitch counter's target |
| `reps` | how many worked rounds this one authored round stands for. Read off `"7-12"` when omitted |
| `note` | the one thing that goes wrong here. Optional, and worth its weight — it is the only place the pattern can warn you _while_ your hands are on it |
| `label` | overrides the big number, for pieces worked in rows rather than rounds |

A range round is expanded by the app: `"7-12"` is six taps, each showing its
own number (7, 8, 9…) and a row of pips, so "which of the six am I on" is
answered without counting.

## The sheet

The workshop answers *what now*. The sheet answers *where am I*, which is a
different question and gets the opposite layout: every step of every piece in
one column, the way a printed pattern reads — and it prints as one, with the
chrome and the colour dropped.

It is also the recovery path. Lose your place, scan the list, tap the round
your hands are actually on, and the workshop opens there and remembers it.
Worked rounds are struck through (their notes are not — those are still
information), and the round you are on carries the marker, on started pieces
only.

## The workshop

- **Tap anywhere** on the round → next. **Swipe** left/right → forward/back.
- **↶** in the bottom bar → one round back. It is the recovery path for a
  mis-tap and it is always reachable, including from the finished screen.
- **The middle button** counts stitches within the round, against `count`.
  Tap to add one; **hold half a second** to zero it.
- **The eye** holds a screen wake lock, on by default: the phone must not go
  dark mid-round. Silently absent where the browser has no `wakeLock`.
- **≡** opens the stitch key over the round, one tap out and one tap back.
- Position is saved on every step, per piece, under `p/<pattern>/<piece>` in
  the same `localStorage` store as reading progress.

## House rules for writing one

1. **One round, one screen, no scrolling.** If an instruction does not fit at
   `clamp(1.5rem, 7.4vw, 2.15rem)`, it is two rounds or it belongs in `note`.
2. **Every round carries its `count`.** It is how a worker finds the round
   where it went wrong — always the round where the total stopped matching.
3. **Collapse identical rounds** into one range round rather than repeating
   them. Six taps through six identical entries is the same work; six entries
   is six chances to lose your place.
4. **Notes are for the thing that goes wrong there** — where to stuff, where a
   colour changes, which side is the front. Not commentary.
5. **Credit the source**, with a link where there is one. Patterns have
   authors.
