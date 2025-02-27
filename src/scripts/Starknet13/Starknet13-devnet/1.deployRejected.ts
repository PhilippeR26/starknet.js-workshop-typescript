// deploy in devnet-rs a contract that can be rejected.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-devnet/1.deployRejected.ts
// Coded with Starknet.js v5.24.3

import { constants, Contract, Account, json, shortString, RpcProvider } from "starknet";
import fs from "fs";
import { account0OZSepoliaAddress,account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";



async function main() {
    // initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" } ); // only starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" }); // testnet
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9545/rpc/v0.5" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0.5" }); // local Pathfinder Sepolia Integration node

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =" , shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());

    // *** Devnet-rs 
   const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    // *** initialize existing Sepolia Testnet account
    //const privateKey0=account0OZSepoliaPrivateKey;
    //const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    //const privateKey0=account1IntegrationOZprivateKey;
    //const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.casm.json").toString("ascii"));

    const declareResponse = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm });
    const contractClassHash = declareResponse.class_hash;
    // const contractClassHash = "0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4";

    // // class hash in Cairo2.1.0 = 0x70e819c9d5fc017e5cee4779dac602b82699e8ddd82a3778923485757540596
    // // class hash in Cairo2.0.0 = 0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4
    console.log('✅ Test Contract declared with classHash =', contractClassHash);

     await provider.waitForTransaction(declareResponse.transaction_hash);
    console.log("Deploy of contract in progress...")
    const { transaction_hash: th2, address } = await account0.deployContract({ classHash: contractClassHash });
    console.log("contract_address =", address);
    // address in Goerly Testnet : 0x01073c451258ff87d4e280fb00bc556767cdd464d14823f84fcbb8ba44895a34
    // address in Sepolia Integration : 0x33852427be21d24eca46797a31363597f52afcc315763ce32e83e5218eed2e3
    // address in Sepolia Testnet : 0x37bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0
    // address in mainnet : 0x02bD907B978F58ceDf616cFf5CdA213d63Daa3AD28Dd3C1Ea17cA6CF5E1D395F
    await provider.waitForTransaction(th2);

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });