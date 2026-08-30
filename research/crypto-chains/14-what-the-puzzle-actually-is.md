# Brief — 14 What the puzzle actually is

## The rule, exactly

A block is valid when the double SHA-256 of its 80-byte header, read as a
256-bit integer, is **less than or equal to the target**. The target is encoded
in the header's 4-byte `bits` field in a compact exponent-and-mantissa form.

The difficulty-1 target — the easiest the protocol allows, and the one used at
genesis — is:

```
0x00000000FFFF0000000000000000000000000000000000000000000000000000
```

Difficulty is defined against it: `target = difficulty_1_target / difficulty`.
From that, the expected number of hashes per block is

```
2^256 / (target + 1)  ~  difficulty x 2^32
```

That identity is exact and does not go stale, which is why the lesson uses it
rather than quoting a hashrate.

## Measured, not asserted

`tools/visuals/mining-ladder.py` mines real targets and reports attempts:

| Zero bits required | Expected | Actually took |
|---|---|---|
| 4 | 16 | 16 |
| 8 | 256 | 102 |
| 12 | 4,096 | 5,323 |
| 16 | 65,536 | 145,648 |
| 20 | 1,048,576 | 505,395 |

The scatter around the expectation is not noise to apologise for — it *is* the
lesson. Finding a block is a Poisson process, and individual outcomes vary
wildly around the mean. Two of these five are off by more than a factor of two.

## Memorylessness — the point most explanations miss

Each hash is an independent trial. There is no partial progress, no state
carried between attempts, nothing to accumulate. A machine that has been
hashing this header for nine minutes is **exactly as close** to a solution as
one that started a microsecond ago.

Consequences worth stating:

- No head start, so no economies of scale in *luck*; a miner with 1% of the
  hashrate wins about 1% of blocks over time.
- Pools exist to reduce **variance**, not to raise expected return.
- "The miner solved a complex mathematical problem" is wrong twice: nothing is
  solved, and there is nothing complex about it. It is counting.

## The limit

The whitepaper's "one CPU one vote" did not survive contact with hardware:
general-purpose CPUs gave way to GPUs, then FPGAs, then ASICs that do nothing
else. The vote is now denominated in capital and electricity, and it
concentrates. That is a real and permanent departure from the original design
statement, and the lesson should say so rather than repeating the slogan.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §4 — https://bitcoin.org/bitcoin.pdf
- Bitcoin developer reference, *Block Chain — Target nBits* — https://developer.bitcoin.org/reference/block_chain.html
- FIPS 180-4, *Secure Hash Standard* — https://csrc.nist.gov/pubs/fips/180-4/upd1/final
