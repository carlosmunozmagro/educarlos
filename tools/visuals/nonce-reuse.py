#!/usr/bin/env python3
"""Figures and visuals/crypto-chains/same-r.svg for lesson 06.

Signs two different messages on secp256k1 with the same nonce k - the mistake
Sony made on the PS3 - and recovers the private key from the two signatures
alone. Everything the recovery uses is public. The script asserts the recovered
key equals the original, so the lesson cannot quote a number this did not
actually produce.

Run:  python3 tools/visuals/nonce-reuse.py
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/same-r.svg"

P = 2**256 - 2**32 - 977
N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
G = (0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
     0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8)


def add(p, q):
    if p is None:
        return q
    if q is None:
        return p
    (x1, y1), (x2, y2) = p, q
    if x1 == x2 and (y1 + y2) % P == 0:
        return None
    lam = ((3 * x1 * x1) * pow(2 * y1, -1, P) if p == q
           else (y2 - y1) * pow(x2 - x1, -1, P)) % P
    x3 = (lam * lam - x1 - x2) % P
    return (x3, (lam * (x1 - x3) - y1) % P)


def mul(k, p=G):
    r = None
    while k:
        if k & 1:
            r = add(r, p)
        p = add(p, p)
        k >>= 1
    return r


def z_of(msg):
    return int.from_bytes(hashlib.sha256(msg.encode()).digest(), "big") % N


def sign(d, msg, k):
    z = z_of(msg)
    r = mul(k)[0] % N
    s = pow(k, -1, N) * (z + r * d) % N
    return z, r, s


def main():
    d = 0x5f3a9c11e84b27d6a0f45c93b18e7620d4a1cc35e29b8f470163ad5e7c92b8f1
    k = 0xa1b2c3d400000000000000000000000000000000000000000000000000000001

    z1, r1, s1 = sign(d, "pay 0.05 BTC to Nora", k)
    z2, r2, s2 = sign(d, "pay 0.01 BTC to the exchange", k)
    assert r1 == r2, "same k must give the same r"

    # Two equations, two unknowns. Subtracting cancels r*d, leaving only k.
    k_rec = (z1 - z2) * pow(s1 - s2, -1, N) % N
    d_rec = (s1 * k_rec - z1) * pow(r1, -1, N) % N
    assert k_rec == k and d_rec == d, "recovery failed"

    short = lambda v: f"{v:064x}"[:8] + "..." + f"{v:064x}"[-4:]
    print(f"private key d   {short(d)}   (the secret)")
    print(f"signature 1     r {short(r1)}   s {short(s1)}")
    print(f"signature 2     r {short(r2)}   s {short(s2)}")
    print(f"recovered k     {short(k_rec)}")
    print(f"recovered d     {short(d_rec)}   match: {d_rec == d}")

    rows = [("first signature", short(r1), short(s1)),
            ("second signature", short(r2), short(s2))]
    y0, rh = 22, 62
    height = y0 + rh * len(rows) + 24
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'two different messages, signed moments apart</text>']
    for i, (label, r, s) in enumerate(rows):
        top = y0 + i * rh
        out.append(f'  <rect class="box" x="8" y="{top}" width="284" height="54" rx="6"/>')
        out.append(f'  <text class="dim" x="20" y="{top + 15}" font-size="10">{label}</text>')
        out.append(f'  <rect class="hot" x="14" y="{top + 21}" width="142" height="17" rx="3"/>')
        out.append(f'  <text class="lbl" x="20" y="{top + 34}" font-size="11">r  {r}</text>')
        out.append(f'  <text x="20" y="{top + 50}" font-size="11">s  {s}</text>')
    out.append(f'  <text class="accent" x="8" y="{height - 6}" font-size="12">'
               f'identical r, so identical k</text>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
