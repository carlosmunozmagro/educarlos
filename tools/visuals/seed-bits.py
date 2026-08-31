#!/usr/bin/env python3
"""Figures and visuals/crypto-chains/seed-bits.svg for lesson 24.

Works BIP-39's arithmetic on the standard all-zero test vector: 128 bits of
entropy, a 4-bit checksum, twelve 11-bit words, and the PBKDF2 stretch to the
512-bit seed. Everything printed is computed here, including the index of the
final word - which is why that famous mnemonic ends in "about" rather than a
thirteenth "abandon".

Run:  python3 tools/visuals/seed-bits.py
"""
import hashlib
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "visuals/crypto-chains/seed-bits.svg"

ENT_BITS = 128
WORDS = 12
BITS_PER_WORD = 11


def main():
    checksum_bits = ENT_BITS // 32
    assert ENT_BITS + checksum_bits == WORDS * BITS_PER_WORD, "the words do not fit"
    print(f"{ENT_BITS} entropy + {checksum_bits} checksum = "
          f"{WORDS} x {BITS_PER_WORD} = {WORDS * BITS_PER_WORD} bits")

    entropy = bytes(ENT_BITS // 8)                       # the all-zero vector
    digest = hashlib.sha256(entropy).digest()
    checksum = digest[0] >> (8 - checksum_bits)
    print(f"sha256(entropy)[0] = 0x{digest[0]:02x}, top {checksum_bits} bits = {checksum}")

    bits = "0" * ENT_BITS + format(checksum, f"0{checksum_bits}b")
    indexes = [int(bits[i * BITS_PER_WORD:(i + 1) * BITS_PER_WORD], 2) for i in range(WORDS)]
    print(f"word indexes: {indexes}")
    print(f"the last word is index {indexes[-1]} of the 2048-word list, "
          f"not index 0 - which is why the vector does not end in another 'abandon'")

    mnemonic = ("abandon " * 11 + "about").encode()
    seed = hashlib.pbkdf2_hmac("sha512", mnemonic, b"mnemonic", 2048)
    print(f"PBKDF2-HMAC-SHA512, 2048 rounds, salt 'mnemonic':")
    print(f"  seed = {seed.hex()[:24]}...{seed.hex()[-8:]}  ({len(seed) * 8} bits)")

    steps = [("twelve words", f"{WORDS} x {BITS_PER_WORD} bits", "cold"),
             ("128 bits of entropy", f"+ {checksum_bits}-bit checksum", "accent"),
             ("PBKDF2, 2048 rounds", "salt: 'mnemonic' + passphrase", "cold"),
             ("512-bit seed", "one master key, every address", "cold")]
    y0, rh = 24, 40
    height = y0 + rh * len(steps) - 6
    out = [f'<svg viewBox="0 0 300 {height}" xmlns="http://www.w3.org/2000/svg">',
           '  <defs><marker id="sb-arrow" viewBox="0 0 8 8" refX="7" refY="4" '
           'markerWidth="6" markerHeight="6" orient="auto">'
           '<path d="M0 1 L7 4 L0 7 z" fill="currentColor"/></marker></defs>',
           '  <text class="dim" x="8" y="12" font-size="10">'
           'from a sentence to every key you own</text>']
    for i, (name, note, cls) in enumerate(steps):
        top = y0 + i * rh
        out.append(f'  <rect class="box" x="8" y="{top}" width="284" height="28" rx="5"/>')
        out.append(f'  <text class="{"accent" if cls == "accent" else "lbl"}" x="18" '
                   f'y="{top + 12}" font-size="11">{name}</text>')
        out.append(f'  <text class="dim" x="18" y="{top + 24}" font-size="10">{note}</text>')
        if i < len(steps) - 1:
            out.append(f'  <line class="line" x1="150" y1="{top + 28}" x2="150" '
                       f'y2="{top + rh - 2}" marker-end="url(#sb-arrow)"/>')
    out.append("</svg>")
    OUT.write_text("\n".join(out) + "\n")
    print(f"\nwrote {OUT.relative_to(OUT.parents[2])} ({height} tall)")


if __name__ == "__main__":
    main()
