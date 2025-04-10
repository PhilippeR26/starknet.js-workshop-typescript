// test Lava urls
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/4.testLava.ts
// Coded with Starknet.js v7.0.1 & Devnet 0.3.0
import { RpcProvider, Account, shortString, json, Contract, cairo, logger, config, type RPC08, Provider, type SuccessfulTransactionReceiptResponse, num, hash, type constants } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { account2IntegrationAXaddress, account2IntegrationAXprivateKey, } from "../../../A2priv/A2priv";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
import { lavaMainnetKey } from "../../../A-MainPriv/mainPriv";
import { wait } from "../../utils/utils";
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
  config.set("legacyMode", true);
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


  // *** scan lava urls ***
  const nodeUrls = [
    "https://rpc.starknet-testnet.lava.build",
    "https://rpc.starknet-testnet.lava.build/rpc/v0_6",
    "https://rpc.starknet-testnet.lava.build/rpc/v0_7",
    "https://rpc.starknet-testnet.lava.build/rpc/v0_8",
    "https://g.w.lavanet.xyz:443/gateway/strk/rpc-http/" + lavaMainnetKey,
    "https://rpc.starknet.lava.build",
    "https://rpc.starknet.lava.build/rpc/v0_6",
    "https://rpc.starknet.lava.build/rpc/v0_7",
    "https://rpc.starknet.lava.build/rpc/v0_8",
  ];
  
  let collect: string[][] = [];
  collect = nodeUrls.map((val: string) => [val]);
  for (let i = 0; i < 10; i++) {
    const results: string[] = await Promise.all(nodeUrls.map(async (url): Promise<string> => {
      const provider = new RpcProvider({ nodeUrl: url });
      const rpcVersion = await provider.getSpecVersion();
      return rpcVersion;
    }));
    console.log({ results });
    collect = collect.map<string[]>(
      (arr: string[], pos: number) => {
        arr.push(results[pos]);
        return arr;
      }
    );
    await wait(10_000); // 10s
  }
  console.log({ collect });



  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
