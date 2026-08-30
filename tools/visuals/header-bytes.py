#!/usr/bin/env python3
"""Draws visuals/crypto-chains/header-80.svg for lesson 11.

The six fields of a bitcoin block header, drawn to scale across 80 bytes. The
point of drawing it to scale is that the two 32-byte hashes are almost the
whole thing, and the field a miner spends all its electricity changing is one
of the slivers.

Run:  python3 tools/visuals/header-bytes.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/header-80.svg"

FIELDS = [("version", 4, "cold"), ("previous block", 32, "cold"),
          ("merkle root", 32, "cold"), ("time", 4, "cold"),
          ("bits", 4, "cold"), ("nonce", 4, "accent")]

X0, BAR_W = 8, 284


def main():
    total = sum(n for _, n, _ in FIELDS)
    assert total == 80, f"header is {total} bytes, should be 80"
    print(f"{total} bytes total")
    for name, n, _ in FIELDS:
        print(f"  {n:>2} {name}")
    print(f"\na year of headers: 52,560 x 80 = {52560 * 80 / 1e6:.1f} MB")

    y, h = 26, 28
    out = ['<svg viewBox="0 0 300 96" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           '80 bytes, drawn to scale</text>']
    x = X0
    for name, n, cls in FIELDS:
        w = BAR_W * n / total
        out.append(f'  <rect class="{cls}" x="{x:.1f}" y="{y}" width="{w - 1.5:.1f}" '
                   f'height="{h}" rx="3"/>')
        if n >= 32:
            out.append(f'  <text class="lbl" x="{x + w / 2:.1f}" y="{y + 18}" '
                       f'font-size="11" text-anchor="middle">{name}</text>')
        x += w
    assert x <= 292, "bar overflows the canvas"

    out.append(f'  <text class="dim" x="8" y="{y + h + 16}" font-size="10">'
               f'the slivers, left to right: version, time, bits,</text>')
    out.append(f'  <text class="accent" x="8" y="{y + h + 30}" font-size="11">'
               f'and the nonce, on the far right</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"wrote {OUT.relative_to(OUT.parents[2])}")


if __name__ == "__main__":
    main()
