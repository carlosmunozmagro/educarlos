# Brief — 10 Proving membership

## The structure

Pair the transaction ids, hash each pair, repeat until one hash is left. That
is the **Merkle root**, and it is one 32-byte field in the block header.

To prove a transaction is in the block you supply one hash per level — the
sibling at each step — and the verifier recomputes upward. Proof size is
`ceil(log2 n)` hashes.

| Transactions in block | Hashes in proof | Bytes |
|---|---|---|
| 8 | 3 | 96 |
| 1,024 | 10 | 320 |
| 4,096 | 12 | 384 |

`tools/visuals/merkle.py` builds a real tree with bitcoin's double SHA-256 over
eight leaves and prints the three-hash proof it drew.

## What SPV actually establishes

This is where the lesson has to be exact, because "the phone verified the
payment" is routinely overstated. A Merkle proof plus a block header proves:

> this transaction is committed to by that header.

It does **not** prove:

- that the header is on the best chain (needs the header chain, and even then
  it is probabilistic — lesson 16);
- that the transaction was *valid* (a light client does not check signatures,
  scripts, or whether the inputs existed — it trusts miners for that);
- that it was not later reorganised out.

Forging a proof would require finding a second set of transactions hashing to
the same root — a collision, at `2^128` work. The proof is sound; its *scope*
is the limit.

## The duplicate-leaf bug

Bitcoin duplicates the last hash when a level has an odd number of nodes. That
means a tree over `[A, B, C]` and one over `[A, B, C, C]` produce the same root.
**CVE-2012-2459** (May 2012): an attacker could take a valid block, duplicate
transactions to produce an identical root, and get nodes to mark the *original*
block invalid — a denial of service against a valid block. Fixed by tracking
duplicate txids explicitly during validation.

## How light clients do it now

- **BIP-37** bloom filters: the client sends a filter, the node sends matching
  transactions. Leaked which addresses the client cared about, and let a
  malicious filter request cost a node a lot of disk reads.
- **BIP-157/158** compact block filters: the *node* publishes a filter per
  block, the client downloads it and decides for itself. The query never
  leaves the phone.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §7–8 — https://bitcoin.org/bitcoin.pdf
- CVE-2012-2459, Merkle tree duplicate-transaction vulnerability — https://en.bitcoin.it/wiki/Common_Vulnerabilities_and_Exposures#CVE-2012-2459
- BIP-158, *Compact Block Filters for Light Clients* — https://github.com/bitcoin/bips/blob/master/bip-0158.mediawiki
