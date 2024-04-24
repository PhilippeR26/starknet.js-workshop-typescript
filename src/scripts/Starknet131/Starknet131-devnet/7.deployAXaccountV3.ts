// Deploy a new ArgentX wallet (Cairo1 0.3.1).
// launch with : npx src/scripts/Starknet131/Starknet131-devnet/7.deployAXaccountV3.ts
// Coded with Starknet.js v6.8.0, Starknet-devnet-rs v0.0.5

import { RpcProvider, Account, ec, json, stark, hash, CallData, Contract, constants } from "starknet";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --fork-network http://192.168.1.11:9545/rpc/v0_7' in devnet-rs directory before using this script, using my local pathfinder Sepolia testnet
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo243/ArgentXAccount031.sierra.json").toString("ascii"));
    const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo243/ArgentXAccount031.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountAXsierra);
    console.log("Class Hash of ArgentX contract =", ch);

    // Calculate future address of the ArgentX account
    const privateKeyAX = stark.randomAddress();
    console.log('AX account Private Key =', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX account Public Key  =', starkKeyPubAX);
    const contractAXclassHash = "0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b";
    const calldataAX = new CallData(accountAXsierra.abi);
    const ConstructorAXCallData = calldataAX.compile("constructor", {
        owner: starkKeyPubAX,
        guardian: "0"
    });
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, ConstructorAXCallData, 0);
    console.log('Precalculated account address=', accountAXAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": accountAXAddress,
        "amount": 10_000_000_000_000_000_000
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    const { data: answer2 } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": accountAXAddress,
        "amount": 10_000_000_000_000_000_000,
        "unit": "FRI",
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer2); // 10 STRK

    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const contractETH = new Contract(compiledERC20.abi, ethAddress, provider);
    const contractSTRK = new Contract(compiledERC20.abi, strkAddress, provider);

    
    // deploy ArgentX account
    const accountAX = new Account(provider, accountAXAddress, privateKeyAX,undefined,constants.TRANSACTION_VERSION.V3);
    const initialEth = await contractETH.balanceOf(accountAX.address) as bigint;
    const initialStrk = await contractSTRK.balanceOf(accountAX.address) as bigint;
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: ConstructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log("Final address =", accountAXFinalAdress);
    await provider.waitForTransaction(AXdAth);
    const finalEth = await contractETH.balanceOf(accountAX.address);
    const finalStrk = await contractSTRK.balanceOf(accountAX.address);
    console.log("Reduction of ETH balance =", formatBalance(initialEth - finalEth, 18));
    console.log("Reduction of STRK balance =", formatBalance(initialStrk - finalStrk, 18));

    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });