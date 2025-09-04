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
    const myOption1 = new CairoTypeOption(myU8, "core::option::Option::<core::integer::u8>", hdParsingStrategy, CairoOptionVariant.Some);
    const myOption2 = CairoTypeOption.fromCairoOption(myOption0, "core::option::Option::<core::integer::u8>", hdParsingStrategy);
    console.log({ myOption2 });
    const myOption3 = new CairoTypeOption(myOption0, "core::option::Option::<core::option::Option::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log({ myOption3 });
    const myOption4 = new CairoOption(CairoOptionVariant.Some, myOption0);
    const myOption5 = CairoTypeOption.fromCairoOption(myOption4, "core::option::Option::<core::option::Option::<core::integer::u8>>", hdParsingStrategy);
    console.log({ myOption5 });
    const myOption6 = new CairoOption(CairoOptionVariant.Some, myOption4);
    const myOption7  = CairoTypeOption.fromCairoOption(myOption6, "core::option::Option::<core::option::Option::<core::option::Option::<core::integer::u8>>>", hdParsingStrategy);
    console.log("myOption7 =", myOption7 );
    const resp=myOption7.decompose(hdParsingStrategy).unwrap().unwrap().unwrap();
    console.log({resp});
    const farr0=new CairoFixedArray([1,2,3],"[core::integer::u8; 3]",hdParsingStrategy);
    const arr0=new CairoArray([farr0,farr0],"core::array::Array::<[core::integer::u8; 3]>",hdParsingStrategy);
    console.log("array of fixedArray encode =",arr0.toApiRequest());
    console.log("array of fixedArray decode =",arr0.decompose(hdParsingStrategy));

    const arr = [myOption0, myOption0];

    const myArr = new CairoArray(arr, "core::array::Array::<core::option::Option::<core::integer::u8>>", hdParsingStrategy);
    console.log(myArr);
    console.log(myArr.decompose(hdParsingStrategy));
    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });