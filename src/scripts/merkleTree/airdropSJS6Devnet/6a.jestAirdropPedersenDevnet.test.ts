// Test a Merkle tree hashed with Pedersen.
// Coded with Starknet.js v9.2.1 and Starknet-devnet v0.7.2
// Launch with npx jest src/scripts/merkleTree/airdropSJS6Devnet/6a.jestAirdropPedersenDevnet.test.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256, Calldata, CallData, Call, encode, addAddressPadding, CairoBytes31, type CairoUint256 } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 
// 🚨🚨🚨 launch starknet-devnet 'cargo run --release -- --seed 0' before using this script
//    👆👆👆




describe('Airdrop contract tests', () => {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    const accountAddress0 = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    
    let erc20Contract: Contract;
    let merkleVerifyContract: Contract;
    let airdropContract: Contract;
    let tree: Merkle.StarknetMerkleTree;
    let root0: string;
    let l2DevnetProvider: DevnetProvider;
    const initialConsolation = 3n;
    beforeAll(async () => {
        l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
        if (!(await l2DevnetProvider.isAlive())) {
            console.log("No l2 devnet.");
            process.exit();
        }
        console.log(
            "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
            ", rpc", await myProvider.getSpecVersion(),
            ", SN version =", (await myProvider.getBlock()).starknet_version);
        console.log("Provider connected to Starknet-devnet-rs");
        console.log("Account 0 connected.\n");

        tree = Merkle.StarknetMerkleTree.load(
            JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Devnet/treeListAddressPedersenDevnet.json', 'ascii'))
        );

        // ********* deploy ERC20
        const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
        const compiledCasmERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.casm.json").toString("ascii"));
        const myCallERC20 = new CallData(compiledSierraERC20.abi);
        const myConstructorERC20: Calldata = myCallERC20.compile("constructor", {
            name: "Starknet.js-v6-celebration",
            symbol: "SJS6",
            initial_supply: 40000,
            recipient: account0.address,
        });
        const deployResponseERC20 = await account0.declareAndDeploy({
            contract: compiledSierraERC20,
            casm: compiledCasmERC20,
            constructorCalldata: myConstructorERC20
        }, { tip: 0 });
        const erc20Address = deployResponseERC20.deploy.contract_address;
        const erc20ClassHash = deployResponseERC20.declare.class_hash;
        console.log("ERC20 contract :");
        console.log("class_hash =", erc20ClassHash);
        console.log("address =", erc20Address);
        erc20Contract = new Contract({ abi: compiledSierraERC20.abi, address: erc20Address, providerOrAccount: account0 });

        // ******** deploy MerkleVerify
        const sierraMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_pedersen_Merkle.contract_class.json").toString("ascii"));
        const casmMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_pedersen_Merkle.compiled_contract_class.json").toString("ascii"));
        const myCallMerkleVerify = new CallData(sierraMerkleVerify.abi);
        root0 = num.toHex64(tree.root);
        console.log({root0});
        const myConstructorMerkleVerify: Calldata = myCallMerkleVerify.compile("constructor", {
            merkle_root: root0,
        });
        const deployResponse0 = await account0.declareAndDeploy({
            contract: sierraMerkleVerify,
            casm: casmMerkleVerify,
            constructorCalldata: myConstructorMerkleVerify
        }, { tip: 0 });
        const merkleAddress = deployResponse0.deploy.contract_address;
        const merkleClassHash = deployResponse0.declare.class_hash;
        console.log("MerkleVerify contract :");
        console.log("class_hash =", merkleClassHash);
        console.log("address =", merkleAddress);
        merkleVerifyContract = new Contract({ abi: sierraMerkleVerify.abi, address: merkleAddress, providerOrAccount: account0 });
    });

    test("get_root", async () => {
        const root = num.toHex64(await merkleVerifyContract.get_root());
        expect(root).toEqual(root0);
    });

    test("hash leaf", async () => {
        const leaf = tree.getInputData(3);
        const localHash = num.toHex64(Merkle.StarknetMerkleTree.leafHash(leaf, Merkle.HashType.Pedersen));
        console.log({localHash});
        const hashLeaf = num.toHex64(await merkleVerifyContract.hash_leaf_array(leaf));
        expect(localHash).toEqual(hashLeaf);
    });

    test("verify_from_leaf_hash", async () => {
        const leaf = tree.getInputData(3);
        const localHash = num.toHex64(Merkle.StarknetMerkleTree.leafHash(leaf, Merkle.HashType.Pedersen));
        console.log({localHash});
        // localHash: '0x00b25974bb55dc3155639b41fa8a9ab88a04b2ab0c7f0c044672232566f46931'
        const proof = tree.getProof(leaf);
        const formattedProof = proof.reduce((cumul, val) => cumul + num.toHex64(val) + ",", "")
        console.log("formatted proof=", formattedProof);
        const localVerify=tree.verify(3,proof);
        console.log({localVerify});
        const isVerified = await merkleVerifyContract.verify_from_leaf_hash(localHash, proof);
        expect(isVerified).toBe(true);
    });

    test("verify_from_leaf_array", async () => {
        const leaf = tree.getInputData(3) as string[];
        const proof = tree.getProof(leaf);
        console.log({ leaf });
        const formattedLeaf = leaf.reduce((cumul, val) => cumul + num.toHex(val) + ",", "")
        console.log("formatted leaf=", formattedLeaf);
        console.log({ proof });
        console.log("formatted proof=", proof.reduce((cumul, val) => cumul + num.toHex(val) + ",", ""));
        const isVerified = await merkleVerifyContract.verify_from_leaf_array(leaf, proof);
        expect(isVerified).toBe(true);
    });


    test("verify_from_leaf_airdrop", async () => {
        const leaf = tree.getInputData(3);
        const addr = leaf[0];
        const amount: Uint256 = { low: leaf[1], high: leaf[2] };
        const proof = tree.getProof(leaf);
        const isVerified = await merkleVerifyContract.verify_from_leaf_airdrop(addr, amount, proof);
        expect(isVerified).toBe(true);
    });
});