// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/6.testFixedArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish } from "starknet";
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
    // *** Option from a CairoType
    // const myU8 = new CairoUint8(200);
    const myU8 = 8;
    const myOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, myU8);

    // Option from num
    const myOption1 = new CairoTypeOption(myU8, "core::option::Option::<core::integer::u8>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log(LogC.bg.yellow, "myOption1 =", LogC.reset, myOption1);
    console.log("  encode =", myOption1.toApiRequest());
    console.log("  unwrap =", myOption1.decompose(hdParsingStrategy));

    // Option from iterator
    const iter2 = ["0", "100"][Symbol.iterator]();
    const myOption2 = new CairoTypeOption(iter2, "core::option::Option::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption2 =", LogC.reset, myOption2);
    console.log("  encode =", myOption2.toApiRequest());
    console.log("  unwrap =", myOption2.decompose(hdParsingStrategy));

    // Option from CairoOption
    const myOption3 = new CairoTypeOption(myOption0, "core::option::Option::<core::integer::u8>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption3 =", LogC.reset, myOption3);
    console.log("  encode =", myOption3.toApiRequest());
    console.log("  unwrap =", myOption3.decompose(hdParsingStrategy));

    // Option of Option 
    const myOption4 = new CairoOption(CairoOptionVariant.Some, myOption0);
    const myOption5 = new CairoTypeOption(myOption4, "core::option::Option::<core::option::Option::<core::integer::u8>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption5 =", LogC.reset, myOption5);
    console.log("  encode =", myOption5.toApiRequest());
    console.log("  unwrap =", myOption5.decompose(hdParsingStrategy));

    // Option of Option of Option
    const myOption6 = new CairoOption(CairoOptionVariant.Some, myOption4);
    const myOption7 = new CairoTypeOption(myOption6, "core::option::Option::<core::option::Option::<core::option::Option::<core::integer::u8>>>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption7 =", LogC.reset, myOption7);
    console.log(myOption7.toApiRequest());
    console.log(myOption7.decompose(hdParsingStrategy));
    const resp = myOption7.decompose(hdParsingStrategy).unwrap().unwrap().unwrap();
    console.log({ resp });

    // Option of CairoFixedArray
    const fArr0 = new CairoFixedArray([1, 2, 3], "[core::integer::u8; 3]", hdParsingStrategy);
    const myOption8 = new CairoTypeOption(fArr0, "core::option::Option::<[core::integer::u8; 3]>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption8 =", LogC.reset, myOption8);
    console.log("  encode =", myOption8.toApiRequest());
    console.log("  decode =", myOption8.decompose(hdParsingStrategy));

    // Option of fixed array
    const myOption9 = new CairoTypeOption([1, 2, 3], "core::option::Option::<[core::integer::u8; 3]>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log(LogC.bg.yellow, "myOption9 =", LogC.reset, myOption9);
    console.log(myOption9.toApiRequest());
    console.log(myOption9.decompose(hdParsingStrategy));

    // Option of fixed array
    const fArr1 = [1,2,3];
    const myOpt10=new CairoOption<Array<BigNumberish>>(CairoOptionVariant.Some, fArr1);
    const myOption10 = new CairoTypeOption(myOpt10, "core::option::Option::<[core::integer::u8; 3]>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "myOption10 =", LogC.reset, myOption10);
    console.log(myOption10.toApiRequest());
    console.log(myOption10.decompose(hdParsingStrategy));

    // option of array
    const myOption11 = new CairoTypeOption([1,2,3], "core::option::Option::<core::array::Array::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log(LogC.bg.yellow, "myOption11 =", LogC.reset, myOption11);
    console.log(myOption11.toApiRequest());
    console.log(myOption11.decompose(hdParsingStrategy));

    // option of array
    const myArr1 = new CairoArray([10,11,12], "core::array::Array::<core::integer::u8>", hdParsingStrategy);
    const myOption12 = new CairoTypeOption(myArr1, "core::option::Option::<core::array::Array::<core::integer::u8>>", hdParsingStrategy,CairoOptionVariant.Some);
    console.log(LogC.bg.yellow, "myOption12 =", LogC.reset, myOption12);
    console.log(myOption12.toApiRequest());
    console.log(myOption12.decompose(hdParsingStrategy));

    // option of tuple
    const myOption13 = new CairoTypeOption([100, 10], "core::option::Option::<(core::integer::u16, core::integer::u8)>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log(LogC.bg.yellow, "myOption13 =", LogC.reset, myOption13);
    console.log(myOption13.toApiRequest());
    console.log(myOption13.decompose(hdParsingStrategy));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });