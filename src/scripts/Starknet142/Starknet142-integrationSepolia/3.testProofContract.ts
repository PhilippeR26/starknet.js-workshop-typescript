/// declare in integration the proof contract
// launch with npx src/scripts/starknet142/starknet142-integrationSepolia/3.testProofContract.ts
// Coded with Starknet.js v10.0.0-B2

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { hexU32ArrayToBase64 } from "../../utils/encode";
import { displayBalances } from "../../utils/displayBalances";

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
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
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
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  const accountAddress0 = account3IntegrationOZ17address;
  const privateKey0 = account3IntegrationOZ17privateKey;

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
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2160/proof_voty_PrivateVoteVerifierMultiRound.contract_class.json").toString("ascii")) as CompiledSierra;


  // Connect the new contract instance :
  const address = "0x3ef1a9bef65bfb7452ee257745c9979ebfb1b1da9390333a9b400b365e3ac58";
  const myTestContract = new Contract({ abi: compiledSierra.abi, address, providerOrAccount: account0 });

  console.log("Test Contract connected at =", myTestContract.address);

  // proof contract 
  // const classH= 0x203367a056efe1292baa7961cb667348b8aa6122b9229f796c5c18c3e7b967c
  const testCallData = new CallData(compiledSierra.abi);
  const myCalldata = testCallData.compile("main",
    {
      merkle_root: "0x29de50c968dea48d1b1573e5e35593e94d80614c46d63d3602e3961d42acaff",
      vote: "0x01",
      nullifier: "0x26af69bd5611932e22c77d37b159741013cca4cd22613b284741d3ad6b1b196",
      round: "0x01",
      member_leaf: "0x46834de20fe71e56d6cda4502646f55e85e3ec51057913e5774c69bbe184483",
      merkle_proof:
        [
          "0x6470e032be23949b12cc95a0afac6d016869a5a9e351d461500c7d4d9e8b872",
          "0x61ed79f3eda9549dedad333037a5961d8221a6694aaac6ce3eb7062a5760e40"
        ],
      secret: "0x123"
    });
  const res = await myTestContract.call("main",myCalldata);
console.log(res);

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// merkle_root: felt252,
//   vote: u8,
//     nullifier: felt252,
//       round: felt252,
//         // ================== PRIVATE INPUTS (cachés par la preuve)
//         member_leaf: felt252, // hash de ton identifiant membre
//           merkle_proof: Array<felt252>, // siblings (profondeur max ~20-25 ok en browser)
//             secret: felt252 

// return: (merkle_root, vote, nullifier)