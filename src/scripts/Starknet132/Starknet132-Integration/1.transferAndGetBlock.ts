// Get Starknet version of Sepolia integration network
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Integration/1.transferAndGetBlock.ts
// Coded with Starknet.js v7b 

import { RpcProvider, Account, shortString, json, Contract, cairo, logger } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account2IntegrationAXaddress, account2IntegrationAXprivateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey, account4IntegrationOZ20address, account4IntegrationOZ20privateKey, account5IntegrationOZ20address, account5IntegrationOZ20privateKey } from "../../../A2priv/A2priv";
dotenv.config();


async function main() {
  //const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node

  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545" }); // local pathfinder Testnet node

  logger.setLogLevel('DEBUG');
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()), 
    ", rpc", await myProvider.getSpecVersion(), 
    ", SN version =",(await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia integration");
  const OZaccount0 = new Account(
    myProvider,
    account5IntegrationOZ20address, account5IntegrationOZ20privateKey,
    undefined,
    "0x3");
  const accountDest = new Account(
    myProvider,
    account4IntegrationOZ20address, account4IntegrationOZ20privateKey,
    undefined,
    "0x2");
  console.log("Accounts connected.\n");


  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethToken = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  const strkToken = new Contract(compiledERC20Contract.abi, strkAddress, myProvider);
  console.log("ETH account5 balance =", formatBalance(await ethToken.call("balanceOf", [OZaccount0.address]) as bigint, 18), "ETH");
  console.log("STRK OZ account5 balance =", formatBalance(await strkToken.call("balanceOf", [OZaccount0.address]) as bigint, 18), "STRK");
  console.log("ETH account4 balance =", formatBalance(await ethToken.call("balanceOf", [accountDest.address]) as bigint, 18), "ETH");
  console.log("STRK account4 balance =", formatBalance(await strkToken.call("balanceOf", [accountDest.address]) as bigint, 18), "STRK");

  const myCall0 = ethToken.populate("transfer", {
    recipient: accountDest.address,
    amount: cairo.uint256(1 * 10 ** 13),
  });
  const myCall1 = strkToken.populate("transfer", {
    recipient: accountDest.address,
    amount: cairo.uint256(1 * 10 ** 15),
  });
  const res = await OZaccount0.execute([myCall0,myCall1]);
  const txR = await OZaccount0.waitForTransaction(res.transaction_hash);
  console.log(txR);

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
