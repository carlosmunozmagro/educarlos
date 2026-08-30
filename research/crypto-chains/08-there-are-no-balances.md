# Brief — 08 There are no balances

## The model

Bitcoin stores **unspent transaction outputs**, not accounts. Each UTXO is an
amount plus a locking script. A transaction consumes whole outputs as inputs
and creates new ones. There is nowhere in the system that holds "Caleb's
balance" — a wallet computes that by scanning for outputs it can unlock.

The case, checked by `tools/visuals/utxo-split.py`:

```
in    0.0812              Caleb's only unspent output
out   0.05     to Nora
out   0.0309   change back to Caleb
fee   0.0003   = 0.0812 - 0.05 - 0.0309
```

**The fee is not a field.** No part of a bitcoin transaction states it. It is
whatever the inputs exceed the outputs by, and the miner claims it. That is the
number most explanations skip, and it is why forgetting the change output does
not throw an error — it just pays the entire remainder as fee.

## The sum rule, and the day it failed

Consensus requires `sum(inputs) >= sum(outputs)`. On **15 August 2010**, block
**74,638** contained a transaction with two outputs of roughly **92.2 billion
BTC** each. Summed in a signed 64-bit integer they overflowed to a negative
number, so the check passed. This is **CVE-2010-5139**, the value overflow
incident.

- Patched in hours; the fixed client rejected the block, and the honest chain
  overtook the bad one within about 19 hours.
- Worth stating plainly: the rule held, the *arithmetic implementing it* did
  not. The lesson should not present this as a design flaw in UTXOs.

## Two consequences worth a screen each

- **The coinbase exception.** Exactly one transaction per block has no inputs:
  the coinbase, which creates the subsidy plus the fees. Every other satoshi in
  existence traces back to one.
- **Change is a leak.** Caleb's 0.0309 goes to a fresh address of his own, but
  it appears in the same transaction as the payment, which is the basis of the
  clustering heuristics in lesson 23.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §9 — https://bitcoin.org/bitcoin.pdf
- Bitcoin developer reference, *Transactions* — https://developer.bitcoin.org/reference/transactions.html
- CVE-2010-5139, the value overflow incident — https://en.bitcoin.it/wiki/Common_Vulnerabilities_and_Exposures#CVE-2010-5139
