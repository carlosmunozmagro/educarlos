# House style for lessons

The rules a lesson has to satisfy before it ships. `write-lesson` follows these;
`check-content` enforces the mechanical ones. Edit this file to change how all
future content comes out — the skills read it, they don't duplicate it.

---

## 1. The shape of a lesson

A lesson is 8–16 screens following one arc. Do not shuffle it.

| Screens | Job |
|---|---|
| 1 | **Hook.** A concrete claim, number, or question that opens a gap. `kind: "title"`. |
| 2–3 | **One specific instance**, with real values, before any general rule. |
| middle | **The mechanism**, one move per screen, anchored by a visual. |
| — | **A reveal**, placed where the reader can almost answer it. |
| late | **Formalise.** The notation arrives *after* the intuition, never before. |
| — | **Where it breaks.** An edge case, a limit, a thing people get wrong. |
| last | **Consolidate:** the one sentence worth keeping, then the handoff to the next lesson, then `sources`. |

This ordering is *concreteness fading* — instance first, abstraction second.
Reversing it is the single most common way a lesson stops working.

### The running case

A lesson is not a list of rules with a worked example bolted on. **One concrete case
runs the whole way through, and the rules are what that case forces you to notice.**

- **Name someone and put them in a situation** by screen 2 at the latest. A person, a
  real date, a real amount, an ordinary business. Not "una empresa" — *Marta firma la
  escritura el 3 de marzo*.
- **Advance the case on most screens.** Each screen moves the story forward a step:
  she signs, the Registro inscribes, the money arrives, she transfers it. The legal
  point arrives *because* of what just happened, not alongside it.
- **The case must generate the misconception naturally.** If the reader would not make
  the mistake in this situation, the situation is wrong.
- **Resolve it.** The closing screen says what happened to her, not just what the rule was.
- **Keep the numbers consistent.** The amount on screen 6 is the amount on screen 9.
  Contradicting your own case is worse than having none.
- Ordinary beats exotic. A design studio, a consultancy, a shop. The reader has to be
  able to stand in the case.

**The case illustrates the norm; it never replaces citing it.** Article numbers and real
values still carry the weight — the story is what makes them land, not a substitute for
them. And never invent the legal outcome of your own case: if the answer depends on
facts you did not specify, say that it depends, and on what.

A screen with no actor, no date and no amount is the "bare" failure mode. If a screen
could be lifted into any other lesson unchanged, it is not part of a case — it is filler.

### Carrying a case across lessons

A case may run on through later lessons, and usually should — a reader who already knows
Marta's company starts the next lesson ahead. But continuity is a convenience, never an
obligation.

**Carry it while it stays natural.** The business can grow between chapters: hire someone,
have a bad year, buy premises. Growth is fine. Distortion is not.

**Retire it the moment you would have to bend the business to keep it.** A solo design
studio does not need a holding company, and does not have a succession problem. Forcing
it there produces a case the reader can tell is fake, which costs more than a fresh start.
Retire between chapters, not mid-chapter, and introduce the new case as fully as the first.

**Every lesson must stand alone.** Someone can open lesson 14 directly from the course
map. Re-establish the case in one line — *"Ámbar Estudio, el estudio de Marta, factura ya
180.000 € al año"* — and never require the reader to remember a detail from three lessons
back. A returning case is a bonus, never a prerequisite.

**Respect what already happened.** If the case carries, later lessons inherit its history:
do not re-explain the constitution Marta already completed, and do not contradict her
figures. The registry in `research/<course>/CASES.md` records the established facts and
which lessons used them. Read it before writing; update it after.

You are forcing it when: the business changes sector or size to fit the lesson; you invent
facts that a reader would find implausible for that business; or the lesson only works if
the reader remembers earlier lessons.

## 2. One screen, one idea

- **≤ 80 words of prose per screen.** Enforced. If you're over, you have two ideas.
- **≤ 1 visual per screen.** Enforced.
- A screen the reader can't finish in ~20 seconds is two screens.
- Every screen must survive the test: *if this screen were deleted, what would the
  reader no longer be able to do?* No answer means delete it.

## 3. Voice

- Second person, present tense. "You would have to guess inputs until one matches."
- **Lead with the mechanism, not the metaphor.** Metaphors may follow an explanation;
  they may never replace one. No ledgers, no villages of accountants, no "think of it like a…"
  as the primary explanation.
- Concrete numbers over qualifiers. Not "very large" — `2^256 ≈ 1.16 × 10^77`.
- Short declaratives. Cut "it's important to note", "essentially", "simply", "just".
- No hype, no exclamation marks, no "Let's dive in", no "In this lesson we will learn".
- Contractions are fine in English. Never in the Spanish course.

## 4. What makes a lesson *advanced*

These courses are for a reader who will notice if you're vague. Each lesson needs:

- **Named specifics** — BIP numbers, article numbers, model numbers, exact thresholds,
  real dates. "Modelo 303" not "the VAT form". "BIP 141" not "a protocol upgrade".
- **At least one number most explanations get wrong or skip.**
- **At least one corrected misconception**, stated as the misconception then the correction.
- **A limit or failure mode.** What the mechanism does *not* protect against.
- No hedging where a real value exists. If you don't know it, research it — don't soften it.

## 5. Reveals

The `reveal` block is the only interaction, so it has to earn the tap.

- Ask something the reader can *nearly* answer from the screens before it. Retrieval,
  not trivia. Not "What does SHA stand for?"
- Productive wrong-footing is good: pose the objection the reader is already forming
  ("collisions must exist, so why is this safe?").
- The answer resolves it in 2–4 sentences and adds one thing the question didn't contain.
- Roughly one reveal per 4–6 screens. Two in a row is nagging.

## 6. Sourcing

**Every** number, rate, threshold, date, article, model number, protocol constant, or
legal claim traces to a primary source.

- Primary only: BOE, AEAT, official specifications, BIPs, standards bodies, primary
  research. Not blog posts, not SEO content, not other model output.
- The `sources` block on the closing screen carries 2–5 of them.
- Courses with `needsSources: true` (anything touching law, tax, or regulation) additionally
  require a `reviewedOn` date on every lesson. `check-content` fails the build without them.
- If research couldn't confirm a figure, say what is uncertain in the lesson. Never invent
  a plausible-looking number.

## 7. Spanish course rules (España)

- **`tú`, not `usted`.** Warm and standard for learning material.
- Spain terminology only, never LatAm equivalents and never English calques:
  sociedad limitada (SL), sociedad anónima (SA), SLU, autónomo, Impuesto sobre Sociedades,
  IVA, IRPF, RETA, Seguridad Social, Registro Mercantil, AEAT, escritura pública,
  CIF/NIF, modelo 303, modelo 200, modelo 111, modelo 130.
- Introduce an acronym once in full, then use the acronym.
- Numbers use Spanish convention: `15.000 €`, `21 %`, `1,5 millones`. Amount before the
  euro sign, with a space. Dates written out: `1 de enero de 2026`.
- Cite the norm where it matters: `Ley 27/2014 del Impuesto sobre Sociedades`, and
  link to the BOE consolidated text.
- Tax and legal rules change. Prefer explaining the *mechanism* and *why the rule exists*
  over reciting a rate table that goes stale in a year — and where you do state a rate,
  date it.

## 8. Anti-patterns

Reject a draft that does any of these:

- Opens by announcing what the lesson will cover.
- Explains with a metaphor and never gets to the mechanism.
- Puts the formula before the intuition.
- Uses a table where two sentences would do — or prose where a 3-column comparison is the point.
- Has a screen that is only a restatement of the previous screen.
- Uses a visual as decoration rather than as the carrier of an idea.
- Ends with a summary that repeats the lesson instead of one sentence worth keeping.
- States a rate, threshold, or constant with no source.
- States a rule about a generic "tú" with no situation, date or amount attached.
- Introduces a person on screen 2 and abandons them by screen 5.
- Contradicts its own case — the amount or date changes between screens.
