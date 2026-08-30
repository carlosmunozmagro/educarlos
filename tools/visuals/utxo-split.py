#!/usr/bin/env python3
"""Draws visuals/crypto-chains/utxo-split.svg for lesson 08.

Caleb's single unspent output, and the two outputs it becomes. The script
asserts the arithmetic before drawing, so the diagram cannot disagree with the
lesson: the fee is what is left over, not a field anyone writes down.

Run:  python3 tools/visuals/utxo-split.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/utxo-split.svg"

INPUT = 0.0812
TO_NORA = 0.05
CHANGE = 0.0309
FEE = round(INPUT - TO_NORA - CHANGE, 8)


def main():
    assert FEE == 0.0003, f"fee came out at {FEE}, the case says 0.0003"
    print(f"in  {INPUT}")
    print(f"out {TO_NORA} to Nora + {CHANGE} change = {round(TO_NORA + CHANGE, 8)}")
    print(f"fee {FEE}  (implied: inputs minus outputs)")

    svg = f'''<svg viewBox="0 0 300 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="ux-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 1 L7 4 L0 7 z" fill="currentColor"/>
    </marker>
  </defs>

  <text class="dim" x="8" y="12" font-size="10">one input, spent whole</text>

  <rect class="box" x="76" y="18" width="148" height="38" rx="6"/>
  <text class="lbl" x="150" y="36" font-size="12" text-anchor="middle">{INPUT} BTC</text>
  <text class="dim" x="150" y="50" font-size="10" text-anchor="middle">Caleb's only coin</text>

  <line class="line" x1="130" y1="58" x2="80" y2="86" marker-end="url(#ux-arrow)"/>
  <line class="line" x1="170" y1="58" x2="220" y2="86" marker-end="url(#ux-arrow)"/>

  <rect class="box" x="8" y="92" width="136" height="42" rx="6"/>
  <text class="accent" x="76" y="110" font-size="12" text-anchor="middle">{TO_NORA} BTC</text>
  <text class="dim" x="76" y="125" font-size="10" text-anchor="middle">to Nora</text>

  <rect class="box" x="156" y="92" width="136" height="42" rx="6"/>
  <text class="lbl" x="224" y="110" font-size="12" text-anchor="middle">{CHANGE} BTC</text>
  <text class="dim" x="224" y="125" font-size="10" text-anchor="middle">change, to Caleb</text>

  <rect class="box" x="8" y="146" width="284" height="38" rx="6"/>
  <text class="lbl" x="150" y="164" font-size="11" text-anchor="middle">fee {FEE} BTC</text>
  <text class="dim" x="150" y="178" font-size="10" text-anchor="middle">nobody wrote this down: it is the gap</text>
</svg>
'''
    OUT.write_text(svg)
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])}")


if __name__ == "__main__":
    main()
