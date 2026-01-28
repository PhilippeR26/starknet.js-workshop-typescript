// Test a Merkle tree hashed with Pedersen.
// Coded with Starknet.js v9.3.0 and Starknet-devnet (compatible rpc 0.10.0)
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Devnet/3a.TestMerkleVerifPedersenDevnet.ts

import { Account, json, Contract, RpcProvider, RPC, num, shortString, CairoBytes31 } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { DevnetProvider } from "starknet-devnet";
import { account3BraavosMainnetAddress, account3BraavosMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
dotenv.config({ quiet: true });

//    👇👇👇
// 🚨🚨🚨 Launch first the script src/scripts/merkleTree/2a.deployMerkleVerifPedersenDevnet.ts
// 🚨🚨🚨 launch starknet-devnet 'cargo run --release -- --seed 0' before using this script
//    👆👆👆
async function main() {
    // initialize Provider 
    // **** Starknet-devnet
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    // **** Sepolia Testnet
    //  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
    // *** Mainnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Mainnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_7" }); 
    // ***** local Sepolia Integration node :
    // const myProvider = new RpcProvider({ nodeUrl: ""  });
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9550/rpc/v0_7" }); 


    // Check that communication with provider is OK
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);

    // *** Devnet 
    // const accData = await l2DevnetProvider.getPredeployedAccounts();
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account0OZSepoliaAddress;
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // *** initialize existing Argent X Mainnet  account
    const accountAddress0 = account3BraavosMainnetAddress
    const privateKey0 = account3BraavosMainnetPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account1IntegrationOZ8address;
    // const privateKey0 = account1IntegrationOZ8privateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0, });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // ************************************
    
    // Connect the deployed contract in devnet
    //    👇👇👇
    // modify with the MerkleVerify address resulting of script 2a
    const MerkleVerifyAddress = "0x71b1816613705a408f8e727d6cb2b448522aa589b24123f7ec3e72c2c697bec";
    //    👆👆👆
    const compiledTest = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_pedersen_Merkle.contract_class.json").toString("ascii"));
    const myContract = new Contract({ abi: compiledTest.abi, address: MerkleVerifyAddress, providerOrAccount: account0 });
    console.log(myContract.functions);
    console.log('Contract connected at =', myContract.address, "\n");

    // Interactions with the contract with call 
    const typeH = await myContract.get_hash_type();
    console.log("hash type =", new CairoBytes31(typeH).decodeUtf8());
    // proof recovered from the server :
    const resultRoot = await myContract.get_root();
    console.log("root =", num.toHex(resultRoot));

    //    👇👇👇 result of script 1a
    const proof = [
        '0x61cd7d1de14516d2dbc88ae5dfc652f058db5073a6af2e84b037d8bd81b5fd3',
        '0x54d040a0fb15af62db14739f7b0dc71ae531e0f59dc9550990ba50affb51091',
        '0x4bcecd0cb4eba4ecad6748d60200d190a61dba4f6e7f09b5e15fdb72106c0dc',
        '0x433303296d255b42113ba28da5bbcc4006b1c27cb4e9402194b013d3b20d7cd',
        '0x40e456da4b94bb3eb940d9442820d204a1f721113c506a9b2efa732065b51de',
        '0x3cf57d0762b41e79ae7b36ddc43156776b2b2e2d3293a1b22e7a7407b4a396e',
        '0x73438d07c54dbc566bed99e36483822350e1f3b39c4b5dc8a9086b7424a3e37',
        '0x7ea27260aed1ce9e6674bf03c4659315ac3e751424c17bc0293435284702bae',
        '0x689372ee01f46f4725933d805ac71bb0e51ab1cb92d9f0e269d872f2cfaf54b',
        '0xf5befad1de7242f3b198c6b24c4794e992c62fed4d8d3633c1c6b118b6fad9'

    ];

    //    👇👇👇 result of script 1
    const leaf = [
        '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691',
        '0x3e8',
        '0x0'
    ];
    const hashed_leaf = await myContract.hash_leaf_array(leaf);
    console.log("hashed leaf =", num.toHex(hashed_leaf))
    //    👇👇👇 result of script 1
    const leafH = "0x61b70e86987702b2496b6faf482f87760a3239ae57a66b6c68a39965b2950b5"
    console.log("should be   =", leafH);

    //    👇👇👇 result of script 1
    const result1 = await myContract.verify_from_leaf_hash(leafH, proof);
    console.log("result from verify_from_leaf_hash =", result1);

    const result2 = await myContract.verify_from_leaf_array(leaf, proof);
    console.log("result from verify_from_leaf_array=", result2);

    const result3 = await myContract.verify_from_leaf_airdrop(leaf[0], { low: leaf[1], high: leaf[2] }, proof);
    console.log("result from verify_from_leaf_airdrop =", result3);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });