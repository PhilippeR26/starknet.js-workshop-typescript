// Test the status of transactions in Rpc0.9
// launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/1.testSpeedTx.ts
// Coded with Starknet.js v8.0.0-beta.1

import { RpcProvider, Account,  json,   Contract, shortString,  type CompiledSierra, type CairoAssembly } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress } from "../../../A1priv/A1priv";
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
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // juno
    const url = "http://192.168.1.34:9545/rpc/v0_9"; // Pathfinder
    const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Juno Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Pathfinder Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9545/rpc/v0_9", specVersion: "0.9.0" }); // local Pathfinder Sepolia Testnet node
    // public node
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9", specVersion: "0.9.0" }); // Sepolia Testnet 


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

    const account0 = new Account({provider:myProvider,address: accountAddress0, signer:privateKey0});
    console.log("Account 0 connected.\n");

    // ***** main code : 
    async function followTransaction(txH: string) {
        const stepDuration = 250; //ms
        let success: boolean = false
        while (!success) {
            try {
                const status = await myProvider.getTransactionStatus(txH);
                if (["PRE_CONFIRMED", "ACCEPTED_ON_L2"].includes(status.finality_status)) {
                    success = true;
                } else {
                    await wait(stepDuration);
                }
                console.log(status.finality_status, (new Date().getTime() - start) / 1000, "nonce=", await axiosGetNonce(url));
            } catch { await wait(stepDuration) }
        }
        const finality = new Date().getTime();
        console.log("Finality in (s) =", (finality - start) / 1000);
        let isReceipt: boolean = false
        // ********* necessary only for Pathfinder.
        while (!isReceipt) {
            try {
                const txR = await myProvider.getTransactionReceipt(txH);
                if (txR) { isReceipt = true; }
            } catch {
                console.log("waiting Receipt :", (new Date().getTime() - start) / 1000, "nonce=", await axiosGetNonce(url));
                await wait(stepDuration);
            }
        }
        const txRTime = new Date().getTime();
        console.log("txR in (s) =", (txRTime - start) / 1000, "nonce=", await axiosGetNonce(url));
        // *********
    }

    // 
    // direct access with axios
    const nonce = await axiosGetNonce(url);
    console.log("Axios nonce:", nonce);
    if (nonce === undefined) {
        process.exit()
    };
    const account1Address = account3ArgentXSepoliaAddress;
        // test a big multiCall
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({abi:compiledERC20Contract.abi,address: strkAddress, providerOrAccount:account0});
    const transferCall = strkContract.populate("transfer", [account1Address, 1n * 10n ** 2n]);
    let start = new Date().getTime();
    const respTransfer = await account0.execute([transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall, transferCall,], {
        nonce,
        tip: 1n * 10n ** 9n,
    });
    await followTransaction(respTransfer.transaction_hash);

    // *********************************
    console.log("Try second tx...");
    const nonce2 = await axiosGetNonce(url);
    console.log("Axios nonce2:", nonce2);
    if (BigInt(nonce2) !== (BigInt(nonce) + 1n)) {
        throw new Error("Nonce problem (should not be the same): " + nonce + " " + nonce2);
    }
    start = new Date().getTime();
    const respTransfer2 = await strkContract.withOptions({
        nonce: nonce2,
        blockIdentifier: "pre_confirmed"
    }).transfer(account1Address, 2n * 10n ** 3n);
    console.log(respTransfer2);
    await followTransaction(respTransfer2.transaction_hash);


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
