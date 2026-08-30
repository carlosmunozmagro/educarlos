# Brief — 06 The number that leaked a console

## The arithmetic

Two signatures by the same key `d` over different messages, using the same
nonce `k`:

```
s1 = k^-1 (z1 + r d)
s2 = k^-1 (z2 + r d)        # same k, so same r = (kG).x
```

Subtract. The `r d` term is identical in both and cancels:

```
s1 - s2 = k^-1 (z1 - z2)
k = (z1 - z2) / (s1 - s2)   mod n
```

Then from either signature:

```
d = (s1 k - z1) / r         mod n
```

Every quantity on the right of both lines is public: `z1`, `z2` are hashes of
the signed messages, `r`, `s1`, `s2` are the signatures themselves. No side
channel, no brute force, two modular inversions.

`tools/visuals/nonce-reuse.py` performs this on real secp256k1 with a
256-bit key and asserts the recovered key equals the original. Its printed
values are the ones the lesson quotes.

## The PS3

- **fail0verflow**, *Console Hacking 2010: PS3 Epic Fail*, presented at the
  **27th Chaos Communication Congress, 29 December 2010**, Berlin.
- Sony's ECDSA signing for PS3 executables used a **constant** where the nonce
  should have been. Every signature it ever produced shared one `k`.
- Consequence: recovery of the private key used to sign code for the console,
  and therefore the ability to sign arbitrary code that the console would
  accept as Sony's.

## The bitcoin version

- **11 August 2013** — Bitcoin.org security advisory: Android's `SecureRandom`
  could be improperly initialised, so wallets on affected devices produced
  repeated nonces and, in some cases, repeated `r` values on-chain.
- The aggravating factor is structural, not accidental: **signatures on a
  public chain are published forever**. Scanning the entire history for two
  signatures sharing an `r` is a cheap, retroactive, permanent search. Sony at
  least had to be attacked; a chain hands the input to everyone.

## The fix

**RFC 6979** (Thomas Pornin, August 2013), *Deterministic Usage of DSA and
ECDSA*: derive `k` with HMAC-DRBG from the private key and the message hash.

- The signer needs **no entropy at signing time** — the failure mode is
  removed rather than mitigated.
- Determinism is safe here because `k` still depends on the secret `d`; an
  observer cannot recompute it. Signing the same message twice yields the same
  signature, which is not a leak, and makes signing reproducible under test.
- BIP-340 (Schnorr) specifies deterministic nonce derivation with auxiliary
  randomness for the same reason.

## The limit still open

Full reuse is the loud version. **Partial** nonce bias is the quiet one: if the
top bits of `k` are even slightly non-uniform, lattice reduction recovers `d`
from many signatures. Howgrave-Graham and Smart (2001) established the
technique; later work — LadderLeak (CCS 2020) among it — pushed the required
leakage below one bit, at the cost of very large signature counts. State this
qualitatively; do not quote a signature count in the lesson.

## Sources

- fail0verflow, *Console Hacking 2010: PS3 Epic Fail*, 27C3, 29 December 2010 — https://fahrplan.events.ccc.de/congress/2010/Fahrplan/events/4087.en.html
- Bitcoin.org, *Android Security Vulnerability*, 11 August 2013 — https://bitcoin.org/en/alert/2013-08-11-android
- RFC 6979, *Deterministic Usage of DSA and ECDSA* — https://www.rfc-editor.org/rfc/rfc6979
- N. Howgrave-Graham, N. Smart, *Lattice Attacks on Digital Signature Schemes*, Designs, Codes and Cryptography 23, 2001
