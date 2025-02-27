// Create a new OpenZeppelin account in Starknet Sepolia integration. Step 3/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-integration/3.deployOZaccount.ts
// Coded with Starknet.js v5.24.3
import { Account, ec, json, hash, CallData, RpcProvider, Contract, cairo, stark } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account1IntegrationOZ8address,account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { infuraKey, account4MainnetAddress, account4MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { addrETH } from "../../../A2priv/A2priv";
import { junoNMtestnet } from "../../../A1priv/A1priv";


async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0.5" }); // local pathfinder sepolia Integration node


    // new Open Zeppelin account v0.8.0 :


    // deploy account
    const OZaccount0 = new Account(provider, account1IntegrationOZ8address, account1IntegrationOZ8privateKey);
    const OZ080ClassHash="0x5400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c";
    //const starkKeyPub = ec.starkCurve.getStarkKey(account1IntegrationOZprivateKey);
    const starkKeyPub = await OZaccount0.signer.getPubKey();
    //const chId=await provider.getChainId();
    //console.log("chainId =",chId);

    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const resDeplAccount = await OZaccount0.deployAccount({
        classHash: OZ080ClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub
    });
    console.log("res =", resDeplAccount);
    // const { transaction_hash, contract_address } = await OZaccount0.deployAccount({ classHash: OZ080ClassHash, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub }); 
    console.log("✅ New OpenZeppelin account created.txH =", resDeplAccount.transaction_hash, "\n   final address =", resDeplAccount.contract_address);
    await provider.waitForTransaction(resDeplAccount.transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });