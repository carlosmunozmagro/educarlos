# Brief — 16 Nothing is ever final

## The model

Section 11 of the whitepaper treats the attacker's progress as a Poisson
process and computes the probability that, starting `z` blocks behind, they
ever catch up. `tools/visuals/confirmations.py` transcribes that calculation
and its `q = 0.1` column reproduces the paper's published table exactly:

| z | P(reversal), q = 10% |
|---|---|
| 0 | 1.0000000 |
| 1 | 0.2045873 |
| 2 | 0.0509779 |
| 3 | 0.0131722 |
| 4 | 0.0034552 |
| 5 | 0.0009137 |
| 6 | 0.0002428 |
| 10 | 0.0000012 |

Two things the lesson should draw out of this table:

1. **One confirmation is worth much less than people assume.** Against a 10%
   attacker it leaves a **1 in 5** chance of reversal — because the attacker
   has been mining privately since before the payment, so being "one block
   behind" is a small deficit, not a defeat.
2. **The decay is geometric.** Each further block divides the risk by roughly
   four at `q = 0.1`. Six confirmations is where the paper's own table crosses
   1 in 4,000, which is the entire origin of the "six confirmations"
   convention. It is a table entry, not a rule.

## The part the model leaves out

The calculation takes `q` as given. In practice the real question is economic:
would anyone assemble 10% of the world's hashrate to reverse a **0.05 BTC**
payment for a synthesiser? The cost of the attempt is unrelated to the size of
the payment, so the sensible policy is to scale confirmations with **value at
risk**, not to apply one number to everything. A café takes one confirmation
and is right to; an exchange crediting a large deposit takes many and is also
right.

Rosenfeld's *Analysis of hashrate-based double spending* (2014) extends the
whitepaper's model, including the case where the attacker starts mining before
the transaction is broadcast rather than after.

## Zero confirmations, and why it got worse

Accepting an unconfirmed transaction was always a risk; **BIP-125** made it
explicit. Opt-in Replace-by-Fee lets a sender broadcast a replacement for their
own unconfirmed transaction with a higher fee, and nodes will relay it in
preference. Anything not yet in a block is not "probably fine" — it is a
proposal the sender may withdraw.

## Resolution of the case

Nora waits for two confirmations, which against any plausible attacker on a
€4,150 sale is far past the point of diminishing returns, and ships the CS-30
on **16 March 2026**. Record this in CASES.md — it is where case A ends.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §11 — https://bitcoin.org/bitcoin.pdf
- BIP-125, *Opt-in Full Replace-by-Fee Signaling* — https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki
- Meni Rosenfeld, *Analysis of Hashrate-Based Double Spending*, 2014 — https://arxiv.org/abs/1402.2009
