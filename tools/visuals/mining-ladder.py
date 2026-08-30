#!/usr/bin/env python3
"""Draws visuals/crypto-chains/mining-ladder.svg for lesson 14.

Actually mines. For each target - "the digest must start with k zero bits" -
this counts how many nonces it had to try. The measured counts are what the
lesson quotes, so the claim that each extra zero bit doubles the work is
demonstrated rather than asserted.

Run:  python3 tools/visuals/mining-ladder.py   (a few seconds)
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/mining-ladder.svg"

HEADER = b"nora-caleb-block-header-"
BITS = [4, 8, 12, 16, 20]
X0, BAR_MAX = 8, 150


def leading_zero_bits(digest):
    n = int.from_bytes(digest, "big")
    return 256 - n.bit_length()


def mine(bits):
    nonce = 0
    while True:
        d = hashlib.sha256(hashlib.sha256(HEADER + str(nonce).encode()).digest()).digest()
        if leading_zero_bits(d) >= bits:
            return nonce + 1, d
        nonce += 1


def main():
    results = []
    for bits in BITS:
        tries, digest = mine(bits)
        results.append((bits, tries, digest))
        print(f"{bits:>2} zero bits: {tries:>9,} hashes   expected {2**bits:>9,}   "
              f"{digest.hex()[:16]}...")

    top, rh = 26, 26
    height = top + rh * len(results) + 6
    scale = BAR_MAX / max(t.bit_length() for _, t, _ in results)
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'hashes tried before one landed below the target</text>']
    for i, (bits, tries, _) in enumerate(results):
        y = top + i * rh
        w = max(3, tries.bit_length() * scale)
        cls = "accent" if bits == BITS[-1] else "cold"
        out.append(f'  <text x="{X0}" y="{y + 11}" font-size="11">{bits} zeros</text>')
        out.append(f'  <rect class="{cls}" x="{X0 + 56}" y="{y + 1}" width="{w:.0f}" '
                   f'height="13" rx="3"/>')
        out.append(f'  <text class="lbl" x="292" y="{y + 11}" font-size="11" '
                   f'text-anchor="end">{tries:,}</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
