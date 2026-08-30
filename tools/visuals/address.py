#!/usr/bin/env python3
"""Nora's address, and the typo that bounces. Lesson 07.

Derives a real segwit v0 address end to end from an illustrative private key -
public key, HASH160, bech32 - then changes one character and shows the checksum
rejecting it. Also writes visuals/crypto-chains/address-pipeline.svg.

The key here is a fixed teaching constant. It is not a wallet. Do not send
anything to the address this prints.

Run:  python3 tools/visuals/address.py
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/address-pipeline.svg"

P = 2**256 - 2**32 - 977
G = (0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
     0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8)
CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"   # BIP-173: no 1, b, i or o


def add(p, q):
    if p is None or q is None:
        return p or q
    (x1, y1), (x2, y2) = p, q
    lam = ((3 * x1 * x1) * pow(2 * y1, -1, P) if p == q
           else (y2 - y1) * pow(x2 - x1, -1, P)) % P
    x3 = (lam * lam - x1 - x2) % P
    return (x3, (lam * (x1 - x3) - y1) % P)


def mul(k):
    r, p = None, G
    while k:
        if k & 1:
            r = add(r, p)
        p = add(p, p)
        k >>= 1
    return r


def polymod(values):
    """BIP-173 BCH checksum over GF(32)."""
    gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    chk = 1
    for v in values:
        top = chk >> 25
        chk = (chk & 0x1ffffff) << 5 ^ v
        for i in range(5):
            chk ^= gen[i] if (top >> i) & 1 else 0
    return chk


def hrp_expand(hrp):
    return [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]


def convertbits(data, frm, to, pad=True):
    acc = bits = 0
    ret = []
    for value in data:
        acc = (acc << frm) | value
        bits += frm
        while bits >= to:
            bits -= to
            ret.append((acc >> bits) & ((1 << to) - 1))
    if pad and bits:
        ret.append((acc << (to - bits)) & ((1 << to) - 1))
    return ret


def encode(hrp, witver, program):
    data = [witver] + convertbits(program, 8, 5)
    chk = polymod(hrp_expand(hrp) + data + [0] * 6) ^ 1
    data += [(chk >> 5 * (5 - i)) & 31 for i in range(6)]
    return hrp + "1" + "".join(CHARSET[d] for d in data)


def valid(addr):
    hrp, _, data = addr.rpartition("1")
    if any(c not in CHARSET for c in data):
        return False
    return polymod(hrp_expand(hrp) + [CHARSET.index(c) for c in data]) == 1


def main():
    d = 0x2b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfe
    x, y = mul(d)
    pubkey = bytes([2 + (y & 1)]) + x.to_bytes(32, "big")
    sha = hashlib.sha256(pubkey).digest()
    h160 = hashlib.new("ripemd160", sha).digest()
    addr = encode("bc", 0, h160)

    print(f"public key (33 bytes) {pubkey.hex()[:12]}...{pubkey.hex()[-4:]}")
    print(f"SHA-256               {sha.hex()[:12]}...{sha.hex()[-4:]}")
    print(f"RIPEMD-160 (20 bytes) {h160.hex()}")
    print(f"address               {addr}   ({len(addr)} characters)")
    assert valid(addr)

    # One character wrong, in the middle, where an eye slides over it.
    i = 20
    wrong = CHARSET[(CHARSET.index(addr[i]) + 1) % 32]
    typo = addr[:i] + wrong + addr[i + 1:]
    print(f"one character changed {typo}")
    print(f"checksum accepts it?  {valid(typo)}")
    assert not valid(typo)

    steps = [("Public key, 33 bytes", pubkey.hex()[:10] + "..."),
             ("SHA-256", sha.hex()[:10] + "..."),
             ("RIPEMD-160, 20 bytes", h160.hex()[:10] + "..."),
             ("bech32 + 6-char checksum", addr[:14] + "...")]
    y0, rh = 26, 44
    height = y0 + rh * len(steps) - 4
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <defs><marker id="ap-arrow" viewBox="0 0 8 8" refX="7" refY="4" '
           'markerWidth="6" markerHeight="6" orient="auto">'
           '<path d="M0 1 L7 4 L0 7 z" fill="currentColor"/></marker></defs>',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'each step throws information away, on purpose</text>']
    for i, (label, value) in enumerate(steps):
        top = y0 + i * rh
        cls = ' class="box"' if i < len(steps) - 1 else ' class="box"'
        out.append(f'  <rect{cls} x="8" y="{top}" width="284" height="32" rx="6"/>')
        style = "accent" if i == len(steps) - 1 else "lbl"
        out.append(f'  <text class="{style}" x="18" y="{top + 14}" font-size="11">{label}</text>')
        out.append(f'  <text x="18" y="{top + 27}" font-size="11">{value}</text>')
        if i < len(steps) - 1:
            out.append(f'  <line class="line" x1="150" y1="{top + 32}" x2="150" '
                       f'y2="{top + rh - 2}" marker-end="url(#ap-arrow)"/>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
