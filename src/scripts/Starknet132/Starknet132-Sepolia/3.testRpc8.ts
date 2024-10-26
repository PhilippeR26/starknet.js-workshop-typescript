// Connect to a Testnet node, located in a remote computer in the local network. Test rpc 0.8 new IP.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/3.testRpc8.ts
// Coded with Starknet.js v6.15.0


import { shortString, RpcProvider, json } from "starknet";
import fs from "fs";
import axios from "axios";
import WebSocket from 'ws';
import * as dotenv from "dotenv";
dotenv.config();

function wait(delay: number) {
  return new Promise((res) => {
    setTimeout(res, delay);
  });
}

async function waitFor(f: Function) {
  while (!f()) await wait(200);
  return f();
}

async function keypress(): Promise<void> {
  process.stdin.setRawMode(true);
  return new Promise(resolve => process.stdin.once('data', data => {
    const byteArray = [...data];
    if (byteArray.length > 0 && byteArray[0] === 3) {
      console.log('^C');
      process.exit(1);
    }
    process.stdin.setRawMode(false);
    resolve();
  }))
}

async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_8" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  const { data: answer } = await axios.post('http://192.168.1.11:9545/rpc/v0_8', {
    id: 1,
    jsonrpc: "2.0",
    method: "starknet_chainId",
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log('Axios starknet_chainId =', answer);


  // **** starknet_getCompiledCasm ***
  const { data: answer2 } = await axios.post('http://192.168.1.11:9545/rpc/v0_8', {
    id: 2,
    jsonrpc: "2.0",
    method: "starknet_getCompiledCasm",
    params: { class_hash: "0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06" }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log('Axios starknet_getCompiledCasm =', answer2);


  // ** ws **
  let wsOpen: boolean = false;
  const start0 = new Date().getTime();
  let end0: number = 0;
  const ws_pathfinder = new WebSocket("ws://192.168.1.11:9545/ws");
  const ws_starknetRpc = new WebSocket("ws://192.168.1.11:9545/rpc/v0_8");
  console.log("A");
  ws_starknetRpc.on("error", console.error);
  ws_starknetRpc.on('open', function open() {
    end0 = new Date().getTime();
    wsOpen = true;
  });
  await waitFor(() => wsOpen);
  console.log("ws opened in", end0 - start0, "ms.");

  const start = new Date().getTime();
  let end: number;
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_getCompiledCasm","params" : ["0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06"],  "id" : 0}');
  
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_chainId","params" : [],  "id" : 1}');
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "starknet_chainId","params" : [],  "id" : 2}');

  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["newHeads"],  "id" : 3}');
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["events","0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"],  "id" : 4}');
  console.log("B");
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["transactionStatus","0x1a6efb583c3fa89421ea34547d47fb863f5758a4720ea3f99a2fd9e508c4f21"],  "id" : 5}');

  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeNewHeads","params" : [],  "id" : 6}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeEvents","params" : ["0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"],  "id" : 7}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeTransactionStatus","params" : ["0x1a6efb583c3fa89421ea34547d47fb863f5758a4720ea3f99a2fd9e508c4f21"],  "id" : 8}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribePendingTransactions","params" : [],  "id" : 9}');
  
  function message(data:any) {
    end = new Date().getTime();
    console.log("Message received. After", end - start, "ms:");
    const newMessage = json.parse(data.toString("ascii"));
    console.log(newMessage);
  }

  ws_starknetRpc.on('message', message );
  ws_pathfinder.on('message', message );

  console.log("C");
  await wait(10 * 1000); // 10 sec
  console.log("press a key to stop the subscription.");
  await keypress();
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 0,  "id" : 20}');
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 1,  "id" : 21}');
  ws_pathfinder.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 2,  "id" : 22}');
  console.log("Cbis");
  ws_pathfinder.close();
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 0,  "id" : 30}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 1,  "id" : 31}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 2,  "id" : 32}');
  ws_starknetRpc.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 3,  "id" : 33}');
  ws_starknetRpc.close();

  console.log("D");

  console.log("✅ end of script.");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


