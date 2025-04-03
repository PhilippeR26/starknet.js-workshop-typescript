// Get Starknet version of Sepolia  network
// Launch with npx ts-node src/scripts/Starknet134/Starknet134-Sepolia/1.testRpc8snjs.ts
// Coded with Starknet.js v7b3

import { RpcProvider, Account, shortString, json, Contract, cairo, logger, config, type RPC08, Provider, type SuccessfulTransactionReceiptResponse, num, hash, CairoCustomEnum } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { account2IntegrationAXaddress, account2IntegrationAXprivateKey, } from "../../../A2priv/A2priv";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
dotenv.config();


async function main() {
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:9545/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  logger.setLogLevel('INFO');
  // config.set("legacyMode",true);
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");
  const account0 = new Account(
    myProvider,
    account3ArgentXSepoliaAddress,
    account3ArgentXSepoliaPrivateKey,
    // undefined,
    // "0x2"
  );
  const accountDest = new Account(
    myProvider,
    account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey,
    undefined,
    "0x2");
  console.log("Accounts connected.\n");

  // ******** test
  const testAddress = "0x06f8cb0ad5c3e9c19b383141a90bf423272b295725d73148244bbb904df0ac56";
    const testSierra = await myProvider.getClassAt(testAddress);
    const testContract = new Contract(testSierra.abi, testAddress, myProvider);
    const myCall = testContract.populate("purchase_policy", {
        coverage_type: new CairoCustomEnum({ BusinessInterruptions: {} }),
        amount:200,
        data: [1,2],
        descrption: "Zorg is here.",
    }
    );
    console.log(myCall);
    const res = await account0.execute(myCall);
    console.log(res);
    const txR = await myProvider.waitForTransaction(res.transaction_hash);
    console.log(txR);


  

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
