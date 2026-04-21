/// Test the heavy calculation proof contract in Devnet, with an existing account and a pre-deployed contract (deployed in the previous script 2.declareCalculationProofContract.ts)
// launch with npx src/scripts/Starknet142/Starknet142-devnet/3.testAgeProof.ts
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
import { requestProof, type ProveResult } from "../Starknet142-Sepolia/RequestProof";
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
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
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
  // const accountSepolia = new Account({ provider: myProvider2, address: accountAddress1, signer: privateKey1 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/proof_of_secret_SuperSecret.contract_class.json").toString("ascii")) as CompiledSierra;

  // Connect the new contract instance (deployed in Testnet) :
  // ⚠️⚠️⚠️ update the address from result of script 2:
  const address = "0x69f4ef660ca0e81a4bfaf672f4ea7c53cf0014533de07ca266d5defbfa25d53";
  // const compiledSierra =await myProvider.getClassAt(address);
  const myTestContract = new Contract({ abi: compiledSierra.abi, address, providerOrAccount: account0 });

  console.log("Test Contract connected at =", myTestContract.address);
  console.log(myTestContract.functions);

  // proof contract 
  // // create 6 blocks
  //  for (let i=0;i<6;i++){
  //   const res=await l2DevnetProvider.createBlock();
  //   console.log(res);
  //  }
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
    super_secret: 100
  }
  console.log({ privData });
  const myCalldata = myTestContract.populate("create_proof_of_secret",
    {
      public_input: pubData,
      private_input: privData,
    });
  const tx = await account0.getSignedTransaction(myCalldata);
  console.log(tx);
  const currentBlock0: number = await myProvider.getBlockNumber();
  console.log({ currentBlock0 });
  // const currentBlock: number = 8802136 // block of devnet fork
  // =====================================================
  // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
  // A proof server shall be running locally using port 3030.
  // See here: https://github.com/PhilippeR26/secure-voty/tree/main/proofServer
  // Needs 15Gb free RAM 
  // =====================================================

  type ProveTransactionRequest = {
    block_id: string | { block_number: number };
    transaction: INVOKE_TXN_V3;
  }
  const params: ProveTransactionRequest = {
    // block_id: { block_number: 4 },
    block_id: "latest",
    transaction: tx
  }
  const response = await fetch("http://127.0.0.1:5050/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "starknet_proveTransaction",
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
  }

  const result = data.result as {
    proof: string;           // base64-encoded
    proof_facts: string[];
    l2_to_l1_messages: Array<{
      order: number;
      from_address: string;
      to_address: string;
      payload: string[];
    }>;
  };

  console.log("Result =", result, "\nPayload=", result.l2_to_l1_messages[0].payload);

  // const proofRes: ProveResult = await requestProof(currentBlock, tx);
  // console.log("proof size =", proofRes.proof.length, ", start =", proofRes.proof.slice(0, 8), ", end =", proofRes.proof.slice(-8));

  // const messageCallData = new CallData(l1l2MessageAbi);
  const messageContent = testCallData.decodeParameters("proof_of_secret::L1L2message", (result.l2_to_l1_messages[0].payload) as string[]);
  type L1L2message = {
    user_id: BigNumberish,
    is_whitelisted: boolean,
  }
  const messageFromProof = messageContent as L1L2message;
  console.log({ messageFromProof });
  // fs.writeFileSync('./src/scripts/Starknet142/Starknet142-Sepolia/proofResult.json', json.stringify({ proofRes, messageFromProof }, undefined, 2));
  console.log("✅ Proof1 calculated.");


  for (let i = 0; i < 10; i++) {
    const res = await l2DevnetProvider.createBlock();
    console.log(res);
  }

  const myCalldata2 = myTestContract.populate("verify_proof_of_secret",
    {
      public_message: messageFromProof,
    }
  );
  // correction of wrong proof_facts:
  const correctedProofFacts=[...result.proof_facts];
  correctedProofFacts.pop();
  correctedProofFacts.pop();
  correctedProofFacts.push(encode.addHexPrefix(result.l2_to_l1_messages.length.toString(16)));
  const arrayToHash:string[]=[
    result.l2_to_l1_messages[0].from_address, 
    result.l2_to_l1_messages[0].to_address, 
    result.l2_to_l1_messages[0].payload.length.toString() 
  ];
  result.l2_to_l1_messages[0].payload.reduce((myArray:string[],payloadItem:string)=>{
    myArray.push(payloadItem); 
    return myArray;
  },arrayToHash);

  correctedProofFacts.push(hash.computePoseidonHashOnElements(arrayToHash));
  console.log({correctedProofFacts});
  console.log("Calling verify_proof_of_age with the proof...");
  // const tx5=await accountSepolia.execute(myCalldata2, { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
  const tx2 = await account0.execute(myCalldata2, { proof: result.proof, proofFacts: result.proof_facts });
  const txR2 = await account0.provider.waitForTransaction(tx2.transaction_hash);
  console.log("Tx success =", txR2.isSuccess());
  const res = await myTestContract.read_result();
  console.log("Age result read from contract =", res);

  console.log("✅ Test 1 completed.");

  // const pubData2: PublicInputsForProof = {
  //   nonce: 5, // ⚠️ to change each time
  // }
  // const privData2: PrivateInputsForProof = {
  //   birth_date_timestamp: Math.floor(Date.now() / 1000) - 14 * 365 * 24 * 3600, // minor
  //   secret: 123456
  // }
  // console.log({ privData2 });
  // const myCalldata3 = myTestContract.populate("create_proof_of_age",
  //   {
  //     public_input: pubData2,
  //     private_input: privData2,
  //   });

  // const tx3 = await accountSepolia.getSignedTransaction(myCalldata3);
  // console.log(tx3);
  // const currentBlock2: number = await myProvider.getBlockNumber();
  // const proofRes2: ProveResult = await requestProof(currentBlock2, tx3);
  // console.log("proof size =", proofRes2.proof.length, ", start =", proofRes2.proof.slice(0, 8), ", end =", proofRes2.proof.slice(-8));

  // const messageContent2 = messageCallData.decodeParameters("proof_of_age::L1L2message", (proofRes2.l2ToL1Messages![0].payload) as string[]);
  // const messageFromProof2 = messageContent2 as L1L2message;
  // console.log({ messageFromProof2 });
  // fs.writeFileSync('./src/scripts/Starknet142/Starknet142-devnet/proofResult.json', json.stringify({ proofRes2, messageFromProof2 }, undefined, 2));
  // console.log("✅ Proof2 calculated.");

  // const myCalldata4 = myTestContract.populate("verify_proof_of_age",
  //   {
  //     public_message: messageFromProof,
  //   }
  // );
  // console.log("Calling verify_proof_of_age with the proof...");

  // const tx4 = await account0.execute(myCalldata4, { proof: proofRes2.proof, proofFacts: proofRes2.proofFacts });
  // const txR4 = await account0.provider.waitForTransaction(tx4.transaction_hash);
  // console.log("Tx success =", txR4.isSuccess());
  // const res4 = await myTestContract.read_result();
  // console.log("Age result read from contract =", res4);
  console.log("✅ Test 2 completed.");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
