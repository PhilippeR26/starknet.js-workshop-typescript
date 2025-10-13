// Test Cairo array with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/9a.testArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hdParsingStrategy,  type AbiStruct, CairoStruct, CairoCustomEnum, type AbiEnum, CairoTypeCustomEnum, type BigNumberish, CairoTuple } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
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
    // const contractAddress = "0x3cb38b467e468d3caadfc056c11cb6cf754f4c98ac430c6f1af36d35bce3e4f";

    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const myTestContract = new Contract({
        abi: compiledSierra.abi,
        address: contractAddress,
        providerOrAccount: account0,
    });

    const strategies = myTestContract.callData.parser.parsingStrategies;
    // console.log("strategies =", strategies);
    
    const myTup = [true,false];
    const myTypeTup=new CairoTuple(myTup,"(core::bool, core::bool)", strategies);
    const comp0 = myTestCallData.compile("tuple_bool", [myTup]);
    const comp0a = myTestCallData.compile("tuple_bool", { x: myTup });
    const comp0b = myTestCallData.compile("tuple_bool", [myTypeTup]);
    const comp0c = myTestCallData.compile("tuple_bool", { x: myTypeTup });
    console.log("tuple_bool comp0 compile() =", comp0);
    console.log("tuple_bool comp0a compile() =", comp0a);
    console.log("tuple_bool comp0b compile() =", comp0b);
    console.log("tuple_bool comp0c compile() =", comp0c);
    const res0a = (await myTestContract.call("tuple_bool", [myTup])) as Object;
    const res0b = (await myTestContract.call("tuple_bool", [myTypeTup])) as  Object;
    const res0 = (await myTestContract.tuple_bool(myTup)) as  Object;
    const res0c = (await myTestContract.tuple_bool(myTypeTup)) as  Object;
    console.log("res0 =", res0);
    console.log("res0a =", res0a);
    console.log("res0b =", res0b);
    console.log("res0c =", res0c);
    const res0d = CallData.compile([CairoTuple.compile(myTup)]); 
    const res0e = CallData.compile({ x: CairoTuple.compile(myTup) }); 
    const res0f = CallData.compile([myTypeTup]);
    const res0g = CallData.compile({ x: myTypeTup });
    console.log("res0d =", res0d);
    console.log("res0e =", res0e);
    console.log("res0f =", res0f);
    console.log("res0g =", res0g);


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
