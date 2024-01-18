// script valid for Pedersen and Poseidon, for all networks.
// Deploy a contract to verify a Pedersen/Poseidon Merkle tree
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/4.deployMerkleVerify.ts

import { Account, Call, Calldata, CallData, constants, Contract, json, RPC, RpcProvider, shortString } from 'starknet';
import { account5TestnetAddress, account5TestnetPrivateKey } from "../../A1priv/A1priv";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../A1priv/A1priv";
import { resetDevnetNow } from '../utils/resetDevnetFunc';

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    // initialize Provider. Adapt to your needs
    // Starknet-devnet-rs
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // Goerli Testnet
    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" }); 
    // local Pathfinder Sepolia Testnet node :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.7:9545/rpc/v0_6" });
    // local Pathfinder Sepolia Integration node :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.7:9550/rpc/v0_6" }); 
    // local Juno mainnet :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.7:6060/v0_6" }); //v0.6.0

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());

    // initialize account. Adapt to your case
    // *** Devnet-rs 
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X Goerli Testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Testnet account
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // const accountAddress0 = account0OZSepoliaAddress;

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V2);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // deploy MerkleVerify
    const MERKLE_CLASS_HASH_PEDERSEN = "TBD";
    const MERKLE_CLASS_HASH_POSEIDON = "0x03e2efc98f902c0b33eee6c3daa97b941912bcab61b6162884380c682e594eaf";
    const root = "0x4bad3f80e8041eb3d32432fa4aed9f904db8c8ab34109879a99da696a0c5a81"
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