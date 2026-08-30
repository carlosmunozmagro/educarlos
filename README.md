# Lessons — a scrolling course app

A phone-first web app for reading deep lessons one screen at a time. The feel of
Brilliant, without the quiz machinery: you scroll, each screen snaps into place,
its visual animates in, and occasional prompts let you tap to reveal an answer.

Vanilla JS. No framework, no build step, no npm install. Python 3 is the only tool
needed, and only for the dev server and the validator.

---

## Run it

```bash
python3 tools/serve.py          # serves this directory on http://localhost:8080
python3 tools/validate.py       # checks all content, exits non-zero on errors
```

Then open `http://localhost:8080` and view it at phone width (375×812).

## Current state

**Working end to end.** Library → course map → lesson player, with progress saved
to `localStorage` and mid-lesson resume.

Three courses, at very different stages:

| Course | Lang | Lessons | State |
|---|---|---|---|
| `sociedades-es` | es | **40 / 40** | **complete** — 10 chapters |
| `historia-es` | es | 23 / 32 | chapters 7 and 8 unwritten (lessons 24–32) |
| `crypto-chains` | en | 1 / 1 | one finished lesson; no outline beyond it |

Verified: snap scrolling, entrance animations, KaTeX inline and display, reveal
toggle, resume-after-reload, deep links with storage cleared, light and dark,
landscape. Not verified: `prefers-reduced-motion` (CSS-only path).

### Known gaps

- `historia-es` lists lessons 24–32 in its manifest with no files on disk, so
  `tools/validate.py` currently exits non-zero. Research briefs exist through
  lesson 21.
- `sociedades-es` has research briefs for 16 of its 40 lessons. The 20 lessons of
  chapters 1–7 written before the brief discipline settled have none.
- Lesson `01-what-a-hash-does` predates the content pipeline and has **no research
  brief**. Its figures are computed by `tools/visuals/avalanche.py`, so they are
  sound — but the usual artifact is missing.
- Not deployed. Delivery is intended to be GitHub Pages, which on a free account
  needs a public repo — undecided.

## Layout

```
index.html               single entry, hash router
app/                     main.js (router) render.js (blocks) mdlite.js
                         progress.js i18n.js styles.css
content/index.json       list of course ids
content/<course>/        course.json + lessons/<id>.json
visuals/<course>/*.svg   inlined into the page, theme-aware
research/<course>/*.md   sourced briefs lessons are written from
schema/                  JSON Schema, for editor autocomplete
app/brand.js             the mark, the name, the pun field
tools/serve.py           dev server
tools/publish.py         validate, commit, push - see docs/PUBLISH.md
tools/validate.py        format + house-rule enforcement
tools/visuals/           generators for data-bearing diagrams
docs/                    STYLE.md  VISUALS.md  FORMAT.md  PLAN.md
```

## How content gets made

Five project skills in `.claude/skills/`, picked up automatically by any Claude
Code session opened on this directory:

```
course-outline  →  lesson-research  →  write-lesson  →  make-visual  →  check-content
```

> The skills live in `.claude/skills/` and are **not currently present in this
> repository** — neither is `schema/`. `tools/validate.py`, `tools/serve.py` and
> `tools/publish.py` are documented below; only `validate.py` and the generators in
> `tools/visuals/` exist on disk today.

- **course-outline** — research the domain, propose chapters and lessons, stop for
  approval, then write `course.json`. Course length follows the material.
- **lesson-research** — investigate from primary sources, write a sourced brief to
  `research/`. Flags perishable and unconfirmed facts.
- **write-lesson** — brief → validated lesson JSON.
- **make-visual** — SVG in the house visual language.
- **check-content** — validator plus a reading pass against the house style.

The rules those skills follow live in **`docs/STYLE.md`** (lesson arc, voice, depth
bar, sourcing, Spanish/España conventions) and **`docs/VISUALS.md`** (canvas, colour
classes, legibility, data-driven generation). Edit those docs to change how all
future content comes out — the skills read them rather than duplicating them.

**`docs/PUBLISH.md`** is the deploy guide: one-time GitHub Pages setup, then
`python3 tools/publish.py` for everything after.

`docs/FORMAT.md` is the block reference. `python3 tools/validate.py` enforces the
mechanical parts: ≤80 prose words per screen, ≤1 visual per screen, dead visual
references, ragged tables, unbalanced `$`, missing sources on law/tax courses.

## The courses

1. **`crypto-chains`** (English) — how hashing, keys and chains actually work,
   mechanism first, no metaphors.
2. **`sociedades-es`** (Spanish, **España**) — sociedades empresariales: SL, SA, SLU,
   autónomo, Impuesto sobre Sociedades, IVA, IRPF, RETA, modelos AEAT, Registro
   Mercantil. Ten chapters, from what a company legally is through hiring, partners,
   distress and restructuring.
3. **`historia-es`** (Spanish) — the history of Spain, argued from sources rather
   than narrated.

The two Spanish courses that touch law or tax require `needsSources: true`, a
disclaimer, and a `reviewedOn` date on every lesson.

All are advanced, written for a reader who will notice vagueness.

Running cases are registered in `research/<course>/CASES.md` — read it before
writing a lesson that continues one, and update it after.
