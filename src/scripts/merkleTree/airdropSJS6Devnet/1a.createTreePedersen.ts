// Test a Merkle tree hashed with Pedersen
// Coded with Starknet.js v9.3.0 and Starknet-devnet (compatible rpc 0.10.0)
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Devnet/1a.createTreePedersen.ts

import { json } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config({ quiet: true });

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    const list = json.parse(fs.readFileSync("./src/scripts/merkleTree/airdropSJS6Devnet/listAddressesDevnet.json").toString("ascii"));
    // each leaf is a string array : address, number of token

    const airdrop: Merkle.InputForMerkle[] = list.list;

    console.time("create tree");
    const tree1 = Merkle.StarknetMerkleTree.create(airdrop, Merkle.HashType.Pedersen);
    console.timeEnd("create tree");
    console.log("items quantity =", tree1.dump().values.length);
    console.log("root =", tree1.root); // for smartcontract constructor
    fs.writeFileSync('./src/scripts/merkleTree/airdropSJS6Devnet/treeListAddressPedersenDevnet.json', JSON.stringify(tree1.dump(), undefined, 2));

    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Devnet/treeListAddressPedersenDevnet.json', 'ascii'))
    );
    // process.exit(5);
    const accountAddress = '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691';
    const indexAddress = tree.dump().values.findIndex((leaf) => leaf.value[0] == accountAddress);
    if (indexAddress === -1) {
        throw new Error("address not found in the list.");
    }
    const inpData = tree.getInputData(indexAddress);
    console.log("Leaf #", indexAddress, "contains =", inpData);
    const leafHash = Merkle.StarknetMerkleTree.leafHash(inpData, Merkle.HashType.Pedersen);
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
