// Execute transactions (Strk transfer) as fast as possible in Rpc0.9
// Launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/3a.Challenge10txsRpcStrk.ts
// Coded with Starknet.js v8.0.0-beta.4 + experimental

import { RpcProvider, Account, json, Contract, shortString, type CompiledSierra, type CairoAssembly, BlockTag, type Call, type Nonce } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, equilibriumPathfinderTestnetUrl, spaceShardPathfinderTestnetNodeUrl } from "../../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
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
    const url="http://127.0.0.1:5050/rpc";
     //const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
        const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

    // *** local 
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // my local Juno Sepolia Testnet node (Starlink network)
    // const url = "http://192.168.1.34:9545/rpc/v0_9"; // local Pathfinder
    // const url = equilibriumPathfinderTestnetUrl; // Pathfinder testnet from Equilibrium team
    // const url = spaceShardPathfinderTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team

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
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet");

    // *** initialize existing predeployed account 0 of Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;
    // **** Sepolia
    // const accountAddress0 = account2TestBraavosSepoliaAddress;
    // const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log("Account 0 connected.\n");

    // ***** main code : 
    const account1Address = account3ArgentXSepoliaAddress;
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
    const txList: Call[] = [];
    for (let i = 0n; i < 10n; i++) {
        txList.push(strkContract.populate("transfer", [account1Address, i * 10n ** 2n]));
    }
    const tipStats = await myProvider.getEstimateTip();
    console.log("tip=", tipStats.recommendedTip);
    const start = new Date().getTime();
    const response = [];
    for (const call of txList) {
        const start0 = new Date().getTime();
        const resp = await account0.fastExecute(
            call,
            {
                tip: tipStats.recommendedTip,
            },
            {
                retries: 30,
                retryInterval: 500, //ms
            }
        );
        if (!resp.isReady) {
            console.error("Timeout. No response in the timeFrame.");
            process.exit(5);
        }
        const end = new Date().getTime();
        response.push({ respTx: resp.txResult, end });
        console.log("tx in", (end - start0) / 1000, "s.");
    }
    response.forEach((resp, i) => {
        console.log("tx#", i, "at", (resp.end - start) / 1000, "s.");
    })
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
