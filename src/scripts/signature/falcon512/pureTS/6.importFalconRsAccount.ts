// Reuse an account created with the falcon-rs WASM (../accountKeys.json), now signing in pure TypeScript.
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/6.importFalconRsAccount.ts
// Coded with Starknet.js v11.0.2 + starknet-devnet

import fs from 'fs';
import { Account, CallData, Contract, hash, json, num } from 'starknet';
import { connectDevnet, FALCON_DIR, loadErc20Abi, loadFalconAccountClass, STRK_ADDRESS, toPkStruct } from './demoCommon';
import { Falcon512Signer } from './lib';

async function main() {
  // 🚨 run ../2.deployFalcon512.ts (falcon-rs WASM flow) on this devnet before this script.
  const { myProvider, account0 } = await connectDevnet();
  const accountData = json.parse(fs.readFileSync(`${FALCON_DIR}/accountKeys.json`).toString('ascii'));
  console.warn(
    '⚠️ Keys that already signed with the falcon-rs WASM may have leaked information (public sampler seed).\n' +
      '   Import is for continuity only: for real funds, deploy a new account with a new key (see pureTS/SECURITY.md).'
  );
  const falconSigner = Falcon512Signer.fromFalconRs(accountData.privKey);

  // *** the imported key must give the address of accountKeys.json
  const { sierra, classHash } = loadFalconAccountClass();
  const packedPubKey = falconSigner.getPackedPublicKey();
  const constructorCalldata = new CallData(sierra.abi).compile('constructor', { pk_packed: toPkStruct(packedPubKey) });
  const expectedAddress = hash.calculateContractAddressFromHash(packedPubKey[0], classHash, constructorCalldata, 0);
  const sameAddress = num.toBigInt(expectedAddress) === num.toBigInt(accountData.address);
  console.log('Address recomputed from the imported key matches accountKeys.json:', sameAddress);
  if (!sameAddress) throw new Error('Imported key does not match the account address');

  try {
    await myProvider.getClassHashAt(accountData.address);
  } catch {
    console.log('Account not deployed on this devnet: run ../2.deployFalcon512.ts (falcon-rs WASM flow) first.');
    process.exit();
  }

  // *** transfer, signed in pure TypeScript
  const falconAccount = new Account({ provider: myProvider, address: accountData.address, signer: falconSigner });
  const strkContract = new Contract({ abi: loadErc20Abi(), address: STRK_ADDRESS, providerOrAccount: falconAccount });
  const resp = await strkContract.withOptions({ skipValidate: false }).transfer(account0.address, 1n * 10n ** 10n);
  const txR = await myProvider.waitForTransaction(resp.transaction_hash);
  if (!txR.isSuccess()) {
    console.log(txR);
    throw new Error('Transfer failed');
  }
  console.log('✅ falcon-rs account used with the pure TypeScript signer.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
