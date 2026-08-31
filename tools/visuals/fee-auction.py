#!/usr/bin/env python3
"""Draws visuals/crypto-chains/fee-auction.svg for lesson 25.

Packs a small block the way a miner does - greedily, by fee rate - and prints
what got in. The case it is built to show: the transaction paying the largest
total fee is the one left behind, because it is also the largest.

Run:  python3 tools/visuals/fee-auction.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/fee-auction.svg"

CAPACITY_VB = 900
# (label, size in vbytes, fee in satoshis)
MEMPOOL = [
    ("a courier", 140, 4200),
    ("a refund", 220, 5500),
    ("a pressing deposit", 300, 5400),
    ("Teodora, 41 inputs", 1400, 14000),
    ("a coffee", 190, 1520),
]


def main():
    rated = sorted(((f / s, n, s, f) for n, s, f in MEMPOOL), reverse=True)
    used, rows = 0, []
    for rate, name, size, fee in rated:
        fits = used + size <= CAPACITY_VB
        if fits:
            used += size
        rows.append((name, size, fee, rate, fits))
        print(f"{name:<20} {size:>5} vB {fee:>6} sat {rate:>5.0f} sat/vB "
              f"{'in' if fits else 'left behind'}")
    print(f"\nblock holds {CAPACITY_VB} vB, filled {used} vB")
    biggest = max(rows, key=lambda r: r[2])
    assert not biggest[4], "the largest total fee should be the one left out"
    print(f"largest total fee ({biggest[2]} sat) did not get in")

    y0, rh = 24, 26
    height = y0 + rh * len(rows) + 24
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'sorted by fee rate, packed until full</text>']
    # No cut line: the greedy fill skips the oversized transaction and keeps
    # going, so a horizontal "block full" rule would be a lie about the row
    # below it.
    for i, (name, size, fee, rate, fits) in enumerate(rows):
        y = y0 + i * rh
        out.append(f'  <rect class="{"cold" if fits else "box"}" x="8" y="{y}" '
                   f'width="284" height="20" rx="4"/>')
        out.append(f'  <text class="{"lbl" if fits else "accent"}" x="16" y="{y + 14}" '
                   f'font-size="11">{name}</text>')
        out.append(f'  <text class="{"lbl" if fits else "accent"}" x="284" y="{y + 14}" '
                   f'font-size="11" text-anchor="end">'
                   f'{rate:.0f} sat/vB{"" if fits else "  too big"}</text>')
    out.append(f'  <text class="dim" x="8" y="{height - 6}" font-size="10">'
               f'the 14,000 sat transaction is the one left out</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"wrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
