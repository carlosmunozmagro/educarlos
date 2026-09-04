# The mystery section — design

Status: **design agreed, not built.** This document is the specification. When the
code exists, this stays as the record of what the world actually is — it is the
one place the answer is written down in plain language, for us, not for readers.

---

## What it is

The courses explain mechanism. This one hides it and makes you find it.

A reader opens a console onto a system that is genuinely running — real rules,
real dynamics — and nobody tells them the rules. They watch, they choose where to
point limited attention, they occasionally perturb it, and they write down what
they think is happening. The app later tells them whether they were right.

It lives in the `misterio` section, already declared in `content/index.json` with
badge `?` and the subtitle "Something else entirely."

**Decisions locked in:** a signal from an unseen source · real wall-clock drift
plus a live on-screen pulse · near-wordless · solvable, then it keeps going.

## The rule we do not break

**Everything visible must be deducible.** Every phenomenon has a rule a careful
reader could infer from evidence they can actually collect. No arbitrary lore, no
"mysterious because we said so", no randomness standing in for depth.

This is `docs/STYLE.md`'s honesty bar applied to a system instead of a sentence.
If we ever want an effect we cannot justify mechanically, we cut the effect.

---

## The world

An unseen source emits across **16 bands**. Five **voices** carry the signal.

Each voice has a band, an amplitude, a phase, and a period. The periods are not
arbitrary: every one is an integer multiple of a single hidden **base period P**.

Seeded per reader. A representative world, with `P = 30` ticks and a tick of
8 real minutes:

| Voice | Multiple | Period | Real time |
|---|---|---|---|
| I | 2 | 60 ticks | 8 hours |
| II | 3 | 90 | 12 hours |
| III | 4 | 120 | 16 hours |
| IV | 6 | 180 | **24 hours** |
| V | 9 | 270 | 36 hours |

Voice IV's period being exactly one day is deliberate. It sings at the same
wall-clock time every day, and it is the first thread anyone pulls.

Because the multiples share factors, **partial alignments happen constantly** —
two or three voices in phase, several times a day. Those are the training set.
`lcm(2,3,4,6,9) = 36`, so all five align every `36P = 1080` ticks — **once every
six days**. That is the **grand conjunction**.

The multiple set, `P`, the tick length, the band count and the voice count are
all config in `sim.json`, and the multiples are drawn per seed from a family that
keeps the lcm in the 5–8 day range.

## Attention

A reader listens to **3 of 16 bands** at full resolution. The other 13 return a
single coarse energy figure: you know something happened, not what or where.

Voices are **shy**. A voice observed continuously for more than `S` ticks drifts
to another band. Staring chases the signal off. This is what makes "which three?"
a strategy rather than a menu, and it is the first evidence that the source is
aware of being watched.

Two costed actions, on a charge that regenerates in real time — 3 maximum, one
per ~6 hours. This is what enforces the pace honestly; grinding is impossible.

| Action | Effect | Cost |
|---|---|---|
| `listen(b₁,b₂,b₃)` | full resolution on three bands | free, logged |
| `ping(b)` | injects energy; phase-shifts voices near `b` | 1 charge |
| `damp(b)` | suppresses band `b` for `D` ticks; voices will not enter it | 1 charge |
| `mark(tick)` / `predict(tick)` | notebook entries | free |

## The three layers

**Layer 1 — it is harmonic.** The solve is a `predict` entry naming the tick of a
grand conjunction, logged before the fact, correct within ±2 ticks. Nobody is told
there is a base period or that prediction is the goal. They get there by noticing
the intervals share a divisor.

**Layer 2 — it is copying you.** A correct layer-1 prediction unlocks one new
instrument: the **residual view**, actual signal minus the harmonic model the
reader has just proved. The residual is not noise. It is the reader's own ping
history, replayed at a fixed delay `Δ` through a fixed band permutation `π`.

It has been mirroring them the whole time, in the one part of the signal they had
no instrument to see. Anybody who kept a log of their own pings can deduce it
cold. The layer-2 solve is layer 1 inverted: predict what the *source* will do,
from what *you* did.

**Layer 3 — it initiates.** After layer 2 the echo stops being a copy. Variations
first, then sequences the reader never played. There is no further solve. The
notebook goes on scoring predictions, and the world goes on running.

## The notebook

The reader's only prose, and it is theirs. Free text for observations, but a
*prediction* is structured — a tick, optionally a band — so the app can score it
without reading English or Spanish. Predictions resolve themselves as the world
reaches them. That scoring is the entire reward system; there is nothing else.

## Time

Two clocks, and only one of them is state.

**Slow tick — 8 real minutes.** `tick = floor((now − epoch) / TICK_MS)`. Advances
whether the app is open or not. All state lives here. Close the tab, come back
tomorrow, 180 ticks have happened without you and the app replays them on load.

**Live pulse — wall-clock seconds.** The on-screen waveform is an analytic
function of the slow state and the current second: a sum of sinusoids with
parameters read from state. It is *presentation, not state*. The screen is never
still; the state machine still steps every 8 minutes. No drift, no battery cost,
determinism untouched.

Returning after an absence opens on a **digest**: the elapsed span as a scrubable
compressed waterfall, so time away is something you review rather than something
you missed.

## Determinism

The engine never calls `Math.random`.

RNG is a **stateless hash** of `(seed, tick, salt)` — splitmix-style mixing, not a
stateful stream. Any tick is computable directly, so fast-forwarding is exactly
equal to having been present. State is `fold(rules, seed, choiceLog)`. Storage is
the seed, the log and the notebook — nothing derived is ever persisted.

Same seed and same choices produce the same world on any device. Export and import
a run as JSON, like progress already does.

Replay cost is microseconds per tick; a year is ~65k ticks and replays instantly.
Beyond a hard cap we coarse-fold rather than refuse.

## Why a static host is fine

Everything is client-side and readable, so we make that a legitimate route rather
than fighting it. Reading `world.js` gives a reader the *physics* — that voices
are harmonic, that the residual is a delayed echo. It does not give them their own
`P`, their multiples, their `Δ` or their `π`. Those come from the seed.

Source-diving hands you the theory and still makes you measure. That is the right
outcome for this repo.

## Wordless

Bands, glyphs, marks, numbers. Near-zero prose, so it sits outside the EN/ES split
and earns the `?` badge. UI chrome (buttons, digest, notebook) localises through
the existing `app/i18n.js`; the world itself says nothing.

---

## Shape of the code

New route `#/x/:id`. No dependencies, no build step, same vanilla-JS grain.

```
content/misterio/<id>/sim.json   seeded config — new content kind, not a course
app/sim/rng.js                   stateless seeded hash. no Math.random anywhere
app/sim/world.js                 the hidden rules. pure: no DOM, no clock
app/sim/engine.js                (state, tick) -> state; replay and fast-forward
app/sim/instruments.js           state -> what the reader is permitted to see
app/sim/console.js               the view, canvas waterfall, 60fps pulse
app/sim/journal.js               seed, choice log, notebook, lastSeenTick, layer
docs/MISTERIO.md                 this file
```

`content/index.json` gains a `sims` list on a section, rendered by `viewSection`
alongside course cards. Storage key `edu.sim.v1`.

## Verification

`world.js` and `engine.js` are pure ES modules with no DOM, so **Node 22 (present
in this environment) runs them headlessly**. `tools/sim_check.py` shells out to
node and asserts:

- replaying `0..N` in one pass equals replaying it in two, split anywhere
- state at tick `N` is identical across two processes with the same seed and log
- a grand conjunction lands exactly where `lcm(multiples) · P` says it does
- partial alignments occur at the predicted density
- no `Math.random`, no `Date.now`, no DOM reference anywhere under `app/sim/`
  except `console.js`
- charge regeneration never exceeds the cap under any replay

Then the browser pass, at 375×812: the pulse runs at 60fps without pinning the
CPU, the digest scrubs, a reload mid-session resumes identically, and a run
exported on one device imports onto another and matches tick for tick.

Note: `tools/validate.py`, `tools/serve.py` and `schema/` are described in the
README but do not exist on disk. This is the first tooling in the repo; it should
not pretend to hook into a validator that was never written.

## Build order

1. **`rng.js` + `world.js` + `engine.js`, headless.** No UI at all. Node harness
   prints a text waterfall for a seeded world over 30 simulated days. Purpose: tune
   the world until it is interesting on paper before drawing a single pixel.
2. **The console, read-only.** Route, canvas waterfall, live pulse, attention
   allocation. No actions, no notebook. Purpose: agree it feels alive.
3. **Actions and charges.** Ping, damp, the shy-voice coupling.
4. **Notebook and layer 1.** Predictions, scoring, the conjunction solve.
5. **Digest.** Return-after-absence review, export/import.
6. **Layer 2.** Residual instrument, echo, the solve.
7. **Layer 3.** Initiation.

Each phase is reviewable on its own, and phase 1 is where the design either
survives contact or gets rewritten cheaply.

## Open calibration

Tunable once phase 1 is running and not worth arguing before then: tick length,
the multiple family and therefore conjunction cadence, how shy the voices are,
charge economy, `Δ` and how discoverable `π` should be, and how much a first-time
visitor sees in a single sitting before it can possibly seem interesting.
