// Test the status of transactions in Rpc0.9
// launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/1.testSpeedTx.ts
// Coded with Starknet.js v8.0.0-beta.1

import { RpcProvider, Account, json, Contract, shortString, type CompiledSierra, type CairoAssembly, CairoBytes31 } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, equilibriumPathfinderTestnetUrl, spaceShardPathfinderTestnetNodeUrl } from "../../../A1priv/A1priv";
import { alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
dotenv.config();


async function main() {
    // *** devnet
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    //    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

    // *** local 
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // local Juno
    // const url = "http://192.168.1.34:9545/rpc/v0_9"; // local Pathfinder
    // const url = equilibriumPathfinderTestnetUrl; // Pathfinder testnet from Equilibrium team
    // const url = spaceShardPathfinderTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team
     const url = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/" + alchemyKey;
    // const url="https://starknet-sepolia.infura.io/v3/" + infuraKey;

    const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Juno Sepolia Testnet node (Starlink network)
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
         "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
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
    // 
    // direct access with axios
    const account1Address = account3ArgentXSepoliaAddress;
    // test a big multiCall
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
    const transferCall = strkContract.populate("transfer", [account1Address, 1n * 10n ** 2n]);
    console.log("transfer test in progress...");
    const respTransfer = await account0.execute(transferCall);
    const txR=await myProvider.waitForTransaction(respTransfer.transaction_hash, {retryInterval: 5000});
    console.log("transfer success is :",txR.isSuccess());
    const tr=await myProvider.getTransactionTrace(respTransfer.transaction_hash);
    console.log(tr);

    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
