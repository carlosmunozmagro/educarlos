# Brief — 02 Committing to a secret

**Written from:** FIPS 180-4, Naor's bit-commitment paper, NIST SP 800-132,
plus figures produced by `tools/visuals/commitment.py`.

## The claim the lesson is built on

A hash commitment is two properties at once, and they pull in opposite
directions:

- **Hiding** — the digest reveals nothing about the committed value.
- **Binding** — the committer cannot later open it to a different value.

Binding follows from collision resistance (FIPS 180-4 for SHA-256; the
collision bound is `2^128` work by the birthday argument). Hiding does **not**
follow from pre-image resistance when the message space is small, and that is
the point the lesson turns on.

## The number the lesson leads with

Every whole-euro price from 1,000 to 9,999 is 9,000 candidates. Hashing all of
them and comparing against a target digest, in unoptimised CPython on the
session container:

```
brute force: 9000 candidates, recovered 3900, 3.7 ms
rate: ~2.45 million candidates per second
```

Reproduce with `python3 tools/visuals/commitment.py`. The exact millisecond
figure is hardware-dependent — the lesson says "milliseconds", and quotes 3.7
as a measured run, not a constant. The rate is the honest headline: a single
core, no GPU, no optimisation.

Values used in the lesson, all from that run:

| Thing | Value |
|---|---|
| `SHA-256("3900")` | `d82e950a…b90511e42` (shown as `d82e95…1e42`) |
| `SHA-256("8419e2d5…" ‖ "4400")` | `8f0fcdc1…9eb8bde9` (shown as `8f0fcd…bde9`) |
| Nora's salt | `b3f1c0a7d5e29148`, 64 bits |
| Salted search space | `9,000 × 2^64 ≈ 1.66 × 10^23` |

## Salting

The salt is not a secret and does not need to be — it is revealed at opening
time along with the value. Its only job is to make the search space too large
to enumerate. NIST SP 800-132 §5.1 gives the same reasoning for password
storage and asks for at least 128 bits there; 64 bits is enough for a
one-shot commitment between two parties but is quoted in the lesson as
Nora's choice, not as a standard.

## The limit the lesson must state

A commitment binds a **value**. It does not bind a **person to participate**.
Nora can see Caleb's revealed €4,400, dislike it, and simply never open her
own commitment. Real commit-reveal protocols answer this with a deadline and
a forfeited deposit, not with cryptography. Do not let the lesson imply that
committing creates an obligation.

Second limit worth a sentence: a commitment says nothing about *when* it was
made. Anchoring a commitment in time needs a timestamping service or a
chain — which is the thread the course picks up in chapter 2.

## Sources

- FIPS 180-4, *Secure Hash Standard* — https://csrc.nist.gov/pubs/fips/180-4/upd1/final
- Moni Naor, *Bit Commitment Using Pseudo-Randomness*, Journal of Cryptology 4(2), 1991
- NIST SP 800-132, *Recommendation for Password-Based Key Derivation* — https://csrc.nist.gov/pubs/sp/800/132/final
