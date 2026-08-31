# Brief — 24 Twelve words

All figures below are computed by `tools/visuals/seed-bits.py`, which
reproduces BIP-39's standard all-zero test vector end to end.

## The arithmetic

```
12 words x 11 bits = 132 bits = 128 bits entropy + 4 bits checksum
24 words x 11 bits = 264 bits = 256 bits entropy + 8 bits checksum
```

The checksum is the first `ENT/32` bits of `SHA-256(entropy)`. For the all-zero
128-bit entropy, `SHA-256(...)[0] = 0x37`, so the top four bits are `3` — and
the twelfth word is index 3 of the wordlist, which is why the canonical test
vector reads *"abandon × 11, about"* rather than a twelfth "abandon". Worth
showing: it turns the checksum from an assertion into something the reader can
see land.

A wrong mnemonic passes the 12-word checksum with probability `1/16`, so a
typo is caught fifteen times out of sixteen.

## Mnemonic to seed

```
seed = PBKDF2-HMAC-SHA512(mnemonic, salt = "mnemonic" + passphrase, 2048 rounds)
     = 5eb00bbddcf069084889a8ab...ce9e38e4      (512 bits, computed here)
```

**Why only 2,048 rounds** when password hashing uses hundreds of thousands: the
input already carries 128 bits of entropy, so there is nothing to stretch. Key
stretching buys time against guessing *low*-entropy inputs. The exception is a
user-chosen passphrase — and there, 2,048 rounds is thin, which is an argument
for a strong passphrase rather than for a slow KDF.

## BIP-32 and BIP-44

The seed generates a master key, from which child keys are derived
deterministically. A backup taken once therefore covers every address the
wallet will ever create, including ones that do not exist yet. Paths look like
`m/44'/0'/0'/0/i` (BIP-44).

Two consequences, in increasing sharpness:

- **An extended public key (`xpub`) derives every future receiving address.**
  Leaking one loses no funds and all privacy, forever, including addresses not
  yet generated.
- **Non-hardened derivation is worse than that.** Given a parent `xpub` and any
  *one* non-hardened child **private** key, the parent private key is
  recoverable — and therefore every sibling. This is exactly why account-level
  paths use hardened derivation (the apostrophes above).

## The passphrase

BIP-39's optional passphrase (often called the 25th word) goes into the PBKDF2
salt, so a different passphrase produces a **different valid wallet**. There is
no error for a wrong one: it opens an empty wallet, which is indistinguishable
from a correct passphrase on a wallet that was never funded.

## The limit

Twelve words on paper is a bearer instrument. Whoever reads it owns the money,
there is no revocation, no reset, and nobody to appeal to. Every practical loss
in this field is here rather than in the mathematics.

## Sources

- BIP-39, *Mnemonic code for generating deterministic keys* — https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- BIP-32, *Hierarchical Deterministic Wallets* — https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- BIP-44, *Multi-Account Hierarchy for Deterministic Wallets* — https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
