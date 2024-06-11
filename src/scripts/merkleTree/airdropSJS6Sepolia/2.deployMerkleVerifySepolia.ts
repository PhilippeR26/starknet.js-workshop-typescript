// script valid for Pedersen and Poseidon, for all networks.
// Deploy a contract to verify a Pedersen/Poseidon Merkle tree
// Coded with Starknet.js v6.0.0-beta.11 
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Sepolia/2.deployMerkleVerifySepolia.ts

import { Account, Call, Calldata, CallData, constants, Contract, json, RPC, RpcProvider, shortString } from 'starknet';
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    // initialize Provider. Adapt to your needs
    // **** Starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // **** Sepolia Testnet :
    const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
   

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());

    // initialize account. Adapt to your case
    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

    // *** initialize existing Sepolia Testnet account
    const privateKey0 = account0OZSepoliaPrivateKey;
    const accountAddress0 = account0OZSepoliaAddress;

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // deploy MerkleVerify
    const MERKLE_CLASS_HASH_PEDERSEN = "0x4ff16c026ed3b1849563c95605ef8ee91ca403f2c680bda53e4f6717400b230";
    const MERKLE_CLASS_HASH_POSEIDON = "0x03e2efc98f902c0b33eee6c3daa97b941912bcab61b6162884380c682e594eaf";
    //    👇👇👇 change here with the result of script 1
    const root = "0x165eb9df01e9b94c4eb8315c32ed7f728a429c41deea9ddc427c5d8b252af8d"
    const myConstructorMerkleVerify: Calldata = CallData.compile([root]);
    console.log("In progress...");
    const deployResponse = await account0.deployContract({
        //         👇👇👇 change here to PEDERSEN or POSEIDON
        classHash: MERKLE_CLASS_HASH_POSEIDON,
        constructorCalldata: myConstructorMerkleVerify
    });
    const MerkleVerifyAddress = deployResponse.contract_address;
    console.log("MerkleVerify contract :");
    console.log("address =", MerkleVerifyAddress);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });