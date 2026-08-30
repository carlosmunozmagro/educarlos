# Brief — 04 The one-way street

## Curve parameters (SEC 2 v2 §2.4.1)

secp256k1 is `y^2 = x^3 + ax + b` over `F_p` with:

```
p = 2^256 - 2^32 - 977
a = 0
b = 7
h = 1          (cofactor - every point is in the prime-order group)
n ~ 1.158 x 10^77
```

The cofactor of 1 is worth a clause: on curves with `h > 1` there are small
subgroups a careless implementation can be pushed into. secp256k1 has none,
which removes a whole class of implementation bug.

## The drawn figure

`tools/visuals/curve-scatter.py` plots the *same equation*, `y^2 = x^3 + 7`,
over `p = 97`. Output of the run the lesson quotes:

```
78 affine points, plus the point at infinity   (group order 79, prime)
G  = (1, 28)
2G = (68, 81)
3G = (53, 38)
4G = (67, 19)
```

The teaching point is visible without any maths: `2G` is nowhere near `G`.
Consecutive multiples scatter. Over a 256-bit prime the same scattering holds,
which is exactly why knowing `Q = dG` says nothing about the size of `d`.

## Cost, both directions

- **Forwards.** Double-and-add: at most 256 doublings and 256 additions for a
  256-bit scalar, so a few hundred field operations. Microseconds.
- **Backwards.** The elliptic-curve discrete logarithm problem. The best known
  generic attack is Pollard's rho at `O(sqrt(n))`, i.e. about `2^128` group
  operations for secp256k1. No sub-exponential algorithm is known for
  well-chosen curves — unlike integer factorisation, where index calculus
  applies. That difference is why 256-bit EC keys stand in for 3072-bit RSA.

## Public key encoding (SEC 1 v2 §2.3.3)

- Uncompressed: `04 || x || y`, 65 bytes.
- Compressed: `02 || x` if `y` is even, `03 || x` if odd — 33 bytes. The curve
  equation gives `y^2` from `x`, so only the parity is missing.

## The limit

Grover's algorithm gives a quadratic speed-up against hash pre-images: SHA-256
drops to roughly `2^128` work, which is survivable. Shor's algorithm solves the
discrete logarithm in polynomial time, which is not — the ECDLP is not
weakened, it is removed. NIST published the replacements in **August 2024**:
FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA). Bitcoin has not
adopted any of them; that is a live design question, not a settled one, and
the lesson should say so without predicting a date.

## Sources

- SEC 1 v2, *Elliptic Curve Cryptography* — https://www.secg.org/sec1-v2.pdf
- SEC 2 v2, *Recommended Elliptic Curve Domain Parameters* — https://www.secg.org/sec2-v2.pdf
- NIST FIPS 204, *Module-Lattice-Based Digital Signature Standard*, August 2024 — https://csrc.nist.gov/pubs/fips/204/final
- Peter Shor, *Algorithms for Quantum Computation: Discrete Logarithms and Factoring*, FOCS 1994
