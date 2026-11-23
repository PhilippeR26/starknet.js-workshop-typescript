# Cairo 0 accounts in the sequencer "v1-bound" list

The Starknet sequencer accepts only V3 transactions. Some old accounts accept only transactions of version 1. To keep them usable, the sequencer has a fixed list of these Cairo 0 classes: `v1_bound_accounts_cairo0`.

This list does not allow or block accounts. A Cairo 0 account that is not in the list can still send V3 transactions, if its code accepts version 3. Example: the OpenZeppelin Cairo 0 account v0.6.1 accepts any version ≥ 1.

| # | class hash | origin | in the list since |
| --- | --- | --- | --- |
| 1 | 0x6d706cfbac9b8262d601c38251c5fbe0497c3a96cc91a92b08d91b61d9e70c4 | Unknown wallet. Account with a signer and a guardian. `get_version` returns `0.2.0`. | Starknet 0.13.5 |
| 2 | 0x309c042d3729173c7f2f91a34f04d8c509c1b292d334679ef1aabf8da0899cc | OKX Cairo 0 account (same ABI as ArgentX 0.2.3.x) | Starknet 0.13.5 |
| 3 | 0x1a7820094feaf82d53f53f214b81292d717e7bb9a92bb2488092cd306f3993f | ArgentX (now Ready) 0.2.3 | Starknet 0.13.5 |
| 4 | 0x33434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2 | ArgentX (now Ready) 0.2.3.1 | Starknet 0.13.5 |
| 5 | 0x41cb0280ebadaa75f996d8d92c6f265f6d040bb3ba442e5f86a554f1765244e | Paradex account (same ABI as ArgentX 0.2.3.x) | Starknet 0.14.0 |
| 6 | 0x3530cc4759d78042f1b543bf797f5f3d647cde0388c33734cf91b7f7b9314a9 | Cairo 0 proxy of the Paradex and OKX accounts | Starknet 0.14.0 |

All 6 classes are Cairo 0 classes on Starknet mainnet. The list is the same from Starknet 0.14.0 to Starknet 0.14.5.

## What the sequencer does

- For a V3 transaction, if the class that runs the code is in the list, the `get_tx_info` syscall returns version 1 instead of 3. The old account code then accepts the transaction.
- In a proxy account, the class that runs the code is the implementation class (called with `library_call`), not the proxy class. So the ArgentX Cairo 0 proxy `0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918` is not in the list, and does not need to be.
- This works only if the transaction tip is lower than or equal to `0x746a5288000` (8 × 10^12). With a higher tip, the account sees version 3.
- ArgentX 0.2.3.1 checks the version in `__execute__`, not in `__validate__`. So if the account sees version 3, the transaction passes the validation, then reverts: the fees are paid.
- The gateway validators do not check the account class.
- The sequencer has the same list for 7 Cairo 1 classes (`v1_bound_accounts_cairo1`). Example: ArgentX 0.3.0 `0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003`.

## Check an account

1. Read the class hash of the account: `provider.getClassHashAt(address)`.
2. If this class is a proxy, call `get_implementation` on the account, and use the result.
3. Compare this class hash with the list.

A fee estimation of a V3 transaction is the final test: the node runs the same rules as the sequencer (checked with Juno).

## Checked on 2026-10-22

- Sequencer code at commit [`ff40811`](https://github.com/starkware-libs/sequencer/tree/ff40811bdca5769d36d6233cc2b52634205d0dbb).
- Mainnet node (Starknet 0.14.4), with the account `0x3ec215c6c9028ff671b46a2a9814970ea23ed3c4bcc3838c6d1dcbf395263c3` (class #1 behind the proxy `0x46f844ea1a3b3668f81d38b5c1bd55e816e0373802aefe732138628f0133486`). A fee estimation of a V3 transaction (flag `SKIP_VALIDATE`, empty `__execute__`) succeeds with tip 0. It fails on the version check with tip `0x746a5288001`.

## Sources

- List: [blockifier_versioned_constants_0_14_5.json](https://github.com/starkware-libs/sequencer/blob/ff40811bdca5769d36d6233cc2b52634205d0dbb/crates/blockifier/resources/blockifier_versioned_constants_0_14_5.json#L204-L221)
- Starknet OS: [account_backward_compatibility.cairo](https://github.com/starkware-libs/sequencer/blob/ff40811bdca5769d36d6233cc2b52634205d0dbb/crates/apollo_starknet_os_program/src/cairo/starkware/starknet/core/os/execution/account_backward_compatibility.cairo#L32-L63), [deprecated_execute_syscalls.cairo](https://github.com/starkware-libs/sequencer/blob/ff40811bdca5769d36d6233cc2b52634205d0dbb/crates/apollo_starknet_os_program/src/cairo/starkware/starknet/core/os/execution/deprecated_execute_syscalls.cairo#L203-L227)
- Blockifier: [hint_processor.rs](https://github.com/starkware-libs/sequencer/blob/ff40811bdca5769d36d6233cc2b52634205d0dbb/crates/blockifier/src/execution/deprecated_syscalls/hint_processor.rs#L311-L349)
- V3 only: [rpc_transaction.rs](https://github.com/starkware-libs/sequencer/blob/ff40811bdca5769d36d6233cc2b52634205d0dbb/crates/starknet_api/src/rpc_transaction.rs#L328-L331)
- ArgentX 0.2.3.1: [assert_correct_tx_version](https://github.com/argentlabs/argent-contracts-starknet/blob/v0.2.3.1/contracts/account/library.cairo#L141-L146), [call in `__execute__`](https://github.com/argentlabs/argent-contracts-starknet/blob/v0.2.3.1/contracts/account/ArgentAccount.cairo#L130)
- OpenZeppelin Cairo 0 v0.6.1: [version check](https://github.com/OpenZeppelin/cairo-contracts/blob/v0.6.1/src/openzeppelin/account/library.cairo#L189-L192)
- Origins: [Argent-X class hashes](https://github.com/argentlabs/argent-x/blob/HEAD/packages/extension/src/shared/account/starknet.constants.ts), [OKX class hashes](https://github.com/okx/go-wallet-sdk/blob/HEAD/coins/starknet/account_constants.go), Paradex `GET https://api.prod.paradex.trade/v1/system/config` (`paraclear_account_hash`, `paraclear_account_proxy_hash`)
