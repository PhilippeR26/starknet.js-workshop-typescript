// Create a new OpenZeppelin account in Starknet Sepolia testnet. Step 3/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/3.deployOZaccount.ts
// Coded with Starknet.js v5.24.3
import { Account, ec, json, Provider, hash, CallData, RpcProvider, Contract, cairo, stark } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey,  account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress,account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { infuraKey, account2MainnetAddress, account2MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { addrETH } from "../../../A2priv/A2priv";
import { junoNMtestnet } from "../../../A1priv/A1priv";


async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0.6" }); // local pathfinder sepolia testnet node


    // new Open Zeppelin account v0.8.1 :


    // deploy account
    const OZaccount0 = new Account(provider, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey);
    const OZ081ClassHash="0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    const starkKeyPub = ec.starkCurve.getStarkKey(account1OZSepoliaPrivateKey);
    //const chId=await provider.getChainId();
    //console.log("chainId =",chId);

    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const resDeployAccount = await OZaccount0.deployAccount({
        classHash: OZ081ClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub
    });
    console.log("res =", resDeployAccount);
    // const { transaction_hash, contract_address } = await OZaccount0.deployAccount({ classHash: OZ080b1ClassHash, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub }); 
    console.log("✅ New OpenZeppelin account created.txH =", resDeployAccount.transaction_hash, "\n   final address =", resDeployAccount.contract_address);
    await provider.waitForTransaction(resDeployAccount.transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });