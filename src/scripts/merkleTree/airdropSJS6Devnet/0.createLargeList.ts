// Create a large list of addresses.
// Coded with Starknet.js v9.3.0 and Starknet-devnet (compatible rpc 0.10.0)
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Devnet/0.createLargeList.ts

import { json, num, stark } from "starknet";
import * as Merkle from "starknet-merkle-tree";
// import * as Merkle from "starknet-merkle-tree-old";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config({ quiet: true });

async function main() {
    const numberOfLeaves = 1_000; // each leaves includes 3 felt252
    const list: Merkle.InputForMerkle[] = [];
    for (let i = 0; i < numberOfLeaves; i++) {
        list.push([
            stark.randomAddress(),
            stark.randomAddress(),
            stark.randomAddress()
        ]);
    };
    fs.writeFileSync('./src/scripts/merkleTree/airdropSJS6Devnet/listLarge.json', JSON.stringify({ list }, undefined, 2));


    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
