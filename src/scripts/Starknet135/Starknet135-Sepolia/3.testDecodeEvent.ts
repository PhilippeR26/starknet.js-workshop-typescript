// decode an event
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/3.testDecodeEvent.ts
// Coded with Starknet.js v7.0.1 & Devnet 0.3.0
import { RpcProvider, Account, shortString, json, Contract, cairo, logger, config, type RPC08, Provider, type SuccessfulTransactionReceiptResponse, num, hash, type constants } from "starknet";
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
  console.log("Provider connected to Starknet Sepolia testnet.");
  const account0 = new Account(
    myProvider,
    account3ArgentXSepoliaAddress,
    account3ArgentXSepoliaPrivateKey,
    // undefined,
    // "0x2"
  );
  console.log("Account connected.\n");

  const contractAddress = "0x02d34b927a277a6c6dc7a3d5df7f468cb6be63db5a99eae822ad8cffb4bf22fc";
  const sierraContract = await myProvider.getClassAt(contractAddress);
  const myContract = new Contract(sierraContract.abi, contractAddress, myProvider);
  const txH = "0x6ad75e507f4266d160bdafd2e59b1079d0f0add150886c1404381fe69bf961c";
  const txR = await myProvider.getTransactionReceipt(txH);
  const events = myContract.parseEvents(txR);
  console.log("Ids :", events[0]["openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferBatch"].ids);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
