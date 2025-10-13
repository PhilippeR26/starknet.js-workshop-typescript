// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/11.testStruct.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoStruct, type AbiEntry, type AbiStruct, createAbiParser, CairoCustomEnum } from "starknet";
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
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const strategies = myTestCallData.parser.parsingStrategies;
    console.log("strategies =", strategies);

    const myU8 = 8;
    const myOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, myU8);
    const myResult0 = new CairoResult(CairoResultVariant.Ok, 9);
    const iter2 = ["2", "3"][Symbol.iterator]();

    // abi of Point:
    // {
    //         "type": "struct",
    //         "name": "enums::Point",
    //         "members": [
    //             {
    //                 "name": "x",
    //                 "type": "core::integer::u64"
    //             },
    //             {
    //                 "name": "y",
    //                 "type": "core::integer::u32"
    //             }
    //         ]
    //     }
    type Point = {
        x: BigNumberish,
        y: BigNumberish,
    }
    const myPoint: Point = { x: 1, y: 2 };

    // CairoStruct from object
    const abiPoint = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Point") as AbiStruct | undefined;
    console.log("abiPoint", abiPoint);
    const struct10 = new CairoStruct(myPoint, abiPoint as AbiStruct, strategies);
    console.log(LogC.bg.yellow, "struct10 =", LogC.reset, struct10);
    console.log("  encode =", struct10.toApiRequest());
    console.log("  decode =", struct10.decompose(strategies));
    const struct10a = new CairoStruct({ y: 2, x: 1 }, abiPoint as AbiStruct, strategies);
    console.log(LogC.bg.yellow, "struct10a =", LogC.reset, struct10a);
    console.log("  encode =", struct10a.toApiRequest());
    console.log("  decode =", struct10a.decompose(strategies));

    // CairoStruct from iterator
    const struct11 = new CairoStruct(iter2, abiPoint as AbiStruct, strategies);
    console.log(LogC.bg.yellow, "struct11 =", LogC.reset, struct11);
    console.log("  encode =", struct11.toApiRequest());
    console.log("  decode =", struct11.decompose(strategies));

    // CairoStruct from CairoStruct
    const struct12 = new CairoStruct(struct10, abiPoint as AbiStruct, strategies);
    console.log(LogC.bg.yellow, "struct12 =", LogC.reset, struct12);
    console.log("  encode =", struct12.toApiRequest());
    console.log("  decode =", struct12.decompose(strategies));

    // CairoStruct including a CairoStruct
    const abiStruct2 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Point2") as AbiStruct | undefined;
    // {
    //         "type": "struct",
    //         "name": "enums::Point2",
    //         "members": [
    //             {
    //                 "name": "thickness",
    //                 "type": "core::integer::u64"
    //             },
    //             {
    //                 "name": "location",
    //                 "type": "enums::Point"
    //             }
    //         ]
    //     } ;
    const struct1 = new CairoStruct({ thickness: 8, location: struct10 }, abiStruct2!, strategies);
    console.log(LogC.bg.yellow, "struct1 =", LogC.reset, struct1);
    console.log("  encode =", struct1.toApiRequest());
    console.log("  decode =", struct1.decompose(strategies));

    const struct1a = new CairoStruct({ thickness: 8, location: { x: 1, y: 2 } }, abiStruct2!, strategies);
    console.log(LogC.bg.yellow, "struct1a =", LogC.reset, struct1a);
    console.log("  encode =", struct1a.toApiRequest());
    console.log("  decode =", struct1a.decompose(strategies));

    // CairoStruct including a tuple
    type Cat = {
        age: BigNumberish,
        legs: Record<number, BigNumberish | object | boolean>
    }
    const abiStruct1b = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Cat") as AbiStruct | undefined;
    const myTuple1b = cairo.tuple(10, 11, 12, 13);
    const myCat: Cat = { age: 3, legs: myTuple1b }
    const struct1b = new CairoStruct(myCat, abiStruct1b!, strategies);
    console.log(LogC.bg.yellow, "struct1b =", LogC.reset, struct1b);
    console.log("  encode =", struct1b.toApiRequest());
    console.log("  decode =", struct1b.decompose(strategies));


    // CairoStruct including an array
    type Dog = {
        age: BigNumberish,
        colors: BigNumberish[],
    }
    const myDog: Dog = { age: 7, colors: [4, 5, 6] };
    const abiStruct3 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Dog") as AbiStruct | undefined;
    console.log("abiStruct3 =", abiStruct3);
    const struct3 = new CairoStruct(myDog, abiStruct3!, strategies);
    console.log(LogC.bg.yellow, "Struct3 =", LogC.reset, struct3);
    console.log("  encode =", struct3.toApiRequest());
    console.log("  decode =", struct3.decompose(strategies));

    // CairoStruct including a fixed array
    type Horse = {
        age: BigNumberish,
        legs_color: BigNumberish[],
    }
    const myHorse: Horse = { age: 2, legs_color: [5, 6, 7, 8] };
    const abiStruct4 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Horse") as AbiStruct | undefined;
    console.log("abiStruct4 =", abiStruct4);
    const struct4 = new CairoStruct(myHorse, abiStruct4!, strategies);
    console.log(LogC.bg.yellow, "Struct4 =", LogC.reset, struct4);
    console.log("  encode =", struct4.toApiRequest());
    console.log("  decode =", struct4.decompose(strategies));

    // CairoStruct including an option
    type Truck = {
        power: BigNumberish,
        turbo: CairoOption<BigNumberish>,
    }
    const myTruck: Truck = { power: 256, turbo: new CairoOption<BigNumberish>(CairoOptionVariant.Some, 2) };
    const abiStruct5 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Truck") as AbiStruct | undefined;
    console.log("abiStruct5 =", abiStruct5);
    const struct5 = new CairoStruct(myTruck, abiStruct5!, strategies);
    console.log(LogC.bg.yellow, "Struct5 =", LogC.reset, struct5);
    console.log("  encode =", struct5.toApiRequest());
    console.log("  decode =", struct5.decompose(strategies));
    // CairoStruct including a result
    type Destruction = {
        area: BigNumberish,
        res: CairoResult<BigNumberish, BigNumberish>,
    }
    const myDestruction: Destruction = { area: 100, res: new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Err, 2) };
    const abiStruct6 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Destruction") as AbiStruct | undefined;
    console.log("abiStruct6 =", abiStruct6);
    const struct6 = new CairoStruct(myDestruction, abiStruct6!, strategies);
    console.log(LogC.bg.yellow, "Struct6 =", LogC.reset, struct6);
    console.log("  encode =", struct6.toApiRequest());
    console.log("  decode =", struct6.decompose(strategies));

    // empty CairoStruct
    const myEmpty = {};
    const abiStruct9 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::Empty") as AbiStruct | undefined;
    console.log("abiStruct9 =", abiStruct9);
    const struct9 = new CairoStruct(myEmpty, abiStruct9!, strategies);
    console.log(LogC.bg.yellow, "struct9 =", LogC.reset, struct9);
    console.log("  encode =", struct9.toApiRequest());
    console.log("  decode =", struct9.decompose(strategies));

    console.log("enums =", CallData.getAbiEnum(compiledSierra.abi)["enums::MyEnum"]);

    // CairoStruct including a Cairo Enum
    const abiStruct13 = myTestCallData.abi.find((data: AbiEntry) => data.name == "enums::ExecutionReport") as AbiStruct | undefined;
    console.log("abiStruct13 =", abiStruct13);
    const customEnum13 = new CairoCustomEnum({ Success: 32 });
    const struct13 = new CairoStruct({ message: customEnum13, description: "CCC" }, abiStruct13!, strategies);
    console.log(LogC.bg.yellow, "struct13 =", LogC.reset, struct13);
    console.log("  encode =", struct13.toApiRequest());
    console.log("  decode =", struct13.decompose(strategies));


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });