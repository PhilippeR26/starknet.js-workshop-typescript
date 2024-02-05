// Deploy a new ArgentX wallet, without declaration (fork of testnet)
// Coded with Starknet.js v5.11.1
// launch with : npx ts-node src/scripts/3.createNewArgentXaccount.ts


import { Provider, Account, ec, json, stark, hash, CallData } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

   //          👇👇👇
    // 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --fork-network alpha-goerli' before using this script.
    //          👆👆👆

async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (process.env.STARKNET_PROVIDER_BASE_URL != "http://127.0.0.1:5050") {
        console.log("This script work only on local devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });
    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT0_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0Address: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing OZ account0 connected.\n');

    // Declare Proxy and ArgentXaccount classes in devnet :
     const argentXproxyClassHash = "0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXimplementationClassHash = "0x33434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

    // Calculate future address of the ArgentX account
    // const privateKeyAX = process.env.AA_NEW_ACCOUNT_PRIVKEY ?? "";
    const privateKeyAX=stark.randomAddress();
    console.log('AX_ACCOUNT_DEVNET_PRIVKEY=', privateKeyAX);
    //const starkKeyPairAX = ec.getKeyPair(privateKeyAX);
    //const starkKeyPairAX = ec.genKeyPair();
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    const AXimplementationInitializer=CallData.compile({ signer: starkKeyPubAX, guardian: "0" });
    const AXproxyConstructorCallData = CallData.compile({ 
        implementation: argentXimplementationClassHash, 
        selector: hash.getSelectorFromName("initialize"), 
        calldata: [...AXimplementationInitializer], });
    const AXproxyAddress = hash.calculateContractAddressFromHash(
        starkKeyPubAX, 
        argentXproxyClassHash, 
        AXproxyConstructorCallData, 
        0);
    console.log('Precalculated account address=', AXproxyAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": AXproxyAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);

    // deploy ArgentX account
    const accountAX = new Account(provider, AXproxyAddress, privateKeyAX);
    const deployAccountPayload = { 
        classHash: argentXproxyClassHash, 
        constructorCalldata: AXproxyConstructorCallData, 
        contractAddress: AXproxyAddress, 
        addressSalt: starkKeyPubAX };
    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log('Transaction hash =', AXdAth);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });