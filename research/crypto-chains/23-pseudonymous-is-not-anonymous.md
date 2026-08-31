# Brief — 23 Pseudonymous is not anonymous

## The two heuristics that do most of the work

From Meiklejohn et al., *A Fistful of Bitcoins* (IMC 2013) — the paper that
established this empirically rather than in principle:

1. **Common input ownership.** If a transaction spends several outputs, one
   entity almost certainly controls all of them, because it had to sign for each.
   Repeated across the chain, this merges addresses into clusters.
2. **Change identification.** One output is usually change returning to the
   sender. Tells include: an address never seen before that is later spent by
   the same cluster; a non-round amount beside a round one; an output whose
   script type matches the inputs when the other does not.

Neither is certain. Both are right often enough that clusters converge, and a
single link to a real name — a KYC exchange deposit, a published donation
address, a paid invoice — colours the whole cluster.

## Why this is worse than an ordinary privacy leak

The chain is **permanent and public**. An analysis technique invented in 2032
applies to a payment made in 2026, and there is no way to withdraw the data. It
is the only surveillance dataset that is complete, retroactive, and free.

Nakamoto anticipated exactly this: §10 of the whitepaper recommends a new key
pair for every transaction, and notes that multi-input transactions
"necessarily reveal that their inputs were owned by the same owner". The
privacy model was documented as fragile from the start; the practice drifted.

## The case

Teodora publishes one address on the label's site so listeners can pay for
records directly. That address is her name. Every payment she later makes out
of those funds — the mastering escrow, the pressing plant, her own rent —
joins a cluster the site already labelled.

The mistake is not the payment. It is address reuse plus a public label.

## Mitigations, honestly stated

- **A fresh address per payment.** The single most effective thing, free, and
  supported by every wallet since BIP-32.
- **CoinJoin** and similar: many participants in one transaction, breaking the
  common-input assumption by making it false.
- **Taproot (BIP-341)** helps indirectly: cooperative spends of complex scripts
  look identical to ordinary ones, so script type stops being a fingerprint.
- None of it removes what is already published.

## Sources

- Meiklejohn, Pomarole, Jordan, Levchenko, McCoy, Voelker, Savage, *A Fistful of Bitcoins*, IMC 2013 — https://cseweb.ucsd.edu/~smeiklejohn/files/imc13.pdf
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §10 — https://bitcoin.org/bitcoin.pdf
- BIP-341, *Taproot: SegWit version 1 spending rules* — https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
