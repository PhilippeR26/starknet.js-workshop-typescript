// Test a Merkle tree hashed with Poseidon
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/1a.testMerkleLibPoseidon.ts

import { Account, ec, hash, Provider, num, json, Contract, encode, Signature, typedData, uint256, RpcProvider, RPC } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    const list = json.parse(fs.readFileSync("./src/scripts/merkleTree/listAddressSepolia.json").toString("ascii"));
    // each leaf is a string array : address, number of token

    const airdrop: Merkle.InputForMerkle[] = list.list;

    const tree1 = Merkle.StarknetMerkleTree.create(airdrop, Merkle.HashType.Poseidon);
    console.log("root =", tree1.root); // for smartcontract constructor
    fs.writeFileSync('src/scripts/merkleTree/treeListAddressSepolia.json', JSON.stringify(tree1.dump(),undefined,2));

    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/treeListAddressSepolia.json', 'ascii'))
    );
    // process.exit(5);
    const accountAddress = '0x00AeA72d025Ae2F361afAcb86Cd58AAAdAA7bD4a961CC56fB0F3D8087476BAbd';
    const indexAddress = tree.dump().values.findIndex((leaf) => leaf.value[0] == accountAddress);
    if (indexAddress === -1) {
        throw new Error("address not found in the list.");
    }
    const inpData = tree.getInputData(indexAddress);
    console.log("Leaf #", indexAddress, "contains =", inpData);
    const leafHash = Merkle.StarknetMerkleTree.leafHash(inpData, Merkle.HashType.Poseidon);
    console.log("leafHash =", leafHash);
    const proof = tree.getProof(indexAddress);
    console.log("corresponding proof =", proof);
    const isValid = tree.verify(inpData, proof);
    console.log("This proof is", isValid);
    //console.log(tree.render());
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
