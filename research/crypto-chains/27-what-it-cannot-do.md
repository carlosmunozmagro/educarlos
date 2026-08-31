# Brief — 27 What it cannot do

The closing lesson. Its job is to state the boundary precisely and fairly, and
to resolve case B.

## The exact claim

A chain can establish, to a very high standard:

- that a message was signed by the holder of a particular key;
- that one record came before another, with no referee deciding it;
- that nothing has changed since, and that any change would be evident.

It cannot establish, ever, by any construction:

- that what was written was **true when it was written**.

Every mechanism in this course lives on the first list. Nothing on the second
list becomes reachable by making the first list stronger — better hashing,
faster finality and cheaper blocks all leave it exactly where it is.

## Why the oracle "solution" is not one

An oracle is a party that writes external facts on-chain. Whoever writes them
is trusted about them; the chain's guarantee begins *after* the write. You can
decentralise an oracle into a committee with stake at risk, which is a real
improvement and is not the same thing as removing the trust — and lesson 26 is
about what happens to committees holding concentrated value.

State this without sneering: oracles are a reasonable engineering answer to an
unavoidable problem. They are just not a solution to it in the sense people
usually mean.

## Where this bites in practice

- **Land registry.** An immutable record of a fraudulent registration is a
  permanent fraudulent record, and harder to correct than a paper one.
- **Provenance.** "Organic", "conflict-free", "made in" — somebody scanned a
  box. The chain preserves the scan, not the contents.
- **Teodora's escrow.** The script checks signatures and elapsed blocks. Dragan
  is there because whether six tracks were properly mastered is not a question
  any machine can be given.

Garbage in is worse here than elsewhere, because the output is permanent and
carries an unearned air of authority.

## What it did achieve, stated fairly

Narrow and real: ordering with no referee, tamper-evidence that is cheap to
check, bearer assets with no custodian, and settlement that does not ask
permission. Chapters 1 to 4 are how each of those was bought, and chapter 5 is
what each cost.

## Resolving case B

Ines delivers the masters on **19 May 2026**, fifteen days into the thirty. She
and Teodora both sign; the 0.012 BTC is released. Dragan is never contacted and
does not know the transaction happened. Record it in CASES.md: the escrow
worked, and the sign it worked is that the interesting path was never taken.

## Sources

- Nick Szabo, *Formalizing and Securing Relationships on Public Networks*, First Monday 2(9), 1997 — https://firstmonday.org/ojs/index.php/fm/article/view/548
- ethereum.org, *Oracles* — https://ethereum.org/en/developers/docs/oracles/
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §1 — https://bitcoin.org/bitcoin.pdf
