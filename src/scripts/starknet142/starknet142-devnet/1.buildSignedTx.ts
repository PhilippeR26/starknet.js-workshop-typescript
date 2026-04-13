// Build a signed transaction.
// Launch with npx src/scripts/starknet142/starknet142-devnet/1.buildSignedTx.ts
// Coded with Starknet.js v10.0.0-B2+experimental

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { hexU32ArrayToBase64 } from "../../utils/encode";
import { displayBalances } from "../../utils/displayBalances";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

  // Check that communication with provider is OK
  console.log(
    "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Devnet.");

  //process.exit(5);
  // *** Devnet
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;

  // *** initialize existing Sepolia Testnet account
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account3IntegrationOZ17address;
  // const privateKey0 = account3IntegrationOZ17privateKey;

  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));
  // Declare & deploy Test contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2122/hello2_HelloStarknet.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2122/hello2_HelloStarknet.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  const dummyContract = new Contract({ abi: compiledSierra.abi, address: "0x123" });
  console.log("functions =", dummyContract.functions);

  const resDecl = await account0.declareIfNot({
    contract: compiledSierra,
    casm: compiledCasm,
  });
  if (resDecl.transaction_hash) {
    console.log("new class hash =", resDecl.class_hash);
    await myProvider.waitForTransaction(resDecl.transaction_hash);
  } else {
    console.log("Already declared");
  };
  const classHash = resDecl.class_hash;
  console.log({ classHash, txH: resDecl.transaction_hash });

  const deployResponse = await account0.deployContract({
    classHash: classHash,
    constructorCalldata: undefined,
  });
  console.log(deployResponse);

  // Connect the new contract instance :
  const myTestContract = new Contract({ abi: compiledSierra.abi, address: deployResponse.contract_address });
  myTestContract.providerOrAccount = account0;

  console.log('✅ Test Contract connected at =', myTestContract.address);

  // // proof contract 
  // // classH= 0x203367a056efe1292baa7961cb667348b8aa6122b9229f796c5c18c3e7b967c
  // // address= 0x3ef1a9bef65bfb7452ee257745c9979ebfb1b1da9390333a9b400b365e3ac58



  // const proofH32 = json.parse(fs.readFileSync("./src/scripts/starknet142/starknet142-integrationSepolia/array_sum.proof").toString("ascii")) as string[];
  // const proofB64 = hexU32ArrayToBase64(proofH32);

  const myCall = myTestContract.populate("Say_HelloPhil126",
    {
      messages: "0x123",
    });


  const tx3: INVOKE_TXN_V3 = await account0.getSignedTransaction(myCall);
  console.log({ tx3 });

  const res = await account0.provider.channel.invokeSignedTx(tx3);
  const txR3 = await account0.provider.waitForTransaction(res.transaction_hash);
  console.log({ txR3 });

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

