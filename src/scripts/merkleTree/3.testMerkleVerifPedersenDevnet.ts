// Test a Merkle tree
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/3.merkleTreeV6.ts

import { Account, json, Contract, RpcProvider, RPC, encode, num, Call, Calldata } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 Launch first the script src/scripts/merkleTree/deployMerkle.ts
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

    // MERKLE TREE
    interface Airdrop {
        address: string;
        amount: string;
    }
    // Connect the deployed contract in devnet
    //    👇👇👇
    // modify with the Airdrop address resulting of 2.deployMerkle.ts
    const testAddress = "0x742711cced021549c42d8f450db76a6e3aa45a1a54481cf2607b22e267177ba";
    //    👆👆👆
    const compiledTest = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_pedersen.sierra.json").toString("ascii"));
    const myContract = new Contract(compiledTest.abi, testAddress, account0);
    console.log(myContract.functions);

    console.log('Contract connected at =', myContract.address);

    const is_made0 = await myContract.is_address_airdropped("0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a");
    console.log("is made =", is_made0)
    // Interactions with the contract with call 
    // proof recovered from the server :
    const proof = [
        '0x15d3d89532cfb667cc41feb817b39f8316d33b244df87572c97a84d670fc5f6',
        '0x7668799c40354f4b76ccee0817d5b4804f52b9328bd02f43e578e432362eecb',
        '0x78de171349ea33fcbc7cac4833037e0368e37e24c7741465cf2c22d0ef2e104'
    ];
    const resultRoot = await myContract.get_root();
    console.log("root =", num.toHex(resultRoot));

    const leaf = ['0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a', '26', '0'];
    // const hashed_leaf = await myContract.hash_leaf(leaf[0], leaf[1]);
    // console.log("hashed leaf =", num.toHex(hashed_leaf));
    // //0x1ec6375477dd0822dc2c77c5c0a6efc97915a93df1ccc5c6b89b684c0ae2cef

    // const proof0Call: Call = myContract.populate("hash_proof0", {
    //     leaf: hashed_leaf,
    //     proofEnter: proof
    // });
    // const hash0 = (await myContract.call("hash_proof0", proof0Call.calldata as Calldata)) as bigint
    // console.log("Hash0     =",num.toHex(hash0));
    // console.log("Should be = 0x47c6bb5d7802c88b9c84af0eab505802b27aa3b539933fa778e69b7d03e3861");

    const result1 = await myContract.verify_proof("0x5bc4a0b9116d541e35f28b6ed5eb10f093c155f1a21cc3096ccb0c19ccb8b99", proof);
    //const idxResponse = Object.values(result1);
    // console.log("Result =", "0x" + result1.res.toString(16));
    console.log("result1 =", result1);
    //console.log("idxResponse =", idxResponse);
    let airdropPerformed: boolean;
    try {
        await myContract.invoke("request_airdrop", ["0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a", "0x1a", proof]);
        airdropPerformed = true
    }
    catch (err) {
        console.log(err);
        airdropPerformed = false
    }
    console.log("Result =", airdropPerformed);

    const tim = await myContract.get_time();
    const end = BigInt(new Date().getTime()) / 1000n;
    console.log("block_time =", tim, "\n   my_time =", end);

    const is_made = await myContract.is_address_airdropped("0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a");
    console.log("is made =", is_made)

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });