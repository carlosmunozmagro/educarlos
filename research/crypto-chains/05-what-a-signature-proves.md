# Brief — 05 What a signature proves

## ECDSA, exactly (SEC 1 v2 §4.1)

Signing a message `m` with private key `d`:

```
z = the leftmost n_bits of H(m)          # bitcoin: H is double SHA-256
k = a fresh random integer in [1, n-1]
R = kG,  r = R.x mod n                   # start over if r = 0
s = k^-1 (z + r d) mod n                 # start over if s = 0
signature = (r, s)
```

Verifying with the public key `Q`:

```
u1 = z s^-1 mod n
u2 = r s^-1 mod n
R' = u1 G + u2 Q
valid iff R'.x mod n == r
```

The identity that makes it work, and the answer to the lesson's reveal:

```
u1 G + u2 Q = (z s^-1) G + (r s^-1) d G
            = s^-1 (z + r d) G
            = k G                        because s = k^-1 (z + r d)
```

So verification reconstructs `kG` — the same point the signer computed — from
public values only. `d` cancels. Nothing in the verification path ever holds it.

## Sizes

`r` and `s` are each up to 32 bytes. Bitcoin serialises them in DER with a
one-byte sighash flag appended, which lands at **71–72 bytes** for a typical
signature. Schnorr signatures (BIP-340, active since Taproot) are a flat **64
bytes** because they need no DER framing — worth one clause, not a screen.

## Malleability

If `(r, s)` verifies then so does `(r, n - s)`: negating `s` negates `k`, and
`R` and `-R` share an x-coordinate. So a third party who cannot forge anything
can still alter the *encoding* of a valid signature.

In bitcoin this changed the transaction id, which is a hash over the whole
serialised transaction, signature included. A pending transaction could be
rebroadcast in mutated form and confirm under a different txid, breaking any
software that tracked it by id.

- **BIP-62** proposed a set of rules against it, including the low-`s` rule.
- **BIP-146** made low-`s` a relay policy rule.
- **BIP-141** (SegWit) is the structural fix: witness data is excluded from the
  txid, so mutating a signature cannot change it.

## What a signature does not prove

Worth stating plainly, because it is the most commonly overstated claim in the
field. A valid signature proves exactly one thing: *whoever produced this knew
the private key for this public key, and applied it to this exact message*. It
does not prove:

- **Identity.** It proves key control. A stolen key signs just as well.
- **Time.** There is no timestamp inside a signature. Ordering comes from the
  chain, not from the signature.
- **Intent beyond the bytes.** It commits to `z` and nothing else — which is
  why what goes *into* `z` is a security decision. That is lesson 09.

## Sources

- SEC 1 v2, *Elliptic Curve Cryptography*, §4.1 — https://www.secg.org/sec1-v2.pdf
- NIST FIPS 186-5, *Digital Signature Standard*, February 2023 — https://csrc.nist.gov/pubs/fips/186-5/final
- BIP-146, *Dealing with signature encoding malleability* — https://github.com/bitcoin/bips/blob/master/bip-0146.mediawiki
- BIP-141, *Segregated Witness* — https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
