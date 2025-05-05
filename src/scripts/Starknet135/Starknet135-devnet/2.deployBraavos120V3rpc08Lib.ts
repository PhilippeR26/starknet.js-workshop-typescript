// Test deploy Braavos account v1.2.0 with a transaction rpc 0.8 v3
// Coded with Starknet.js v7.1.0 & devnet-rs v0.3.0 (rpc0.8) & starknet-devnet.js v0.2.2

import { RpcProvider, Account, ec, json, stark, CallData, hash, type BigNumberish, constants } from "starknet";
import { deployBraavosAccount, calculateAddressBraavos, estimateBraavosAccountDeployFee } from "../../braavos/3g.deployBraavos120v3rpc08";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import type { DeployAccountResp } from "../../utils/types";
import { ETransactionVersion } from "@starknet-io/types-js";
import axios from "axios";
dotenv.config();


export async function deployAccountBraavos(
  myProvider: RpcProvider,
  account0: Account,
): Promise<DeployAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

  // *********** Deploy Braavos account *************
  // declare
  const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosBaseAccount110.contract_class.json").toString("ascii"));
  const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosBaseAccount110.compiled_contract_class.json").toString("ascii"));
  console.log("Braavos base account v1.1.0 declare in progress...");
  const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
  const contractBraavosClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) { await myProvider.waitForTransaction(respDecl.transaction_hash) };
  console.log("Braavos base contract v1.1.0 class hash :", respDecl.class_hash);
  const accountBraavosSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2100/Braavos_120.contract_class.json").toString("ascii"));
  const accountBraavosCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2100/Braavos_120.compiled_contract_class.json").toString("ascii"));
  const respDecl2 = await account0.declareIfNot({ contract: accountBraavosSierra, casm: accountBraavosCasm });
  const contractBraavosClassHash2 = respDecl2.class_hash;
  console.log("Braavos contract v1.2.0 class hash :", respDecl2.class_hash);
  if (respDecl2.transaction_hash) { await myProvider.waitForTransaction(respDecl2.transaction_hash) };

  // Calculate future address of the Braavos account
  const privateKeyBraavosBase = stark.randomAddress();
  console.log('Braavos account Private Key =', privateKeyBraavosBase);
  const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
  console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);

  const accountBraavosAddress = calculateAddressBraavos(privateKeyBraavosBase);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountBraavosAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountBraavosAddress, 100n * 10n ** 18n, "FRI");
  // deploy Braavos account

  const maxQtyGasAuthorized = 4000n; // max quantity of gas authorized
  const maxPriceAuthorizeForOneGas = 1n * 10n ** 12n; // max FRI authorized to pay 1 gas (1 FRI=10**-18 STRK)
  const myMaxFee = undefined;
  console.log("input maxFee=", { myMaxFee });

  const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavosBase, myProvider, {});
  console.log({ estimatedFee });

  const respDeploy = await deployBraavosAccount(privateKeyBraavosBase, myProvider, myMaxFee);
  const txR = await myProvider.waitForTransaction(respDeploy.transaction_hash);
  console.log("Transaction receipt is success =", txR.isSuccess());
  const accountBraavos = new Account(myProvider, accountBraavosAddress, privateKeyBraavosBase);
  console.log("Braavos account created.\nFinal address =", accountBraavosAddress);
  console.log('✅ Braavos 1.2.0 account deployed.');

  const result: DeployAccountResp = {
    account: accountBraavos,
    address: accountBraavosAddress,
    classH: contractBraavosClassHash2,
    privateK: privateKeyBraavosBase,
    publicK: starkKeyPubBraavosBase,
  }
  return result
}
