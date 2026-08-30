#!/usr/bin/env python3
"""Draws visuals/crypto-chains/confirmations.svg for lesson 16.

Runs the calculation from section 11 of the bitcoin whitepaper: the probability
that an attacker holding q of the hashrate ever catches up from z blocks
behind. The script prints the q = 0.1 column so it can be checked against the
table in the paper itself, then plots two attacker sizes on a log scale.

Run:  python3 tools/visuals/confirmations.py
"""
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/confirmations.svg"

ZMAX = 10
CURVES = [(0.10, "line", "q = 10%"), (0.30, "stroke-accent", "q = 30%")]

PAD_L, PAD_R, TOP, PLOT_H = 68, 8, 22, 112   # PAD_L clears the axis labels
DECADES = 6.0           # y axis runs from 1 down to 1e-6


def catch_up(q, z):
    """Whitepaper section 11, transcribed."""
    p = 1.0 - q
    lam = z * (q / p)
    s = 1.0
    for k in range(z + 1):
        poisson = math.exp(-lam)
        for i in range(1, k + 1):
            poisson *= lam / i
        s -= poisson * (1 - (q / p) ** (z - k))
    return s


def main():
    print("q = 0.1, to check against the table in the paper:")
    for z in range(ZMAX + 1):
        print(f"  z={z:<3} P={catch_up(0.10, z):.7f}")

    w = 300 - PAD_L - PAD_R
    sx = lambda z: PAD_L + w * z / ZMAX
    sy = lambda p: TOP + PLOT_H * min(DECADES, -math.log10(max(p, 1e-12))) / DECADES

    out = [f'<svg viewBox="0 0 300 {TOP + PLOT_H + 34}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'chance the payment is reversed</text>']
    for dec in (0, 3, 6):
        y = TOP + PLOT_H * dec / DECADES
        out.append(f'  <line class="line" x1="{PAD_L}" y1="{y:.1f}" x2="292" y2="{y:.1f}"/>')
        label = "1 in 1" if dec == 0 else f"1 in 10^{dec}"
        out.append(f'  <text class="dim" x="8" y="{y + 3:.1f}" font-size="10">{label}</text>')

    for q, cls, label in CURVES:
        pts = " ".join(f"{sx(z):.1f},{sy(catch_up(q, z)):.1f}" for z in range(ZMAX + 1))
        out.append(f'  <polyline class="{cls}" fill="none" points="{pts}"/>')
        anchor_y = sy(catch_up(q, ZMAX))
        out.append(f'  <text class="{"accent" if "accent" in cls else "lbl"}" x="290" '
                   f'y="{anchor_y - 6:.1f}" font-size="11" text-anchor="end">{label}</text>')

    for z in (0, 5, 10):
        out.append(f'  <text class="dim" x="{sx(z):.1f}" y="{TOP + PLOT_H + 16}" '
                   f'font-size="10" text-anchor="middle">{z}</text>')
    out.append(f'  <text class="dim" x="{PAD_L + w / 2:.0f}" y="{TOP + PLOT_H + 30}" '
               f'font-size="10" text-anchor="middle">confirmations</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])}")


if __name__ == "__main__":
    main()
