// Deploy a contract to verify a Pedersen Merkle tree
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/2.deployMerkle.ts

import { Account, Call, Calldata, CallData, Contract, json, RPC, RpcProvider } from 'starknet';
import { resetDevnetNow } from '../utils/resetDevnetFunc';

import fs from "fs";
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
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, RPC.ETransactionVersion.V2);
    console.log("Account 0 connected.\n In progress...");

    // deploy ERC20
    const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const compiledCasmERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.casm.json").toString("ascii"));
    const myCallERC20 = new CallData(compiledSierraERC20.abi);
    const myConstructorERC20: Calldata = myCallERC20.compile("constructor", {
        name: "SuperToken",
        symbol: "STK",
        initial_supply: 1000,
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

    // deploy Airdrop
    const compiledSierraAirdrop = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_pedersen.sierra.json").toString("ascii"));
    const compiledCasmAirdrop = json.parse(fs.readFileSync("compiledContracts/cairo240/merkle_verify_pedersen.casm.json").toString("ascii"));
    const myCallAirdrop = new CallData(compiledSierraAirdrop.abi);
    const root = "0x22f696d3dd16ed893c66899f07ff4d5eacb70416c02b50fd3b53378105d60bc"
    const myConstructorAirdrop: Calldata = myCallAirdrop.compile("constructor", {
        erc20_address: erc20Address,
        start_time: 1704811578,
        merkle_root: root,
    });
    const deployResponse = await account0.declareAndDeploy({
        contract: compiledSierraAirdrop,
        casm: compiledCasmAirdrop,
        constructorCalldata: myConstructorAirdrop
    });
    const airdropAddress = deployResponse.deploy.contract_address;
    const airdropClassHash = deployResponse.declare.class_hash;
    console.log("Airdrop contract :");
    console.log("class_hash =", airdropClassHash);
    console.log("address =", airdropAddress);

    // authorize the Airdrop contract to transfer some tokens
    const erc20Contract = new Contract(compiledSierraERC20.abi, erc20Address, account0);
    const authorize: Call = erc20Contract.populate("approve", {
        spender: airdropAddress,
        amount: 500
    });
    const tx = await account0.execute(authorize);
    const txR = await provider.waitForTransaction(tx.transaction_hash);
    console.log("authorize =",txR.execution_status);
    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });