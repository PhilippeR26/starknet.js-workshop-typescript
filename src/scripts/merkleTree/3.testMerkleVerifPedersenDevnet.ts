// Test a Merkle tree hashed with Pedersen.
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/3.TestMerkleTreePedersenDevnet.ts

import { Account, json, Contract, RpcProvider, RPC, num} from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 Launch first the script src/scripts/merkleTree/2.deployMerkleVerifPedersenDevnet.ts
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
    // modify with the MerkleVerify address resulting of 2.deployMerkleVerifPedersenDevnet.ts
    const testAddress = "0x1221a5c7e05bf3702853c6191eafd5284752fb4fa59a5157cc496e492a5e785";
    //    👆👆👆
    const compiledTest = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_pedersen.sierra.json").toString("ascii"));
    const myContract = new Contract(compiledTest.abi, testAddress, account0);
    console.log(myContract.functions);
    console.log('Contract connected at =', myContract.address,"\n");

    // Interactions with the contract with call 
    // proof recovered from the server :
    const resultRoot = await myContract.get_root();
    console.log("root =", num.toHex(resultRoot));

    const proof = [
        '0x15d3d89532cfb667cc41feb817b39f8316d33b244df87572c97a84d670fc5f6',
        '0x7668799c40354f4b76ccee0817d5b4804f52b9328bd02f43e578e432362eecb',
        '0x78de171349ea33fcbc7cac4833037e0368e37e24c7741465cf2c22d0ef2e104'
      ];

    const leaf = ['0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a', '26', '0'];
    const hashed_leaf = await myContract.hash_leaf_array(leaf) ;
    console.log("hashed leaf =", num.toHex(hashed_leaf))
    console.log("should be   = 0x5bc4a0b9116d541e35f28b6ed5eb10f093c155f1a21cc3096ccb0c19ccb8b99");

    const result1 = await myContract.verify_from_leaf_hash("0x5bc4a0b9116d541e35f28b6ed5eb10f093c155f1a21cc3096ccb0c19ccb8b99", proof);
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