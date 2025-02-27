// Check if public key is valid.
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/3.deployOZaccount.ts
// Coded with Starknet.js v5.24.3
import { Account, ec, json, Provider, hash, CallData, RpcProvider, Contract, cairo, stark } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";

import { infuraKey, account4MainnetAddress, account4MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { junoNMtestnet } from "../../../A1priv/A1priv";


async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0.5" }); // local pathfinder sepolia testnet node


    // new Open Zeppelin account v0.8.0b1 :


    // deploy account
    const OZaccount0 = new Account(provider, account1IntegrationOZ8address, account1IntegrationOZ8privateKey);
    const OZ080b1ClassHash = "0x00903752516de5c04fe91600ca6891e325278b2dfc54880ae11a809abb364844";
    const starkKeyPub = await OZaccount0.signer.getPubKey();
    console.log("Calculated public key =", starkKeyPub);
    //const chId=await provider.getChainId();
    //console.log("chainId =",chId);
    const compiledOZcontract = await provider.getClassAt(OZaccount0.address);
    const contractOZ = new Contract(compiledOZcontract.abi, OZaccount0.address, OZaccount0);
    console.log(contractOZ.functions);
    const pubK=await contractOZ.getPublicKey();
    console.log("recovered PubK =", "0x"+pubK.toString(16));
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });