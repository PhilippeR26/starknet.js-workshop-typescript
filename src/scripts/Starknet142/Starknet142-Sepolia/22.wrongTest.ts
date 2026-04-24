// Test an invalid proof
// launch with npx ts-node src/scripts/Starknet142/Starknet142-Sepolia/22.wrongTest.ts
// Coded with Starknet.js v10.0.0-B6 + experimental

import { constants, json, shortString, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode, RpcProvider as RpcProviderProof, Account as AccountProof } from "starknet-proof";
import { RpcProvider, Account, Contract } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { requestProof, type ProveResult } from "./RequestProof";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";

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

  // totally random proof, just to test the call with a proof that will not be valid, and see that the contract call is working and returns false as expected
  const alteredProof0 = Buffer.alloc(300_000);
  for (let i = 0; i < 300_000; i++) {
    alteredProof0[i] = i % 256;
  }
  const alteredProof = alteredProof0.toString('base64');

  // Valid proofFacts
  const proofFacts = [
    "0x50524f4f4630",
    "0x5649525455414c5f534e4f53",
    "0x3e98c2d7703b03a7edb73ed7f075f97f1dcbaa8f717cdf6e1a57bf058265473",
    "0x5649525455414c5f534e4f5330",
    "0x89ffb1",
    "0x376d2f11185b2bcd78ae1bdb807660a2d9e7e35f7ebe5974d46d00a79b85153",
    "0x1b9900f77ff5923183a7795fcfbb54ed76917bc1ddd4160cc77fa96e36cf8c5",
    "0x1",
    "0x12596e27d4c96afca11bd25940c704d457e9bd4450fcb1f6dbb6c2fc4955721"
  ];
  console.log(
      'proof size =',
      alteredProof.length,
      ', start =',
      alteredProof.slice(0, 15),
      ', end =',
      alteredProof.slice(-15)
    );

  console.log("✅ Proof calculated.");

  // valid L1L2 message
  const myCalldata2 = myTestContract.populate("verify_proof_of_secret",
    {
      public_message: {
        "user_id": 1234,
        "is_whitelisted": true
      },
    }
  );

  console.log("Calling verify_proof_of_secret with the proof...");
  const tx2 = await account0.execute(myCalldata2, { proof: alteredProof, proofFacts: proofFacts });
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
