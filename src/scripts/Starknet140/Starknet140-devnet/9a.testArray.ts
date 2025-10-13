// Test Cairo array with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/9a.testArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoTypeResult, type AbiStruct, CairoStruct, CairoCustomEnum, type AbiEnum, CairoTypeCustomEnum } from "starknet";
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
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.compiled_contract_class.json").toString("ascii"));
    console.log("Deploy of contract in progress...");
    const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm }, { tip: 2000000 });
    const contractAddress = deployResponse.deploy.address;
    console.log("Contract deployed at =", contractAddress);
    // const contractAddress = "0x703cd4e9816f09e44a07e170fdf37b993f036994468683dd90ea7a1ec803086";

    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const myTestContract = new Contract({
        abi: compiledSierra.abi,
        address: contractAddress,
        providerOrAccount: account0,
    });

    const strategies = myTestContract.callData.parser.parsingStrategies;
    // console.log("strategies =", strategies);
    type Point = { x: BigNumberish, y: BigNumberish };

    // Array of enum using a Point struct
    const myPoint: Point = { y: 4, x: 3 }; // wrong order
    const abiMyEnum: AbiEnum = myTestCallData.abi.find(
        (item) => item.name === 'enums::MyEnum'
    );
    const abiPoint: AbiStruct = myTestCallData.abi.find(
        (item) => item.name === 'enums::Point'
    );
    console.log("abiMyEnum =", abiMyEnum);
    const myEnum0= new CairoCustomEnum({LocationError: myPoint});
    const myTypeEnum0 = new CairoTypeCustomEnum(myPoint, abiMyEnum, strategies,1);
    console.log("MyTypeEnum0 =",myTypeEnum0);
    const arr=[myEnum0, myEnum0];
    const arrType=[myTypeEnum0,myTypeEnum0];
    const comp0 = myTestCallData.compile("array_enum", [arr]);
    const comp0a = myTestCallData.compile("array_enum", { x: arr });
    const comp0b = myTestCallData.compile("array_enum", [arrType]);
    const comp0c = myTestCallData.compile("array_enum", { x: arrType });
    console.log("array_enum comp0 compile() =", comp0);
    console.log("array_enum comp0a compile() =", comp0a);
    console.log("array_enum comp0b compile() =", comp0b);
    console.log("array_enum comp0c compile() =", comp0c);
    const res0a = (await myTestContract.call("array_enum", [arr])) as Array<CairoCustomEnum>;
    const res0b = (await myTestContract.call("array_enum", [arrType])) as  Array<CairoCustomEnum>;
    const res0 = (await myTestContract.array_enum(arr)) as  Array<CairoCustomEnum>;
    const res0c = (await myTestContract.array_enum(arrType)) as  Array<CairoCustomEnum>;
    console.log("res0 =", res0);
    console.log("res0a =", res0a);
    console.log("res0b =", res0b);
    console.log("res0c =", res0c);
    const res0d = CallData.compile([arr]); // should be a wrong answer (undefined variants have to be created with CallData.compile).
    const res0e = CallData.compile({ x: arr }); // Same.
    const res0f = CallData.compile([arrType]);
    const res0g = CallData.compile({ x: arrType });
    console.log("res0d =", res0d);
    console.log("res0e =", res0e);
    console.log("res0f =", res0f);
    console.log("res0g =", res0g);


    // // execute
    // const op8: Point = {y: 4,  x: 3 }; // wrong order
    // console.log("abiPoint =", {abiPoint}    );
    // const op8t=new CairoStruct(op8,abiPoint,strategies);
    // console.log("op8t=",op8t);
    // const myEnum8 = new CairoCustomEnum({ LocationError: op8 });
    // //const myEnum8=new CairoCustomEnum({Success: 10});
    // const myTypeEnum8 = new CairoTypeCustomEnum(op8, abiMyEnum, strategies, 1);

    // const myCall8 = myTestContract.populate("write_custom_enum", { x: myEnum8 });
    // console.log("myCall8 =", myCall8);
    // const myCall8a = myTestContract.populate("write_custom_enum", [myEnum8]);
    // const myCall8b = myTestContract.populate("write_custom_enum", { x: myTypeEnum8 });
    // const myCall8c = myTestContract.populate("write_custom_enum", [myTypeEnum8]);

    // console.log("Invoke in progress...");
    // const res8 = await account0.execute(myCall8, { tip: 200n });
    // const txR8 = await myProvider.waitForTransaction(res8.transaction_hash);
    // console.log("write8 =", txR8.isSuccess());


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
