// Deploy a new Braavos wallet (Cairo1, contract v1.0.0).
// launch with : npx src/scripts/Starknet13/Starknet13-sepolia/6.deployBraavosAccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0

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

    // new Braavos account v1.0.0 :
    // deploy account
    const braavosAccount0 = new Account(provider, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey);
    const braavos100ClassHash = "0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253";
    const privKey = stark.randomAddress();
    const starkKeyPub = ec.starkCurve.getStarkKey(privKey);
    console.log("Private key =", privKey);
    console.log("Public key =", starkKeyPub);

    const braavosAccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const braavosContractAddress = hash.calculateContractAddressFromHash(starkKeyPub, braavos100ClassHash, braavosAccountConstructorCallData, 0);
    console.log('Precalculated account address=', braavosContractAddress);

    const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, addrETH, braavosAccount0);
    const myCall = ethContract.populate("transfer",
        {
            recipient: braavosContractAddress,
            amount: cairo.uint256(5 * 10 ** 15),
        });
    const res = await braavosAccount0.execute(myCall);
    await provider.waitForTransaction(res.transaction_hash);
    console.log("transferred 0.005 ETH");

    const OZaccount = new Account(provider, braavosContractAddress, account1OZSepoliaPrivateKey);
    const resDeployAccount = await OZaccount.deployAccount({
        classHash: braavos100ClassHash,
        constructorCalldata: braavosAccountConstructorCallData,
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