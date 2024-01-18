// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/3a.TestMerkleTreePoseidonDevnet.ts

import { Account, json, Contract, RpcProvider, RPC, num} from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 Launch first the script src/scripts/merkleTree/2a.deployMerklePoseidon.ts
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
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, RPC.ETransactionVersion.V2);
    console.log("Account 0 connected.\n");

    // Connect the deployed contract in devnet
    //    👇👇👇
    // modify with the MerkleVerify address resulting of 2a.deployMerklePoseidon.ts
    const testAddress = "0x2ddbfbf0a4944b4bb702a715773fe985c4a305a101adecb361e0f1522159c3b";
    //    👆👆👆
    const compiledTest = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_poseidon.sierra.json").toString("ascii"));
    const myContract = new Contract(compiledTest.abi, testAddress, account0);
    console.log(myContract.functions);
    console.log('Contract connected at =', myContract.address,"\n");

    // Interactions with the contract with call 
    // proof recovered from the server :
    const resultRoot = await myContract.get_root();
    console.log("root =", num.toHex(resultRoot));

    const proof = [
        '0x40a6dba21b22596e979a1555a278ca58c11b5cd5e46f5801c1af8c4ab518845',
        '0x7957d036cf1e60858a601df12e0fb2921114d4b5facccf638163e0bb2be3c34',
        '0x12677ed42d2f73c92413c30d04d0b88e771bf2595c7060df46f095f2132eca2'
    ];

    const leaf = ['0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a', '26', '0'];
    const hashed_leaf = await myContract.hash_leaf_array(leaf) ;
    console.log("hashed leaf =", num.toHex(hashed_leaf))
    console.log("should be   = 0x6e5bfc0a35b74af4395c2a60a7735c0f0cbcfba515e91d4edd3f7ea70287cbc");

    const result1 = await myContract.verify_from_leaf_hash("0x6e5bfc0a35b74af4395c2a60a7735c0f0cbcfba515e91d4edd3f7ea70287cbc", proof);
    console.log("result from verify_from_leaf_hash =", result1);

    const result2 = await myContract.verify_from_leaf_array(leaf,proof);
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