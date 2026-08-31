# Brief — 22 A token is a mapping

## What the standard actually specifies

EIP-20 defines an interface, not an object:

```
totalSupply()                       balanceOf(owner)
transfer(to, value)                 transferFrom(from, to, value)
approve(spender, value)             allowance(owner, spender)
events: Transfer, Approval
```

Behind it, the entire state of a token is two mappings inside one contract:

```
mapping(address => uint256) balances;
mapping(address => mapping(address => uint256)) allowed;
```

There is no token object anywhere. `transfer` decrements one row and
increments another and emits an event. A wallet showing you a balance is
calling `balanceOf` on that contract and displaying the number it returns.

## Consequences the lesson should draw

- **Your wallet does not contain tokens.** It contains a key. The balance lives
  in a table inside somebody else's contract, and the wallet is a viewer.
- **You cannot refuse a token.** Anyone may credit any address; there is no
  acceptance step. Unsolicited tokens appearing in a wallet are not a
  compromise, and interacting with them can be.
- **Tokens sent to a contract that does not handle them are stuck.** They are
  recorded as that contract's balance, and if it has no code to move them,
  nothing ever will. They are not burned — they are unreachable, which is
  worse, because they are still counted in the supply.

## The approve race, which is in the EIP itself

Changing an existing allowance from `N` to `M` is two states with a gap: a
spender watching the mempool can spend `N` before the change lands, then `M`
after, for `N + M` total. The standard notes it. The usual mitigations are
setting the allowance to zero first, or `increaseAllowance` /
`decreaseAllowance` helpers that were never part of EIP-20.

Related and more damaging in practice: **unlimited approvals**. Approving
`2^256 - 1` once is convenient and standard, and it means a contract that is
later compromised or upgraded can take the entire balance, not the amount you
were spending that day.

## The admin question

Nothing in EIP-20 forbids privileged functions, and major issued tokens have
them: minting, pausing, and address blacklists held by the issuer. Whether your
balance is yours is a property of that particular contract's code, not of the
standard, and not of the chain. This is the honest close of the lesson.

## Sources

- EIP-20, *Token Standard* — https://eips.ethereum.org/EIPS/eip-20
- ethereum.org, *ERC-20 Token Standard* — https://ethereum.org/en/developers/docs/standards/tokens/erc-20/
- ethereum.org, *Smart contract security* — https://ethereum.org/en/developers/docs/smart-contracts/security/
