// Deploy a new ArgentX wallet (Cairo1 0.3.1).
// launch with : npx ts-node ssrc/scripts/3.createNewArgentXaccount.ts
// Coded with Starknet.js v5.19.5, Starknet-devnet-rs v0.1.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, Contract, CairoOption, CairoOptionVariant, CairoCustomEnum } from "starknet";
import { DevnetProvider } from "starknet-devnet";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    const devnetProvider=new DevnetProvider({url:provider.channel.nodeUrl});
    if (!devnetProvider.isAlive()){
        console.log("Devnet-rs is not running...");
        process.exit(5);
    }
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
    const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountAXsierra);
    console.log("Class Hash of ArgentX contract =", ch);

    // Calculate future address of the ArgentX account
    const privateKeyAX = "0x1234567890abcdef987654321";
    console.log('AX account Private Key =', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX account Public Key  =', starkKeyPubAX);

    // declare
    const respDecl = await account0.declareIfNot({ contract: accountAXsierra, casm: accountAXcasm });
    if (respDecl.transaction_hash) {
        await provider.waitForTransaction(respDecl.transaction_hash);
        console.log("ArgentX Cairo 1 contract declared");
    } else { console.log("Already declared.") };

    const contractAXclassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
    //const contractAXclassHash=respDecl.class_hash;
    const calldataAX = new CallData(accountAXsierra.abi);
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
    const constructorAXCallData = calldataAX.compile("constructor", {
        owner: axSigner,
        guardian: axGuardian
    });
    console.log("constructor =", constructorAXCallData);
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, constructorAXCallData, 0);
    console.log('Precalculated account address=', accountAXAddress);

    // fund account address before account creation
    // const _mint0=devnetProvider.mint(accountAXAddress,10_000_000_000_000_000_000,"WEI");
    // const _mint1=devnetProvider.mint(accountAXAddress,100_000_000_000_000_000_000,"FRI");
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

    // deploy ArgentX account
    const accountAX = new Account(provider, accountAXAddress, privateKeyAX);
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: constructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload);
    console.log("Final address =", accountAXFinalAddress);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });