// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v9.2.1
// launch with npx src/scripts/merkleTree/airdropSJS6Sepolia/5a.testAirdropPedersenSepolia.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256, shortString, type CompiledSierra } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function main() {
    // initialize Provider. Adapt to your needs
    // **** Starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // **** Sepolia Testnet :
    const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey });

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());

    // initialize account. Adapt to your case
    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

    // *** initialize existing Sepolia Testnet account
    const accountAddress0 = account1BraavosSepoliaAddress;
    const privateKey0 = account1BraavosSepoliaPrivateKey;

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account({ provider, address: accountAddress0, signer: privateKey0 });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // Connect the Airdrop deployed contract in devnet
    //    👇👇👇
    // modify with the Airdrop address resulting of 2 & 4 :
    const ERC20_ADDRESS = "0x37e0251e45a968a26fa503635c031d6020612a10d35c99e3496e10cb930f0a3";

    // Interactions with the contract with call 
    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Sepolia/treeListAddressSepoliaPedersen.json', 'ascii'))
    );
    const leaf = tree.getInputData(1380);
    console.log({ leaf });
    // proof recovered from the server :

    const proof = tree.getProof(1380);
    console.log({ proof });

    const hashLeaf=Merkle.StarknetMerkleTree.leafHash(leaf,Merkle.HashType.Pedersen);
    console.log({hashLeaf});
    const localVerif= tree.verify(1380,proof);
    console.log({localVerif});


    const sierra = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_pedersen.sierra.json").toString("ascii")) as CompiledSierra;
    const pedersenVerifContract = new Contract({ abi: sierra.abi, address: "0x0169adc4bfb30dc3280fc79368410e72c7eaec612c2fd69c327e36ce53d9aedd" });
    const root = "0x0165eb9df01e9b94c4eb8315c32ed7f728a429c41deea9ddc427c5d8b252af8d";

    const getRoot = await pedersenVerifContract.get_root();
    console.log(root == getRoot ? "✅" : "❌", 'root=', num.toHex64(getRoot));
    const leafHash = await pedersenVerifContract.hash_leaf_array(leaf);
    console.log("leaf hash =", num.toHex64(leafHash));
    const verifFromHash = await pedersenVerifContract.verify_from_leaf_hash(leafHash, proof);
    console.log({ verifFromHash });
    const verifFromLeaf = await pedersenVerifContract.verify_from_leaf_array(leaf, proof);
    console.log({ verifFromLeaf });



    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });