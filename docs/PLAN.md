# Brilliant-style scrolling course app

## Context

You want a phone-first web app for reading deep, well-designed lessons — the feel of Brilliant (beautiful, visual, one idea per screen) without the quiz machinery. Instead of tapping through interactive exercises, you scroll: each screen snaps into place, its visual animates in, and occasional prompts let you tap to reveal an answer.

Two courses drive the design, and they're deliberately different stress tests:

1. **Crypto & chains** (English) — how the math actually works: hashing, keys and signatures, what a block really is, Merkle trees, mining and difficulty, forks and finality. Heavy on formulas, code, and structural diagrams.
2. **Sociedades empresariales** (Spanish, España) — SL/SA/SLU/autónomo, Impuesto de Sociedades, IVA, IRPF, RETA, modelos AEAT, Registro Mercantil, and how to use these structures well. Heavy on prose, comparison tables, decision trees, and citable sources.

Both are advanced and neither fits in a single sitting, so the app needs real structure — courses split into chapters and lessons, a visual course map, and saved progress — and content length is driven by the material, not a fixed quota.

Beyond the app itself, you want **skills** that capture *how* content gets written here, so future lessons come out in the same voice, the same screen rhythm, and the same visual language without re-deciding every time.

**Decisions locked in:** vertical snap screens · reveal-and-animate (no scoring) · JSON content · Spain jurisdiction · GitHub Pages hosting · length driven by content.

---

## Content format: JSON, with the escape hatches that make it pleasant

You leaned JSON for visuals and links. Agreed, with two adjustments that remove the usual JSON pain:

- **Visuals live in their own `.svg` files**, referenced by path — never pasted into JSON strings. They stay editable, diffable, and reusable.
- **Text fields accept inline markdown-lite** — `**bold**`, `_italic_`, `` `code` ``, `[text](url)`, `$math$`. So links and emphasis are natural, while structure stays machine-readable and validatable.

**One lesson = one JSON file.** A course's `course.json` is only a manifest of chapters and lesson ids. This matters given open-ended length: I generate, and you edit, one lesson at a time without touching a 5000-line file.

```
content/crypto-chains/course.json          ← meta + chapter/lesson manifest
content/crypto-chains/lessons/02-hashing.json
```

A lesson is a list of **screens**; each screen is a list of typed **blocks**:

| Block | Purpose |
|---|---|
| `prose` | Heading + paragraphs. The default. |
| `visual` | `{src, caption, alt}` → inlined SVG |
| `formula` | Display math via KaTeX (`E = mc^2`) |
| `code` | Syntax-highlighted snippet |
| `table` | Comparison tables — essential for SL vs SA vs autónomo |
| `callout` | `key` / `note` / `warning` / `gotcha` |
| `steps` | Numbered walkthrough, revealed step by step |
| `reveal` | Prompt + hidden answer, tap to expand |
| `sources` | Citations (BOE, AEAT, BIPs, whitepapers) |

Screens are capped by design (~1 idea, ≤80 words of prose, ≤1 visual). The validator enforces it — that constraint is what keeps it feeling like Brilliant rather than a wall of text.

---

## Architecture

Vanilla JS, no framework, no build step, no runtime dependencies to install. Hash routing so GitHub Pages serves it without any redirect config.

```
index.html                  single entry, hash router
app/
  main.js                   routes: #/ · #/c/:course · #/c/:course/l/:lesson
  render.js                 block renderers (one function per block type)
  progress.js               localStorage, versioned key
  mdlite.js                 inline markdown → HTML (escaped, no innerHTML of raw input)
  i18n.js                   UI chrome follows course language (es/en)
  styles.css
content/
  index.json                course library
  crypto-chains/ · sociedades-es/
visuals/<course>/*.svg
vendor/katex/               self-hosted, works offline and under strict CSP
schema/course.schema.json · schema/lesson.schema.json
tools/validate.mjs          schema + house-rules linting
docs/STYLE.md · docs/VISUALS.md
```

**Three views:**

1. **Library** — the two courses as cards with progress rings.
2. **Course map** — the "visual layout" you asked for: chapters as labelled sections, lessons as nodes on a vertical spine, each showing not-started / in-progress / done. Tapping resumes exactly where you left off.
3. **Lesson player** — `scroll-snap-type: y mandatory` over full-height screens. `IntersectionObserver` drives both the entrance animations and progress tracking. A thin progress bar pinned to the top; swipe-down-at-end advances to the next lesson.

**Mobile details that decide whether this feels native or broken:** `100dvh` not `100vh` (Safari's collapsing toolbar), `env(safe-area-inset-*)` padding, `overscroll-behavior: contain`, `prefers-reduced-motion` respected, dark-first palette with per-course accent (amber for crypto, teal for sociedades).

**Progress** lives in `localStorage` under `bs.progress.v1` as `{lessonId: {lastScreen, completed, updatedAt}}`, with an export/import-JSON escape hatch so it survives you clearing Safari data.

---

## The skills

Four skills in `.claude/skills/`, each thin because the actual house style lives in `docs/STYLE.md` and `docs/VISUALS.md` — you edit those to change how content comes out, without touching skill logic.

| Skill | Does |
|---|---|
| **`course-outline`** | Topic + language + jurisdiction → researches and proposes a chapter/lesson outline with a one-line learning objective per lesson. Writes `course.json` and registers the course. **Stops for your approval before any lesson is written** — this is where "as long as it needs to be" gets decided per course. |
| **`write-lesson`** | Generates one lesson's screens to house style: opens with a concrete hook, one idea per screen, a visual at least every 3 screens, a `reveal` prompt per section, `sources` on anything factual. Creates the SVGs it needs, runs the validator, reports what it wrote. |
| **`make-visual`** | Produces a single SVG in the house visual language — shared palette tokens, consistent stroke weights, legible at 375px wide, readable in both themes, no embedded fonts. |
| **`check-content`** | QA pass: schema validation, screen-length limits, dead visual refs, KaTeX parse errors, missing sources, language consistency, and staleness (flags tax/legal lessons whose `reviewedOn` is over a year old). |

Because the Spanish course covers tax and legal territory, its schema carries a required `disclaimer` and per-lesson `reviewedOn` + `sources`, surfaced on the course map. `check-content` treats a missing source on a factual claim as an error, not a warning.

---

## Build order

Each phase is independently useful and reviewable — you can stop and look at real output at every step.

- **Phase 1 — Skeleton + format proof.** Repo, schema, styles, runtime, and *one hand-written lesson* (crypto: "What a hash actually does") exercising every block type. Purpose: agree on how it looks and reads before generating volume.
- **Phase 2 — Ship to your phone.** `git init`, push, enable GitHub Pages, verify on your actual phone, add to home screen. *Note: Pages on a free account needs a public repo — the content is educational, so that's likely fine, but it's your call at this step.*
- **Phase 3 — Skills + style docs.** Write `docs/STYLE.md` from what Phase 1 taught us, then the four skills.
- **Phase 4 — Crypto course.** `course-outline` → you approve → chapters generated one at a time.
- **Phase 5 — Sociedades course.** Same loop, in Spanish, with the sources/disclaimer discipline.
- **Phase 6 — Polish.** PWA manifest + service worker for genuine offline reading, page transitions, progress export.

## Verification

- `node tools/validate.mjs` — schema + house rules across all content; wired to run at the end of every content skill.
- `python3 -m http.server 8080` and drive it in the browser at a 375×812 mobile viewport: check snap behaviour, animation entry, reveal taps, KaTeX rendering, and that progress survives a reload and a mid-lesson exit.
- Deliberate hostile checks: rotate to landscape, enable reduced-motion, load with `localStorage` cleared, and open a lesson URL directly (deep link) rather than navigating in.
- Final check on your real phone via the Pages URL, since iOS Safari's toolbar behaviour is the thing most likely to break the snap layout.

## Open question for later (not blocking)

Whether the two courses share one Pages site or get separate ones. Defaulting to one site, one library, two courses — simpler and lets the library screen do its job.
