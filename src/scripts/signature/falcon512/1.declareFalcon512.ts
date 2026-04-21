// Declare a falcon512 account from S2morrow
// launch with npx src/scripts/signature/falcon512/1.declareFalcon512.ts
// Coded with Starknet.js v10.0.0 + devnet 0.8.0

import { Contract, Account, json, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";

dotenv.config({ quiet: true });


async function main() {
  // initialize Provider 
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full' in Starknet-Devnet directory before using this script.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

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
  //    const accountAddress0 = account1OZSepoliaAddress;
  //    const privateKey0 = account1OZSepoliaPrivateKey;

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

  // Connect the new contract instance (deployed in Testnet) :
  const classH = "0x0037c7626b50ba517835c9556b53bce57cb6633704bb702f8c2f13a44cf151d5";
  // Declare & deploy Test contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./src/scripts/signature/falcon512/falcon512Account.sierra.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./src/scripts/signature/falcon512/falcon512Account.casm.json").toString("ascii")) as CairoAssembly;
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

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
