// Create a new OpenZeppelin account in Starknet Sepolia testnet. Step 3/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/3.deployOZaccount.ts
// Coded with Starknet.js v5.24.3
import { Account, ec, json, Provider, hash, CallData, RpcProvider, Contract, cairo, stark, shortString } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { infuraKey, account2MainnetAddress, account2MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { addrETH } from "../../../A2priv/A2priv";
import { junoNMtestnet } from "../../../A1priv/A1priv";


async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local pathfinder sepolia testnet node
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    // new Open Zeppelin account v0.8.1 :
    // deploy account
    const OZaccount0 = new Account(provider, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey);
    const OZ081ClassHash = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    const starkKeyPub = ec.starkCurve.getStarkKey(account1OZSepoliaPrivateKey);

    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, OZ081ClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);

    const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, addrETH, OZaccount0);
    const myCall = ethContract.populate("transfer",
        {
            recipient: OZcontractAddress,
            amount: cairo.uint256(5 * 10 ** 15),
        });
    const res = await OZaccount0.execute(myCall);
    await provider.waitForTransaction(res.transaction_hash);
    console.log("transferred 0.005 ETH");

    const OZaccount = new Account(provider, OZcontractAddress, account1OZSepoliaPrivateKey);
    const resDeployAccount = await OZaccount.deployAccount({
        classHash: OZ081ClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub
    });
    console.log("res =", resDeployAccount);
    await provider.waitForTransaction(resDeployAccount.transaction_hash);
    console.log("✅ New OpenZeppelin account created");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });