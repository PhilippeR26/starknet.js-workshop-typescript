// test format WebAuthN signature.
// Launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/1.testWebAuthNsignature.ts
// Coded with Starknet.js v8 experimental

import { RpcProvider, shortString, Account, type BlockIdentifier, BlockTag, json, Contract, stark, type FeeEstimate, type ResourceBounds, num, type CompiledSierra, CallData, CairoCustomEnum, type BigNumberish, parseCalldataField, type AbiEntry, CairoBytes31 } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import axios from "axios";
import type { BlockWithTxHashes } from "@starknet-io/types-js";
import { strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
  // ********* Mainnet **************
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_8" });
  // ********* Sepolia Testnet **************
  // *** local pathfinder Sepolia Testnet node
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // *** local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  // logger.setLogLevel("ERROR");
  // config.set("legacyMode",true);
  console.log("ert");
  console.log(
    "chain Id =", new CairoBytes31 (await myProvider.getChainId()).decodeUtf8(),
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

  // Main code
  const ReadySierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii")) as CompiledSierra;
  const ReadyCallData = new CallData(ReadySierra.abi);
  type WebAuthNSignature = {
    cross_origin: boolean,
    client_data_json_outro: BigNumberish[],
    flags: number,
    sign_count: number,
    ec_signature: { r: BigNumberish; s: BigNumberish; y_parity: boolean },
    sha256_implementation: CairoCustomEnum;
  };
  const sierraSignature: WebAuthNSignature = {
    cross_origin: false,
    client_data_json_outro: [10, 20],
    flags: 2,
    sign_count: 100,
    ec_signature: { r: 200, s: 300, y_parity: true },
    sha256_implementation: new CairoCustomEnum({ Cairo0: {} }),
  };

  const params = [sierraSignature];
  const selectedType = "argent::signer::webauthn::WebauthnSignature";
  const iter = params[Symbol.iterator]();
  const structs = CallData.getAbiStruct(ReadySierra.abi);
  const enums = CallData.getAbiEnum(ReadySierra.abi);
  const abiExtract = ReadySierra.abi.find((abiItem) => abiItem.name === selectedType);
  const inputAbi: AbiEntry = { name: abiExtract.type, type: abiExtract.name };
  const encoded = parseCalldataField(iter, inputAbi, structs, enums);

  console.log(encoded);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

