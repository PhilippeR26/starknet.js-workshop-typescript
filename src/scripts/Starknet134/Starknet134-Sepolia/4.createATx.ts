// Get Starknet V3 tx from rpc 0.7 & 0.8.
// Launch with npx ts-node src/scripts/Starknet134/Starknet134-Sepolia/4.createATx.ts
// Coded with Starknet.js v7.0.1

import { RpcProvider, Account, shortString, json, Contract, cairo, logger, config, type RPC08, Provider, type SuccessfulTransactionReceiptResponse, num, hash } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { account2IntegrationAXaddress, account2IntegrationAXprivateKey, } from "../../../A2priv/A2priv";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
import type { CASM_COMPILED_CONTRACT_CLASS } from "@starknet-io/types-js/dist/types/api/executable";
import { Signer } from "./5.debugSigner";
dotenv.config();


async function main() {
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:9545/rpc/v0_8" });
  const myProvider7 = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7", specVersion: "0.7" });
  const myProvider8 = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: "0.8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" }); 
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  logger.setLogLevel('INFO');
  config.set("legacyMode", true);
  console.log(
    "Provider 0.7:\nchain Id =", shortString.decodeShortString(await myProvider7.getChainId()),
    ", rpc", await myProvider7.getSpecVersion(),
    ", SN version =", (await myProvider7.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");
  console.log(
    "Provider 0.8:\nchain Id =", shortString.decodeShortString(await myProvider8.getChainId()),
    ", rpc", await myProvider8.getSpecVersion(),
    ", SN version =", (await myProvider8.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");

  // const account7Address = "0x016fc169fb9b6c3f2b128d42903e50e7c7abb24a01340ee19c8c36a35a1770e1";
  // const account8Address="0x0745d525a3582e91299d8d7c71730ffc4b1f191f5b219d800334bc0edad0983b";
  const account7Address = account3ArgentXSepoliaAddress;
  const account8Address=account3ArgentXSepoliaAddress;
  const destAccount=account2TestBraavosSepoliaAddress;

  const mySigner = new Signer(account3ArgentXSepoliaPrivateKey);
  const account7 = new Account(
    myProvider7,
    account7Address,
    mySigner,
    undefined,
    "0x3"
  );
  const account8 = new Account(
    myProvider8,
    account8Address,
    mySigner,
    undefined,
    "0x3");
  console.log("Accounts connected.\n");


  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethToken = new Contract(compiledERC20Contract.abi, ethAddress);


  const myCall0 = ethToken.populate("transfer", {
    recipient: destAccount,
    amount: cairo.uint256(1n * 10n ** 11n),
  });

  // should fail as dummy private key :
  console.log("******** tx v3 with rpc0.7 ******");
  try {
    const res = await account7.execute(
      myCall0,
      // { version: 1 },
    );
    await myProvider7.waitForTransaction(res.transaction_hash);
  }
  catch (err: any) {

    console.log(err);
  }

  console.log("******** tx v3 with rpc0.8 ******");
  try {
    const res = await account8.execute(myCall0,   // { version: 1 },
    );
  }
  catch (err: any) {
    console.log(err);
  }

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
