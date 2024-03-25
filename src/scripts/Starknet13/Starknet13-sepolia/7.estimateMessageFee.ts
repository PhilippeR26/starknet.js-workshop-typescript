// Declare Merkle-verify.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-sepolia/2.declareMerkle.ts
// Coded with Starknet.js v6.0.0 B11

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, transaction, CallData, selector, type Abi, type CompiledSierra } from "starknet";
import fs from "fs";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZaddress, account1IntegrationOZprivateKey } from "../../../A2priv/A2priv";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";



async function main() {
    // initialize Provider 
    // Starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    // Goerli Testnet
    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" }); 
    // Sepolia testnet
    const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" }); // Sepolia Testnet 
    // local Sepolia Testnet node :
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
    // local Sepolia Integration node :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_6" }); 
    // mainnet :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_6" }); //v0.7.0

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log(ch);
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());
    const payload_Pathfinder = {
        jsonrpc: '2.0',
        id: 1,
        method: 'pathfinder_version',
        params: []
    };
    const payload_Juno = {
        jsonrpc: '2.0',
        id: 1,
        method: 'juno_version',
        params: []
    };

    // const response = await axios.post("http://192.168.1.7:9545/rpc/pathfinder/v0.1", payload_Pathfinder);

    //console.log('Version:', response.data);
    // process.exit(5);

    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X Goerli Testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress
    // *** initialize existing Sepolia Testnet account
     const privateKey0 = account0OZSepoliaPrivateKey;
     const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    //const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V2);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');


    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/hello.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo200/hello.casm.json").toString("ascii"));

    const constructor = CallData.compile([]);
    const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm, constructorCalldata:constructor });
    console.log(deployResponse);
    const estim=await provider.estimateMessageFee({
        from_address:"0x1122334455667788990011223344556677889900", 
        to_address:deployResponse.deploy.address, 
        entry_point_selector: "increase_bal", 
        payload:["100"]});
    console.log("estimateMessageFee =", estim);
// process.exit(5);



    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });