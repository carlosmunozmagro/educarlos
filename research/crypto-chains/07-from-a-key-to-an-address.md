# Brief — 07 From a key to an address

## The pipeline (segwit v0, P2WPKH)

```
33-byte compressed public key
  -> SHA-256                      32 bytes
  -> RIPEMD-160                   20 bytes   ("HASH160", the witness program)
  -> bech32 encode, hrp "bc", witness version 0
  -> bc1q...                      42 characters
```

Values produced by `tools/visuals/address.py` from a fixed teaching key:

```
public key   021b6d5a0ee7...b9ca
SHA-256      5823ed873710...cccc
HASH160      862918540329bd33efce785a5deee773582d3759
address      bc1qsc53s4qr9x7n8m7w0pd9mmh8wdvz6d6e80rn8a   (42 chars)
typo at index 20 -> checksum rejects
```

The script asserts both that the address validates and that the one-character
mutation does not. The private key is a published teaching constant — the
lesson must say so, so nobody funds it.

## Why hash the key at all

1. **Length.** 20 bytes instead of 33, and it encodes to something a person can
   read across a phone screen.
2. **A second wall.** Until Nora *spends* from the address, the network has
   only `HASH160(pubkey)`. Her public key is not published, so a break of the
   elliptic-curve discrete log would not, on its own, reach an unspent output
   at a never-used address. That protection ends the moment she spends, which
   is the real argument against address reuse.

Two different hash functions, from different design families, so a structural
break in one does not immediately hand over the other.

## bech32 (BIP-173)

- Character set `qpzry9x8gf2tvdw0s3jn54khce6mua7l` — **1, b, i and o are absent**
  because they are the characters people confuse in handwriting and low-quality
  displays.
- Case-insensitive, but mixed case is invalid, so the checksum never has to
  cover case.
- The last 6 characters are a BCH checksum. BIP-173's stated guarantee: **any
  error affecting at most 4 characters is always detected**, and larger errors
  slip through with probability below 1 in 10^9.

## bech32m (BIP-350)

bech32 turned out to have a specific weakness: when the final data character is
`p`, inserting or deleting `q` characters immediately before it leaves the
checksum valid. Segwit v0 addresses have fixed lengths, so v0 was not exposed;
witness versions 1 and above (Taproot, BIP-341) use **bech32m**, which differs
only in the constant XORed into the checksum (`0x2bc830a3` instead of `1`).

## The limit

A checksum catches accidents. It does not catch substitution: clipboard-hijack
malware replaces the whole address with a different, perfectly valid one, and
every check passes. The defence there is comparing the address out of band, not
arithmetic. Say this plainly — it is the failure that actually costs people
money today.

## Sources

- BIP-173, *Base32 address format for native v0-16 witness outputs* — https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki
- BIP-350, *Bech32m format for v1+ witness addresses* — https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki
- BIP-141, *Segregated Witness* — https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
