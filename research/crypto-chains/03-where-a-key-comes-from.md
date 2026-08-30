# Brief — 03 Where a key comes from

## What a secp256k1 private key is

An integer `d` with `1 <= d <= n-1`, where `n` is the order of the base point
`G` given in SEC 2 v2 §2.4.1:

```
n = FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFE BAAEDCE6 AF48A03B BFD25E8C D0364141
  ~ 1.158 x 10^77
```

`n` is just under `2^256`. The gap is about `2^129`, so the share of random
256-bit strings that fall outside the valid range is roughly `2^-127` — a
wallet that simply redraws on an out-of-range value will, in practice, never
redraw. Worth one clause in the lesson; not worth a screen.

## The collision question

For `k` keys drawn uniformly from `n ~ 1.16 x 10^77`, the birthday
approximation gives collision probability `~ k^2 / (2n)`. At `k = 10^9` keys
(more than every wallet ever created), that is about `4 x 10^-60`. The lesson
uses "one in `10^59`" as the order of magnitude, not a precise figure.

## Debian, May 2008 — the entropy collapse

- **CVE-2008-0166**, Debian advisory **DSA-1571-1**, published **13 May 2008**.
- A patch to Debian's OpenSSL package removed a line feeding uninitialised
  memory into the PRNG pool. Removing it also removed every other seed except
  the **process ID**.
- Linux PIDs default to a maximum of 32,768, so the generator had **15 bits**
  of state: at most 32,768 distinct keys per architecture and key size.
- The affected packages shipped from **September 2006** to the advisory, so
  roughly twenty months of keys.
- This hit SSH and SSL/TLS keys. Bitcoin did not exist yet — the lesson must
  say so rather than implying bitcoin keys were affected. It is used because
  it is the best-documented instance of the failure mode, not because it
  touched this field.

## Brain wallets

Marie Vasek, Joseph Bonneau, Ryan Castellucci, Cameron Keith, Tyler Moore,
*The Bitcoin Brain Drain: Examining the Use and Abuse of Bitcoin Brain
Wallets*, Financial Cryptography 2016. A "brain wallet" derives the private
key from a passphrase the user memorises, usually as `SHA-256(passphrase)`.

The paper's headline finding, and the only one the lesson relies on: brain
wallets were found and drained systematically, with many emptied within
minutes of first being funded — attackers ran the search continuously against
new blocks rather than waiting.

**Not yet verified from the paper itself in this session:** the exact counts
(number of brain wallets identified, total BTC drained). Do not quote a count
in the lesson until it is read from the paper. The qualitative finding above
is safe and is what the mechanism argument needs.

## The limit worth stating

Randomness is not auditable after the fact. A key drawn from 15 bits and a key
drawn from 256 bits are both 32-byte strings, and no examination of the key
distinguishes them. This is why the assurance moved to the *generator*: NIST
SP 800-90A defines the approved constructions, SP 800-90B the entropy-source
testing. You test the process, because you cannot test the output.

## Sources

- SEC 2 v2, *Recommended Elliptic Curve Domain Parameters* — https://www.secg.org/sec2-v2.pdf
- Debian DSA-1571-1, *openssl — predictable random number generator* — https://www.debian.org/security/2008/dsa-1571
- NIST SP 800-90A Rev. 1, *Recommendation for Random Number Generation Using Deterministic Random Bit Generators* — https://csrc.nist.gov/pubs/sp/800/90/a/r1/final
- Vasek et al., *The Bitcoin Brain Drain*, Financial Cryptography 2016
