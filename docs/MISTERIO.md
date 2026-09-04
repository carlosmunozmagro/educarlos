# The mystery section — design

Status: **phase one built and passing.** The engine exists and is verified
headlessly; nothing is drawn yet. This document is the specification and the
record of what the world actually is — the one place the answer is written down
in plain language, for us, not for readers.

Where the design changed under contact with a running world, it says so, because
the reason is usually more useful than the rule.

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

Each voice **hums continuously and peaks periodically** — it is never silent.
That was not the first design, and the reason for it is in "what phase one
taught us" below.

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

A reader listens to **3 of 16 bands** at full resolution. The rest of the
spectrum returns as **four group totals**, four bands summed into each. A hot
group says roughly where to look and never which band, because a sum cannot be
unpicked: one loud band and three quiet ones read the same as four middling ones.

Voices are **shy**. A voice **caught mid-peak** `S` times in a band the reader is
listening to drifts elsewhere — counted per peak, not per tick. Staring chases
the signal off. This is what makes "which three?" a strategy rather than a menu,
and it is the first evidence that the source is aware of being watched.

A voice fleeing the reader **evades**: it will not move into a band being
listened to. A voice evicted by a ping or a damp is not fleeing, and lands
wherever it lands. That asymmetry is what makes damping worth a charge — it is
the only way to push a voice somewhere you can see it.

Two costed actions, on a charge that regenerates in real time — 3 maximum, one
per ~6 hours. This is what enforces the pace honestly; grinding is impossible.

| Action | Effect | Cost |
|---|---|---|
| `listen(b₁,b₂,b₃)` | full resolution on three bands | free, logged |
| `ping(b)` | sonar: rings long in an occupied band, dies fast in an empty one; evicts whatever was there; returns as an echo `Δ` later | 1 charge |
| `damp(b)` | suppresses band `b` for `D` ticks; voices will not enter it | 1 charge |
| `mark(tick)` / `predict(tick)` | notebook entries | free |

**Ping never touches phase.** The obvious version — a ping nudges nearby voices
out of phase — quietly destroys layer one: if phases move unpredictably, the
conjunction is no longer predictable and the solve evaporates. So a ping is a
probe instead. It rings on in a band with a voice in it and dies quickly in an
empty one, which is the only way to learn what lives in the thirteen bands nobody
is listening to. It also evicts what it finds: you learn a voice *was* there.

That is why a reader pings at all — and every ping is what feeds the echo that
becomes layer two. The instrument and the trap are the same instrument.

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

**Live pulse — wall-clock seconds.** `voiceLevel()` does not require an integer
tick, so the on-screen waveform is the same function evaluated continuously. It
is *presentation, not state*: the screen is never still, the state machine still
steps every 8 minutes. No drift, no battery cost, determinism untouched.

**History is recomputed, never stored.** `trace()` replays any past span exactly,
so the waterfall shows where the voices have been and a two-day absence renders
in full instead of leaving a gap. This is load-bearing rather than decorative: a
voice peaks for about five ticks in a period of sixty to two hundred and seventy,
so almost nobody is ever *present* at a peak. Periods get measured off the trace
afterwards. That is what a waterfall is for.

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

## What phase one taught us

The harness ran before anything was drawn, which is the entire point of building
it in that order. Four things were wrong, and none of them were visible on paper.

**The world was empty 89% of the time.** Voices existed only during their peaks —
a duty cycle of about 4% — so a reader watching three bands of sixteen had roughly
a 7% chance of seeing anything at all on a visit. They would have concluded it was
broken. Fixed by giving every voice a continuous hum, so a band with a voice in it
always shows *something* and the puzzle moves from "is anything there" to "what is
the period of the thing that is".

**Fleeing was unconditional, and that is fatal.** Relocation avoided the reader's
attention for every reason a voice moved, so nothing could ever move *into* view.
Every voice drifted permanently out of reach and the world converged on a dead
screen. Now only a voice *fleeing* evades; one evicted by a ping or damp lands
anywhere. This is also what gives damping a purpose.

**A single coarse aggregate leaves no search gradient.** It was deliberate — a sum
cannot be binary-searched — and it made the spectrum unsearchable rather than
merely hard: three slots, sixteen bands, no direction, and a sonar that costs a
charge and destroys what it finds. Group totals restore direction without
resolving individual bands, and it is how the instrument would really work.

**Shyness counted ticks instead of peaks.** A peak is about five ticks wide, so a
shyness of six was really a shyness of just over one: a voice bolted before a
reader could watch it peak twice. Two successive peaks is the minimum evidence for
a period, so that one line made layer one unsolvable. Counting rising edges fixed
it, and shy relocations over 30 days fell from 33 to 9.

The seeded family `[2,3,4,9,12]` also had to go: it contains no multiple of 6, so
that world had no 24-hour voice and no first foothold. The check now asserts every
family has exactly one.

### Where it stands, over 30 simulated days

| | |
|---|---|
| reader has a voice in view | 94–99% of ticks |
| peaks visible in a 3-day waterfall | 2.3–10.2 depending on seed |
| grand conjunction | every 4–6 days, exactly on `lcm(mults)·P` |
| conjunction as seen | whole spectrum swells `.` → `#` over ~1 hour, then decays |

**The open calibration risk is that spread.** A reader on seed `ligera` gets four
times less evidence than one on `verano`, which is the difference between a
measurable world and a frustrating one. Either narrow the families or raise the
attention budget — decide it against the real console in phase 2, not on paper.

## Verification

Built and passing. `python3 tools/sim_check.py` runs three tiers:

**Static.** Nothing under `app/sim/` may contain `Math.random`, `Date.now`,
`performance.now`, `localStorage`, or any DOM reference — `console.js` excepted,
since it draws. Comments are stripped first, so the documentation may discuss the
banned names. Config is checked too: every family has exactly one 24-hour voice,
every conjunction cycle lands in 3–8 days, no echo delay is a multiple of `P`,
every band map is invertible, and the echo gain clears the noise floor.

**Runtime** (`tools/sim_check.mjs`, under node). Replay splitting at ten awkward
ticks; `trace` agreeing with `replay`; conjunctions landing exactly on
`lcm(mults)·P` and nowhere else; charges staying inside `[0, cap]`; a fourth ping
in a row refused; no two voices sharing a band; no voice sitting in a damped band;
every echo traceable to a real ping at exactly `Δ` through exactly `π`; the
residual sealed below layer two and only noise when nothing has been pinged; the
clock truncating and clamping; the signal defined *between* ticks, which is what
the live pulse renders.

**Crossing.** The same seed and log replayed in two separate node processes must
produce byte-identical state. A single process cannot check this: a stateful PRNG
seeded once at import would pass every in-process test and fail here.

Still to do in the browser, at 375×812: the pulse at 60fps without pinning the
CPU, the digest scrubbing, a reload resuming identically, and a run exported on
one device importing onto another and matching tick for tick.

Then the browser pass, at 375×812: the pulse runs at 60fps without pinning the
CPU, the digest scrubs, a reload mid-session resumes identically, and a run
exported on one device imports onto another and matches tick for tick.

Note: `tools/validate.py`, `tools/serve.py` and `schema/` are described in the
README but do not exist on disk. `tools/sim_check.py` is therefore the first
working tooling in the repo and stands alone rather than hooking into a validator
that was never written.

## Build order

1. ~~**`rng.js` + `world.js` + `engine.js`, headless.**~~ **Done.** Plus
   `instruments.js`, `tools/sim_harness.mjs` (`--truth`, `--reader`, `--summary`)
   and the three-tier check above. Four design faults found and fixed before a
   pixel was drawn.
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

Deliberately still open, and best settled against the real console rather than
the harness: the evidence spread between seeds (see above — the sharpest one),
tick length, conjunction cadence, how shy the voices are, the charge economy, `Δ`
and how discoverable `π` should be, how long a waterfall the console shows, and
how much a first-time visitor sees before it can possibly seem interesting.
