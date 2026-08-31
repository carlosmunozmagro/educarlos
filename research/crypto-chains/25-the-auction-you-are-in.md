# Brief — 25 The auction you are in

## Fixed supply, continuous sale

A bitcoin block is capped at **4,000,000 weight units** (BIP-141), which is
about 1,000,000 virtual bytes. Demand is not capped by anything. So block space
is a fixed supply sold continuously, and a fee is a bid.

Miners maximise revenue per unit of space, so they sort by **fee rate**
(satoshis per virtual byte), not by total fee. `tools/visuals/fee-auction.py`
packs a small block greedily and produces exactly the case the lesson needs:

```
a courier            140 vB   4,200 sat   30 sat/vB   in
a refund             220 vB   5,500 sat   25 sat/vB   in
a pressing deposit   300 vB   5,400 sat   18 sat/vB   in
Teodora, 41 inputs 1,400 vB  14,000 sat   10 sat/vB   left behind
a coffee             190 vB   1,520 sat    8 sat/vB   in
```

The largest total fee in the mempool is the one that does not confirm, and a
transaction paying a ninth as much goes in ahead of it.

## Why Teodora's transaction is enormous

Because of lesson 08. Her wallet holds dozens of small outputs from individual
record sales, and spending them means including every one as an input, each
with its own signature. Size is driven by input count, so a wallet full of
small payments is expensive to spend from — and the fee is charged on the
bytes, not on the amount.

The remedy is **consolidation**: combine many small outputs into one while
rates are low. Note the privacy cost, straight from lesson 23 — consolidating
tells the world those outputs share an owner. The two goals are in direct
conflict and there is no configuration that satisfies both.

## EIP-1559

Ethereum replaced blind first-price bidding with:

- a **base fee** per unit of gas, set by the protocol, adjusted by up to
  **12.5%** per block to target blocks half full, and **burned**;
- a **priority fee** (tip) to the proposer;
- a max fee the sender is willing to pay, with the difference refunded.

The point is predictability: the base fee is knowable before you send, rather
than guessed against an invisible field of other bids.

## The bid is public

The mempool is a broadcast medium, so a pending transaction is a published
statement of intent that has not executed yet. That gap is what MEV extracts:
reordering, front-running and sandwiching a known trade. Daian et al., *Flash
Boys 2.0* (2019), is the paper that named and measured it.

Bitcoin's version is milder but real — and RBF (BIP-125, lesson 16) is the
sender's own tool for the same gap: bump the fee on a stuck transaction rather
than waiting.

## Sources

- BIP-141, *Segregated Witness* — https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
- EIP-1559, *Fee market change for ETH 1.0 chain* — https://eips.ethereum.org/EIPS/eip-1559
- Daian, Goldfeder, Kell, Li, Zhao, Bentov, Breidenbach, Juels, *Flash Boys 2.0* — https://arxiv.org/abs/1904.05234
