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

- One course exists: `crypto-chains`, with **one finished lesson**,
  `01-what-a-hash-does` (11 screens, exercising all nine block types).
- The `sociedades-es` course (Spanish, España) is **not started** — no outline yet.
- Verified: snap scrolling, entrance animations, KaTeX inline and display, reveal
  toggle, resume-after-reload, deep links with storage cleared, light and dark,
  landscape. Not verified: `prefers-reduced-motion` (CSS-only path).

### Known gaps

- Lesson `01-what-a-hash-does` predates the content pipeline and has **no research
  brief** in `research/`. Its figures are computed by `tools/visuals/avalanche.py`,
  not recalled, so they are sound — but the usual artifact is missing.
- Not a git repo yet, and not deployed anywhere. Delivery is intended to be
  GitHub Pages, which on a free account needs a public repo — undecided.

## Layout

```
index.html               single entry, hash router
app/                     main.js (router) render.js (blocks) mdlite.js
                         progress.js i18n.js styles.css
content/index.json       list of course ids, pattern ids, and sections
content/<course>/        course.json + lessons/<id>.json
content/patterns/        <id>.json - one crochet pattern each
visuals/<course>/*.svg   inlined into the page, theme-aware
research/<course>/*.md   sourced briefs lessons are written from
schema/                  JSON Schema, for editor autocomplete
app/patterns.js          the pattern page and the workshop - see docs/PATTERNS.md
app/ui.js                chrome shared by both halves (icons, ring)
app/brand.js             the mark, the name, the pun field
app/theme.js             system / light / dark, remembered per reader
app/icons/               home-screen icon: icon.svg + rasterised PNGs
app/site.webmanifest     install metadata (name, colours, icons)
tools/serve.py           dev server
tools/publish.py         validate, commit, push - see docs/PUBLISH.md
tools/validate.py        format + house-rule enforcement
tools/visuals/           generators for data-bearing diagrams
tools/icons.sh           re-rasterises app/icons/ from icon.svg
docs/                    STYLE.md  VISUALS.md  FORMAT.md  PATTERNS.md  PLAN.md
```

## How content gets made

Five project skills in `.claude/skills/`, picked up automatically by any Claude
Code session opened on this directory:

```
course-outline  →  lesson-research  →  write-lesson  →  make-visual  →  check-content
```

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

`docs/PATTERNS.md` is the reference for the other content kind: crochet
patterns, worked one round at a time in a hands-busy workshop view rather than
read. `docs/FORMAT.md` is the block reference. `python3 tools/validate.py` enforces the
mechanical parts: ≤80 prose words per screen, ≤1 visual per screen, dead visual
references, ragged tables, unbalanced `$`, missing sources on law/tax courses.

## The two courses

1. **`crypto-chains`** (English) — how hashing, keys and chains actually work,
   mechanism first, no metaphors.
2. **`sociedades-es`** (Spanish, **España**) — sociedades empresariales: SL, SA, SLU,
   autónomo, Impuesto sobre Sociedades, IVA, IRPF, RETA, modelos AEAT, Registro
   Mercantil. Requires `needsSources: true`, a disclaimer, and a `reviewedOn` date
   on every lesson.

Both are advanced, written for a reader who will notice vagueness.
