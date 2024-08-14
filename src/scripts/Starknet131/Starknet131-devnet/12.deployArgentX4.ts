// Deploy an Account 0.4.0 account in devnet.
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import type { DeployAccountResp } from "../../utils/types";
dotenv.config();

export async function deployAccountArgentX4(myProvider: RpcProvider, account0: Account): Promise<DeployAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  //
  // *********** Deploy ArgentX 0.4.0 account *************
  //
  const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
  const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountAXsierra);
  console.log("Class Hash of ArgentX contract =", ch);

  // Calculate future address of the ArgentX account
  const privateKeyAX = stark.randomAddress();
  console.log('AX account Private Key =', privateKeyAX);
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  console.log('AX account Public Key  =', starkKeyPubAX);

  // declare
  console.log("casm_hash",hash.computeCompiledClassHash(accountAXcasm));
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
  const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, constructorAXCallData, 0);
  console.log('Precalculated account address=', accountAXAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAXAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAXAddress, 100n * 10n ** 18n, "FRI");

  // deploy ArgentX account
  const accountAX = new Account(myProvider, accountAXAddress, privateKeyAX);
  const deployAccountPayload = {
    classHash: contractAXclassHash,
    constructorCalldata: constructorAXCallData,
    contractAddress: accountAXAddress,
    addressSalt: starkKeyPubAX
  };
  const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload);
  console.log("Final address =", accountAXFinalAddress);
  await myProvider.waitForTransaction(AXdAth);
  console.log('✅ ArgentX 0.4.0 account deployed.');
  const result: DeployAccountResp = {
    account: accountAX,
    address: accountAXAddress,
    classH: ch,
    privateK: privateKeyAX,
    publicK: starkKeyPubAX,
  }
  return result
}
