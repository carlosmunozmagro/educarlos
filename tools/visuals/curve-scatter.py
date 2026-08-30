#!/usr/bin/env python3
"""Draws visuals/crypto-chains/curve-scatter.svg for lesson 04.

The same equation bitcoin uses, y^2 = x^3 + 7, over a field small enough to
draw: p = 97 instead of a 256-bit prime. Every point is plotted, and the first
four multiples of the base point are labelled, so the reader can see that
consecutive multiples are not near each other.

Run:  python3 tools/visuals/curve-scatter.py
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/curve-scatter.svg"

P, A, B = 97, 0, 7
PAD_L, PAD_T, SIZE = 20, 16, 264      # plot box, in canvas units


def points():
    pts = []
    squares = {}
    for y in range(P):
        squares.setdefault(y * y % P, []).append(y)
    for x in range(P):
        rhs = (x * x * x + A * x + B) % P
        for y in squares.get(rhs, []):
            pts.append((x, y))
    return pts


def add(p, q):
    if p is None:
        return q
    if q is None:
        return p
    (x1, y1), (x2, y2) = p, q
    if x1 == x2 and (y1 + y2) % P == 0:
        return None
    if p == q:
        lam = (3 * x1 * x1 + A) * pow(2 * y1, -1, P) % P
    else:
        lam = (y2 - y1) * pow(x2 - x1, -1, P) % P
    x3 = (lam * lam - x1 - x2) % P
    return (x3, (lam * (x1 - x3) - y1) % P)


def order_of(g):
    n, cur = 1, g
    while cur is not None:
        cur = add(cur, g)
        n += 1
    return n


def main():
    pts = points()
    # Take the first point whose order is the whole group: with p = 97 the
    # group has prime order, so any point but the identity generates it.
    g = sorted(pts)[0]
    n = order_of(g)
    print(f"y^2 = x^3 + 7 mod {P}: {len(pts)} affine points, plus the point at infinity")
    print(f"base point G = {g}, order {n}")

    mults, cur = [], None
    for k in range(1, 5):
        cur = add(cur, g)
        mults.append((k, cur))
        print(f"{k}G = {cur}")

    sx = lambda x: PAD_L + SIZE * x / (P - 1)
    sy = lambda y: PAD_T + SIZE * (1 - y / (P - 1))
    assert sx(P - 1) + 8 <= 300, "plot overflows the canvas"
    height = round(PAD_T + SIZE + 20)

    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">']
    out.append(f'  <line class="line" x1="{PAD_L - 6}" y1="{sy(0):.1f}" '
               f'x2="{PAD_L + SIZE + 4:.0f}" y2="{sy(0):.1f}"/>')
    out.append(f'  <line class="line" x1="{PAD_L - 6}" y1="{PAD_T - 6}" '
               f'x2="{PAD_L - 6}" y2="{sy(0):.1f}"/>')

    labelled = {p: f"{k}G" for k, p in mults}
    for x, y in pts:
        if (x, y) in labelled:
            continue
        out.append(f'  <circle class="cold" cx="{sx(x):.1f}" cy="{sy(y):.1f}" r="1.8"/>')
    for k, (x, y) in mults:
        cx, cy = sx(x), sy(y)
        out.append(f'  <circle class="accent" cx="{cx:.1f}" cy="{cy:.1f}" r="3.4"/>')
        anchor = "end" if cx > 240 else "start"
        dx = -6 if anchor == "end" else 6
        out.append(f'  <text class="lbl" x="{cx + dx:.1f}" y="{cy - 5:.1f}" '
                   f'font-size="11" text-anchor="{anchor}">{k}G</text>')

    out.append(f'  <text class="dim" x="{PAD_L - 6}" y="{height - 6}" font-size="10">'
               f'x = 0 to {P - 1}</text>')
    out.append(f'  <text class="dim" x="292" y="{height - 6}" font-size="10" '
               f'text-anchor="end">{len(pts)} points in total</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
