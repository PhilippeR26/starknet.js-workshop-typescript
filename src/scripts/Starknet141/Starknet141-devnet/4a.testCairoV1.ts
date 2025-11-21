// Test Cairo v1 contract with new Parser
// launch with npx src/scripts/Starknet141/Starknet141-devnet/4a.testCairoV1.ts
// Coded with Starknet.js v8.6.0 + experimental

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, CairoStruct } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
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
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
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
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo110/helloSierra/hello.sierra.json").toString("ascii")) as CompiledSierra;

    const myCallData = new CallData(compiledSierra.abi);
    const myContract = new Contract({ abi: compiledSierra.abi, address: "0x100" });
    const calldata1 = myCallData.compile("array2ddd_felt", {
        testdd: [[20, 21], [10, 20, 30]],
    });
    console.log({ calldata1 });

    const calldata2 = myCallData.compile("array_bool_tuple", {
        a: [7, 8, 9],
        b: false,
    });
    console.log({ calldata2 });
    const response2 = myCallData.parse("array_bool_tuple", calldata2);
    console.log("response2=", response2);

    const calldata3 = myCallData.compile("tuple_echo", {
        a: cairo.tuple([7, 8, 9], [100, 101]),
        b: false,
    });
    console.log({ calldata3 });
    const response3 = myCallData.parse("tuple_echo", calldata3);
    console.log("response3=", response3);

    const userData = { address: "0x123", is_claimed: true };
    const calldata4 = myCallData.compile("set_user1", {
        user: userData,
    });
    console.log({ calldata4 });
    const response4 = myCallData.parse("get_user1", calldata4);
    console.log("response4=", response4);

    const bet = {
        name: 456,
        description: 1000,
        expire_date: 345,
        creation_time: 678,
        creator: "0xabcde",
        is_cancelled: false,
        is_voted: true,
        bettor: userData,
        counter_bettor: userData,
        winner: false,
        pool: 45674575467457,
        amount: 12234567,
    };
    const abiBet = myCallData.structs["hello::hello::Bet"];
    const calldata5 = new CairoStruct(bet, abiBet, myCallData.parser.parsingStrategies).toApiRequest();
    console.log({ calldata5 });
    const response5 = myCallData.parse("get_bet", calldata5);
    console.log("response5=", response5);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

