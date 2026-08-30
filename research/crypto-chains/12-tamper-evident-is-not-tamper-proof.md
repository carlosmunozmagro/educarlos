# Brief — 12 Tamper-evident is not tamper-proof

## The precise mechanism

Editing a transaction in block `k` changes that block's merkle root, so its
header hash changes. **Exactly one link breaks**: the `prev` pointer stored in
block `k+1` no longer equals block `k`'s hash. Blocks `k+2` onward are still
internally consistent with each other.

Repairing the break means rewriting block `k+1`'s header, which changes *its*
hash, which breaks `k+2`. So a rewrite is a cascade of `n - k` header
recomputations. `tools/visuals/chain-break.py` builds a real five-block chain,
edits block 2, and confirms one broken link and three headers to redo.

The common phrasing — "every subsequent block becomes invalid" — is loose in a
way that matters: what actually happens is that the *cost of a consistent
rewrite* grows with depth. That cost is the whole security argument, and the
hash chain does not supply it.

## A hash chain alone prevents nothing

Git is a hash chain with the same structure: each commit names its parent by
hash. `git rebase` rewrites history freely and produces a perfectly consistent
chain. It is detectable only if you already know the old hash — a reference
point from outside the chain.

That is the general statement: **a hash chain gives you evidence conditional on
knowing the true tip**. Deciding which tip is true is a different problem, and
it is what proof of work is for. Chapter 3.

## March 2013, and what immutability is worth

The clearest case that a chain is not physics:

- **11–12 March 2013.** Bitcoin 0.8 accepted block **225,430**, which 0.7 nodes
  rejected because of an unintended Berkeley DB lock limit. The network split
  into two chains for roughly six hours.
- Resolution was **social**: developers and pool operators coordinated to have
  miners downgrade to 0.7, so the longer 0.8 chain was abandoned. Around 24
  blocks were discarded.
- Documented in **BIP-50**, the post-mortem. Anyone whose transaction was in
  those blocks had it un-happen.

Also worth stating: one- and two-block reorganisations happen routinely without
anyone coordinating anything. "Confirmed" is a probability, which is lesson 16.

## The framing the lesson should land

Immutability is an **economic** property, not a mathematical one. The chain
guarantees that a rewrite is *detectable* and *expensive*. It never guaranteed
that it is impossible — and it says nothing at all about whether what was
recorded was true in the first place, which is lesson 27.

## Sources

- BIP-50, *March 2013 Chain Fork Post-Mortem* — https://github.com/bitcoin/bips/blob/master/bip-0050.mediawiki
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §11 — https://bitcoin.org/bitcoin.pdf
- *Pro Git*, chapter 10.2, Git Objects — https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
