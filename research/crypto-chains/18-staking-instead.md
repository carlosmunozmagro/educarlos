# Brief — 18 Staking instead

## The switch

- **15 September 2022**, Ethereum's Merge. Specified in **EIP-3675**, which
  replaces proof of work with the beacon chain's consensus.
- Triggered not at a block height but at a **terminal total difficulty** —
  a cumulative-work threshold, so the switch happened when the old chain had
  done a fixed total amount of work rather than at a wall-clock time.
- The Ethereum Foundation's stated result: energy use down about **99.95%**.

## The clock

| Unit | Length |
|---|---|
| slot | 12 seconds — one chance for a chosen validator to propose |
| epoch | 32 slots = 384 s = **6.4 minutes** |
| finality | 2 epochs = 768 s = **12.8 minutes** |

`tools/visuals/finality.py` asserts this arithmetic before drawing it.

## What replaces work

- A validator deposits **32 ETH**. The deposit, not electricity, is the scarce
  thing that makes votes cost something.
- **Casper FFG** (Buterin and Griffith, 2017) provides the finality gadget:
  epochs are justified and then finalised by votes weighted by stake.
- **Slashing** is the enforcement. A validator that proposes two conflicting
  blocks, or casts contradictory attestations, loses part of its stake and is
  ejected. This is what answers the "nothing at stake" objection — under proof
  of work, building on two chains costs you the split of your hashrate; under
  naive proof of stake it costs nothing, so it has to be made to cost
  something explicitly.

## The genuinely different property

Proof of work gives a **probability** that decays (lesson 16). Casper FFG gives
**economic finality**: once finalised, reverting requires at least one third of
the total stake to be slashed. That is not a probability — it is a price,
denominated in the attacker's own capital, and it is knowable in advance.

## What it costs: weak subjectivity

This is the trade-off the lesson has to land, and most explanations omit it.

- Under proof of work a new node can verify the chain **from genesis using
  nothing but the protocol rules**. Work is externally verifiable; the heaviest
  chain is identifiable without trusting anybody.
- Under proof of stake, validators who have withdrawn their stake can costlessly
  sign an alternative history from that point — there is nothing left to slash.
  A node syncing from nothing cannot tell which history is real.
- So a syncing node needs a recent **weak subjectivity checkpoint**: a block
  hash obtained out of band and trusted. Not a large amount of trust, and it is
  bounded and well understood — but it is not zero, and proof of work needed
  none.

## Sources

- EIP-3675, *Upgrade consensus to Proof-of-Stake* — https://eips.ethereum.org/EIPS/eip-3675
- Vitalik Buterin and Virgil Griffith, *Casper the Friendly Finality Gadget* — https://arxiv.org/abs/1710.09437
- Ethereum Foundation, *The Merge* — https://ethereum.org/en/roadmap/merge/
