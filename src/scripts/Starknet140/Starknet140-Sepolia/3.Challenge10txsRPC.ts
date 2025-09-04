// Execute transactions as fast as possible in Rpc0.9.
// Launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/3.Challenge10txsRPC.ts
// Coded with Starknet.js v8.4.0

import { RpcProvider, Account, json, Contract, shortString, type CompiledSierra, type CairoAssembly, BlockTag, type Call, type Nonce, logger, CairoBytes31 } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, equilibriumPathfinderTestnetUrl, spaceShardJunoTestnetNodeUrl, spaceShardPathfinderTestnetNodeUrl } from "../../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
import { alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
dotenv.config();


async function main() {
    // *** devnet
    // const url = "http://127.0.0.1:5050/rpc";
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

    // *** local 
    // 🚨🚨🚨 Put here the url of your node.
    //          👇👇👇
    const url = "http://192.168.1.34:9545/rpc/v0_9"; // local Pathfinder Testnet node (Starlink network)
    // const url = "http://localhost:9545/rpc/v0_9"; // local Pathfinder Testnet node (Starlink network)
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // my local Juno Sepolia Testnet node (Starlink network)
    // const url = "http://localhost:6070/rpc/v0_9"; // my local Juno Sepolia Testnet node (Starlink network)
    // const url = equilibriumPathfinderTestnetUrl; // Pathfinder testnet from Equilibrium team
    // const url = spaceShardPathfinderTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team
    // const url = spaceShardJunoTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team
    // const url = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"; // Public Blast Pathfinder testnet
    // const url = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/" + alchemyKey; // Alchemy
    // const url = "https://starknet-sepolia.infura.io/v3/" + infuraKey; // Infura (rpc 0.8.1)
    // const url="https://rpc.starknet-testnet.lava.build/rpc/v0_9"; // Lava (no guaranty of rpc version usage)
    const myProvider = new RpcProvider({
        nodeUrl: url,
        specVersion: "0.9.0",
        blockIdentifier: BlockTag.PRE_CONFIRMED,
    });
    // const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Pathfinder Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9545/rpc/v0_9", specVersion: "0.9.0" }); // local Pathfinder Sepolia Testnet node
    // public node
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9", specVersion: "0.9.0" }); // Sepolia Testnet 


    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    // }
    console.log(
        "chain Id =", new CairoBytes31 (await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet");

    // *** initialize existing predeployed account 0 of Devnet
    // const accData = await l2DevnetProvider.getPredeployedAccounts();
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;
    // **** Sepolia
    // 🚨🚨🚨 Put here the address & the private key of your account.
    //          👇👇👇
    const accountAddress0 = account2TestBraavosSepoliaAddress;
    const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log("Account 0 connected.\n");

    // ***** main code : 
    // class hash: 0x1c8eea1adb73897efebabf3e2c5c3fb8fa02ec4794c26f4f573bede014f986b
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2114/quantity_NameStarknet.contract_class.json").toString("ascii")) as CompiledSierra;
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2114/quantity_NameStarknet.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
    // const resDecl = await account0.declareIfNot({
    //     contract: compiledSierra,
    //     casm: compiledCasm,
    // });
    // if (resDecl.transaction_hash) {
    //     console.log("new class hash =", resDecl.class_hash);
    //     await myProvider.waitForTransaction(resDecl.transaction_hash);
    // } else {
    //     console.log("Already declared");
    // };
    // const classHash = resDecl.class_hash;
    // console.log({ classHash });
    const contractAddr = "0x494cff97f36b18123a7d9749756c8c06eecaf3b8b916be1b511e717d3900528";
    // const deployResponse = await account0.deployContract({
    //     classHash: classHash,
    //     constructorCalldata: undefined,
    // });
    // console.log(deployResponse);

    // Connect the new contract instance :
    const gameContract = new Contract({
        abi: compiledSierra.abi,
        address: contractAddr,
        providerOrAccount: account0
    });
    console.log("contract initialization...");
    const resp0 = await gameContract.set_qty_weapons(100);
    console.log(resp0);
    await myProvider.waitForTransaction(resp0.transaction_hash);
    const startWeapons = (await gameContract.get_qty_weapons()) as bigint;
    console.log("Initial quantity of weapons :", startWeapons);

    const txList: Call[] = [];
    for (let i = 1n; i <= 10n; i++) {
        txList.push(gameContract.populate("decrease_qty_weapons", [i]));
    }
    const tipStats = await myProvider.getEstimateTip();
    console.log("tip=", tipStats.recommendedTip);
    const start = new Date().getTime();
    const response = [];
    logger.setLogLevel("INFO");
    for (const call of txList) {
        const start0 = new Date().getTime();
         await wait(1000);
        const resp = await account0.fastExecute(
            call,
            {
                tip: tipStats.recommendedTip,
            },
            {
                retries: 60,
                retryInterval: 500, //ms
            }
        );
        if (!resp.isReady) {
            console.error("Timeout. No response in the timeFrame.\nIncrease `retries` or `retryInterval` parameters");
            process.exit(5);
        }
        const end = new Date().getTime();
        response.push({ respTx: resp.txResult, end });
        console.log("tx in", (end - start0) / 1000, "s.");
    }
    logger.setLogLevel("ERROR");
    response.forEach((resp, i) => {
        console.log("tx#", i, "at", (resp.end - start) / 1000 + "s.");
    })
    const finalWeapons = (await gameContract.get_qty_weapons()) as bigint;
    console.log("Final quantity of weapons (should be 45) :", finalWeapons);
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
