// Connect to a Testnet node, located in a remote computer in the local network. Test rpc 0.8 new IP.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/3.testRpc8.ts
// Coded with Starknet.js v6.15.0


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
  // == pathfinder Testnet
  // const base = "192.168.1.11:9545/rpc/v0_8";
  // == juno Testnet
  // const base = "localhost:6070/rpc/v0_7"; 

  // **** Sepolia integration
  // == Pathfinder Sepolia Integration
   const base = "localhost:9550/rpc/v0_8";
  // == Juno Sepolia Integration
  // const base = "localhost:6095/rpc/v0_8";

   const url = "http://" + base;

  const myProvider = new RpcProvider({ nodeUrl: url });
  //const myProvider = new RpcProvider({ nodeUrl: url }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion(), ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet");

  const { data: answer } = await axios.post(url, {
    id: 1,
    jsonrpc: "2.0",
    method: "starknet_chainId",
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log('Axios starknet_chainId response =', answer);


  // **** new starknet_getCompiledCasm ***
  const classHash = await myProvider.getClassHashAt(strkAddress);
  // const classHash = "0x01ff74bc2838b0744d431a14084ff4a398db9e0281ff31b6ff2f96346d41f742";
  const { data: answer1 } = await axios.post(url, {
    id: 3,
    jsonrpc: "2.0",
    method: "starknet_getClass",
    params: { class_hash: classHash, block_id: 'pending' }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log('Axios starknet_getClass response =', answer1.result ? json.parse(answer1.result.abi)[0] : answer1);
  console.log("block#=", await myProvider.getBlockNumber());
  const { data: answer2 } = await axios.post(url, {
    id: 2,
    jsonrpc: "2.0",
    method: "starknet_getCompiledCasm",
    params: { class_hash: classHash }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  //console.log("Axios starknet_getCompiledCasm Cairo version response (",classHash,") =", answer2.result.casm.compiler_version ?? answer2);
  console.log("Axios starknet_getCompiledCasm Cairo version response (",classHash,") =",  answer2);
  // process.exit(5);

  // **************** ws ***********************************
  let wsOpen: boolean = false;
  const start0 = new Date().getTime();
  let end0: number = 0;
  let subID6: bigint = 0n;
  let subID7: bigint = 0n;
  let subID8: bigint = 0n;
  let subID9: bigint = 0n;
  // const ws_custom = new WebSocket("ws://192.168.1.11:9545/ws"); // pathfinder Testnet
  // const ws_custom = new WebSocket("ws://localhost:6071"); // juno Testnet
  // const ws_starknetRpc = new WebSocket("ws://192.168.1.11:9545/rpc/v0_8"); // pathfinder Testnet
  // juno Testnet
  // const ws_starknetRpc = new WebSocket("ws://localhost:6071"); 
   // **** Sepolia integration
  // == Pathfinder Sepolia Integration
  //const ws_starknetRpc = new WebSocket("ws://localhost:9545/rpc/v0_8"); 
  // == Juno Sepolia Integration
  // const ws_starknetRpc = new WebSocket("ws://localhost:6096/rpc/v0_8"); 

  // **** Mainnet
  //== Juno Mainnet
  const ws_starknetRpc = new WebSocket("ws://localhost:6061/rpc/v0_8"); 


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
    params: ["0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49"],
    id: 7
  });
  ws_starknetRpc.send(message7);

  const message8 = JSON.stringify({
    jsonrpc: "2.0",
    method: "starknet_subscribeTransactionStatus",
    params: ["0x408c1c5569c9cd787d1e9205adf1ed0d2a980a0ea0bdcfb4f2c0b681f55ba14"],
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

  function message(data: any) {
    end = new Date().getTime();
    const newMessage = json.parse(data.toString("ascii"));
    console.log("Message received ws_pathfinder. After", end - start, "ms :", newMessage);
  }

  ws_starknetRpc.onmessage = (event) => {
    end = new Date().getTime();
    const response = json.parse(event.data.toString("ascii"));
    if (response.id == 6 && !subID6) subID6 = response.subscription_id;
    if (response.id == 7 && !subID7) subID7 = response.subscription_id;
    if (response.id == 8 && !subID8) subID8 = response.subscription_id;
    if (response.id == 9 && !subID9) subID9 = response.subscription_id;
    
    console.log("Received response ws_starknet_rpc: after", end - start, "ms :", response);
  
  };
  // ws_custom.on('message', message);

  console.log("C");
  await wait(10 * 1000); // 10 sec
  console.log("press a key to stop the subscription.");
  await keypress();
 
  if (subID6) {
    const unsubscribe6 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID6.toString()],
      id: 32
    });
    ws_starknetRpc.send(unsubscribe6);
  }
  if (subID7) {
    const unsubscribe6 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID7.toString()],
      id: 33
    });
    ws_starknetRpc.send(unsubscribe6);
  }
  if (subID8) {
    const unsubscribe6 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID8.toString()],
      id: 34
    });
    ws_starknetRpc.send(unsubscribe6);
  }
  if (subID9) {
    const unsubscribe6 = JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet__unsubscribe",
      params: [subID9.toString()],
      id: 35
    });
    ws_starknetRpc.send(unsubscribe6);
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


