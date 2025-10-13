// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/8.testTuple.ts
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
    const iter2 = ["0", "100", "0", "200"][Symbol.iterator]();

    // tuple from object
    const tup0 = new CairoTuple(cairo.tuple(100, 200), "(core::integer::u8, core::integer::u16)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup0 =", LogC.reset, tup0);
    console.log(tup0.toApiRequest());
    console.log(tup0.decompose(hdParsingStrategy));

    // tuple from CairoTuple
    const tup10 = new CairoTuple(tup0, "(core::integer::u8, core::integer::u16)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup10 =", LogC.reset, tup10);
    console.log(tup10.toApiRequest());
    console.log(tup10.decompose(hdParsingStrategy));

    // tuple from array
    const tup2 = new CairoTuple([100, 200], "(core::integer::u8, core::integer::u16)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup2 =", LogC.reset, tup2);
    console.log(tup2.toApiRequest());
    console.log(tup2.decompose(hdParsingStrategy));

    // tuple including a tuple
    const tup1 = new CairoTuple(cairo.tuple(100, cairo.tuple(200, 300)), "(core::integer::u8, (core::integer::u8, core::integer::u16))", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup1 =", LogC.reset, tup1);
    console.log(tup1.toApiRequest());
    console.log(tup1.decompose(hdParsingStrategy));

    console.log("extract types tuple:");
    console.log("Cairo 0", CairoTuple.getTupleElementTypes("(a:felt, b:felt)"));
    console.log("Cairo 1", CairoTuple.getTupleElementTypes("(core::integer::u8, core::integer::u16)"));

    // tuple including an array
    const tup3 = new CairoTuple(cairo.tuple(100, [10, 20]), "(core::integer::u8, core::array::Array::<core::integer::u8>)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup3 =", LogC.reset, tup3);
    console.log(tup3.toApiRequest());
    console.log(tup3.decompose(hdParsingStrategy));

    // tuple including a fixed array
    const tup4 = new CairoTuple(cairo.tuple(100, [10, 20]), "(core::integer::u8, [core::integer::u32; 2])", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup4 =", LogC.reset, tup4);
    console.log(tup4.toApiRequest());
    console.log(tup4.decompose(hdParsingStrategy));

    // tuple including an option
    const tup5 = new CairoTuple(cairo.tuple(100, myOption0), "(core::integer::u8, core::option::Option::<core::integer::u8>)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup5 =", LogC.reset, tup5);
    console.log(tup5.toApiRequest());
    console.log(tup5.decompose(hdParsingStrategy));

    // tuple including an option, from an iterator
    const tup6 = new CairoTuple(iter2, "(core::option::Option::<core::integer::u8>, core::option::Option::<core::integer::u16>)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup6 =", LogC.reset, tup6);
    console.log(tup6.toApiRequest());
    console.log(tup6.decompose(hdParsingStrategy));

    // Cairo 0 tuple
    console.log("getTupleElementTypes :");
    console.log(CairoTuple.getTupleElementTypes("(core::integer::u8, core::array::Array::<core::integer::u8>)"));
    console.log(CairoTuple.getTupleElementTypes("(x:felt, y:felt)"));
    console.log(CairoTuple.getTupleElementTypes("(felt, felt)"));
    const tup7 = new CairoTuple(cairo.tuple(100, 200), "(x:felt, y:felt)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup7 =", LogC.reset, tup7);
    console.log(tup7.toApiRequest());
    console.log(tup7.decompose(hdParsingStrategy));
    const tup8 = new CairoTuple(cairo.tuple(100, 200), "(felt, felt)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup8 =", LogC.reset, tup8);
    console.log(tup8.toApiRequest());
    console.log(tup8.decompose(hdParsingStrategy));

    // empty tuple
    const tup9 = new CairoTuple(cairo.tuple(), "()", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup9 =", LogC.reset, tup9);
    console.log("  encode =", tup9.toApiRequest());
    console.log("  decode =", tup9.decompose(hdParsingStrategy));

    // tuple including an option
    const tup11 = new CairoTuple(cairo.tuple(100, myResult0), "(core::integer::u8, core::result::Result::<core::integer::u8, core::integer::u16>)", hdParsingStrategy);
    console.log(LogC.bg.yellow, "tup11 =", LogC.reset, tup11);
    console.log("  encode =", tup11.toApiRequest());
    console.log("  decode =", tup11.decompose(hdParsingStrategy));

    // tuple including a struct
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
        const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
        const strategies = myTestCallData.parser.parsingStrategies;
        type Point = {
            x: BigNumberish,
            y: BigNumberish,
        }
        const myPoint: Point = { x: 1, y: 2 };
    const tup12 = new CairoTuple([7,myPoint], "(core::integer::u8, enums::Point)", strategies);
    console.log(LogC.bg.yellow, "tup12 =", LogC.reset, tup12);
    console.log("  encode =", tup12.toApiRequest());
    console.log("  decode =", tup12.decompose(strategies));

    // tuple including a CairoCustomEnum
    const myEnum13=new CairoCustomEnum({Success: 3});
const tup13 = new CairoTuple([7, myEnum13], "(core::integer::u8, enums::MyEnum)", strategies);
    console.log(LogC.bg.yellow, "tup13 =", LogC.reset, tup13);
    console.log("  encode =", tup13.toApiRequest());
    console.log("  decode =", tup13.decompose(strategies));


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });