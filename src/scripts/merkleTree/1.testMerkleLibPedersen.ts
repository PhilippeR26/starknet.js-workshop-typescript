// Test a Merkle tree hashed with Pedersen
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/1.testMerkleLibPedersen.ts

import { Account, ec, hash, Provider, num, json, Contract, encode, Signature, typedData, uint256, RpcProvider, RPC } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    // each leaf is a string array : address, number of token
    const airdrop: Merkle.InputForMerkle[] = [
        ['0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79', '256','0'],
        ['0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1', '25','0'],
        ['0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c', '56','0'],
        ['0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a', '26','0'],
        ['0x53c615080d35defd55569488bc48c1a91d82f2d2ce6199463e095b4a4ead551', '56','0'],
    ];
    const tree1 = Merkle.StarknetMerkleTree.create(airdrop, Merkle.HashType.Pedersen);
    console.log("root =", tree1.root); // for smartcontract constructor
    fs.writeFileSync('src/scripts/merkleTree/treeTestPedersen.json', JSON.stringify(tree1.dump(),undefined,2));

    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/treeTestPedersen.json', 'ascii'))
    );
    tree.validate(); // if necessary
    const walletAddress = '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a';
    const indexAddress = airdrop.findIndex((leaf) => {
        if (leaf[0] == walletAddress) { return true }
        return false
    });
    const inp = indexAddress;
    if (inp === -1) {
        throw new Error("address not found in the list.");
    }
    const inpData = tree.getInputData(inp);
    console.log("Leaf #",inp,"contains =", inpData);
    const leafHash = Merkle.StarknetMerkleTree.leafHash(inpData,Merkle.HashType.Pedersen);
    console.log("leafHash =", leafHash);
    const proof = tree.getProof(inp);
    console.log("corresponding proof =",proof);
    const isValid=tree.verify(inpData,proof);
    console.log("This proof is",isValid);
    console.log(tree.render());
    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

function getHexString(d2: string) {
    throw new Error("Function not implemented.");
}
