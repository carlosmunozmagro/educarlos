# Running cases — crypto-chains

The established facts of the cases that run through this course. Read before
writing a lesson; update after. Contradicting a figure recorded here is worse
than starting a fresh case.

---

## Case A — the CS-30 payment (chapters 1 and 2)

**Nora Almeida** restores vintage synthesisers in a ground-floor workshop in
Lisbon. She has done it for eleven years, alone, and sells maybe forty
instruments a year. She is not a cryptographer and has no interest in becoming
one; she keeps a paper ledger and distrusts anything she cannot check.

**Caleb Oyelaran** collects modular gear in Toronto. He and Nora have never met
and never will. They have exchanged eighteen emails.

| Fact | Value |
|---|---|
| The instrument | A Yamaha CS-30, restored, listed at **€4,200** |
| Price they settle on | **€4,150**, agreed by sealed commitment in lesson 02 |
| Agreed settlement | **0.05 BTC** — Caleb's suggestion, and Nora's discomfort |
| The date they agree | **14 March 2026** |
| Caleb's wallet holds | a single unspent output of **0.0812 BTC** |
| The payment splits into | **0.05** to Nora, **0.0309** change to Caleb, **0.0003** fee |
| Nora's address | `bc1qsc53s4qr9x7n8m7w0pd9mmh8wdvz6d6e80rn8a` — derived for real by `tools/visuals/address.py`, from a teaching key, not a wallet |
| The block it lands in | referred to as "the block", height never stated |

Arithmetic that must hold everywhere: `0.05 + 0.0309 + 0.0003 = 0.0812`.

**Do not** give Caleb a second UTXO, change the fee, or state a BTC/EUR exchange
rate anywhere. €4,150 and 0.05 BTC are both established facts of the case; the
rate that connects them is deliberately never asserted, because asserting it
would date the course.

### Where the case has been used

| Lesson | What it did there |
|---|---|
| 02-committing-to-a-secret | Nora and Caleb agree a price by sealed commitment before either reveals a number |
| 03-where-a-key-comes-from | Nora's wallet generates the 256 bits that will receive the payment |
| 04-the-one-way-street | that private key becomes a public key she can hand to Caleb |
| 05-what-a-signature-proves | Caleb signs; Nora verifies without ever holding his key |
| 06-the-number-that-leaked-a-console | Caleb's wallet almost signs twice with one nonce (the PS3 story carries the real failure) |
| 07-from-a-key-to-an-address | Nora's mistyped address, and the checksum that rejects it |

## Real failures used as anchors

These are not the case — they are documented events the case leans on. Keep the
dates right.

| Event | Date | Used in |
|---|---|---|
| fail0verflow present the PS3 ECDSA key recovery at 27C3 | 29 December 2010 | 06 |
| Android `SecureRandom` weakness, Bitcoin.org advisory | 11 August 2013 | 03, 06 |
| RFC 6979, deterministic ECDSA nonces, published | August 2013 | 06 |
