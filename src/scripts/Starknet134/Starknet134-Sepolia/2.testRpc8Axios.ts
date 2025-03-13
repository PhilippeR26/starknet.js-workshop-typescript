// Connect to a Testnet node, located in a remote computer in the local network. Test rpc 0.8 new IP.
// Launch with npx ts-node src/scripts/Starknet134/Starknet134-Sepolia/2.testRpc8Axios.ts
// Coded with Starknet.js v6.15.0


import { shortString, RpcProvider, json, num, hash, provider } from "starknet";
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
  // const url="https://free-rpc.nethermind.io/sepolia-juno/v0_8";
  // const url = "https://starknet-mainnet.public.blastapi.io/rpc/v0_8";

  // == pathfinder Testnet
  const url = "http://192.168.1.78:9545/rpc/v0_8";
  // const url = "http://localhost:9545/rpc/v0_8";
  // == juno Testnet
  //  const url = "http://192.168.1.78:6070/v0_8";
  // const url = "http://localhost:6070/v0_8"; 

  // **** Sepolia integration
  // == Pathfinder Sepolia Integration
  // const url = "http://localhost:9550/rpc/v0_8";
  // == Juno Sepolia Integration
  // const url = "http://localhost:6095/rpc/v0_8";


  const myProvider = await RpcProvider.create({ nodeUrl: url });
  // const myProvider = new RpcProvider({ nodeUrl: url }); // local pathfinder testnet node
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
  console.log("Axios starknet_getCompiledCasm Cairo version response (", classHash, ") =", answer2.result.compiler_version ?? answer2);

  // Given an l1 tx hash, returns the associated l1_handler tx hashes and statuses for all L1 -> L2 messages sent by the l1 transaction, ordered by the l1 tx sending order
  const { data: answer3 } = await axios.post(url, {
    id: 3,
    jsonrpc: "2.0",
    method: "starknet_getMessagesStatus",
    params: { transaction_hash: "0xaf42eb7d293d78f8a28f4ac7abe72077889b2b03cf868972688060d5ed3d5d96" }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log("Axios starknet_getMessagesStatus (3) response =", answer3.result ?? answer3);

  // const block_id = new provider.Block("556892").identifier;
  // const block_id=new provider.Block("pending").identifier;
  const block_id = new provider.Block("latest").identifier;
  console.log({ block_id });

  const { data: answer4 } = await axios.post(url, {
    id: 4,
    jsonrpc: "2.0",
    method: "starknet_getStorageProof",
    params: {
      block_id,
      contract_addresses: ["0x33ba2f0e6fb9a4a63a701728bacd7c86fd7750889c7f454711fa5d2766ce34c"],
    }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log("Axios starknet_getStorageProof (4) contract response =", answer4.result?.contracts_proof.contract_leaves_data ?? answer4);

  const { data: answer5 } = await axios.post(url, {
    id: 5,
    jsonrpc: "2.0",
    method: "starknet_getStorageProof",
    params: {
      block_id,
      class_hashes: ["0x29f7ed685a31a4a5cc523da7e2cf768606375e098755b9beee479b5dd159ab"],
    }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log("Axios starknet_getStorageProof (5) class response =", answer5.result?.classes_proof[0] ?? answer5);

  const { data: answer6 } = await axios.post(url, {
    id: 6,
    jsonrpc: "2.0",
    method: "starknet_getStorageProof",
    params: {
      block_id,
      contracts_storage_keys: [{
        contract_address: "0x33ba2f0e6fb9a4a63a701728bacd7c86fd7750889c7f454711fa5d2766ce34c",
        storage_keys: [num.toHex(hash.starknetKeccak("counter"))], // "0x007ebcc807b5c7e19f245995a55aed6f46f5f582f476a886b91b834b0ddf5854"
      }],
    }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log("storage key =", num.toHex(hash.starknetKeccak("counter")));
  console.log("Axios starknet_getStorageProof (6) storage response =", answer6.result?.contracts_storage_proofs[0] ?? answer6); // should be: 10

  const { data: answer7 } = await axios.post(url, {
    id: 7,
    jsonrpc: "2.0",
    method: "starknet_getStorageProof",
    params: {
      block_id,
      contracts_storage_keys: [],
      class_hashes: [],
      contract_addresses: [],
    }
  }, {
    headers: {
      "Content-Type":
        "application/json"
    }
  });
  console.log("Axios starknet_getStorageProof (7) empty response =", answer7.result ?? answer7);

  console.log("✅ end of script.");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


