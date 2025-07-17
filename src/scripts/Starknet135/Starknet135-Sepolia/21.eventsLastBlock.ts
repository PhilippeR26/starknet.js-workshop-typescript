// Get STRK transfer events in a block.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/21.eventsLastBlock.ts
// Coded with Starknet.js v7.6.2

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, type BlockIdentifier, type TXN_HASH, provider, BlockTag, type CompiledSierra, type GetTransactionReceiptResponse, type TransactionStatusReceiptSets, ReceiptTx, type GetTxReceiptResponseWithoutHelper, } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "./10.getBalance"
import { wait } from "../../utils/utils";
import { assert } from "../../utils/assert";
import { strkAddress } from "../../utils/constants";
dotenv.config();


async function main() {
  // ********* Mainnet **************
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_8" });
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  // logger.setLogLevel("ERROR");
  // config.set("legacyMode",true);
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");

  // *** Devnet
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;


  // *** initialize existing Sepolia Testnet account
  // non SNIP-9 account:
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // SNIP-9 compatible accounts:
  // const accountAddress0 = account3ArgentXSepoliaAddress;
  // const privateKey0 = account3ArgentXSepoliaPrivateKey;
  const accountAddress0 = account2BraavosSepoliaAddress;
  const privateKey0 = account2BraavosSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');

  const { abi: strkAbi } = (await myProvider.getClassAt(strkAddress)) as CompiledSierra;
  const strkContract = new Contract(strkAbi, strkAddress, myProvider);
  const block = await myProvider.getBlockWithReceipts("latest");
  console.log("txs number=", block.transactions.length);
  if (block.transactions.length > 0) {
    const res = block.transactions.flatMap((transaction) => {
      const rawReceipt = transaction.receipt as GetTxReceiptResponseWithoutHelper;
      const txReceipt = new ReceiptTx(rawReceipt) as GetTransactionReceiptResponse;
      return strkContract.parseEvents(txReceipt);
    });
    console.log(res);
  }


  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

