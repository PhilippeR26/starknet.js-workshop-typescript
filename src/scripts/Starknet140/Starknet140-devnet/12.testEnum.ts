// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/12.testEnum.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoStruct, type AbiEntry, type AbiStruct, CairoCustomEnum, CairoTypeCustomEnum, type AbiEnum, CairoFixedArray, CairoTypeResult } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import axios from "axios";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import LogC from "../../utils/logColors";
dotenv.config();




async function main() {
  // initialize Provider 
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

  // Check that communication with provider is OK
  console.log(
    // "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Devnet.");

  //process.exit(5);
  // *** Devnet
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;

  // *** initialize existing Sepolia Testnet account
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');

  // ********** main code
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
  const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
  const strategies = myTestCallData.parser.parsingStrategies;
  console.log("strategies =", strategies);
  const abiPoint = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Point") as AbiStruct | undefined;
  console.log("abiPoint", abiPoint);
  // {
  //   "type": "enum",
  //   "name": "enums::MyEnum",
  //   "variants": [
  //       {
  //           "name": "Success",
  //           "type": "core::integer::u8"
  //       },
  //       {
  //           "name": "LocationError",
  //           "type": "enums::Point"
  //       },
  //       {
  //           "name": "TwoErrors",
  //           "type": "[core::integer::u32; 2]"
  //       },
  //       {
  //           "name": "ErrorList",
  //           "type": "core::array::Span::<core::integer::u256>"
  //       },
  //       {
  //           "name": "Parents",
  //           "type": "(core::integer::u64, core::integer::u128)"
  //       },
  //       {
  //           "name": "Damage",
  //           "type": "core::option::Option::<core::integer::u8>"
  //       },
  //       {
  //           "name": "Report",
  //           "type": "core::result::Result::<core::integer::u32, core::integer::u64>"
  //       },
  //       {
  //           "name": "Empty",
  //           "type": "()"
  //       }
  //   ]
  // },

  // CairoTypeCustomEnum from CairoCustomEnum
  const enum0 = new CairoCustomEnum({ Success: 32 });
  console.log({ enum0 });

  const abiMyEnum = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::MyEnum") as AbiEnum;
  console.log("abiMyEnum", abiMyEnum);
  const enum10 = new CairoTypeCustomEnum(enum0, abiMyEnum as AbiEnum, strategies, 0);
  console.log(LogC.bg.yellow, "enum10 =", LogC.reset, enum10);
  console.log("encoded =", enum10.toApiRequest());
  const result10 = enum10.decompose(strategies)
  console.log("decoded =", result10.activeVariant(), result10.unwrap(), result10.variant);

  // CairoTypeCustomEnum from iterator
  const iter2 = ["0", "3"][Symbol.iterator]();
  const enum11 = new CairoTypeCustomEnum(iter2, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum11 =", LogC.reset, enum11);
  console.log(enum11.toApiRequest());
  const result11 = enum11.decompose(strategies)
  console.log(result11.activeVariant(), result11.unwrap(), result11.variant);

  // CairoTypeCustomEnum from CairoTypeCustomEnum
  const enum12 = new CairoTypeCustomEnum(enum10, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum12 =", LogC.reset, enum12);
  console.log(enum12.toApiRequest());
  const result12 = enum12.decompose(strategies)
  console.log(result12.activeVariant(), result12.unwrap(), result12.variant);

  // CairoTypeCustomEnum from CairoCustomEnum including a CairoCustomEnum
  const enum13a = new CairoCustomEnum({ NoAnswer: {} });
  const enum13Parent = new CairoCustomEnum({ Status: enum13a });
  const enum13 = new CairoTypeCustomEnum(enum13Parent, abiMyEnum, strategies, 2);
  console.log(LogC.bg.yellow, "enum13 =", LogC.reset, enum13);
  console.log("encoded =", enum13.toApiRequest());
  const result13 = enum13.decompose(strategies)
  console.log("decoded =", result13.activeVariant(), result13.unwrap(), result13.variant);

  // CairoTypeCustomEnum including a CairoStruct
  const enum1 = new CairoTypeCustomEnum({ x: 8, y: 9 }, abiMyEnum, strategies, 1);
  console.log(LogC.bg.yellow, "enum1 =", LogC.reset, enum1);
  console.log("encoded =", enum1.toApiRequest());
  const result1 = enum1.decompose(strategies)
  console.log("decoded =", result1.activeVariant(), result1.unwrap(), result1.variant);

  const myStruct1a = new CairoStruct({ x: 4, y: 5 }, abiPoint!, strategies);
  const enum1a = new CairoTypeCustomEnum(myStruct1a, abiMyEnum, strategies, 1);
  console.log(LogC.bg.yellow, "enum1a =", LogC.reset, enum1a);
  console.log("encoded =", enum1a.toApiRequest());
  const result1a = enum1a.decompose(strategies)
  console.log("decoded =", result1a.activeVariant(), result1a.unwrap(), result1a.variant);

  const enum1b = new CairoTypeCustomEnum(enum1a, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum1b =", LogC.reset, enum1b);
  console.log("encoded =", enum1b.toApiRequest());
  const result1b = enum1b.decompose(strategies)
  console.log("decoded =", result1b.activeVariant(), result1b.unwrap(), result1b.variant);

  // CairoTypeCustomEnum including a tuple
  const enum2 = new CairoTypeCustomEnum([4, 5], abiMyEnum, strategies, 5);
  console.log(LogC.bg.yellow, "enum2 =", LogC.reset, enum2);
  console.log("encoded =", enum2.toApiRequest());
  const result2 = enum2.decompose(strategies)
  console.log("decoded =", result2.activeVariant(), result2.unwrap(), result2.variant);

  const enum2a = new CairoTypeCustomEnum(new CairoTuple({ 0: 5, 1: 6 }, "(core::integer::u64, core::integer::u128)", strategies), abiMyEnum, strategies, 5);
  console.log(LogC.bg.yellow, "enum2a =", LogC.reset, enum2a);
  console.log("encoded =", enum2a.toApiRequest());
  const result2a = enum2a.decompose(strategies)
  console.log("decoded =", result2a.activeVariant(), result2a.unwrap(), result2a.variant);

  const enum2b = new CairoTypeCustomEnum(enum2, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum2b =", LogC.reset, enum2b);
  console.log("encoded =", enum2b.toApiRequest());
  const result2b = enum2b.decompose(strategies)
  console.log("decoded =", result2b.activeVariant(), result2b.unwrap(), result2b.variant);

  // CairoTypeCustomEnum including an array
  const enum3 = new CairoTypeCustomEnum([3, 4], abiMyEnum, strategies, 4);
  console.log(LogC.bg.yellow, "enum3 =", LogC.reset, enum3);
  console.log("encoded =", enum3.toApiRequest());
  const result3 = enum3.decompose(strategies)
  console.log("decoded =", result3.activeVariant(), result3.unwrap(), result3.variant);

  const enum3a = new CairoTypeCustomEnum(new CairoArray([5, 6, 7], "core::array::Array::<core::integer::u256>", strategies), abiMyEnum, strategies, 4);
  console.log(LogC.bg.yellow, "enum3a =", LogC.reset, enum3a);
  console.log("encoded =", enum3a.toApiRequest());
  const result3a = enum3a.decompose(strategies)
  console.log("decoded =", result3a.activeVariant(), result3a.unwrap(), result3a.variant);

  const enum3b = new CairoTypeCustomEnum(enum3, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum3b =", LogC.reset, enum3b);
  console.log("encoded =", enum3b.toApiRequest());
  const result3b = enum3b.decompose(strategies)
  console.log("decoded =", result3b.activeVariant(), result3b.unwrap(), result3b.variant);

  // CairoTypeCustomEnum including a fixed array
  const enum4 = new CairoTypeCustomEnum([2, 3], abiMyEnum, strategies, 4);
  console.log(LogC.bg.yellow, "enum4 =", LogC.reset, enum4);
  console.log("encoded =", enum4.toApiRequest());
  const result4 = enum4.decompose(strategies)
  console.log("decoded =", result4.activeVariant(), result4.unwrap(), result4.variant);

  const enum4a = new CairoTypeCustomEnum(new CairoFixedArray([6, 7], "[core::integer::u32; 2]", strategies), abiMyEnum, strategies, 3);
  console.log(LogC.bg.yellow, "enum4a =", LogC.reset, enum4a);
  console.log("encoded =", enum4a.toApiRequest());
  const result4a = enum4a.decompose(strategies)
  console.log("decoded =", result4a.activeVariant(), result4a.unwrap(), result4a.variant);

  const enum4b = new CairoTypeCustomEnum(enum4, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum4b =", LogC.reset, enum4b);
  console.log("encoded =", enum4b.toApiRequest());
  const result4b = enum4b.decompose(strategies)
  console.log("decoded =", result4b.activeVariant(), result4b.unwrap(), result4b.variant);

  // CairoTypeCustomEnum including an option
  const option4 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 8);
  const enum5 = new CairoTypeCustomEnum(option4, abiMyEnum, strategies, 6);
  console.log(LogC.bg.yellow, "enum5 =", LogC.reset, enum5);
  console.log("encoded =", enum5.toApiRequest());
  const result5 = enum5.decompose(strategies)
  console.log("decoded =", result5.activeVariant(), result5.unwrap(), result5.variant);

  const enum5a = new CairoTypeCustomEnum(new CairoTypeOption(9, "core::option::Option::<core::integer::u8>", strategies, CairoOptionVariant.Some), abiMyEnum, strategies, 6);
  console.log(LogC.bg.yellow, "enum5a =", LogC.reset, enum5a);
  console.log("encoded =", enum5a.toApiRequest());
  const result5a = enum5a.decompose(strategies)
  console.log("decoded =", result5a.activeVariant(), result5a.unwrap(), result5a.variant);

  const enum5b = new CairoTypeCustomEnum(enum5, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum5b =", LogC.reset, enum5b);
  console.log("encoded =", enum5b.toApiRequest());
  const result5b = enum5b.decompose(strategies)
  console.log("decoded =", result5b.activeVariant(), result5b.unwrap(), result5b.variant);

  // CairoStruct including a result
  const myResult6 = new CairoResult<BigNumberish,BigNumberish>(CairoResultVariant.Ok, 9);
  const enum6 = new CairoTypeCustomEnum(myResult6, abiMyEnum, strategies, 7);
  console.log(LogC.bg.yellow, "enum6 =", LogC.reset, enum6);
  console.log("encoded =", enum6.toApiRequest());
  const result6 = enum6.decompose(strategies)
  console.log("decoded =", result6.activeVariant(), result6.unwrap(), result6.variant);

  const enum6a = new CairoTypeCustomEnum(new CairoTypeResult(4, "core::result::Result::<core::integer::u32, core::integer::u64>", strategies, CairoResultVariant.Ok), abiMyEnum, strategies, 7);
  console.log(LogC.bg.yellow, "enum6a =", LogC.reset, enum6a);
  console.log("encoded =", enum6a.toApiRequest());
  const result6a = enum6a.decompose(strategies)
  console.log("decoded =", result6a.activeVariant(), result6a.unwrap(), result6a.variant);

  const enum6b = new CairoTypeCustomEnum(enum6, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum6b =", LogC.reset, enum6b);
  console.log("encoded =", enum6b.toApiRequest());
  const result6b = enum6b.decompose(strategies)
  console.log("decoded =", result6b.activeVariant(), result6b.unwrap(), result6b.variant);
  
  // CairoStruct including an empty CairoStruct
   const myEmpty = {};
  const enum7 = new CairoTypeCustomEnum(myEmpty, abiMyEnum, strategies, 8);
  console.log(LogC.bg.yellow, "enum7 =", LogC.reset, enum7);
  console.log("encoded =", enum7.toApiRequest());
  const result7 = enum7.decompose(strategies)
  console.log("decoded =", result7.activeVariant(), result7.unwrap(), result7.variant);

  const enum7a = new CairoTypeCustomEnum(new CairoTuple({}, "()", strategies), abiMyEnum, strategies, 8);
  console.log(LogC.bg.yellow, "enum7a =", LogC.reset, enum7a);
  console.log("encoded =", enum7a.toApiRequest());
  const result7a = enum7a.decompose(strategies)
  console.log("decoded =", result7a.activeVariant(), result7a.unwrap(), result7a.variant);

  const enum7b = new CairoTypeCustomEnum(enum7, abiMyEnum, strategies);
  console.log(LogC.bg.yellow, "enum7b =", LogC.reset, enum7b);
  console.log("encoded =", enum7b.toApiRequest());
  const result7b = enum7b.decompose(strategies)
  console.log("decoded =", result7b.activeVariant(), result7b.unwrap(), result7b.variant);
  
  // CallData.compile
  const enum8 = new CairoCustomEnum({ Success: undefined,
  LocationError: undefined,
  Status: undefined,
  TwoErrors: CairoFixedArray.compile([3,4]),
  ErrorList: undefined,
  Parents: undefined,
  Damage: undefined,
  Report: undefined,
  Empty: undefined
 });
  const enum8a=new CairoTypeCustomEnum(enum8,abiMyEnum,strategies,0)
  const compiled8= CallData.compile([enum8]);
  console.log("enum8 CallData.compile array =",compiled8);
const compiled8a= CallData.compile([enum8a]);
  console.log("enum8a CallData.compile array =",compiled8a);
  const compiled8b= CallData.compile({x:enum8});
  console.log("enum8 CallData.compile object =",compiled8b);

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });