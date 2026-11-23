# OpenZeppelin Falcon-512 accounts — test scripts

Post-quantum accounts of [OpenZeppelin Contracts for Cairo](https://github.com/OpenZeppelin/cairo-contracts)
v4.1.0-rc.0, driven by the `starknet/falcon` signer of starknet.js. One script per preset:

| Script | Preset | `accountType` | Signature | Class hash |
|---|---|---|---|---|
| [1.ozFalcon512HintAccount.ts](1.ozFalcon512HintAccount.ts) | `Falcon512ShakeAccountUpgradeable` | `'oz-hint'` | 60 felts | `0x014660ce3739fbde6e33d994cebd6a9fb20e800516b2e1b6c253d4d09baa9ae0` |
| [2.ozFalcon512DirectAccount.ts](2.ozFalcon512DirectAccount.ts) | `Falcon512ShakeDirectAccountUpgradeable` | `'oz-direct'` | 31 felts | `0x016111958d61eedfa5a950b608997abb4981b548f1862d620cc9247461ddeeb1` |

The classes in this folder (`oz_falcon512_*.json`) are the presets compiled unmodified with Scarb 2.21.0
(Cairo 2.21.0, Sierra 1.9.5). Both are declared on Sepolia and Mainnet. The two presets have the same ABI: nothing
on-chain tells the variant, so the signer always needs the right `accountType`.

A third script, [3.ozFalcon512MlKemMessage.ts](3.ozFalcon512MlKemMessage.ts), uses one account of each preset to send
a post-quantum encrypted message: see [Script 3](#script-3--post-quantum-encrypted-message).

## Requirements

- **starknet.js v11.8.0 or later**, the first release with the OpenZeppelin accounts (`accountType`,
  `signOwnershipAcceptance`). Older versions ignore `accountType` in plain JavaScript and sign in the S2morrow
  layout (61 felts), which an OZ account rejects. starknet.js v11 is published under the npm tag `next`:
  `npm install starknet@11.8.0`.
- **starknet-devnet v0.11.0** on `127.0.0.1:5050` with `--seed 0`, for the default network.

## Usage

```bash
npx ts-node src/scripts/signature/falcon512/OZfalcon512/1.ozFalcon512HintAccount.ts
npx ts-node src/scripts/signature/falcon512/OZfalcon512/2.ozFalcon512DirectAccount.ts
```

To change the network, uncomment the right `myNodeUrl` line and the matching payer-account block (`account0`), and
comment out the devnet ones. Devnet is the default. A devnet is detected with `DevnetProvider.isAlive()` (its chain
id, `SN_SEPOLIA`, does not tell it apart), then restarted, so that its predeployed accounts have Stark keys again.

## What each script does

1. Declares the account class if needed (`declareIfNot`), and checks the class hash.
2. Creates the Falcon key and computes the account address. The constructor takes `public_key: Array<felt252>`,
   so the calldata is `29` followed by the 29 felts of the packed key.
3. Tops up the account to 10 STRK from `account0`, then sends a DEPLOY_ACCOUNT signed by Falcon.
4. Transfers `10n ** 10n` fri of STRK to `account0`.
5. Changes the key. The current key signs the transaction, and the new key signs an acceptance
   (`signOwnershipAcceptance`) for `set_public_key`. The script then checks `get_public_key`, makes a transfer
   signed by the new key, and checks that the old key is refused.
6. On devnet only: migrates the predeployed account 1, a Stark account, to the Falcon class at the same address.
   - One transaction, signed by the Stark key, holds `upgrade(Falcon class)` then `set_public_key`. The acceptance
     is made with an empty current key (`[]`), since the Falcon key storage is still empty.
   - The script then checks the class and the key, makes a transfer signed by Falcon, and checks that the Stark key
     is refused.
7. Prints the fee actually paid by each transaction of the Falcon accounts (`actual_fee` of the receipt), and the
   totals.

Every transaction is sent with `{ skipValidate: false }`, so that the fee estimate made by starknet.js runs the
costly Falcon validation.

## Keys

- On devnet, a new key is created at each run and never saved.
- On the other networks, the account is kept in `ozFalcon512HintKeys.json` or `ozFalcon512DirectKeys.json`, one
  entry per chain. These files hold secret keys: they are listed in `.gitignore`, so keep a backup elsewhere.
- Before a key change, the new key is saved as `pendingSecretKey`. At the next run, the script keeps the stored key
  that matches `get_public_key`, so an interrupted run cannot lose the account.

## Results

Fees actually paid (STRK). Sepolia on 2026-11-19, Mainnet on 2026-11-23:

| Step | Hint — Sepolia | Hint — Mainnet | Direct — Sepolia | Direct — Mainnet |
|---|---|---|---|---|
| DEPLOY_ACCOUNT | 1.442 | 1.380 | 1.764 | 1.782 |
| Transfer (current key) | 0.912 | 0.918 | 1.236 | 1.248 |
| Key change (`set_public_key`) | 1.840 | 1.937 | 2.570 | 2.523 |
| Transfer (new key) | 0.909 | 0.918 | 1.236 | 1.248 |
| **Total** | **5.103** | **5.154** | **6.806** | **6.801** |

The same fees on Mainnet, in US$, at $0.03212 per STRK (CoinGecko, 2026-11-23, the day of the Mainnet
measurements):

| Step | Hint | Direct |
|---|---|---|
| DEPLOY_ACCOUNT | $0.044 | $0.057 |
| Transfer | $0.029 | $0.040 |
| Key change (`set_public_key`) | $0.062 | $0.081 |
| **Total** | **$0.166** | **$0.218** |

L2 gas of one STRK transfer, measured on starknet-devnet 0.11.0 (Starknet 0.14.4, the version of Sepolia and Mainnet
at the time). Unlike the fees, it does not depend on the gas price:

| Account | L2 gas per transfer | Ratio to S2morrow |
|---|---|---|
| S2morrow | 24,949,120 (always the same) | 1 |
| OZ with hint | 67,224,000 or 75,584,000 | 2.7 to 3.0 |
| OZ direct | 74,835,520 or 79,715,520 | 3.0 to 3.2 |

The L1 data gas is 192 for the three accounts, and the L1 gas is 0.

## Notes

- **The direct variant costs 22 to 40 % more than the hint one**, depending on the operation. The key change is
  the most expensive operation: it checks two Falcon signatures, the transaction and the acceptance.
- **The cost of an OZ account varies from one transaction to another.** Its SHAKE-256 hash-to-point discards part
  of its output and sometimes needs one more block. The Poseidon hash-to-point of S2morrow has a fixed cost.
- **Balance needed before a transaction.** The node checks that the balance covers the maximum fee declared by the
  transaction (the starknet.js estimate plus its margin), not the fee actually paid. On Sepolia, the DEPLOY_ACCOUNT
  asked for about 3.56 STRK while it paid 1.44 STRK, hence the 10 STRK top-up on every network.
- **Mainnet declaration.** In November 2026, Mainnet answered every DECLARE with "Transaction type is temporarily
  blocked" (RPC error 63). StarkWare declared the two classes.

## Script 3 — post-quantum encrypted message

Alice (account with hint) sends a text to Bob (direct account), encrypted with a key that only they share. Nothing
secret goes through the network: the key exchange uses ML-KEM-768 (FIPS 203), and each side signs its part with its
Falcon account.

- **Requirements**: starknet.js v11.9.0 or later, the first release with the `mlkem` functions of `starknet/falcon`
  (`npm install starknet@11.9.0`, npm tag `next`).
- **Usage**: `npx ts-node src/scripts/signature/falcon512/OZfalcon512/3.ozFalcon512MlKemMessage.ts`, with the same
  choice of network and payer account as scripts 1 and 2. A devnet is detected but not restarted: no key changes here.
- **Accounts**: declared and deployed if needed. Each one receives 6 STRK before its DEPLOY_ACCOUNT, its only paid
  transaction: the maximum fee of a DEPLOY_ACCOUNT is about 3.6 STRK with hint and 4.4 STRK direct, on Sepolia. On
  the other networks, the two accounts are kept in `ozFalcon512MlKemKeys.json`, listed in `.gitignore`.

Steps:

1. On-chain: the script reads the Falcon public keys of Alice and Bob (`get_public_key`). The `mlkem` functions read
   them again to check each signature.
2. Alice creates an ML-KEM-768 key (`mlkem.createKey`), valid for one hour, and signs it with her account (SNIP-12,
   60 felts). She keeps its 64-byte seed secret, and sends her address, the public key (1184 bytes), `validUntil` and
   her signature.
3. Bob checks the signature of Alice and makes a capsule (`mlkem.encapsulate`): he gets the shared secret and a
   capsule of 1088 bytes, which he signs (31 felts). He sends his address, the capsule, its timestamp and his
   signature.
4. Alice checks the signature of Bob and opens the capsule (`mlkem.decapsulate`): she gets the same 32-byte secret,
   which was never transmitted.
5. Alice encrypts a random Latin text of 3 lines with AES-256-GCM (`gcm` of `@noble/ciphers`). The shared secret is
   the key, and the nonce is 12 random bytes. She sends the nonce and the encrypted text: the text, then a 16-byte
   authentication tag.
6. Bob decrypts it with his copy of the secret.

The script checks that both sides hold the same secret and that Bob reads exactly the text of Alice. It also checks
two refusals: a capsule of Bob presented as sent by Alice (`mlkem.decapsulate`), and an encrypted text changed by one
bit (AES-GCM: "invalid tag").

Why AES-256-GCM: it is authenticated encryption, so Bob detects any change of the encrypted text. The shared secret
is already a 32-byte HKDF output bound to this exchange (chain, both addresses, ML-KEM key and capsule), so it serves
directly as the AES key. A random nonce is enough, since each ML-KEM key encrypts a single message.

Results on starknet-devnet 0.11.0 (2026-11-23): the DEPLOY_ACCOUNT paid 0.0885 STRK for Alice (hint) and 0.0924 STRK
for Bob (direct). The exchange itself costs nothing: only the deployments are transactions.

Limits:

- No forward secrecy: a leaked seed opens every capsule made for its key. Use short-lived keys, or one key per
  message.
- Refusing an old or replayed capsule is the job of the application: Bob signs its timestamp, but `decapsulate` does
  not check its age.
- Not tested yet on Sepolia or Mainnet.
