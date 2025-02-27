// Test transactions V 3 in Goerli integration.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-integrationGoerli/2.transactionV3.ts
// Coded with Starknet.js v6.0.0 B7

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num } from "starknet";
import fs from "fs";
import { account1IntegrationGoerliAXaddress, account1IntegrationGoerliAXprivateKey, account5TestnetAddress, account5TestnetPrivateKey, goerliIntegrationUrl } from "../../../A1priv/A1priv";
import { infuraKey, account4MainnetAddress, account4MainnetPrivateKey, blastKey } from "../../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";



async function main() {
    // initialize Provider 
    const provider = new RpcProvider({ nodeUrl: goerliIntegrationUrl });
    //const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" }); // Goerli Testnet
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9545/rpc/v0_6" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());


    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X Goerly Testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress
    // *** initialize existing Argent X Goerly Testnet  account
    const privateKey0 = account1IntegrationGoerliAXprivateKey;
    const accountAddress0 =account1IntegrationGoerliAXaddress 
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    // *** initialize existing Sepolia Testnet account
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V3);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.casm.json").toString("ascii"));
    // const contractAddress = "0x01073c451258ff87d4e280fb00bc556767cdd464d14823f84fcbb8ba44895a34"; //Goerli Testnet
    // const contractAddress = "0x37bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0"; //Sepolia Testnet
    // const contractAddress = "0x33852427be21d24eca46797a31363597f52afcc315763ce32e83e5218eed2e3"; //Sepolia Integration
    const contractAddress = "0x45861f05e9181dd99e107537a568a2786e5f59181787249db5278c2df5468f"; // devnet-rs

    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const contractETH = new Contract(compiledERC20.abi, ethAddress, provider);
    const contractSTRK = new Contract(compiledERC20.abi, strkAddress, provider);

    const initialEth = await contractETH.balanceOf(account0.address) as bigint;
    const initialStrk = await contractSTRK.balanceOf(account0.address) as bigint;

    
    console.log("ETH balance =", formatBalance(initialEth , 18));
    console.log("STRK balance =", formatBalance(initialStrk , 18));


    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });