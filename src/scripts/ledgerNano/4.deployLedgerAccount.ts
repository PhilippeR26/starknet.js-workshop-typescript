// library for script 5.
// Deploy a Ledger ArgentX v0.4.0 account in devnet.
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.1.0

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, type Call, type InvokeFunctionResponse } from "starknet";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../utils/formatBalance";
import { ethAddress, strkAddress } from "../utils/constants";
import type { DeployAccountResp, DeployLedgerAccountResp } from "../utils/types";
dotenv.config();

export function calculateAccountAddress(starkKeyPubAX: BigNumberish, executorAddress: string, salt: BigNumberish): string {
  const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
  const contractAXclassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
  //const contractAXclassHash=respDecl.class_hash;
  const calldataAX = new CallData(accountAXsierra.abi);
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
  const constructorAXCallData = calldataAX.compile("constructor", {
    owner: axSigner,
    guardian: axGuardian
  });
  console.log("constructor =", constructorAXCallData);
  const accountAXAddress = hash.calculateContractAddressFromHash(ec.starkCurve.pedersen(executorAddress, salt), contractAXclassHash, constructorAXCallData, constants.UDC.ADDRESS);
  console.log('Precalculated account address=', accountAXAddress);
  return accountAXAddress;
}

export async function deployLedgerAccount(myProvider: RpcProvider, account0: Account, starkKeyPub: string, salt: BigNumberish): Promise<DeployLedgerAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

  //
  // *********** Deploy ArgentX v0.4.0 account *************
  //

  const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
  const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountAXsierra);
  console.log("Class Hash of ArgentX contract =", ch);

  // Calculate future address of the ArgentX account
  const starkKeyPubAX = starkKeyPub;
  console.log('AX account Public Key  =', starkKeyPubAX);

  // declare
  console.log("casm_hash", hash.computeCompiledClassHash(accountAXcasm));
  const respDecl = await account0.declareIfNot({ contract: accountAXsierra, casm: accountAXcasm });
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX Cairo 1 contract declared");
  } else { console.log("Already declared.") };

  const contractAXclassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
  //const contractAXclassHash=respDecl.class_hash;
  const calldataAX = new CallData(accountAXsierra.abi);
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
  const constructorAXCallData = calldataAX.compile("constructor", {
    owner: axSigner,
    guardian: axGuardian
  });
  console.log("constructor =", constructorAXCallData);
  const accountAXAddress = hash.calculateContractAddressFromHash(ec.starkCurve.pedersen(account0.address, salt), contractAXclassHash, constructorAXCallData, constants.UDC.ADDRESS);
  console.log('Precalculated account address=', accountAXAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAXAddress, 20n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAXAddress, 100n * 10n ** 18n, "FRI");

  // deploy ArgentX account
  const myCall: Call = {
    contractAddress: constants.UDC.ADDRESS,
    entrypoint: constants.UDC.ENTRYPOINT,
    calldata: CallData.compile({
      classHash: contractAXclassHash,
      salt: salt,
      unique: "1",
      calldata: constructorAXCallData,
    }),
  };
  console.log("Deploy of account in progress...");
  // *** with account.execute()
  const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]); // you can add other txs here

  console.log("TxH =", txHDepl);
  const txR = await myProvider.waitForTransaction(txHDepl);
  console.log('✅ Ledger ArgentX 0.4.0 account deployed.');
  const result: DeployLedgerAccountResp = {
    address: accountAXAddress,
    classH: ch,
    publicK: starkKeyPubAX,
  }
  return result
}

// // Calculate future address of the account
// const myCallData = new CallData(compiledOZAccount.abi);
// const constructor: Calldata = myCallData.compile(
//   "constructor",
//   {
//     public_key: starkKeyPub,
//   });
// const salt = stark.randomAddress();
// const addressDepl = hash.calculateContractAddressFromHash(ec.starkCurve.pedersen(account0.address, salt), decClassHash, constructor, constants.UDC.ADDRESS);
// console.log("address=", addressDepl);
// const myCall: Call = {

//   contractAddress: constants.UDC.ADDRESS,
//   entrypoint: constants.UDC.ENTRYPOINT,
//   calldata: CallData.compile({
//     classHash: decClassHash,
//     salt: salt,
//     unique: "1",
//     calldata: constructor,
//   }),
// };
// console.log("constructor =", constructor);
// console.log("Deploy of account in progress...");
// // *** with account.execute()
// const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]); // you can add other txs here

// console.log("TxH =", txHDepl);
// const txR = await myProvider.waitForTransaction(txHDepl);
