// Test Cairo Result with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/10.testResult.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoTypeResult, CairoResult, CairoResultVariant, CairoCustomEnum } from "starknet";
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
    const input = "core::result::Result::<core::array::Span::<core::felt252>, (core::integer::u8, core::option::Option::<core::integer::u16>)>";

    console.log(CairoTypeResult.getVariantTypes(input));

    // *** Result from a CairoType
    // const myU8 = new CairoUint8(200);
    const myU8 = 8;
    const myResult0 = new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Ok, myU8);

    // Result from num
    const myResult1 = new CairoTypeResult(myU8, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult1 =", LogC.reset, myResult1);
    console.log("  encode =", myResult1.toApiRequest());
    console.log("  decode =", myResult1.decompose(hdParsingStrategy));
    const myResult1Err = new CairoTypeResult(myU8, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy, CairoResultVariant.Err);
    console.log(LogC.bg.yellow, "myResult1Err =", LogC.reset, myResult1Err);
    console.log("  encode =", myResult1Err.toApiRequest());
    console.log("  decode =", myResult1Err.decompose(hdParsingStrategy));

    // Result from iterator
    const iter2 = ["0", "100"][Symbol.iterator]();
    const myResult2 = new CairoTypeResult(iter2, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult2 =", LogC.reset, myResult2);
    console.log("  encode =", myResult2.toApiRequest());
    console.log("  decode =", myResult2.decompose(hdParsingStrategy));
    const iter3 = ["1", "100"][Symbol.iterator]();
    const myResult2Err = new CairoTypeResult(iter3, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult2Err =", LogC.reset, myResult2Err);
    console.log("  encode =", myResult2Err.toApiRequest());
    console.log("  decode =", myResult2Err.decompose(hdParsingStrategy));

    // Result from CairoResult
    const myResult3 = new CairoTypeResult(myResult0, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult3 =", LogC.reset, myResult3);
    console.log("  encode =", myResult3.toApiRequest());
    console.log("  decode =", myResult3.decompose(hdParsingStrategy));
    const myResult3Err = new CairoTypeResult(myResult1Err, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult3Err =", LogC.reset, myResult3Err);
    console.log("  encode =", myResult3Err.toApiRequest());
    console.log("  decode =", myResult3Err.decompose(hdParsingStrategy));

    // Result of Result 
    const myResult4 = new CairoResult(CairoResultVariant.Err, myResult0);
    const myResult4b = new CairoTypeResult(myU8, "core::result::Result::<core::integer::u16, core::integer::u32>", hdParsingStrategy, CairoResultVariant.Ok, true);
    console.log(LogC.bg.yellow, "myResult4b =", LogC.reset, myResult4b);
    const myResult4c = new CairoTypeResult(myResult0, "core::result::Result::<core::integer::u8, core::result::Result::<core::integer::u16, core::integer::u32>>", hdParsingStrategy, CairoResultVariant.Err, true);
    console.log(LogC.bg.yellow, "myResult4c =", LogC.reset, myResult4c);
    const myResult5 = new CairoTypeResult(myResult4, "core::result::Result::<core::integer::u8, core::result::Result::<core::integer::u16, core::integer::u32>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult5 =", LogC.reset, myResult5);
    console.log("  encode =", myResult5.toApiRequest());
    console.log("  decode =", myResult5.decompose(hdParsingStrategy));

    // Result of Result of Result
    const myResult6 = new CairoResult(CairoResultVariant.Ok, myResult4);
    console.log(LogC.bg.yellow, "myResult6 =", LogC.reset, myResult6);
    const myResult7 = new CairoTypeResult(myResult6, "core::result::Result::<core::result::Result::<core::integer::u8, core::result::Result::<core::integer::u16, core::integer::u32>>, core::integer::u32>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult7 =", LogC.reset, myResult7);
    console.log("  encode =", myResult7.toApiRequest());
    console.log("  decode =", myResult7.decompose(hdParsingStrategy));
    const resp = myResult7.decompose(hdParsingStrategy).unwrap().unwrap().unwrap();
    console.log({ resp });

    // Result of Option 
    const myOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, myU8);
    const myResult8 = new CairoResult(CairoResultVariant.Err, myOption0);
    const myResult9 = new CairoTypeResult(myResult8, "core::result::Result::<core::integer::u8, core::option::Option::<core::integer::u8>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myResult9 =", LogC.reset, myResult9);
    console.log("  encode =", myResult9.toApiRequest());
    console.log("  unwrap =", myResult9.decompose(hdParsingStrategy));

    // Result of CairoFixedArray
    const fArr0 = new CairoFixedArray([1, 2, 3], "[core::integer::u8; 3]", hdParsingStrategy);
    const myResult10 = new CairoTypeResult(fArr0, "core::result::Result::<[core::integer::u8; 3], core::integer::u32>", hdParsingStrategy, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult10 =", LogC.reset, myResult10);
    console.log("  encode =", myResult10.toApiRequest());
    console.log("  decode =", myResult10.decompose(hdParsingStrategy));

    // Result of fixed array
    const myResult11 = new CairoTypeResult([1, 2, 3], "core::result::Result::<core::integer::u32, [core::integer::u8; 3]>", hdParsingStrategy, CairoResultVariant.Err);
    console.log(LogC.bg.yellow, "myResult11 =", LogC.reset, myResult11);
    console.log("  encode =", myResult11.toApiRequest());
    console.log("  decode =", myResult11.decompose(hdParsingStrategy));

    // Result of array
    const myResult12 = new CairoTypeResult([1, 2, 3], "core::result::Result::<core::array::Array::<core::integer::u8>, core::integer::u32>", hdParsingStrategy, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult12 =", LogC.reset, myResult12);
    console.log("  encode =", myResult12.toApiRequest());
    console.log("  decode =", myResult12.decompose(hdParsingStrategy));

    // Result of CairoArray
    const myArr1 = new CairoArray([10, 11, 12], "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    const myResult13 = new CairoTypeResult(myArr1, "core::result::Result::<core::integer::u32, core::array::Array::<core::integer::u8>>", hdParsingStrategy, CairoResultVariant.Err);
    console.log(LogC.bg.yellow, "myResult13 =", LogC.reset, myResult13);
    console.log("  encode =", myResult13.toApiRequest());
    console.log("  decode =", myResult13.decompose(hdParsingStrategy));

    // Result of tuple
    const myResult14 = new CairoTypeResult([100, 10], "core::result::Result::<(core::integer::u16, core::integer::u8), core::integer::u32>", hdParsingStrategy, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult14 =", LogC.reset, myResult14);
    console.log("  encode =", myResult14.toApiRequest());
    console.log("  decode =", myResult14.decompose(hdParsingStrategy));

    // result including a struct
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
            const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
        const strategies=myTestCallData.parser.parsingStrategies;
        type Point = {
            x: BigNumberish,
            y: BigNumberish,
        }
        const myPoint: Point = { x: 1, y: 2 };
    const myResult15 = new CairoTypeResult(myPoint, "core::result::Result::<enums::Point, core::integer::u32>", strategies, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult15 =", LogC.reset, myResult15);
    console.log("  encode =", myResult15.toApiRequest());
    console.log("  decode =", myResult15.decompose(strategies));

    // Result including a Cairo Enum
    const myEnum16=new CairoCustomEnum({Success: 3});
const myResult16 = new CairoTypeResult(myEnum16, "core::result::Result::<enums::MyEnum, core::integer::u32>", strategies, CairoResultVariant.Ok);
    console.log(LogC.bg.yellow, "myResult16 =", LogC.reset, myResult16);
    console.log("  encode =", myResult16.toApiRequest());
    console.log("  decode =", myResult16.decompose(strategies));


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });