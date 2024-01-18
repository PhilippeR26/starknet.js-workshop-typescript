// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.0.0-beta.11 and Starknet-devnet-rs (compatible rpc 0.6.0)
// launch with npx ts-node src/scripts/merkleTree/3a.merkleTreePoseidonV6.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256 } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 Launch first the scripts src/scripts/merkleTree/2a.deployMerklePoseidon.ts & src/scripts/merkleTree/5.deployAirdropPoseidonDevnet.ts
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = "0x987654321aabbccddeeff";
    const accountAddress0 = "0x6c9cb47e3bb345fcccbba0fc51bac5c706701523a20f203b11dbb66bd648612";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    //const account0 = new Account(provider, accountAddress0, privateKey0, undefined, RPC.ETransactionVersion.V2);
    console.log("Account 0 connected.\n");

    // Connect the Airdrop deployed contract in devnet
    //    👇👇👇
    // modify with the Airdrop address resulting of 2a & 5 :
    const ERC20_ADDRESS = "0x1adfa979bc2ec510f98dec71f34520408cc730b5e6f6980c3ac9cb28521ff78";
    const AIRDROP_ADDRESS = "0x3d8e0480959cc8f0f97c9a30d91478ea28936751cd49ce8a36028b3d431e767";
    //    👆👆👆
    const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const erc20Contract = new Contract(compiledSierraERC20.abi, ERC20_ADDRESS, account0);
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/airdrop.sierra.json").toString("ascii"));
    const myContract = new Contract(compiledTest.abi, AIRDROP_ADDRESS, account0);
    console.log(myContract.functions);
    console.log('Contract connected at =', myContract.address, "\n");

    // Interactions with the contract with call 
    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/treeTestPoseidon.json', 'ascii'))
    );
    const leaf=tree.getInputData(3);
    // proof recovered from the server :
    // const leaf = ['0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a', '26', '0'];
    const proof=tree.getProof(3);
    // const proof = [
    //     '0x40a6dba21b22596e979a1555a278ca58c11b5cd5e46f5801c1af8c4ab518845',
    //     '0x7957d036cf1e60858a601df12e0fb2921114d4b5facccf638163e0bb2be3c34',
    //     '0x12677ed42d2f73c92413c30d04d0b88e771bf2595c7060df46f095f2132eca2'
    // ];
    const result0 = await myContract.is_address_airdropped(leaf[0]);
    console.log("Is address already airdropped =", result0);
        console.log("leaf0=",leaf[0]);
    const amount: Uint256 = { low: leaf[1], high: leaf[2] };
    const myCall = myContract.populate("request_airdrop", {
        address: '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
        amount,
        proof
    })
    console.log(myCall);
    const txResp = await account0.execute(myCall);
    console.log("executed...");
    await provider.waitForTransaction(txResp.transaction_hash);
    const result1 = await myContract.is_address_airdropped(leaf[0]);
    console.log("result from airdrop request =", result1);
    const bal=await erc20Contract.balanceOf(leaf[0]);
    console.log("New balance of",leaf[0],"=",bal);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });