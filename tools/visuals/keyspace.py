#!/usr/bin/env python3
"""Draws visuals/crypto-chains/keyspace.svg for lesson 03.

Three key spaces on one bar chart, bar length proportional to bits - which is
a log scale, and the only scale on which 2^15 and 2^256 fit on one phone
screen at all. The script prints the decimal counts it drew so the lesson text
can quote the same numbers.

Run:  python3 tools/visuals/keyspace.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/keyspace.svg"

ROWS = [
    ("Debian OpenSSL, 2008", 15, "every key it could make", "accent"),
    ("A 12-word seed phrase", 128, "the practical floor", "cold"),
    ("secp256k1, as designed", 256, "what Nora's wallet drew from", "cold"),
]

X0, BAR_MAX, ROW_H, TOP = 8, 176, 50, 26


def human(n):
    """Decimal count, short enough for an 11px label."""
    if n < 10 ** 6:
        return f"{n:,}"
    exp = len(str(n)) - 1
    return f"10^{exp}"


def main():
    height = TOP + ROW_H * len(ROWS) - 8
    assert X0 + BAR_MAX + 4 + 100 <= 300, "bars plus counts overflow the canvas"

    parts = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">']
    parts.append('  <text class="dim" x="8" y="12" font-size="10">'
                 'bar length = bits, not quantity</text>')

    for i, (label, bits, note, cls) in enumerate(ROWS):
        y = TOP + i * ROW_H
        w = max(2, round(BAR_MAX * bits / 256))
        count = 2 ** bits
        print(f"{label:24} 2^{bits:<4} = {count:,}" if bits <= 64
              else f"{label:24} 2^{bits:<4} ~ {human(count)}")
        parts.append(f'  <text class="lbl" x="{X0}" y="{y}" font-size="11">{label}</text>')
        parts.append(f'  <rect class="{cls}" x="{X0}" y="{y + 8}" width="{w}" height="12" rx="2"/>')
        parts.append(f'  <text x="{X0 + BAR_MAX + 6}" y="{y + 18}" font-size="11">2^{bits}</text>')
        parts.append(f'  <text class="dim" x="{X0}" y="{y + 34}" font-size="10">{note}</text>')

    parts.append("</svg>")
    OUT.write_text("\n".join(parts) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])}  ({height} units tall)")


if __name__ == "__main__":
    main()
