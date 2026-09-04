# The City — a mystery environment

Not a course. A place, filed on the **Mystery** shelf, that runs whether or not
anyone is watching it and answers when they interfere.

```
#/x/city                     the route
app/city/sim.js              the model: land, roads, buildings, decay
app/city/paint.js            isometric canvas painter, theme-aware
app/city/view.js             chrome, gestures, the clock, storage
content/index.json           declares it under the Mystery section
app/main.js                  ENVIRONMENTS maps its id to its module
```

## What it actually simulates

A 44 × 44 grid of plots. Every year, four moves run in order, and each one
reads what the last one wrote:

1. **Fields.** *Access* is 1 on every road cell and decays 0.74 per plot away
   from one. *Amenity* starts at +1 on parks and −1.15 on the works, then
   blurs about four plots out. *Land value* is
   `0.55·access + 0.72·pole + 0.45·amenity`, clamped to 0…1, where *pole* is
   the pull of the founding crossroads and of any station.
2. **Roads.** The network is a set of tips, each with a direction and a
   remaining vigour. A tip steps forward one plot a year, refuses any plot with
   more than one road already touching it — that refusal is what makes blocks
   instead of a smear — branches perpendicular every 4–7 plots with a
   probability set by the land value under it, and dies when it meets the
   network or the map edge. If fewer than five tips survive, new ones start
   from the most valuable road cell with open land beside it.
3. **Development.** ~190 random plots are considered a year. A plot builds if
   it is empty, touches a road, and `value·1.15 + demand − noise > 0.62`. What
   it becomes follows the neighbourhood: shops where value is high or work is
   scarce, works where amenity is already poor, the occasional park the city
   plants itself, houses otherwise.
4. **Densification and decay.** Every built plot climbs toward a ceiling its
   land allows — houses `0.16 + 0.55·value²`, shops `0.3 + 0.95·value²`, the
   works flat. A house or shop on land worth under 0.17, older than 22 years,
   empties out with a 2% annual chance. That is how a works quarter hollows
   its own neighbours: no rule says "blight", the value field does it.

Population is read off the built heights, not stored: roughly 6 + 250·height
people per house. Demand rises with the years and with each new pole, so a
station does not just move growth — it makes more of it.

## The six interferences

| Tool | What it does to the model |
|---|---|
| **Road** | Lays one road cell. On empty land it also starts four new tips — a second network, which becomes a village that may or may not be absorbed. |
| **Park** | Amenity +1, spread four plots. Rents, heights and road branching all rise around it. |
| **Works** | Amenity −1.15, 70 jobs. Raises demand city-wide and blights its own street. |
| **Station** | A new pole (weight 0.85, radius 9) plus four road tips. The strongest single move: a second centre the city grows toward for decades. |
| **Tower** | A small pole (0.45, radius 6). Lifts the ceiling of everything beside it. |
| **Clear** | Empties a 3 × 3 of buildings and drops any small pole under it. The land does not stay empty; it comes back different. |

Nothing is instant. A park placed in year 30 is visible as a change in the
skyline around year 60. That delay is the environment's argument.

## Behaviour worth knowing

- **It runs while the app is shut.** On open, three years pass per hour away,
  capped at 45, and the chronicle says so.
- **State lives in `localStorage`** under `educarlos:city.v1`: the grid packed
  into two ~1,900-character strings, plus seed, year, poles and tips. About
  4.5 KB. Clearing it founds a new city with a new seed.
- **The camera frames the built area**, not the grid, and eases back as the
  city outgrows the screen. Panning or pinching takes it off follow; the
  crosshair button gives it back.
- **The palette is theme tokens** (`--city-*` in `app/styles.css`), read by the
  painter through `getComputedStyle`. `--city-night: 1` is what lights the
  windows after dark. Changing the city's colours is a stylesheet edit.
- **The chronicle** reports placements, population milestones, streets going
  dark, and — when twenty years pass with nobody interfering — an observation
  the city reads off its own last twenty years.

## Adding another environment

1. Add an entry to the `experiences` array of a section in
   `content/index.json`: `id`, `title`, `subtitle`, `tag`, `accent`, `lang`.
2. Add `id → () => import('./<dir>/view.js')` to `ENVIRONMENTS` in
   `app/main.js`. Module paths are named in code on purpose — the manifest says
   what exists, the code says what runs.
3. Export `mount(root, { back, themeButton })` returning a `dispose()` that
   stops every loop and listener it started. The router calls it on the way
   out; anything left running will keep running.
