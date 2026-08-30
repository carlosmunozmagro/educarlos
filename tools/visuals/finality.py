#!/usr/bin/env python3
"""Draws visuals/crypto-chains/finality.svg for lesson 18.

Ethereum's proof-of-stake clock, with the arithmetic asserted rather than
typed: a 12-second slot, 32 slots to an epoch, and finality two epochs after
that. The point of drawing it is the contrast with lesson 16 - this timeline
ends, and the probability curve never does.

Run:  python3 tools/visuals/finality.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/finality.svg"

SLOT_S = 12
SLOTS_PER_EPOCH = 32
EPOCHS_TO_FINAL = 2


def main():
    epoch_s = SLOT_S * SLOTS_PER_EPOCH
    final_s = epoch_s * EPOCHS_TO_FINAL
    assert epoch_s == 384 and final_s == 768, "the clock does not add up"
    print(f"slot      {SLOT_S} s")
    print(f"epoch     {SLOTS_PER_EPOCH} slots = {epoch_s} s = {epoch_s / 60:.1f} min")
    print(f"finalised {EPOCHS_TO_FINAL} epochs = {final_s} s = {final_s / 60:.1f} min")

    steps = [("one slot", f"{SLOT_S} seconds", "one chance to propose", "cold"),
             ("one epoch", f"{SLOTS_PER_EPOCH} slots, {epoch_s / 60:.1f} min",
              "validators vote", "cold"),
             ("finalised", f"{EPOCHS_TO_FINAL} epochs, {final_s / 60:.1f} min",
              "reverting now costs a third of all stake", "accent")]

    y0, rh = 22, 50
    height = y0 + rh * len(steps) - 6
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <defs><marker id="fn-arrow" viewBox="0 0 8 8" refX="7" refY="4" '
           'markerWidth="6" markerHeight="6" orient="auto">'
           '<path d="M0 1 L7 4 L0 7 z" fill="currentColor"/></marker></defs>',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'the clock, and where it stops</text>']
    for i, (name, size, note, cls) in enumerate(steps):
        top = y0 + i * rh
        out.append(f'  <rect class="box" x="8" y="{top}" width="284" height="38" rx="6"/>')
        out.append(f'  <text class="{"accent" if cls == "accent" else "lbl"}" x="18" '
                   f'y="{top + 16}" font-size="11">{name}</text>')
        out.append(f'  <text x="282" y="{top + 16}" font-size="11" '
                   f'text-anchor="end">{size}</text>')
        out.append(f'  <text class="dim" x="18" y="{top + 31}" font-size="10">{note}</text>')
        if i < len(steps) - 1:
            out.append(f'  <line class="line" x1="150" y1="{top + 38}" x2="150" '
                       f'y2="{top + rh - 2}" marker-end="url(#fn-arrow)"/>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
