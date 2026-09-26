// Deploy a S2morrow Falcon-512 account with a DEPLOY_ACCOUNT transaction signed in pure TypeScript.
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/2.deployFalcon512.ts
// Coded with Starknet.js v11.0.2 + starknet-devnet

import { bytesToHex } from '@noble/hashes/utils.js';
import { Account, CallData, Contract, hash, validateAndParseAddress } from 'starknet';
import { connectDevnet, loadErc20Abi, loadFalconAccountClass, saveAccount, STRK_ADDRESS, toPkStruct } from './demoCommon';
import { Falcon512Signer, generateKeyPair } from './lib';

async function main() {
  // 🚨 launch script 1 before this script.
  const { myProvider, account0 } = await connectDevnet();
  const { sierra, classHash } = loadFalconAccountClass();
  try {
    await myProvider.getClassByHash(classHash);
  } catch {
    console.log('Falcon-512 account class not declared: run script 1 first.');
    process.exit();
  }

  // *** keys, fully in TypeScript
  console.time('keygen');
  const { secretKey, publicKey } = generateKeyPair();
  console.timeEnd('keygen');
  const falconSigner = new Falcon512Signer(secretKey);
  const packedPubKey = falconSigner.getStarknetPublicKey(); // 29 felt252

  // *** future address of the account
  const constructorCalldata = new CallData(sierra.abi).compile('constructor', { pk_packed: toPkStruct(packedPubKey) });
  const addressSalt = packedPubKey[0];
  const accountAddress = hash.calculateContractAddressFromHash(addressSalt, classHash, constructorCalldata, 0);
  console.log('Pre-calculated account address =', accountAddress);

  // *** fund the future address (10 STRK)
  const strkContract = new Contract({ abi: loadErc20Abi(), address: STRK_ADDRESS, providerOrAccount: account0 });
  const respTransfer = await strkContract.transfer(accountAddress, 10n * 10n ** 18n);
  await myProvider.waitForTransaction(respTransfer.transaction_hash);
  console.log('Funded with 10 STRK.');

  // *** DEPLOY_ACCOUNT, signed with Falcon-512 (skipValidate: false to estimate the real validation cost)
  const falconAccount = new Account({ provider: myProvider, address: accountAddress, signer: falconSigner });
  console.time('deployAccount');
  const { transaction_hash, contract_address } = await falconAccount.deployAccount(
    { classHash, constructorCalldata, addressSalt, contractAddress: accountAddress },
    { skipValidate: false }
  );
  const txR = await myProvider.waitForTransaction(transaction_hash);
  console.timeEnd('deployAccount');
  if (!txR.isSuccess()) {
    console.log(txR);
    throw new Error('Deploy account failed');
  }
  saveAccount({
    address: contract_address,
    secretKey: '0x' + bytesToHex(secretKey),
    publicKey: '0x' + bytesToHex(publicKey),
  });
  console.log('✅ Falcon-512 account deployed at', validateAndParseAddress(contract_address));
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
