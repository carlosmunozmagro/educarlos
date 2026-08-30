# Brief — 09 What the signature covers

## The digest is a copy of the transaction

`z` is not "the transaction id". It is a hash over a specially serialised copy
of the transaction, and a one-byte **sighash flag** appended to the signature
decides what that copy contains.

| Flag | Value | Covers |
|---|---|---|
| `SIGHASH_ALL` | `0x01` | every input and every output — the default, and what Caleb's wallet uses |
| `SIGHASH_NONE` | `0x02` | the inputs, and **no outputs at all** |
| `SIGHASH_SINGLE` | `0x03` | the inputs, and only the output at the same index as this input |
| `SIGHASH_ANYONECANPAY` | `0x80` | modifier: only *this* input, not the others |

Under `SIGHASH_ALL`, moving a single satoshi of Caleb's change to a different
address invalidates the signature. Under `SIGHASH_NONE` the outputs are not
committed to at all: anyone relaying it can redirect the whole amount. That is
the pair the lesson turns on.

## The self-reference problem

The signature ends up *inside* the transaction, so it cannot be part of what it
signs. Legacy bitcoin resolves this by emptying every input's script field
before hashing and substituting, for the input being signed, the locking script
of the output it spends.

## The SIGHASH_SINGLE bug

If an input's index is greater than or equal to the number of outputs, there is
no corresponding output to sign. Legacy signature hashing returns the digest
`0x0000...0001` — a constant. A signature over that constant commits to
nothing about the transaction and can be replayed. Known and documented; the
BIP-143 digest algorithm removes it for segwit inputs.

## BIP-143

Segwit v0 introduced a new digest algorithm. Two reasons, both worth naming:

1. **Correctness** — it fixes the `SIGHASH_SINGLE` constant-digest case and
   commits explicitly to the value of the input being spent, which legacy
   hashing did not. Not committing to the input amount meant an offline signer
   could be lied to about how much it was spending, and therefore about the
   fee.
2. **Cost** — legacy signature hashing rehashed the whole transaction once per
   input, which is `O(n^2)` in the number of inputs. BIP-143 precomputes
   shared midstates so it is linear.

## The limit

Even `SIGHASH_ALL` covers only the transaction. It says nothing about **when**
the payment happens, **which block** it lands in, or **what order** it takes
relative to a conflicting spend of the same input. Nothing a signature can do
addresses that, which is the whole reason chapter 3 exists.

## Sources

- BIP-143, *Transaction Signature Verification for Version 0 Witness Program* — https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
- BIP-141, *Segregated Witness* — https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
- Bitcoin developer reference, *Transactions* — https://developer.bitcoin.org/reference/transactions.html
