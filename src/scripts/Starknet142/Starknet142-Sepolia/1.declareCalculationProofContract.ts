// declare in Testnet the proof contract
// launch with npx src/scripts/starknet142/starknet142-Sepolia/1.declareCalculationProofContract.ts
// Coded with Starknet.js v10.0.0-B6

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet-proof";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { hexU32ArrayToBase64 } from "../../utils/encode";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  // }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
   const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
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
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;

  // *** initialize existing Sepolia Testnet account
   const accountAddress0 = account1OZSepoliaAddress;
   const privateKey0 = account1OZSepoliaPrivateKey;

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
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/heavy_calculation_PrivateVoteVerifierMultiRound.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2170/heavy_calculation_PrivateVoteVerifierMultiRound.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
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

  // proof contract 
  // classH = 0x7f7cf97d1f54a59d72d3cbae6b87a64b0ffb82cd41da68bb67118fb28ce2404
  // address = 0x65a0840657be286d31a1984cf28c238d58bf72caba4d719d27b2696bd0a1c3f

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

