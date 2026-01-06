// Test events
// launch with npx ts-node src/scripts/Starknet141/Starknet141-devnet/2.testEvents.ts
// Coded with Starknet.js v9.2.1 & starknet-devnet.js v0.7.1

import { constants, Contract, Account, json, RpcProvider, num, hash, CairoBytes31, type CairoAssembly, type CompiledSierra, events, CallData, type EVENTS_CHUNK, type TXN_HASH, type BLOCK_HASH, type BLOCK_NUMBER, type FELT, type RPC } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import type { EMITTED_EVENT, EVENT_CONTENT } from "@starknet-io/types-js";
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

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2122/test_events_send_events.contract_class.json").toString("ascii")) as CompiledSierra;
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2122/test_events_send_events.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
    const resDecl = await account0.declareIfNot({
        contract: compiledSierra,
        casm: compiledCasm,
    });
    if (resDecl.transaction_hash) {
        console.log("new class hash =", resDecl.class_hash);
        await myProvider.waitForTransaction(resDecl.transaction_hash);
    } else {
        console.log("Already declared");
    };
    const classHash = resDecl.class_hash;
    console.log({ classHash });
    console.log("Deploy...");
    const deployResponse = await account0.deployContract({
        classHash: classHash,
        constructorCalldata: undefined,
    });
    console.log("contract addr =", deployResponse.address);

    const myTestContract = new Contract({ abi: compiledSierra.abi, address: deployResponse.contract_address });
    myTestContract.providerOrAccount = account0;

    const myCall = myTestContract.populate("send_events", { errorType: 8, errorDescription: "Mega Panic." });
    console.log("Execute...");
    const res = await account0.execute(myCall);
    const txR = await myProvider.waitForTransaction(res.transaction_hash);
    // event from transaction result
    if (txR.isSuccess()) {
        console.log("raw events =", txR.events);
        const events = myTestContract.parseEvents(txR);
        console.log("decoded events =", events);
    }

    // event from blocks
    const keyFilter = [[num.toHex(hash.starknetKeccak('EventPanic'))], ['0x8']];
    const block = await myProvider.getBlock('latest');
    console.log('bloc #', block.block_number);

    let continuationToken: string | undefined = '0';
    let chunkNum: number = 1;
    const collectedEvents: RPC.RPCSPEC010.EMITTED_EVENT[] = [];

    // type EVENT_CONTENT = {
    //     keys: string[];
    //     data: FELT[];
    // }

    // type EMITTED_EVENT = {
    //     from_address: string;
    // } & EVENT_CONTENT & {
    //     transaction_hash: TXN_HASH;
    //     transaction_index: number;
    //     event_index: number;
    //     block_hash?: BLOCK_HASH;
    //     block_number?: BLOCK_NUMBER;
    // }

    // type EVENTS_CHUNK = {
    //     events: {
    //         transaction_hash: string;
    //         from_address: string;
    //         keys: string[];
    //         data: string[];
    //         block_number?: number | undefined;
    //         block_hash?: string | undefined;
    //         transaction_index?: number | undefined;
    //         event_index?: number | undefined;
    //     }[];
    //     continuation_token?: string | undefined;
    // }

    while (continuationToken) {
        const filter: RPC.RPCSPEC010.EventFilter = {
            from_block: {
                block_number: Math.max(0, block.block_number - 30),
            },
            to_block: {
                block_number: block.block_number,
            },
            address: myTestContract.address,
            keys: keyFilter,
            chunk_size: 5,
            continuation_token: continuationToken === '0' ? undefined : continuationToken,
        }
        const eventsRes  = (await myProvider.getEvents(filter)) as RPC.RPCSPEC010.EVENTS_CHUNK;
        // const eventsRes0 = await myProvider.getEvents(filter);
        // const eventsRes1 = await myProvider.getEvents<typeof constants.SupportedRpcVersion.v0_10_0>(filter);
        collectedEvents.push(...eventsRes.events);
        const nbEvents = eventsRes.events.length;
        continuationToken = eventsRes.continuation_token;
        console.log('chunk nb =', chunkNum, '.', nbEvents, 'events recovered.');
        console.log('continuation_token =', continuationToken);
        for (let i = 0; i < nbEvents; i++) {
            const event = eventsRes.events[i];
            console.log(
                'event #',
                i,
                'data length =',
                event.data.length,
                'key length =',
                event.keys.length,
                ':'
            );
            console.log('\nkeys =', event.keys, 'data =', event.data);
        }
        chunkNum++;
    }
    const myTestCallData = new CallData((compiledSierra as CompiledSierra).abi);
    const abiEvents = events.getAbiEvents(myTestCallData.abi);
    const abiStructs = CallData.getAbiStruct(myTestCallData.abi);
    const abiEnums = CallData.getAbiEnum(myTestCallData.abi);
    const parser = myTestCallData.parser;
    const parsedEvents = events.parseEvents(collectedEvents, abiEvents, abiStructs, abiEnums, parser);
    console.log('parsed events=', parsedEvents);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });