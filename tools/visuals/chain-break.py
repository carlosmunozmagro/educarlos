#!/usr/bin/env python3
"""Draws visuals/crypto-chains/chain-break.svg for lesson 12.

Builds a five-block hash chain for real, edits block 2, and reports exactly
which link stops matching. The answer is one link, not all of them - which is
the point the lesson is making, and the thing loose descriptions get wrong.

Run:  python3 tools/visuals/chain-break.py
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/chain-break.svg"

N = 5
EDITED = 1          # zero-based: block 2


def h(b):
    return hashlib.sha256(b).hexdigest()


def chain(payloads):
    prev, headers = "00" * 32, []
    for p in payloads:
        headers.append((prev, h((prev + p).encode())))
        prev = headers[-1][1]
    return headers


def main():
    payloads = [f"block {i + 1} transactions" for i in range(N)]
    before = chain(payloads)

    tampered = list(payloads)
    tampered[EDITED] = "block 2 transactions, one amount changed"
    after = chain(tampered)

    # Compare the pointers the original chain already stored against the hashes
    # that exist after the edit. That is what an attacker who changes one block
    # and touches nothing else actually leaves behind.
    stored = [before[i][0] for i in range(N)]
    actual = [after[i][1] if i <= EDITED else before[i][1] for i in range(N)]
    broken = [i for i in range(1, N) if stored[i] != actual[i - 1]]
    print(f"edited block {EDITED + 1}")
    print(f"  hash was {before[EDITED][1][:12]}...")
    print(f"  hash now {after[EDITED][1][:12]}...")
    print('links that stop matching: '
          + ', '.join(f'block {i} -> block {i + 1}' for i in broken))
    print(f"headers that must be redone to repair it: {N - EDITED - 1}")

    bh, gap, x0, w = 30, 16, 8, 284
    top = 22
    height = top + N * bh + (N - 1) * gap + 20
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'one amount changed in block 2</text>']
    for i in range(N):
        y = top + i * (bh + gap)
        cls = "accent" if i == EDITED else "box"
        out.append(f'  <rect class="{cls}" x="{x0}" y="{y}" width="{w}" height="{bh}" rx="5"/>')
        label = f"block {i + 1}" + (", edited" if i == EDITED else "")
        out.append(f'  <text class="lbl" x="{x0 + 10}" y="{y + 19}" font-size="11">{label}</text>')
        out.append(f'  <text x="{x0 + w - 10}" y="{y + 19}" font-size="11" '
                   f'text-anchor="end">prev {stored[i][:6]}</text>')
        if i:
            ly = y - gap
            snapped = (i in broken)
            style = "stroke-accent" if snapped else "line"
            out.append(f'  <line class="{style}" x1="60" y1="{ly}" x2="60" y2="{y}"/>')
            if snapped:
                out.append(f'  <text class="accent" x="70" y="{ly + 12}" font-size="11">'
                           f'no longer matches</text>')
    out.append(f'  <text class="dim" x="8" y="{height - 6}" font-size="10">'
               f'repair it and block 3 changes, breaking the next</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
