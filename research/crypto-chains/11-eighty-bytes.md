# Brief — 11 Eighty bytes

## The six fields

| Field | Bytes | What it is |
|---|---|---|
| version | 4 | block version and soft-fork signalling bits |
| previous block hash | 32 | the link backwards |
| merkle root | 32 | the commitment to every transaction in the block |
| time | 4 | Unix timestamp, loosely constrained (below) |
| bits | 4 | the target, in a compact encoding |
| nonce | 4 | the counter a miner increments |

Total **80 bytes**, fixed, since the genesis block. `tools/visuals/header-bytes.py`
asserts the sum and draws it to scale.

## Numbers worth quoting

- A year is about **52,560 blocks** at ten minutes each: `52,560 × 80 = 4.2 MB`
  of headers per year.
- At a height near 880,000 the entire header chain since January 2009 is around
  **70 MB** — small enough for a phone to hold every header ever produced.
- The nonce is 4 bytes, so **2^32 ≈ 4.29 billion** values. Modern ASICs run at
  hundreds of terahashes per second and exhaust that in well under a
  millisecond.

## Where the extra search space comes from

Since the nonce alone is far too small, miners vary:

1. **The coinbase transaction** — an arbitrary "extranonce" field. Changing it
   changes the coinbase txid, so the merkle root changes, so the whole header
   changes. This is the real search space, and it is effectively unbounded.
2. **The timestamp**, within the rules below.
3. **Version bits** left free by BIP-320.

## The timestamp is not a clock

Two consensus rules bound it, and neither makes it accurate:

- greater than the **median of the previous 11 blocks'** timestamps;
- not more than **2 hours** ahead of network-adjusted time.

So a block's stated time can be wrong in either direction by a wide margin.
Anything that needs real ordering uses height, not time. BIP-113 moved
`nLockTime` evaluation onto median-time-past for exactly this reason.

## The limit

A header commits to the transactions but proves nothing about their validity. A
miner can produce a perfectly well-formed header over a block full of invalid
transactions; only a node that downloads and checks the block catches it. This
is the gap SPV clients live inside, and it is why "verified by the header" and
"verified" are different claims.

## Sources

- Bitcoin developer reference, *Block Chain / Block Headers* — https://developer.bitcoin.org/reference/block_chain.html
- BIP-113, *Median time-past as endpoint for lock-time calculations* — https://github.com/bitcoin/bips/blob/master/bip-0113.mediawiki
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §4 — https://bitcoin.org/bitcoin.pdf
