#!/usr/bin/env python3
"""Verification for the mystery simulation.

Three things, in order of how badly they break the design if they fail:

  1. static   - nothing under app/sim/ may read a clock or a global source of
                randomness, because determinism is the whole architecture
  2. runtime  - tools/sim_check.mjs, run under node
  3. crossing - the same seed and log, replayed in two separate processes,
                must produce byte-identical state

Usage:  python3 tools/sim_check.py
"""

import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SIM = ROOT / "app" / "sim"

failures = []


def ok(name, cond, detail=""):
    print(f"  {'ok  ' if cond else 'FAIL'} {name}" + (f"  -> {detail}" if detail and not cond else ""))
    if not cond:
        failures.append(name)


# --------------------------------------------------------------- 1. static

# The console is allowed a clock and the DOM - it draws. Nothing else is.
BANNED = {
    "Math.random": "seeded hashes only, never a global PRNG",
    "Date.now": "the clock enters through tickAt(cfg, ms) and nowhere else",
    "performance.now": "same",
    "localStorage": "persistence belongs to journal.js, not the rules",
}
DOM = re.compile(r"\b(document|window|requestAnimationFrame|canvas)\b")

def strip_comments(src):
    """Comments discuss the banned names by name - that is the documentation
    doing its job. Only real code counts."""
    return re.sub(r"//.*", "", re.sub(r"/\*.*?\*/", "", src, flags=re.S))


print("static: the rules stay pure")
stripped = {}
for path in sorted(SIM.glob("*.js")):
    code = stripped[path.name] = strip_comments(path.read_text())
    for needle, why in BANNED.items():
        ok(f"{path.name} has no {needle}", needle not in code, why)
    if path.name != "console.js":
        ok(f"{path.name} does not touch the DOM", not DOM.search(code))

# The clock has exactly one door into the simulation, and this is it.
ok("engine takes the time it is given",
   "tickAt" in stripped["engine.js"] and "Date.parse" in stripped["engine.js"])


# ------------------------------------------------------------- 1b. config

print("\nstatic: the world is configured sanely")
cfg = json.loads((ROOT / "content" / "misterio" / "senal" / "sim.json").read_text())


def lcm_all(xs):
    from math import gcd
    out = 1
    for x in xs:
        out = out * x // gcd(out, x)
    return out


day_ticks = 1440 // cfg["tickMinutes"]
for fam in cfg["multipleFamilies"]:
    periods = [m * cfg["basePeriod"] for m in fam]
    label = str(fam)
    # The reader's first foothold: a voice that sings at the same wall-clock
    # time every day. A family without one is a world with no way in.
    ok(f"{label} has exactly one 24 h voice",
       sum(1 for p in periods if p == day_ticks) == 1,
       str([p * cfg["tickMinutes"] / 60 for p in periods]))
    days = lcm_all(fam) * cfg["basePeriod"] * cfg["tickMinutes"] / 1440
    ok(f"{label} conjunction cycle is 3-8 days", 3 <= days <= 8, f"{days:.1f} d")
    ok(f"{label} has no repeated multiple", len(set(fam)) == len(fam))

ok("echo delays are never multiples of P",
   all(d % cfg["basePeriod"] for d in cfg["echo"]["delays"]))
ok("band maps are invertible on the spectrum",
   all(len({(m * b + 1) % cfg["bands"] for b in range(cfg["bands"])}) == cfg["bands"]
       for m in cfg["echo"]["mapMults"]))
ok("the echo stands above the noise floor",
   cfg["echo"]["gain"] > cfg["noiseFloor"] * 4)
ok("bands divide evenly into coarse groups",
   cfg["bands"] % cfg["coarseGroupSize"] == 0)


# -------------------------------------------------------------- 2. runtime

print("\nruntime: node tools/sim_check.mjs")
r = subprocess.run(["node", str(ROOT / "tools" / "sim_check.mjs")],
                   capture_output=True, text=True)
sys.stdout.write("".join("  " + ln + "\n" for ln in r.stdout.strip().splitlines()))
if r.returncode:
    sys.stderr.write(r.stderr)
    failures.append("sim_check.mjs")


# ------------------------------------------------------------- 3. crossing

# Determinism across processes is the promise that a run exported from a phone
# and imported on a laptop is the same run. A single process cannot check it:
# a stateful PRNG seeded once at import would pass every in-process test and
# fail here.
print("\ncrossing: two processes, one world")
PROBE = """
import { createWorld, replay, signature } from '../app/sim/engine.js';
import { readFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync(new URL('../content/misterio/senal/sim.json', import.meta.url)));
const log = [];
for (let d = 0; d < 10; d++) {
  log.push({ tick: d * 180 + 5, kind: 'listen', bands: [d % 16, (d + 5) % 16, (d + 11) % 16] });
  log.push({ tick: d * 180 + 60, kind: 'ping', band: (d * 3) % 16 });
  log.push({ tick: d * 180 + 130, kind: 'damp', band: (d * 7) % 16 });
}
const out = [];
for (const seed of ['dorada', 'ligera', 'ñu', '']) {
  out.push(signature(replay(createWorld(cfg, seed), log, 1800)));
}
console.log(JSON.stringify(out));
"""
probe = ROOT / "tools" / ".sim_probe.mjs"
probe.write_text(PROBE)
try:
    runs = [subprocess.run(["node", str(probe)], capture_output=True, text=True, cwd=ROOT)
            for _ in range(2)]
    ok("both processes ran", all(x.returncode == 0 for x in runs),
       runs[0].stderr[:200] if runs[0].returncode else "")
    if all(x.returncode == 0 for x in runs):
        a, b = (x.stdout.strip() for x in runs)
        ok("identical state across processes", a == b)
        ok("different seeds give different worlds", len(set(json.loads(a))) == 4)
finally:
    probe.unlink(missing_ok=True)


print()
if failures:
    print(f"{len(failures)} FAILED: " + ", ".join(failures[:6]))
    sys.exit(1)
print("all checks passed")
