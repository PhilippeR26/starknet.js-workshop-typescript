// Get Sierra and Casm files from a contract class, in Sepolia  network
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/8.getSierraCasmFromClass.ts
// Coded with Starknet.js v10.0.2

import { RpcProvider, shortString, json, logger, CairoBytes31 } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
dotenv.config({ quiet: true });


async function main() {
  // ********* Sepolia Testnet **************
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey });
  // local pathfinder Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http:////localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  // Check that communication with provider is OK
  const chainId = await myProvider.getChainId();
  console.log(
    "chain Id =", new CairoBytes31(chainId).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected.");


  //const classHash = await myProvider.getClassHashAt(strkAddress);
  const classHash = "0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2";
  const sierra = await myProvider.getClassByHash(classHash);
  fs.writeFileSync('./compiledContracts/sierra.json', json.stringify(sierra, undefined, 2));
  const casm = await myProvider.getCompiledCasm(classHash);
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
