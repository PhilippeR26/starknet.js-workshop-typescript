// Get Starknet version of Sepolia integration network
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Integration/1.getBlock.ts
// Coded with Starknet.js v6.14.1 & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, shortString, json, Contract } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import type { SPEC } from "@starknet-io/types-js";
import { account1IntegrationOZaddress, account1IntegrationOZprivateKey } from "../../../A2priv/A2priv";
dotenv.config();


async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545" }); // local pathfinder Testnet node

  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet Sepolia integration");
  const OZaccount0 = new Account(myProvider, account1IntegrationOZaddress, account1IntegrationOZprivateKey);
  console.log("Account connected.\n");

  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethToken = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  console.log("ETH account balance =", formatBalance(await ethToken.call("balanceOf", [OZaccount0.address]) as bigint, 18), "ETH");

  const block = await myProvider.getBlock();
  const dateC = new Date(block.timestamp * 1000);
  const blockN = await myProvider.getBlockNumber();
  console.log("bloc #", blockN, block, dateC);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
