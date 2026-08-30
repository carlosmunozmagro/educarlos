#!/usr/bin/env python3
"""Draws visuals/crypto-chains/retarget.svg for lesson 15.

Runs bitcoin's difficulty adjustment on four hypothetical windows, including
one extreme enough to hit the clamp, and draws the result as bars diverging
from "no change". The clamp is the part worth seeing: the last row wanted a
bigger correction than the rule allows.

Run:  python3 tools/visuals/retarget.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/retarget.svg"

INTERVAL = 2016
TARGET_SPAN = 14 * 24 * 60 * 60          # 1,209,600 seconds
CASES = [10, 14, 20, 70]                 # days the 2016 blocks actually took

CX, HALF, LOG_RANGE = 128, 80, 2.0       # centre, half-width, +/- log2 range


def adjust(days):
    """Return (wanted multiplier, applied multiplier). Difficulty scales as the
    inverse of how long the window took, and the timespan is clamped to a
    quarter and four times the target before it is used."""
    actual = days * 24 * 60 * 60
    clamped = min(max(actual, TARGET_SPAN // 4), TARGET_SPAN * 4)
    return TARGET_SPAN / actual, TARGET_SPAN / clamped


def main():
    from math import log2
    rows = []
    for days in CASES:
        wanted, applied = adjust(days)
        rows.append((days, wanted, applied))
        note = "" if abs(wanted - applied) < 1e-9 else f"  (wanted x{wanted:.2f}, clamped)"
        print(f"2016 blocks in {days:>2} days -> difficulty x{applied:.2f}{note}")
    print(f"\nthe clamp holds every adjustment inside x0.25 to x4")

    top, rh = 24, 34
    height = top + rh * len(rows) + 26
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'how the next difficulty moves</text>',
           f'  <line class="line" x1="{CX}" y1="{top + 12}" '
           f'x2="{CX}" y2="{top + rh * len(rows)}"/>']
    for i, (days, wanted, applied) in enumerate(rows):
        y = top + i * rh
        w = abs(log2(applied)) / LOG_RANGE * HALF
        x = CX if applied >= 1 else CX - w
        clamped = abs(wanted - applied) > 1e-9
        cls = "accent" if clamped else "cold"
        out.append(f'  <text class="dim" x="8" y="{y + 10}" font-size="10">'
                   f'2016 blocks took {days} days</text>')
        if w > 0.5:
            out.append(f'  <rect class="{cls}" x="{x:.1f}" y="{y + 15}" '
                       f'width="{w:.1f}" height="12" rx="3"/>')
        # Every multiplier is right-aligned in its own column: a label that
        # follows a leftward bar runs off the canvas at the clamp.
        label = f"x{applied:.2f}" + ("*" if clamped else "")
        out.append(f'  <text class="lbl" x="292" y="{y + 25}" font-size="11" '
                   f'text-anchor="end">{label}</text>')
    out.append(f'  <text class="dim" x="{CX}" y="{top + rh * len(rows) + 10}" '
               f'font-size="10" text-anchor="middle">no change</text>')
    out.append(f'  <text class="accent" x="8" y="{height - 4}" font-size="10">'
               f'* clamped: at most a four-fold change</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"wrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
