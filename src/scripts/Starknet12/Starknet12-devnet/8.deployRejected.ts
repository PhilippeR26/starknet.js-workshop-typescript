// deploy in devnet a contract that can be rejected.
// launch with npx ts-node src/scripts/cairo12-devnet/8.deployRejected.ts
// Coded with Starknet.js v5.23.0

import { constants, Provider, Contract, Account, json, shortString, RpcProvider } from "starknet";
import fs from "fs";



async function main() {
    // initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" } ); // only starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" }); // testnet
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9545/rpc/v0.4" }); // local mainnet node

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", ch);

    // *** Devnet-rs 
    const privateKey = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
     const accountAddress: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X testnet  account
    // const privateKey = account5TestnetPrivateKey;
    // const accountAddress = account5TestnetAddress
    // *** initialize existing Argent X mainnet  account
    // const privateKey = account4MainnetPrivateKey;
    // const accountAddress = account4MainnetAddress
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/reject.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo200/reject.casm.json").toString("ascii"));

    const declareResponse = await account0.declare({ contract: compiledSierra, casm: compiledCasm });
    const contractClassHash = declareResponse.class_hash;
    // const contractClassHash = "0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4";

    // // class hash in Cairo2.1.0 = 0x70e819c9d5fc017e5cee4779dac602b82699e8ddd82a3778923485757540596
    // // class hash in Cairo2.0.0 = 0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4
    console.log('✅ Test Contract declared with classHash =', contractClassHash);

     await provider.waitForTransaction(declareResponse.transaction_hash);
    console.log("Deploy of contract in progress...")
    const { transaction_hash: th2, address } = await account0.deployContract({ classHash: contractClassHash });
    console.log("contract_address =", address);
    // address in testnet : 0x76e73ba220fcdc9b0b0b68556b9a59f36f5d124349db56e1de4879aa61a91ef
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