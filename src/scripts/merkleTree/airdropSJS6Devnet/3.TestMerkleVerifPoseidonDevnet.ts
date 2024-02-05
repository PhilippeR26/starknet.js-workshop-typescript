// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/3a.TestMerkleTreePoseidonDevnet.ts

import { Account, json, Contract, RpcProvider, RPC, num } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 Launch first the script src/scripts/merkleTree/2a.deployMerkleVerifPoseidonDevnet.ts
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // Connect the deployed contract in devnet
    //    👇👇👇
    // modify with the MerkleVerify address resulting of script 2
    const MerkleVerifyAddress = "0x1aa96fc9588be3e9230cc531017ee48059b54658171010e28e206db33e144ce";
    //    👆👆👆
    const compiledTest = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_poseidon.sierra.json").toString("ascii"));
    const myContract = new Contract(compiledTest.abi, MerkleVerifyAddress, account0);
    console.log(myContract.functions);
    console.log('Contract connected at =', myContract.address, "\n");

    // Interactions with the contract with call 
    // proof recovered from the server :
    const resultRoot = await myContract.get_root();
    console.log("root =", num.toHex(resultRoot));

    //    👇👇👇 result of script 1
    const proof = [
        '0x3bd82955789dec88b769cb6aa58639609ffdcf7ecde330b4128e8c06ba33e96',
        '0x625b514416c8d9ff4e042d99e2c36451ef4150b3dac7e90c7937205328e49fc',
        '0x1cd267ee25c7e7f9a97aa795185c31d03665f935f7422a36234776fc48040c1',
        '0x339252626ecdc1ad7a99f27077c0f544fadfb1ad818fd4ef9ffc9d7790b1c2f',
        '0x533350ad52c8a0c25cce963a56755d8da5b7f27b01a7e2c0f48a4144ac5c4a9',
        '0x354e60b7a5c80c6f61c807bd641d325dea1ea67578ba61da30c5e42e0987dc9',
        '0x589e68e3645c2455fb11abf65a3e8aa80c8ca66cc6bd52ab5adb34c3c66c53d',
        '0x4424f629835312830bcef6e13e870dee4fceb2afa4feeecdf418be10aadfa74',
        '0x7a305492dec621662e5e63d6f722035632225db604bc8a1b6a66dd6ab1a7e3f',
        '0xc9172a51337520b5762b6c0bc154b0575694b79f4b6605cf26d46562defd9b',
        '0x75105bb3704484d154b4e073654845e8424d71538c0a8827462d6aa6b21d2a5'
      ];

    //    👇👇👇 result of script 1
    const leaf = [
        '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691',
        '0x3e8',
        '0x0'
      ];
    const hashed_leaf = await myContract.hash_leaf_array(leaf);
    console.log("hashed leaf =", num.toHex(hashed_leaf))
    //    👇👇👇 result of script 1
    console.log("should be   = 0x3bc66a9e50bd55b54b8e4adaff861ce8806122c8de4b26808fbabe1204c72a5");

    //    👇👇👇 result of script 1
    const result1 = await myContract.verify_from_leaf_hash("0x3bc66a9e50bd55b54b8e4adaff861ce8806122c8de4b26808fbabe1204c72a5", proof);
    console.log("result from verify_from_leaf_hash =", result1);

    const result2 = await myContract.verify_from_leaf_array(leaf, proof);
    console.log("result from verify_from_leaf_array=", result2);

    const result3 = await myContract.verify_from_leaf_airdrop(leaf[0], { low: leaf[1], high: leaf[2] }, proof);
    console.log("result from verify_from_leaf_airdrop =", result3);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });