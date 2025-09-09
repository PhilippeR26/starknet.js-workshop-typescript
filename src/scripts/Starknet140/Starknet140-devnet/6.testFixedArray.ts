// Test fixedArray with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/6.testFixedArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, type BigNumberish, CairoOptionVariant } from "starknet";
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
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", blockIdentifier: BlockTag.PRE_CONFIRMED, }); // only starknet-devnet
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

    // ********** main
    // const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/fixed_array_testfixed_array.contract_class.json").toString("ascii"));
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2120/fixed_array_testfixed_array.compiled_contract_class.json").toString("ascii"));
    // console.log("Deploy of contract in progress...");
    // const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm });
    // const contractAddress = deployResponse.deploy.address;

    // const myTestContract = new Contract({
    //     abi: compiledSierra.abi,
    //     address: contractAddress,
    //     providerOrAccount: account0
    // });

    // ********** main code
    const myU8 = 8;
    const myOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, myU8);
    const iter2 = ["10", "100"][Symbol.iterator]();

    // simple fixed array Cairo1
    const arr0 = new CairoFixedArray([10, 20], "[core::integer::u8; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr0 =", LogC.reset, arr0);
    console.log(arr0.toApiRequest());
    console.log(arr0.decompose(hdParsingStrategy));
    const arr1 = new CairoFixedArray({ "0": 10, "1": 20 }, "[core::integer::u8; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr1 =", LogC.reset, arr1);
    console.log(arr1.toApiRequest());
    console.log(arr1.decompose(hdParsingStrategy));
    const arr2 = new CairoFixedArray(iter2, "[core::integer::u8; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr2 =", LogC.reset, arr2);
    console.log(arr2.toApiRequest());
    console.log(arr2.decompose(hdParsingStrategy));
    const arr3 = new CairoFixedArray(arr0, "[core::integer::u8; 2]>", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr3 =", LogC.reset, arr3);
    console.log(arr3.toApiRequest());
    console.log(arr3.decompose(hdParsingStrategy));

    // fixed Array including an array
    const arr5 = new CairoFixedArray([[20, 30], [100, 110]], "[core::array::Array::<core::integer::u8>; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr5 =", LogC.reset, arr5);
    console.log(arr5.toApiRequest());
    console.log(arr5.decompose(hdParsingStrategy));

    // fixed Array including a fixed array
    const arr6 = new CairoFixedArray([[20, 30], [100, 110]], "[[core::integer::u8; 2]; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr6 =", LogC.reset, arr6);
    console.log(arr6.toApiRequest());
    console.log(arr6.decompose(hdParsingStrategy));

    // fixed Array including a tuple
    const arr7 = new CairoFixedArray([cairo.tuple(20, 30), cairo.tuple(100, 110)], "[(core::integer::u8, core::integer::u16); 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr7 =", LogC.reset, arr7);
    console.log(arr7.toApiRequest());
    console.log(arr7.decompose(hdParsingStrategy));

    // fixed Array including an option
    const arr8 = new CairoFixedArray([myOption0, myOption0], "[core::option::Option::<core::integer::u8>; 2]", hdParsingStrategy);
    console.log(LogC.bg.yellow, "arr8 =", LogC.reset, arr8);
    console.log(arr8.toApiRequest());
    console.log(arr8.decompose(hdParsingStrategy));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });