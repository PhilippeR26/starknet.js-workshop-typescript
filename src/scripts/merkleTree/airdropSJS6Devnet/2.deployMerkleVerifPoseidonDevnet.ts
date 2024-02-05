// Declare/Deploy a contract to verify a Poseidon Merkle tree
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/2b.deployMerklePoseidonDevnet.ts

import { Account, Call, Calldata, CallData, Contract, json, RPC, RpcProvider } from 'starknet';
import fs from "fs";
import { resetDevnetNow } from '../../utils/resetDevnetFunc';

import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");
    resetDevnetNow();
    console.log("Devnet reset performed.");
    
    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n In progress...");

    // deploy ERC20
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
    });
    const erc20Address = deployResponseERC20.deploy.contract_address;
    const erc20ClassHash = deployResponseERC20.declare.class_hash;
    console.log("ERC20 contract :");
    console.log("class_hash =", erc20ClassHash);
    console.log("address =", erc20Address);

    // deploy MerkleVerify
    const compiledSierraMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_poseidon.sierra.json").toString("ascii"));
    const compiledCasmMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_poseidon.casm.json").toString("ascii"));
    const myCallMerkleVerify = new CallData(compiledSierraMerkleVerify.abi);
    //    👇👇👇 result of script 1
    const root = "0x2f9e76ae7d7c98e94b848e7bfa684a6158e5f285654d336c9d6524b9ccf7c36"
    const myConstructorMerkleVerify: Calldata = myCallMerkleVerify.compile("constructor", {
          merkle_root: root,
    });
    const deployResponse = await account0.declareAndDeploy({
        contract: compiledSierraMerkleVerify,
        casm: compiledCasmMerkleVerify,
        constructorCalldata: myConstructorMerkleVerify
    });
    
    const merkleAddress = deployResponse.deploy.contract_address;
    const merkleClassHash = deployResponse.declare.class_hash;
    console.log("MerkleVerify contract :");
    console.log("class_hash =", merkleClassHash);
    console.log("address =", merkleAddress);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });