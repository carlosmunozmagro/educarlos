# Brief — 26 The weakest link is the bridge

## What a bridge is, mechanically

There is no way to move a coin from one chain to another; the chains cannot see
each other. So a bridge locks the asset on chain A and mints a claim on chain
B. Somebody, or some committee, holds the lock and decides when the mint is
authorised.

That decision is off-chain. It is attested by a set of keys — a multisig, a
validator set, a group of "guardians" — and **that set is the security of the
bridge**, regardless of how strong either chain is.

```
security(bridge) = min( chain A, chain B, the committee )
```

and the third term is normally many orders of magnitude smaller than the other
two, while the value sitting behind it is concentrated in one place.

## The three the lesson names

- **Poly Network, August 2021** — roughly 611 million dollars, most of it
  subsequently returned by the attacker.
- **Wormhole, February 2022** — roughly 326 million dollars. A flaw in
  signature verification let the attacker forge a guardian-approved message and
  mint wrapped ether on Solana with nothing backing it.
- **Ronin, March 2022** — roughly 625 million dollars. The attacker obtained
  five of the nine validator keys needed to approve a withdrawal: four held by
  the operator, and a fifth through an approval the Axie DAO had granted during
  a period of high load and left in place afterwards.

In none of these did a chain misbehave. Every block was valid, every signature
verified, consensus held throughout.

*Verification note:* amounts, key counts and the Ronin allowlist detail come
from the projects' own public post-mortems. They were **not** re-verified in
this session, so the lesson gives them as approximate ("roughly", "in the
region of") and cites the statements by title rather than by URL.

## The framing to land

"Trustless bridge" is, in almost all current designs, marketing. A bridge
reintroduces exactly the custodian that the chain underneath it was built to
remove — and then concentrates every user's assets behind it. The largest
losses in the field's history are not cryptographic failures; they are
custodial failures wearing a chain's reputation.

## Sources

- Sky Mavis, post-mortem of the Ronin validator compromise, March 2022
- Wormhole, incident report on the February 2022 exploit
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §1 — https://bitcoin.org/bitcoin.pdf
