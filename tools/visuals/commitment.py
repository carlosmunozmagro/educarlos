#!/usr/bin/env python3
"""Figures for lesson 02, committing to a secret.

Nora commits to the lowest price she will accept. Caleb commits to the highest
he will pay. Neither reveals until both are locked. The script shows how long
an unsalted commitment survives, and what a salt changes.

Run:  python3 tools/visuals/commitment.py
"""
import hashlib
import time

H = lambda b: hashlib.sha256(b).hexdigest()

NORA_FLOOR = 3900          # euros, whole
CALEB_CEILING = 4400
SALT = "b3f1c0a7d5e29148"  # 64 bits of Nora's randomness, hex

def main():
    bare = H(str(NORA_FLOOR).encode())
    print(f"unsalted commitment to {NORA_FLOOR}: {bare}")

    # The whole guess space: every whole-euro price from 1000 to 9999.
    t0 = time.perf_counter()
    found = None
    tried = 0
    for guess in range(1000, 10000):
        tried += 1
        if H(str(guess).encode()) == bare:
            found = guess
    ms = (time.perf_counter() - t0) * 1000
    print(f"brute force: {tried} candidates, recovered {found}, {ms:.1f} ms")
    print(f"rate: {tried / (ms / 1000):,.0f} candidates per second")

    salted = H((SALT + str(NORA_FLOOR)).encode())
    print(f"salted commitment  (salt {SALT}): {salted}")
    print(f"salted guess space: 9000 prices x 2^64 salts = {9000 * 2**64:.3e}")

    caleb = H((SALT[::-1] + str(CALEB_CEILING)).encode())
    print(f"caleb's commitment to {CALEB_CEILING}: {caleb}")

if __name__ == "__main__":
    main()
