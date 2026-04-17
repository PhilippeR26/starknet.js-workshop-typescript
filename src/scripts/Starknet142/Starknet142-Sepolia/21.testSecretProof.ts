/// Test the heavy calculation proof contract in Testnet, with an existing account and a pre-deployed contract (deployed in the previous script 20)
// launch with npx src/scripts/Starknet142/Starknet142-Sepolia/21.testSecretProof.ts
// Coded with Starknet.js v10.0.0-B6 + experimental

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode } from "starknet-proof";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { requestProof, type ProveResult } from "./RequestProof";
import type { INVOKE_TXN_V3 } from "@starknet-io/starknet-types-0102";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }

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

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/proof_of_secret_SuperSecret.contract_class.json").toString("ascii")) as CompiledSierra;

  // Connect the new contract instance (deployed in Testnet) :
  const address = "0x2529eb0dd994b6012b4bd496aea13c3714c13ea8db86d09aeecc5f3164181a6";
  const myTestContract = new Contract({ abi: compiledSierra.abi, address, providerOrAccount: account0 });

  console.log("Test Contract connected at =", myTestContract.address);
  console.log(myTestContract.functions);
  const testCallData = new CallData(compiledSierra.abi);
  type PublicInputsForProof = {
    user_id: BigNumberish,
  }
  const pubData: PublicInputsForProof = {
    user_id: 1234,
  }
  type PrivateInputsForProof = {
    super_secret: BigNumberish,
  }
  const privData: PrivateInputsForProof = {
    super_secret: 100 // Needs to be <1000 to be whitelisted
  }
  console.log({ privData });
  const myCalldata = myTestContract.populate("create_proof_of_secret",
    {
      public_input: pubData,
      private_input: privData,
    });
  const tx = await account0.getSignedTransaction(myCalldata);
  console.log(tx);
  const currentBlock: number = await myProvider.getBlockNumber();
  console.log({ currentBlock });
  // =====================================================
  // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
  // A proof server shall be running locally using port 3030.
  // See here: https://github.com/PhilippeR26/secure-voty/tree/main/proofServer
  // Needs 15Gb free RAM 
  // =====================================================

  
  const proofRes: ProveResult = await requestProof(currentBlock, tx);
  console.log("proof size =", proofRes.proof.length, ", start =", proofRes.proof.slice(0, 8), ", end =", proofRes.proof.slice(-8));

  const messageContent = testCallData.decodeParameters("proof_of_secret::L1L2message", (proofRes.l2ToL1Messages![0].payload) as string[]);
  type L1L2message = {
    user_id: BigNumberish,
    is_whitelisted: boolean,
  }
  const messageFromProof = messageContent as L1L2message;
  console.log({ messageFromProof });
  // fs.writeFileSync('./src/scripts/Starknet142/Starknet142-Sepolia/proofResult.json', json.stringify({ proofRes, messageFromProof }, undefined, 2));
  console.log("✅ Proof1 calculated.");

  const myCalldata2 = myTestContract.populate("verify_proof_of_secret",
    {
      public_message: messageFromProof,
    }
  );

  console.log("Calling verify_proof_of_age with the proof...");
  const tx2 = await account0.execute(myCalldata2, { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
  const txR2 = await account0.provider.waitForTransaction(tx2.transaction_hash);
  console.log("Tx success =", txR2.isSuccess());
  const res = await myTestContract.read_result();
  console.log("is whitelisted, read from contract =", res);

  console.log("✅ Test completed.");


}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
