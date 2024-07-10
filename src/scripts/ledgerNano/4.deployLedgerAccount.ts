// Deploy an OpenZeppelin 0.14.0 account in devnet.
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, type Call, type InvokeFunctionResponse } from "starknet";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../utils/formatBalance";
import { ethAddress, strkAddress } from "../utils/constants";
import type { DeployAccountResp, DeployLedgerAccountResp } from "../utils/types";
dotenv.config();

export async function deployLedgerAccount(myProvider: RpcProvider, account0: Account, starkKeyPub: string): Promise<DeployLedgerAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

  //
  // *********** Deploy OpenZeppelin 0.14.0 account *************
  //

  // Generate public and private key pair.
  console.log('publicKey=', starkKeyPub);
  //declare OZ wallet contract
  const compiledOZAccount = json.parse(
    fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.sierra.json").toString("ascii")
  );
  const casmOZAccount = json.parse(
    fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.casm.json").toString("ascii")
  );
  const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZAccount, casm: casmOZAccount });
  console.log('OpenZeppelin account class hash =', decClassHash);
  if (declTH) { await myProvider.waitForTransaction(declTH); }

  // Calculate future address of the account
  const myCallData = new CallData(compiledOZAccount.abi);
  const constructor: Calldata = myCallData.compile(
    "constructor",
    {
      public_key: starkKeyPub,
    });
  const salt = stark.randomAddress();
  const addressDepl = hash.calculateContractAddressFromHash(ec.starkCurve.pedersen(account0.address, salt), decClassHash, constructor, constants.UDC.ADDRESS);
  console.log("address=", addressDepl);
  const myCall: Call = {

    contractAddress: constants.UDC.ADDRESS,
    entrypoint: constants.UDC.ENTRYPOINT,
    calldata: CallData.compile({
      classHash: decClassHash,
      salt: salt,
      unique: "1",
      calldata: constructor,
    }),
  };
  console.log("constructor =", constructor);
  console.log("Deploy of account in progress...");
  // *** with account.execute()
  const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]); // you can add other txs here

  console.log("TxH =", txHDepl);
  const txR = await myProvider.waitForTransaction(txHDepl);
  // fund account address before account creation
  await l2DevnetProvider.mint(addressDepl, 10 * 10 ** 18, "WEI");
  await l2DevnetProvider.mint(addressDepl, 10 * 10 ** 18, "FRI");

  console.log('✅ Ledger account deployed.');

  const result: DeployLedgerAccountResp = {
    address: addressDepl,
    classH: decClassHash,
    publicK: starkKeyPub,
  }
  return result;
}