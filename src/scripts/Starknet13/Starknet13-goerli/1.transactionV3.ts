// Test transactions V 3 in Goerli Testnet.
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/7.transactionV3.ts
// Coded with Starknet.js v6.0.0 B7

import { constants, Contract, Account, json, shortString, RpcProvider, hash } from "starknet";
import fs from "fs";
import { account5TestnetAddress, account5TestnetPrivateKey, goerliIntegrationUrl } from "../../../A1priv/A1priv";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account4TestnetAddress, account4TestnetPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import axios from "axios";



async function main() {
    // initialize Provider 
    //const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    //const nodeUrl='https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" ;
    // const nodeUrl="https://starknet-testnet.public.blastapi.io/rpc/v0_6";
    const nodeUrl = "https://free-rpc.nethermind.io/goerli-juno/v0_6";
    //const nodeUrl="https://starknet-goerli.g.alchemy.com/starknet/version/rpc/v0.6/" + alchemyKey;
    const provider = new RpcProvider({ nodeUrl }); // Goerli Testnet

    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_6" }); // local Sepolia Integration node
    // Integration Goerli 
    // const nodeUrl=goerliIntegrationUrl;
    // const provider = new RpcProvider({ nodeUrl });

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    // Pathfinder
    // const payload = {
    //     jsonrpc: '2.0',
    //     id: 1,
    //     method: 'pathfinder_version',
    //     params: []
    // };
    // Juno
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'juno_version',
        params: []
    };

    // const response = await axios.post(goerliIntegrationUrl.slice(0, 26) + "/rpc/pathfinder/v0.1", payload); // integration Goerli
    const response = await axios.post("https://starknet-testnet.public.blastapi.io" + "/rpc/pathfinder/v0.1", payload);
    //const response = await axios.post(nodeUrl, payload);

    console.log(payload.method, ':', response.data.result);
    //process.exit(5);
    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** Goerli Testnet  
    const privateKey0 = account4TestnetPrivateKey;
    const accountAddress0 = account4TestnetAddress
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    // *** initialize existing Sepolia Testnet account
    //const privateKey0 = account0OZSepoliaPrivateKey;
    //const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V3);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.casm.json").toString("ascii"));
    // Goerli Testnet
    const contractAddress = "0x01073c451258ff87d4e280fb00bc556767cdd464d14823f84fcbb8ba44895a34";
    // Sepolia Testnet 
    // const contractAddress = "0x37bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0"; 
    // const contractAddress = "0x33852427be21d24eca46797a31363597f52afcc315763ce32e83e5218eed2e3"; //Sepolia Integration
    // const contractAddress = "0x7f7d5e971b9d3e237b7cb8ad77d01c22f16b0cfa1cfadd4906a6a0dfb6542ae"; // devnet-rs


    const myTestContract = new Contract(compiledSierra.abi, contractAddress, provider);
    myTestContract.connect(account0);
    const myCall = myTestContract.populate("test_fail", [100]);
    console.log("Invoke in progress...");
    const { transaction_hash: txH } = await account0.execute(myCall);
    const txR = await provider.waitForTransaction(txH);
    console.log(txR);


    // const compiled1Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    // const compiled1Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    // const compiled1Casm = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.casm.json").toString("ascii"));
    const compiled1Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
    const compiled1Casm = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.casm.json").toString("ascii"));
    const classH = hash.computeContractClassHash(compiled1Sierra);
    console.log("classH =", classH);
    try {
        const res = await provider.getClassByHash(classH);
        console.log("Class already declared.");
        process.exit(5);
    } catch { }
    const resDec = await account0.declare({ contract: compiled1Sierra, casm: compiled1Casm });
    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });