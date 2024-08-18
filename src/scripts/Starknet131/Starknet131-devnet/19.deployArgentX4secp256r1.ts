// Deploy an ArgentX 0.4.0 account using secp256r1 signature (NIST P256)
// Launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/19.deployArgentX4secp256r1.ts
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.2 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, type Call } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import type { DeployAccountResp } from "../../utils/types";
import { ArgentP256Signer, p256RandomPrivateKey } from "../../signature/15.signerArgentSecp256r1";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

export async function deployAccountArgentX4secp256r1(myProvider: RpcProvider, account0: Account): Promise<DeployAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  //
  // *********** Deploy ArgentX 0.4.0 account *************
  //
  console.log("start");
  const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
  const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountAXsierra);
  console.log("Class Hash of ArgentX contract =", ch);
  console.log("casm_hash                      =", hash.computeCompiledClassHash(accountAXcasm));

  // Calculate future address of the ArgentX account
  const privateKeyAX = p256RandomPrivateKey();
  // 0x19103d5c83a54c9aa68a07dbd06ce81e52594608d2786498fa9f76fe941a31d8
  // 0x19103d5c83a54c9aa68a07dbd06ce81e52594608d2786498fa9f76fe941a31d8
  0x3466163efeac3a53d2a63ea5ccf3626b098d7ecb7b2fa95f2a14281b35ea06ab
  console.log('AX account Private Key =', privateKeyAX);
  const myP256Signer = new ArgentP256Signer(privateKeyAX);
  const tmpPub = await myP256Signer.getPubKey();
  const p256PubAX = tmpPub;
  console.log('AX account Public Key  =', p256PubAX);

  // declare
  const respDecl = await account0.declareIfNot({ contract: accountAXsierra, casm: accountAXcasm });
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX Cairo 1 contract declared");
  } else { console.log("Already declared.") };

  const contractAXclassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
  //const contractAXclassHash=respDecl.class_hash;
  const calldataAX = new CallData(accountAXsierra.abi);
  const axSigner = new CairoCustomEnum({ Secp256r1: { pubkey: cairo.uint256(p256PubAX) } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
  const constructorAXCallData = calldataAX.compile("constructor", {
    owner: axSigner,
    guardian: axGuardian
  });
  console.log("constructor =", constructorAXCallData);
  // const salt=stark.randomAddress();
  const salt = num.toHex(BigInt(p256PubAX) & constants.MASK_250);
  console.log({ salt });
  const accountAXAddress = hash.calculateContractAddressFromHash(
    salt,
    contractAXclassHash,
    constructorAXCallData,
    0
  );
  console.log('Precalculated account address=', accountAXAddress);
  // fund account address before account creation
  await l2DevnetProvider.mint(accountAXAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAXAddress, 100n * 10n ** 18n, "FRI");

  // deploy ArgentX account
  const accountAX = new Account(myProvider, accountAXAddress, myP256Signer);
  const deployAccountPayload = {
    classHash: contractAXclassHash,
    constructorCalldata: constructorAXCallData,
    contractAddress: accountAXAddress,
    addressSalt: salt
  };
  const estimation = await accountAX.estimateAccountDeployFee(deployAccountPayload);
  console.log("Estimate =", estimation);
  const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload,{maxFee: estimation.suggestedMaxFee * 5n}); // super extra fee needed
  console.log("Final address =", accountAXFinalAddress);
  await myProvider.waitForTransaction(AXdAth);
  console.log('✅ ArgentX 0.4.0 account deployed.');
  const result: DeployAccountResp = {
    account: accountAX,
    address: accountAXAddress,
    classH: ch,
    privateK: privateKeyAX,
    publicK: p256PubAX,
  }
  return result
}
