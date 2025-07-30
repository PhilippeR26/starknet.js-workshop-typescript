// Execute transactions as fast as possible in Rpc0.9
// launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/2.fastWait.ts
// Coded with Starknet.js v8.0.0-beta.4 + experimental

import { RpcProvider, Account, json, Contract, shortString, type CompiledSierra, type CairoAssembly, BlockTag } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, equilibriumPathfinderTestnetUrl, spaceShardPathfinderTestnetNodeUrl } from "../../../A1priv/A1priv";
dotenv.config();


async function axiosGetNonce(url: string): Promise<string> {
    //console.log("url=", url);
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'starknet_getNonce',
        params: [
            "pre_confirmed",
            // "pending",
            // "latest",
            "0x16607b2adc51fbb2b24587a725f58ab3b506004cf49344f9b47f42664070a93",

        ]
    };
    const response = await axios.post(url, payload);
    const nonce: string = response.data.result;
    return nonce;
}



async function main() {
    // *** devnet
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    //    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

    // *** local 
    const url = "http://192.168.1.34:6070/rpc/v0_9"; // local Juno
    // const url = "http://192.168.1.34:9545/rpc/v0_9"; // local Pathfinder
    // const url = equilibriumPathfinderTestnetUrl; // Pathfinder testnet from Equilibrium team
    // const url = spaceShardPathfinderTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team

    const myProvider = new RpcProvider({
        nodeUrl: url,
        specVersion: "0.9.0",
        blockIdentifier: BlockTag.PRE_CONFIRMED,
    }); // my local Juno Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Pathfinder Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9545/rpc/v0_9", specVersion: "0.9.0" }); // local Pathfinder Sepolia Testnet node
    // public node
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9", specVersion: "0.9.0" }); // Sepolia Testnet 
    https://rpc.pathfinder.equilibrium.co/testnet-sepolia/rpc/v0_9


    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    // }
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet");

    //const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    //const accountAddress0 = accData[0].address;
    //const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;
    // **** Sepolia
    const accountAddress0 = account2TestBraavosSepoliaAddress;
    const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log("Account 0 connected.\n");

    // ***** main code : 
    const account1Address = account3ArgentXSepoliaAddress;
    // test a big multiCall
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
    const transferCall = strkContract.populate("transfer", [account1Address, 1n * 10n ** 2n]);
    const nonce = BigInt(await account0.getNonce());
    console.log({ nonce });
    const tipStats = await myProvider.getEstimateTip();
    console.log("tip=", tipStats.recommendedTip);
    const respTransfer = await account0.execute([transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall], {
        // const respTransfer = await account0.execute(transferCall, {
        tip: tipStats.recommendedTip,
        // nonce: await account0.getNonce(BlockTag.LATEST),
        // blockIdentifier: BlockTag.LATEST,
    });
    const start1 = new Date().getTime();
    try {
        const isReady = await myProvider.fastWaitForTransaction(respTransfer.transaction_hash, account0.address, nonce, { retries: 20, retryInterval: 500 });
        console.log({ isReady });
        if (!isReady) {
            console.error("No response in the timeFrame.");
            process.exit(5);
        }
    } catch {
        console.error("Transaction REVERTED");
        process.exit(6);
    }
    const end1 = new Date().getTime();
    // *********************************
    console.log("Try second tx...");
    const nonce2 = await axiosGetNonce(url);
    const nonce3 = await account0.getNonce(BlockTag.PRE_CONFIRMED);
    const nonce4 = BigInt(await account0.getNonce());
    console.log("Axios nonce2:", nonce2, nonce3, nonce4);
    if (BigInt(nonce2) !== (BigInt(nonce) + 1n)) {
        throw new Error("Nonce problem (should not be the same): " + nonce + " " + nonce2);
    }
    // await wait(2000);
    const start2 = new Date().getTime();
    const respTransfer2 = await strkContract.withOptions({
        tip: tipStats.recommendedTip,
        // nonce:nonce3,
        // blockIdentifier: BlockTag.PRE_CONFIRMED,
    }).transfer(account1Address, 2n * 10n ** 3n);

    // const myCall2 = strkContract.populate("transfer", [account1Address, 2n * 10n ** 2n]);
    // const respTransfer2 = await account0.execute(myCall2, {
    //     tip: tipStats.recommendedTip,
    //     // nonce: await account0.getNonce(BlockTag.PRE_CONFIRMED),
    //     // blockIdentifier: BlockTag.PRE_CONFIRMED,
    // });

    const isReady2 = await myProvider.fastWaitForTransaction(respTransfer2.transaction_hash, account0.address,nonce4);
    console.log({ isReady2 });
    const end2 = new Date().getTime();
    console.log("transaction 1 duration (s)", (end1 - start1) / 1000);
    console.log("transaction 2 duration (s)=", (end2 - start2) / 1000);
    console.log("transactions total duration (s)=", (end2 - start1) / 1000);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
