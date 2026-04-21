# Signer for Falcon-512

Use of this quantum resistant signature : https://github.com/feltroidprime/s2morrow

## Usage

You can use this [signer](12.falcon512Signer.ts) with Starknet.js `Account` class.  
```ts
const seed = randomBytes(32);
const keyPair = falcon.keygen(seed) as { sk: Uint8Array, vk: Uint8Array };
const falcon512Signer = new Falcon512Signer(keyPair.sk, keyPair.vk);
const falcon512Account = new Account({ address, provider: myProvider, signer: falcon512Signer });
```
A script to declare the account contract in Devnet is [here](./1.declareFalcon512.ts)

A script to deploy a Falcon-512 account is [here](./2.deployFalcon512.ts)
And a script to execute a transfer of token from this account is [here](./3.useFalcon512Account.ts)

> [!TIP]
> As it's not a standard signature, to avoid overrun of fees, use the `skipValidate: false` option.
```ts
const respTransfer = await strkContract.withOptions({ skipValidate: false }).transfer(account0.address, 1n * 10n ** 10n);
```

