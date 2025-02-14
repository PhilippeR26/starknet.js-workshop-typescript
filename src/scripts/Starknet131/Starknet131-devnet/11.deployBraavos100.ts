// Deploy a Braavos 1.0.0 account in devnet.
// Coded with Starknet.js v6.23.1 

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, type UniversalDetails } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature, isV3tx } from "../../braavos/3c.deployBraavos100v3";
import { DevnetProvider } from "starknet-devnet";


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import type { DeployAccountResp } from "../../utils/types";
import { EDataAvailabilityMode, type ETransactionVersion } from "@starknet-io/types-js";
dotenv.config();

export async function deployAccountBraavos(
  myProvider: RpcProvider,
  account0: Account,
  version: ETransactionVersion,
): Promise<DeployAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

  // *********** Deploy Braavos account *************
  // declare
  const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.sierra.json").toString("ascii"));
  const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.casm.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountBraavosBaseSierra);
  console.log("Braavos account v1.0.0 declare in progress...");
  const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
  const contractBraavosClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) { await myProvider.waitForTransaction(respDecl.transaction_hash) };
  //console.log("Braavos base contract class hash :", respDecl.class_hash);
  const accountBraavosSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.sierra.json").toString("ascii"));
  const accountBraavosCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.casm.json").toString("ascii"));
  const respDecl2 = await account0.declareIfNot({ contract: accountBraavosSierra, casm: accountBraavosCasm });
  const contractBraavosClassHash2 = respDecl2.class_hash;
  //console.log("Braavos contract class hash :", respDecl2.class_hash);
  if (respDecl2.transaction_hash) { await myProvider.waitForTransaction(respDecl2.transaction_hash) };

  // Calculate future address of the Braavos account
  const privateKeyBraavosBase = stark.randomAddress();
  console.log('Braavos account Private Key =', privateKeyBraavosBase);
  const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
  console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);


  const calldataBraavos = new CallData(accountBraavosBaseSierra.abi);
  type StarkPubKey = { pub_key: BigNumberish };
  const myPubKey: StarkPubKey = { pub_key: starkKeyPubBraavosBase };
  const constructorBraavosCallData = calldataBraavos.compile("constructor", {
    stark_pub_key: myPubKey,
  });
  const accountBraavosAddress = hash.calculateContractAddressFromHash(starkKeyPubBraavosBase, contractBraavosClassHash, constructorBraavosCallData, 0);
  //console.log('Precalculated account address=', accountBraavosAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountBraavosAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountBraavosAddress, 100n * 10n ** 18n, "FRI");
  // deploy Braavos account

  const maxQtyGasAuthorized = 4000n; // max quantity of gas authorized
  const maxPriceAuthorizeForOneGas = 1n * 10n ** 12n; // max FRI authorized to pay 1 gas (1 FRI=10**-18 STRK)
  const myMaxFee: UniversalDetails = isV3tx(version) ? {
    feeDataAvailabilityMode: EDataAvailabilityMode.L1,
    nonceDataAvailabilityMode: EDataAvailabilityMode.L1,
    tip: 10 ** 13,
    paymasterData: [],
    resourceBounds: {
      l1_gas: {
        max_amount: num.toHex(maxQtyGasAuthorized),
        max_price_per_unit: num.toHex(maxPriceAuthorizeForOneGas),
      },
      l2_gas: {
        max_amount: num.toHex(0),
        max_price_per_unit: num.toHex(0),
      },
    },
  } :
    { maxFee: 2 * 10 ** 15 }; // V1
  console.log("input maxFee=", { myMaxFee });

  const respDeploy = await deployBraavosAccount(privateKeyBraavosBase, myProvider, myMaxFee, version);
  const txR = await myProvider.waitForTransaction(respDeploy.transaction_hash);
  //console.log("Transaction receipt success =", txR.isSuccess());
  const accountBraavos = new Account(myProvider, accountBraavosAddress, privateKeyBraavosBase);
  console.log("Braavos account created.\nFinal address =", accountBraavosAddress);
  console.log('✅ Braavos 1.0.0 account deployed.');

  const result: DeployAccountResp = {
    account: accountBraavos,
    address: accountBraavosAddress,
    classH: contractBraavosClassHash2,
    privateK: privateKeyBraavosBase,
    publicK: starkKeyPubBraavosBase,
  }
  return result
}
