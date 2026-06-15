// Test an invalid proof
// launch with npx ts-node src/scripts/Starknet142/Starknet142-Sepolia/22.wrongTest.ts
// Coded with Starknet.js v10.3.0

import { constants, json, shortString, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode,  RpcProvider, Account, Contract } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { account1ReadyMainnetAddress, account1ReadyMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }

  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // mainnet

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
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account3IntegrationOZ17address;
  // const privateKey0 = account3IntegrationOZ17privateKey;

  // *** initialize existing mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const accountAddress0 = account1ReadyMainnetAddress
  const privateKey0 = account1ReadyMainnetPrivateKey;


  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/proof_of_secret_SuperSecret.contract_class.json").toString("ascii")) as CompiledSierra;

  // Connect the new contract instance (deployed in Testnet) :
  const address = "0x748f59171d32188f023fe2dfcdc86fe7a733e95866349f9037db2d24535c303";
  const myTestContract = new Contract({ abi: compiledSierra.abi, address, providerOrAccount: account0 });

  // totally random proof, just to test the call with a proof that will not be valid, and see that the contract call is working and returns false as expected
  const alteredProof0 = Buffer.alloc(300_000);
  for (let i = 0; i < 300_000; i++) {
    alteredProof0[i] = i % 256;
  }
  const alteredProof = alteredProof0.toString('base64');

  // Valid proofFacts
  const proofFacts: string[] = [
    "0x50524f4f4630",
    "0x5649525455414c5f534e4f53",
    "0x3e98c2d7703b03a7edb73ed7f075f97f1dcbaa8f717cdf6e1a57bf058265473",
    "0x5649525455414c5f534e4f5330",
    "0x8b1557",
    "0x7f4be75608c68bc053200af4b33c7e3497da6a53ad314865558ff681cf1f8f2",
    "0x70c7b342f93155315d1cb2da7a4e13a3c2430f51fb5696c1b224c3da5508dfb",
    "0x1",
    "0x37eda4fdff7b514b4f817a5fe3a1650f9f459d6b5fa0c2ba9c97f8180541506"
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
  console.log("Tx result =", txR2);
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
