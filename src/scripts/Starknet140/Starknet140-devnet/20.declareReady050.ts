// Deploy an ArgentX account using secp256r1 signature (NIST P256)
// Launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/20.declareReady050.ts
// Coded with Starknet.js v8.8.0 & starknet-devnet.js v0.6.1

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, type Call, CairoBytes31 } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import type { DeployAccountResp } from "../../utils/types";
import { ArgentP256Signer, p256RandomPrivateKey } from "../../signature/15.signerArgentSecp256r1";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

async function main() {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // initialize Provider
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet
  // const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" }); // testnet
  //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
  //const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });

  // Check that communication with provider is OK
  console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);

  // devnet
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;
  // initialize existing Argent X testnet  account
  // const accountAddress0 = account5TestnetAddress
  // const privateKey0 = account5TestnetPrivateKey;

  // // initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS =', account0.address);
  console.log('existing account connected.\n');
  //
  // *********** Deploy ArgentX 0.5.0 / 0.4.0 account *************
  //
  console.log("Start...");
  // Ready v0.5.0
  const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo2101/argent_ArgentAccount.contract_class.json").toString("ascii"));
  const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo2101/argent_ArgentAccount.compiled_contract_class.json").toString("ascii"));

  // Ready v0.4.0
  // const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
  // const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));

  // declare
  const respDecl = await account0.declareIfNot({ contract: accountAXsierra, casm: accountAXcasm }, { tip: 0 });
  let contractReadyClassHash: string;
  if (respDecl.transaction_hash) {
    contractReadyClassHash = respDecl.class_hash;
    // await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX v0.5.0 contract declared. Class :", respDecl.class_hash);
  } else {
    contractReadyClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
    console.log("Already declared.")
  };


  //const contractAXclassHash = "0xbe187ea57c1dcf8b0b954bf68b7aeeafe071418acbfcab5951125dca69bb97"; //v0.5.0
  // const contractReadyClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
  //const contractAXclassHash=respDecl.class_hash;
  // const calldataAX = new CallData(accountAXsierra.abi);
  // const axSigner = new CairoCustomEnum({ Secp256r1: { pubkey: cairo.uint256(p256PubAX) } });
  // const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
  // const constructorAXCallData = calldataAX.compile("constructor", {
  //   owner: axSigner,
  //   guardian: axGuardian
  // });
  // console.log("constructor =", constructorAXCallData);
  // // const salt=stark.randomAddress();
  // const salt = num.toHex(BigInt(p256PubAX) & constants.MASK_250);
  // console.log({ salt });
  // const accountAXAddress = hash.calculateContractAddressFromHash(
  //   salt,
  //   contractAXclassHash,
  //   constructorAXCallData,
  //   0
  // );
  // console.log('Precalculated account address=', accountAXAddress);
  // // fund account address before account creation
  // await l2DevnetProvider.mint(accountAXAddress, 10n * 10n ** 18n, "WEI");
  // await l2DevnetProvider.mint(accountAXAddress, 100n * 10n ** 18n, "FRI");

  // // deploy ArgentX account
  // const accountAX = new Account(myProvider, accountAXAddress, myP256Signer);
  // const deployAccountPayload = {
  //   classHash: contractAXclassHash,
  //   constructorCalldata: constructorAXCallData,
  //   contractAddress: accountAXAddress,
  //   addressSalt: salt
  // };
  // const estimation = await accountAX.estimateAccountDeployFee(deployAccountPayload);
  // console.log("Estimate =", estimation);
  // const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload,{maxFee: estimation.suggestedMaxFee * 5n}); // super extra fee needed
  // console.log("Final address =", accountAXFinalAddress);
  // await myProvider.waitForTransaction(AXdAth);


  console.log('✅ ArgentX 0.5.0 account declared.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
