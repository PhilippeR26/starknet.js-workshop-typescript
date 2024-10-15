// Estimate fees of an OpenZeppelin v0.17.0,ETH signature account, upgradable & compatible SNIP-9.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/1.accountOZ17EthSnip-9estimate.ts
// Coded with Starknet.js v6.14.1 & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, shortString, hash, CallData, json, stark, ec,  cairo, Contract, eth, EthSigner, addAddressPadding, encode, num } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import assert from "assert";
import type { SPEC } from "@starknet-io/types-js";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZaddress, account1IntegrationOZprivateKey } from "../../../A2priv/A2priv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --lite-mode' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc" }); // local pathfinder Sepolia Integration node
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9540/rpc" }); // local pathfinder Testnet node
   console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet Sepolia integration");
  const OZaccount0 = new Account(myProvider, account1IntegrationOZaddress, account1IntegrationOZprivateKey);
  console.log("Account connected.\n");


  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethToken = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  // console.log("ETH account balance =", formatBalance(await ethToken.call("balanceOf", [OZaccount0.address]) as bigint, 18), "ETH");

  const block = await myProvider.getBlock();
  console.log(block);
  
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
