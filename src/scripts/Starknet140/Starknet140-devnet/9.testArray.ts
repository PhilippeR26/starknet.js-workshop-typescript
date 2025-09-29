// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/6.testFixedArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoCustomEnum } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import type { ResourceBounds } from "@starknet-io/types-js";
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
    const myU8 = 8;
    const myOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, myU8);
    const myResult0 = new CairoResult(CairoResultVariant.Ok, 9);
    const iter2 = ["3", "100", "0", "200"][Symbol.iterator]();

    // simple array Cairo1
    const arr0 = new CairoArray([10, 20], "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr0 =", LogC.reset, arr0);
    console.log(arr0.toApiRequest());
    console.log(arr0.decompose(hdParsingStrategy));
    const arr1 = new CairoArray({ "0": 10, "1": 20 }, "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr1 =", LogC.reset, arr1);
    console.log(arr1.toApiRequest());
    console.log(arr1.decompose(hdParsingStrategy));
    const arr2 = new CairoArray(iter2, "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr2 =", LogC.reset, arr2);
    console.log(arr2.toApiRequest());
    console.log(arr2.decompose(hdParsingStrategy));
    const arr3 = new CairoArray(arr0, "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr3 =", LogC.reset, arr3);
    console.log(arr3.toApiRequest());
    console.log(arr3.decompose(hdParsingStrategy));

    // empty array
    const arr4 = new CairoArray([], "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr4 =", LogC.reset, arr4);
    console.log(arr4.toApiRequest());
    console.log(arr4.decompose(hdParsingStrategy));

    // simple array Cairo0
    const arr10 = new CairoArray([10, 20], "felt*", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr10 =", LogC.reset, arr10);
    console.log(arr10.toApiRequest());
    console.log(arr10.decompose(hdParsingStrategy));

    // Array including an array
    const arr5 = new CairoArray([[20, 30]], "core::array::Array::<core::array::Array::<core::integer::u8>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr5 =", LogC.reset, arr5);
    console.log(arr5.toApiRequest());
    console.log(arr5.decompose(hdParsingStrategy));

    // Array including a fixed array
    const arr6 = new CairoArray([[20, 30]], "core::array::Array::<[core::integer::u8; 2]>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr6 =", LogC.reset, arr6);
    console.log(arr6.toApiRequest());
    console.log(arr6.decompose(hdParsingStrategy));

    // Array including a tuple
    const arr7 = new CairoArray([cairo.tuple(20, 30), cairo.tuple(100, 110)], "core::array::Array::<(core::integer::u8, core::integer::u16)>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr7 =", LogC.reset, arr7);
    console.log(arr7.toApiRequest());
    console.log(arr7.decompose(hdParsingStrategy));

    // Array of options
    const arr8 = new CairoArray([myOption0, myOption0], "core::array::Array::<core::option::Option::<core::integer::u8>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr8 =", LogC.reset, arr8);
    console.log(arr8.toApiRequest());
    console.log(arr8.decompose(hdParsingStrategy));

    // Array of results
    const arr9 = new CairoArray([myResult0, myResult0], "core::array::Array::<core::result::Result::<core::integer::u8, core::integer::u16>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr9 =", LogC.reset, arr9);
    console.log(arr9.toApiRequest());
    console.log(arr9.decompose(hdParsingStrategy));

    // Array of struct
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const strategies = myTestCallData.parser.parsingStrategies;
    type Point = {
        x: BigNumberish,
        y: BigNumberish,
    }
    const myPoint: Point = { x: 1, y: 2 };
    const arr11 = new CairoArray([myPoint, myPoint], "core::array::Array::<enums::Point>", strategies);
    console.log(LogC.bg.yellow, "arr11 =", LogC.reset, arr11);
    console.log("  encode =", arr11.toApiRequest());
    console.log("  decode =", arr11.decompose(strategies));

    // Array including a custom enum
    const myEnum=new CairoCustomEnum({Success:23})
    const arr12 = new CairoArray([myEnum, myEnum], "core::array::Array::<enums::MyEnum>", strategies);
    console.log(LogC.bg.yellow, "arr12 =", LogC.reset, arr12);
    console.log(arr12.toApiRequest());
    console.log(arr12.decompose(strategies));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });