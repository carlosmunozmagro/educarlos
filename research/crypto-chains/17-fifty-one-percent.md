# Brief — 17 Fifty-one percent

## What a majority actually buys

Control of hashrate is control of *which chain grows fastest*, and nothing
else. Concretely it can:

- **choose** which of two competing chains wins;
- **exclude** any transaction it likes, indefinitely (censorship);
- **reverse** recent blocks by publishing a longer alternative, which is how a
  double spend is monetised;
- **take every block reward and fee**, by orphaning everyone else's blocks.

It cannot:

- **sign** for a key it does not hold — hashrate is not a signing oracle, and
  no amount of it moves coins out of an address;
- **mint** coins outside the schedule — a block with an over-large coinbase is
  rejected by every full node whatever work backs it. The 2010 overflow (lesson
  08) is the exception that proves it: the *rule* was never in doubt, the
  arithmetic implementing it was;
- **rewrite deep history at reasonable cost** — a rewrite from depth `d`
  requires redoing `d` blocks of work while the honest chain keeps moving.

## The monetisation, step by step

1. Deposit coins at an exchange and wait for its confirmations.
2. Trade them for a different asset and withdraw that.
3. Publish the privately mined chain in which the deposit never happened.

The exchange is left holding nothing; the attacker keeps the withdrawal. Note
that the attack targets the *counterparty's* confirmation policy, not the
chain's cryptography.

## The real vulnerability: rented hashrate

Security is paid for by the block reward, so a chain's security budget is
roughly `reward × price`. But an attacker does not need to *own* hardware if
the chain shares a proof-of-work algorithm with a much larger one — the
hashrate can be rented for hours. A small chain running the big chain's
algorithm is cheap to attack no matter what its own budget is.

Documented cases:

- **Ethereum Classic, January 2019.** Reorganisations and double spends
  reported by exchanges; Coinbase's incident report put the amount in the
  region of a million dollars.
- **Ethereum Classic, August 2020.** Two further attacks within days,
  involving reorganisations thousands of blocks deep.
- **Bitcoin Gold, May 2018.** Double spends against exchanges, reported in the
  region of 18 million dollars, and attacked again in January 2020.

*Verification note:* the amounts and reorg depths above are from the affected
projects' and exchanges' public statements. Exact figures were **not**
re-verified in this session, so the lesson quotes them as orders of magnitude
("in the region of") and never to more precision than that. No URL is given for
the project statements because none was confirmed here — cite by title.

## Sources

- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §11 — https://bitcoin.org/bitcoin.pdf
- Ethereum Classic project statements on the January 2019 and August 2020 attacks
- Bitcoin Gold project statement on the May 2018 double-spend attack
