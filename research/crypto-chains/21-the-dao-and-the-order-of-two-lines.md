# Brief — 21 The DAO and the order of two lines

## What it was

The DAO was an investment fund with no directors: token holders voted on
proposals, and anyone who disagreed could "split" — leave with their share of
the ether. It raised **more than 12 million ETH** in the crowdsale that ended in
May 2016, worth roughly 150 million dollars at prices of the time, from
thousands of participants.

## The bug

The split path sent ether to the caller **before** reducing the caller's
recorded balance. In the EVM, sending ether to a contract address executes that
contract's code, so control passed to the attacker mid-function, at a moment
when the balance had been checked and not yet written.

The attacker's fallback called back into the same function. The check read the
same untouched balance and passed again. Repeat.

```
// the shape of it
require(balances[msg.sender] >= amount);   // check
msg.sender.call.value(amount)("");         // interaction  <- control leaves here
balances[msg.sender] -= amount;            // effect       <- never reached in time
```

The correct ordering is **checks, effects, interactions**: write the state
before handing control to anyone.

## The timeline

- **17 June 2016** — the drain begins; about **3.6 million ETH** is moved into a
  "child DAO". The Ethereum Foundation publishes *CRITICAL UPDATE Re: DAO
  Vulnerability* the same day.
- The child DAO carried the same **28-day** holding period as the original, so
  the attacker could not move the funds immediately. That window is the only
  reason there was a decision to make rather than a loss to absorb.
- **20 July 2016** — a hard fork at block **1,920,000** moves the funds to a
  recovery contract. Nodes that refused the fork continued the original chain,
  which is **Ethereum Classic** — the same chain attacked in lesson 17.

Documented after the fact in **EIP-779**.

## Two things the lesson must not get wrong

1. **Nothing in Ethereum failed.** The EVM executed the contract exactly as
   written. The bug was in one application's ordering of two statements.
2. **The fork was a human decision**, taken under time pressure, and it split
   the community permanently. "Code is law" was tested against 150 million
   dollars and did not survive contact.

## Why "just use transfer()" is stale advice

`transfer()` and `send()` forward only 2,300 gas, historically too little for a
recipient to re-enter. Gas costs were later repriced (EIP-1884 raised `SLOAD`
among others), which broke legitimate recipients that had relied on that
allowance. The durable fix is the ordering — and a reentrancy guard — not a gas
stipend.

Reentrancy is also not one bug: cross-function reentrancy (a different function
sharing the same state) and read-only reentrancy (a view function observed
mid-update by another contract) are both live categories.

## Sources

- Ethereum Foundation blog, *CRITICAL UPDATE Re: DAO Vulnerability*, 17 June 2016 — https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability
- EIP-779, *Ethereum DAO fork* — https://eips.ethereum.org/EIPS/eip-779
- ethereum.org, *Smart contract security* — https://ethereum.org/en/developers/docs/smart-contracts/security/
