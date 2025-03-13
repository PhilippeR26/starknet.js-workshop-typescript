// Connect to a local Testnet node. Test webSocket of rpc 0_8, using the ws library.
// Launch with npx ts-node src/scripts/Starknet134/Starknet134-Sepolia/3.testWS08ws.ts
// Coded with Starknet.js v7b


import { shortString, RpcProvider, json, num } from "starknet";
import fs from "fs";
import axios from "axios";
import WebSocket from 'ws';
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
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
  // const base="https://free-rpc.nethermind.io/sepolia-juno";
  // == pathfinder Testnet rpc
  // const base = "192.168.1.11:9545/rpc/v0_8";
  // == juno Testnet rpc
  const base = "localhost:6070/rpc/v0_8";

  // **** Sepolia integration
  // == Pathfinder Sepolia Integration
  // const base = "localhost:9550/rpc/v0_8";
  // == Juno Sepolia Integration
  // const base = "localhost:6095/rpc/v0_8";

  const url = "http://" + base;

  const myProvider = await RpcProvider.create({ nodeUrl: url });
  //const myProvider = new RpcProvider({ nodeUrl: url }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion(), ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet");


  // **************** ws ***********************************
  let wsOpen: boolean = false;
  const start0 = new Date().getTime();
  let end0: number = 0;
  let subID6: bigint = 0n;
  let subID7: bigint = 0n;
  let subID8: bigint = 0n;
  let subID9: bigint = 0n;
  let subID10: bigint = 0n;
  // const ws_custom = new WebSocket("ws://192.168.1.11:9545/ws"); // pathfinder Testnet
  // const ws_custom = new WebSocket("ws://localhost:6071"); // juno Testnet
  // pathfinder Testnet ws
  // const ws_starknetRpc = new WebSocket("ws://localhost:9545/rpc/v0_8");
  // juno Testnet ws
  const ws_starknetRpc = new WebSocket("ws://localhost:6071/v0_8"); 
  // **** Sepolia integration
  // == Pathfinder Sepolia Integration
  //const ws_starknetRpc = new WebSocket("ws://localhost:9545/rpc/v0_8"); 
  // == Juno Sepolia Integration
  // const ws_starknetRpc = new WebSocket("ws://localhost:6096/rpc/v0_8"); 

  // **** Mainnet
  //== Juno Mainnet
  // const ws_starknetRpc = new WebSocket("ws://localhost:6061/rpc/v0_8"); 


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
  // const message0 = JSON.stringify({
  //   jsonrpc: "2.0",
  //   method: "starknet_getCompiledCasm",
  //   params: [classHash],
  //   id: 0
  // });
  // ws_starknetRpc.send(message0);

  const message1 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_chainId",
    params: [],
    id: 1
  });
  ws_starknetRpc.send(message1);

  console.log("B");

  const message6 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribeNewHeads",
    params: [],
    id: 6
  });
  ws_starknetRpc.send(message6);

  const message7 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribeEvents",
    params: [strkAddress],
    id: 7
  });
  ws_starknetRpc.send(message7);

  const message8 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribeTransactionStatus",
    params: ["0x7f0dce88163f6565139d677f86ded8c396b449ed098272c6b06c5d2bddeae43"],
    id: 8
  });
  ws_starknetRpc.send(message8);

  const message9 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribePendingTransactions",
    params: [],
    id: 9
  });
  ws_starknetRpc.send(message9);

  const message10 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribeTransactionStatus",
    params: ["0xbff99a5621021b7954025192121b30efc4ea21a479931c088e905da37306f3"],
    id: 10
  });
  ws_starknetRpc.send(message10);

  function message(data: any) {
    end = new Date().getTime();
    const newMessage = json.parse(data.toString("ascii"));
    console.log("Message received ws_pathfinder. After", end - start, "ms :", newMessage);
  }

  ws_starknetRpc.onmessage = (event) => {
    end = new Date().getTime();
    const response = json.parse(event.data.toString("ascii"));
    if (response.id == 6 && !subID6) subID6 = response.result;
    if (response.id == 7 && !subID7) subID7 = response.result;
    if (response.id == 8 && !subID8) subID8 = response.result;
    if (response.id == 9 && !subID9) subID9 = response.result;
    if (response.id == 10 && !subID10) subID10 = response.result;

    console.log("Received response ws_starknet_rpc: after", end - start, "ms :", response);

  };
  // ws_custom.on('message', message);

  console.log("C");
  await wait(10 * 1000); // 10 sec
  console.log("press a key to stop the subscription.");
  await keypress();

  if (subID6) {
    console.log("unsubscribe starknet_subscribeNewHeads...");
    const unsubscribe6 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID6.toString()],
      id: 32
    });
    ws_starknetRpc.send(unsubscribe6);
  }
  if (subID7) {
    console.log("unsubscribe starknet_subscribeEvents...");
    const unsubscribe7 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID7.toString()],
      id: 33
    });
    ws_starknetRpc.send(unsubscribe7);
  }
  if (subID8) {
    console.log("unsubscribe starknet_subscribeTransactionStatus...");
    const unsubscribe8 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID8.toString()],
      id: 34
    });
    ws_starknetRpc.send(unsubscribe8);
  }
  if (subID9) {
    console.log("unsubscribe starknet_subscribePendingTransactions...");
    const unsubscribe9 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID9.toString()],
      id: 35
    });
    ws_starknetRpc.send(unsubscribe9);
  }
  if (subID10) {
    console.log("unsubscribe starknet_subscribeTransactionStatus 2...");
    const unsubscribe10 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID10.toString()],
      id: 36
    });
    ws_starknetRpc.send(unsubscribe10);
  }
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


