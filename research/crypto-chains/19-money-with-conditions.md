# Brief — 19 Money with conditions

## What Script is

A stack language evaluated left to right. No loops, no recursion, no jumps
backwards — deliberately not Turing-complete, so every script's execution cost
is bounded by its length before it is run. An output's `scriptPubKey` states
the condition; a spender's input supplies the data that satisfies it.

The ordinary case, pay-to-public-key-hash:

```
OP_DUP OP_HASH160 <20-byte hash> OP_EQUALVERIFY OP_CHECKSIG
```

"Signature" is one condition among many. Nothing privileges it.

## Multisig, and the off-by-one

```
OP_2 <pubkey A> <pubkey B> <pubkey C> OP_3 OP_CHECKMULTISIG
```

`OP_CHECKMULTISIG` pops **one item more than it needs** — a bug from the first
implementation. Because consensus rules cannot be corrected without a fork, the
spender must push a dummy value, conventionally `OP_0`, for the operator to
throw away. It has been there since 2009 and will stay.

## Timelocks

- `nLockTime` — a transaction-level field: not valid before this height or time.
  A spender could always just not use it, so it constrains nothing on its own.
- **OP_CHECKLOCKTIMEVERIFY** (BIP-65) — puts the constraint in the *output*,
  where the receiver cannot ignore it. Absolute: "not before block N".
- **OP_CHECKSEQUENCEVERIFY** (BIP-112) — relative: "not until N blocks after
  this output was confirmed".

## P2SH (BIP-16)

Paying to a complicated script would make the sender responsible for getting it
right, and would make the address enormous. P2SH pays to the *hash* of a
script; the spender reveals the script and satisfies it. Teodora sends to a
short address; the complexity is her problem, not her label's bank's.

## The case

The escrow output has two spending paths:

1. any two of Teodora, Ines and Dragan sign; or
2. 30 days after funding, Teodora signs alone (`OP_CHECKSEQUENCEVERIFY`).

## The limit that matters

The script can check signatures and elapsed time. It cannot check whether the
master was delivered, or whether it was any good. Every dispute that matters is
outside what the machine can see, which is why the third key belongs to a
person and not to a rule. This is the oracle problem, and lesson 27 is about
it.

## Sources

- BIP-16, *Pay to Script Hash* — https://github.com/bitcoin/bips/blob/master/bip-0016.mediawiki
- BIP-65, *OP_CHECKLOCKTIMEVERIFY* — https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki
- BIP-112, *CHECKSEQUENCEVERIFY* — https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki
- Bitcoin developer reference, *Transactions — Script* — https://developer.bitcoin.org/reference/transactions.html
