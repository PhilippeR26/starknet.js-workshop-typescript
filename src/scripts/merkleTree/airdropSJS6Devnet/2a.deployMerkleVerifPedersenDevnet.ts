// Declare/Deploy a contract to verify a Pedersen Merkle tree
// Coded with Starknet.js v9.3.0 and Starknet-devnet(compatible rpc 0.10.0)
// launch with npx ts-node src/scripts/merkleTree/airdropSJS6Devnet/2a.deployMerkleVerifPedersenDevnet.ts

import { Account, CairoBytes31, Call, Calldata, CallData, Contract, json, RPC, RpcProvider } from 'starknet';
import fs from "fs";

import * as dotenv from "dotenv";
import { DevnetProvider } from 'starknet-devnet';
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from '../../../A1priv/A1priv';
dotenv.config({quiet:true});

//    👇👇👇
// 🚨🚨🚨 launch starknet-devnet 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function main() {
    // *** devnet
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }

    // *** Sepolia Testnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/" + alchemyKey, specVersion: "0.9.0" });

    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected");

    // *** initialize existing pre-deployed account 0 of Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // *** Sepolia Testnet account
    // const accountAddress0 = account2TestBraavosSepoliaAddress;
    // const privateKey0 = account2TestBraavosSepoliaPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
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
    }, { tip: 0 });
    const erc20Address = deployResponseERC20.deploy.contract_address;
    const erc20ClassHash = deployResponseERC20.declare.class_hash;
    console.log("ERC20 contract :");
    console.log("class_hash =", erc20ClassHash);
    console.log("address =", erc20Address);

    // deploy MerkleVerify
    const compiledSierraMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_pedersen_Merkle.contract_class.json").toString("ascii"));
    const compiledCasmMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_pedersen_Merkle.compiled_contract_class.json").toString("ascii"));
    const myCallMerkleVerify = new CallData(compiledSierraMerkleVerify.abi);
    //    👇👇👇 result of script 1a
    const root = "0x14623f721f74fcccb0f5377b30b765dcf06da4ff52a7c826a8bf1d5df4ceb87"
    const myConstructorMerkleVerify: Calldata = myCallMerkleVerify.compile("constructor", {
        merkle_root: root,
    });
    const deployResponse = await account0.declareAndDeploy({
        contract: compiledSierraMerkleVerify,
        casm: compiledCasmMerkleVerify,
        constructorCalldata: myConstructorMerkleVerify
    }, { tip: 0 });

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