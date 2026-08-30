# Brief — 15 The thermostat

## The rule

Every **2016 blocks**, every node independently recomputes the target:

```
actual   = timestamp[last] - timestamp[first]   of the 2016-block window
clamped  = min(max(actual, TARGET_SPAN / 4), TARGET_SPAN * 4)
new_target = old_target * clamped / TARGET_SPAN        (capped at the pow limit)

TARGET_SPAN = 14 * 24 * 60 * 60 = 1,209,600 seconds
```

Nobody runs this. There is no adjuster, no vote, no announcement — each node
derives the identical number from headers it already holds, which is why the
network stays in agreement about it without communicating about it at all.

`tools/visuals/retarget.py` runs the rule on four windows, one of which hits
the clamp.

## The off-by-one

The window spans blocks `n` to `n+2015`, and the timespan is the difference
between the **first and last** timestamps — which covers **2015 intervals**,
not 2016. So the network aims at

```
600 x 2015 / 2016  ~=  599.70 seconds
```

roughly **0.05% fast**. It has never been fixed, because correcting it is a
hard fork to remove a five-hundredth of a percent of error. One real
consequence: halvings, which are counted in blocks (every 210,000), arrive
slightly earlier than the "every four years" shorthand implies.

## The clamp, and what it costs

Limiting each adjustment to a factor of four bounds the damage from a
manipulated or freakish timespan. The price is that a large, sudden loss of
hashrate cannot be corrected quickly: blocks slow down, and the window that
would fix it now takes longer to complete.

**Mid-2021** is the clearest instance: after mining was banned in China,
hashrate fell sharply and the adjustment on **3 July 2021** cut difficulty by
about **28%** — the largest downward adjustment in bitcoin's history.

*Verification note:* that figure comes from the chain's own nBits history and
is widely reported, but was not re-derived from block data in this session.
The lesson states it as "about 28%" and as the largest on record; if it is ever
quoted more precisely, recompute it from the headers first.

## The time-warp attack

Because timestamps are only loosely bounded (lesson 11), a miner with majority
hashpower can backdate blocks so each window appears to have taken far longer
than it did, dragging difficulty down. It requires majority control, so on
bitcoin it is subsumed by lesson 17's larger problem; it has been proposed for
removal as part of a consensus-cleanup soft fork, which is not active.

## Why ten minutes

There is no derivation of it. It is a trade between confirmation latency and
the stale-block rate: blocks must propagate across the network in a small
fraction of the interval, or miners routinely build on headers that are already
obsolete and work is wasted. Ten minutes was a conservative choice, not a
computed optimum. Say that plainly rather than inventing a justification.

## Sources

- Bitcoin developer reference, *Block Chain* — https://developer.bitcoin.org/reference/block_chain.html
- Bitcoin Core, `src/pow.cpp` (`CalculateNextWorkRequired`) — https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, §4 — https://bitcoin.org/bitcoin.pdf
