// Test Cairo0 contract with new Parser
// launch with npx ts-node src/scripts/Starknet141/Starknet141-devnet/4.testCairo0.ts
// Coded with Starknet.js v8.6.0 + experimental

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet";
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

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/ERC20-echo.json").toString("ascii")) as CompiledSierra;

    const myCallData = new CallData(compiledSierra.abi);
    const myContract = new Contract({ abi: compiledSierra.abi, address: "0x100" });
    const calldata1 = myCallData.compile("allowance", {
        owner: 123,
        spender: 456n,
    });
    console.log({ calldata1 });
    const calldata2 = myCallData.compile("constructor", {
        name: 123,
        symbol: 456n,
        decimals: 3,
        initial_supply: cairo.uint256(3000),
        recipient: 45,
        signers: [10, 20, 30],
        threshold: 55,
    });
    console.log({ calldata2 });

    const struct32 = {
        b: 43,
        c: cairo.tuple(70, 71, 72, 74),
    };
    const structY = {
        y1: 80,
        y2: 81,
    };
    const structX = {
        x1: 60,
        x2: structY,
        x3: {
            tx1: cairo.tuple(100, 101),
            tx2: {
                tx21: { tx211: 103, tx212: 104 },
                tx22: cairo.tuple(105, 106),
            }
        }
    };

    // (tx1: (felt, felt), tx2: (tx21: (tx211: felt, tx212: felt), tx22: (felt, felt)))
    const struct1 = {
        discount_fix_bps: 3000,
        discount_transfer_bps: 4000,
    };
    const struct1_1 = {
        discount_fix_bps: 5000,
        discount_transfer_bps: 6000,
    };
    const struct2 = {
        info: struct1,
        data: 90,
        data2: cairo.tuple(95, 96),
    }
    const struct3 = { a: 20, b: struct32 };
    const data = {
        t1: 123,
        n1: 456n,
        tl2: [10, 20, 30],
        k1: [struct3, struct3],
        k2: { t1: 50, t2: structX, t3: 60 },
        u1: cairo.uint256(3000),
        s1: struct1,
        s2: struct2,
        af1: [40, 41, 42],
        au1: [cairo.uint256(4000), cairo.uint256(4001)],
        as1: [struct1, struct1_1],
        // "(p1: (p1: StructY, p2: felt), p2: felt)*"
        atmk: [
            {
                p1: { p1: structY, p2: 100 },
                p2: 34
            },
            cairo.tuple(
                cairo.tuple(structY, 101),
                35
            )
        ],
        // "((StructY, felt), felt)*"
        atmku: [
            cairo.tuple(
                cairo.tuple(structY, 70),
                90,
            ),
            cairo.tuple(
                cairo.tuple(structY, 71),
                91,
            )
        ],
    }
    const calldata3 = myCallData.compile("echo", data);
    console.log({ calldata3 });
    const call4 = myContract.populate("echo", data);
    console.log({ call4 });
    const response = myCallData.parse("echo", calldata3);
    console.log("response=", response);
    console.log("response atmk[0]=", (response as any).atmk[0]);
    console.log("response atmku[0]=", (response as any).atmku[0]);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

