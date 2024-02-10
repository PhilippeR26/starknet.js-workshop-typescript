// Deploy a new ArgentX wallet (Cairo1 0.3.0).
// launch with : npx ts-node ssrc/scripts/3.createNewArgentXaccount.ts
// Coded with Starknet.js v5.19.5, Starknet-devnet-rs v0.1.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, Contract } from "starknet";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
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
    const ch=hash.computeContractClassHash(accountAXsierra);
    console.log("Class Hash of ArgentX contract =",ch);
    
    // Calculate future address of the ArgentX account
    const privateKeyAX = "0x1234567890abcdef987654321";
    console.log('AX account Private Key =', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX account Public Key  =', starkKeyPubAX);
    
    // declare
    const respDecl=await account0.declare({contract:accountAXsierra,casm:accountAXcasm});
    const contractAXclassHash = "0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b";
    //const contractAXclassHash=respDecl.class_hash;
    await provider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX Cairo 1 contract declared")

    const calldataAX = new CallData(accountAXsierra.abi);
    const ConstructorAXCallData = calldataAX.compile("constructor", {
        owner: starkKeyPubAX,
        guardian: "0"
    });
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, ConstructorAXCallData, 0);
    console.log('Precalculated account address=', accountAXAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": accountAXAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy ArgentX account
    const accountAX = new Account(provider, accountAXAddress, privateKeyAX); 
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: ConstructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log("Final address =",accountAXFinalAdress);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });