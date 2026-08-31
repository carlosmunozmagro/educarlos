# Brief — 20 Two ways to model the world

## The two states

| | UTXO (bitcoin) | Accounts (Ethereum) |
|---|---|---|
| The state is | a set of unspent outputs | a map from address to account |
| An account holds | — | balance, nonce, code hash, storage root |
| A transaction | consumes outputs, creates outputs | calls an address, mutating state |
| Replay protection | structural: an output exists once | an explicit per-account **nonce** |
| Parallel validation | natural, if inputs are disjoint | hard: calls contend on shared storage |

## Gas

The EVM is Turing-complete, so a contract can loop forever. Ethereum does not
solve the halting problem — it prices it. Every operation costs gas, the sender
sets a limit, and execution stops when the limit is reached.

The point most explanations skip: when a transaction runs out of gas, **the
state changes revert but the gas is not refunded**. The computation genuinely
happened on every node in the network, and they are being paid for the work,
not for the outcome. Failure that costs nothing would be a free denial of
service.

## What accounts actually buy

Shared, mutable, long-lived state that many parties modify — a contract's
storage. That is not expressible in a UTXO model, where each output is
independent and consumed whole. Every lending pool, exchange and token contract
depends on it.

And it is the same property that makes lesson 21 possible: if many parties
mutate one object, the order of the mutations becomes a security question.

## The escrow, both ways

Teodora's 2-of-3 with a 30-day refund is a short Script in bitcoin and about
twenty lines of Solidity in Ethereum. The Solidity version can do things the
script cannot — release partially, take a fee, be upgraded, emit events — and
each of those is also a thing that can be got wrong. Neither is the better
tool; the account model buys expressiveness and pays in attack surface.

## Sources

- Gavin Wood, *Ethereum: A Secure Decentralised Generalised Transaction Ledger* (the Yellow Paper) — https://ethereum.github.io/yellowpaper/paper.pdf
- ethereum.org, *Accounts* — https://ethereum.org/en/developers/docs/accounts/
- ethereum.org, *Gas and fees* — https://ethereum.org/en/developers/docs/gas/
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §9 — https://bitcoin.org/bitcoin.pdf
