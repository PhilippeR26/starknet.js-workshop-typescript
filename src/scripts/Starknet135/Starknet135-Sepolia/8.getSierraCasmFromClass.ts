// Get Sierra and Casm files from a contract class, in Sepolia  network
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/8.getSierraCasmFromClass.ts
// Coded with Starknet.js v7.1.0

import { RpcProvider, shortString, json, logger, type RPC08, } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  const myProvider = await RpcProvider.create({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
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
  console.log("Provider connected to Starknet Sepolia testnet");


  //const classHash = await myProvider.getClassHashAt(strkAddress);
  const classHash = "0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a"; // BraavosAccountClassHash v1.2.0
  const sierra = await myProvider.getClassByHash(classHash);
  fs.writeFileSync('./compiledContracts/sierra.json', json.stringify(sierra, undefined, 2));
  const casm = await (myProvider.channel as RPC08.RpcChannel).getCompiledCasm(classHash);
  console.log("Cairo compiler version", casm.compiler_version);
  fs.writeFileSync('./compiledContracts/casm.json', json.stringify(casm, undefined, 2));

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
