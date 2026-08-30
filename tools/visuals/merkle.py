#!/usr/bin/env python3
"""Draws visuals/crypto-chains/merkle-path.svg for lesson 10.

Builds a real Merkle tree over eight transaction ids with bitcoin's double
SHA-256, then marks the path from one leaf to the root and the three sibling
hashes a proof actually has to carry. The printed digests are the ones the
lesson quotes.

Run:  python3 tools/visuals/merkle.py
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/merkle-path.svg"

LEAVES = 8
TARGET = 2          # zero-based index of the transaction being proved


def h2(b):
    return hashlib.sha256(hashlib.sha256(b).digest()).digest()


def build(leaves):
    levels = [leaves]
    while len(levels[-1]) > 1:
        row = levels[-1]
        levels.append([h2(row[i] + row[i + 1]) for i in range(0, len(row), 2)])
    return levels


def main():
    leaves = [h2(f"tx{i + 1}".encode()) for i in range(LEAVES)]
    levels = build(leaves)
    root = levels[-1][0]

    idx, proof = TARGET, []
    for level in levels[:-1]:
        sibling = idx ^ 1
        proof.append((sibling, level[sibling]))
        idx //= 2
    print(f"leaf {TARGET} = {leaves[TARGET].hex()[:12]}...")
    for i, (pos, h) in enumerate(proof, 1):
        print(f"  proof hash {i} (position {pos}) {h.hex()[:12]}...")
    print(f"root = {root.hex()[:12]}...")
    print(f"{LEAVES} leaves -> {len(proof)} hashes -> {len(proof) * 32} bytes")

    # Geometry. Level 0 is the leaves, at the bottom.
    lw, gap, x0 = 30, 5, 8
    assert x0 + LEAVES * lw + (LEAVES - 1) * gap <= 292, "leaf row overflows"
    rows, path = [], []
    idx = TARGET
    for d in range(len(levels)):
        n = LEAVES >> d
        step = lw + gap
        # A node sits over the middle of the leaves beneath it, not over its
        # leftmost one - otherwise the tree leans left and the root falls off.
        centres = [x0 + lw / 2 + (i * (1 << d) + ((1 << d) - 1) / 2) * step
                   for i in range(n)]
        rows.append(centres)
        path.append(idx)
        idx //= 2

    top, vgap, bh = 20, 34, 18
    height = top + vgap * (len(rows) - 1) + bh + 26
    y_of = lambda d: top + vgap * (len(rows) - 1 - d)

    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'eight transactions, one proof</text>']
    for d in range(len(rows) - 1):
        for i, cx in enumerate(rows[d]):
            out.append(f'  <line class="line" x1="{cx:.1f}" y1="{y_of(d)}" '
                       f'x2="{rows[d + 1][i // 2]:.1f}" y2="{y_of(d + 1) + bh}"/>')
    proof_nodes = {(d, p ^ 1) for d, p in enumerate(path[:-1])}
    for d, centres in enumerate(rows):
        w = lw if d == 0 else min(lw + 24 * d, 84)
        for i, cx in enumerate(centres):
            if (d, i) in proof_nodes:
                cls = "accent"            # what the proof carries
            elif i == path[d]:
                cls = "hot" if d == 0 else "box"   # what the verifier recomputes
            else:
                cls = "cold"
            out.append(f'  <rect class="{cls}" x="{cx - w / 2:.1f}" y="{y_of(d)}" '
                       f'width="{w}" height="{bh}" rx="4"/>')
    for n, (d, i) in enumerate(sorted(proof_nodes), 1):
        out.append(f'  <text class="lbl" x="{rows[d][i]:.1f}" y="{y_of(d) + 13}" '
                   f'font-size="11" text-anchor="middle">{n}</text>')
    out.append(f'  <text class="lbl" x="{rows[-1][0]:.1f}" y="{y_of(len(rows) - 1) + 13}" '
               f'font-size="11" text-anchor="middle">root</text>')
    out.append(f'  <text class="lbl" x="{rows[0][TARGET]:.1f}" y="{y_of(0) + 30}" '
               f'font-size="10" text-anchor="middle">yours</text>')
    out.append(f'  <text class="dim" x="292" y="{height - 6}" font-size="10" '
               f'text-anchor="end">3 hashes, 96 bytes</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
