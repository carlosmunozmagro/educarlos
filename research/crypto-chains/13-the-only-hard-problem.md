# Brief — 13 The only hard problem

## Framing the lesson has to get right

"Double spending" sounds like a counterfeiting problem, and it is not. Sending
the same coin twice is not copying money — the second transaction is simply
invalid, because its input is already spent, and every node rejects it on
sight. That check needs no consensus at all.

The hard case is different: **two transactions that spend the same output and
have never both been seen by anyone.** Each is validly signed. Each is
acceptable on its own. Only one can be in the final history, and nothing
inherent to either says which.

In the case: Caleb signs the 0.05 to Nora and, seconds later, a conflicting
transaction returning 0.0809 to an address of his own. He sends one to a peer
in Lisbon and one to a peer in Toronto.

## Why this is genuinely hard, not just unsolved

- **There is no global clock.** Timestamps are self-reported and bounded only
  loosely (lesson 11). Two nodes will legitimately disagree about which
  transaction arrived first, and both will be right about their own observation.
- **Byzantine faults.** Some participants are not merely slow or crashed —
  they are actively lying, and may send different messages to different peers.
  Lamport, Shostak and Pease formalised this in 1982.
- **FLP.** Fischer, Lynch and Paterson (1985) proved that in an asynchronous
  network, no *deterministic* protocol can guarantee consensus if even one
  process may fail. This is a theorem, not an engineering gap.

Bitcoin does not defeat FLP. It sidesteps it: the agreement it produces is
**probabilistic**, converging over time rather than deciding at an instant.
That is why lesson 16 gives a probability rather than a yes. Say this
explicitly — it is the honest reason "six confirmations" exists at all.

## What proof of work supplies

The ordering problem needs a tiebreak that cannot be forged, cannot be voted on
cheaply (identities are free, so one-node-one-vote is meaningless — a Sybil
attack costs nothing), and that everyone converges on independently. Work is a
tiebreak denominated in something no one can fake: energy already spent.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §1–2, §5 — https://bitcoin.org/bitcoin.pdf
- Lamport, Shostak, Pease, *The Byzantine Generals Problem*, ACM TOPLAS 4(3), 1982
- Fischer, Lynch, Paterson, *Impossibility of Distributed Consensus with One Faulty Process*, JACM 32(2), 1985
