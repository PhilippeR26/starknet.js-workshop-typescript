// script valid for Pedersen and Poseidon, for all networks.
// Deploy a contract to verify a Pedersen/Poseidon Merkle tree
// Coded with Starknet.js v9.3.0
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Sepolia/2.deployMerkleVerifySepolia.ts

import { Account, CairoBytes31, Call, Calldata, CallData, constants, Contract, json, RPC, RpcProvider, shortString } from 'starknet';
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    // initialize Provider. Adapt to your needs
    // **** Starknet-devnet
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // **** Sepolia Testnet :
    const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey });
   

    // Check that communication with provider is OK
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);

    // initialize account. Adapt to your case
    // *** Devnet
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";

    // *** initialize existing Sepolia Testnet account
    const accountAddress0 = account1BraavosSepoliaAddress;
    const privateKey0 = account1BraavosSepoliaPrivateKey;

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account({provider:myProvider,address: accountAddress0,signer: privateKey0});
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // deploy MerkleVerify
    const MERKLE_CLASS_HASH_PEDERSEN = "0x3e59df2708031668e491d704e24fe3a16af9b3e4512262909306b77faa1029a";
    const MERKLE_CLASS_HASH_POSEIDON = "0x161559a8660eb7323125b37b4c2db2519b34260a020464034b68a50d7090ee2";
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