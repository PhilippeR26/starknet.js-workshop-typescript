// create a new OZ account in devnet
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode } from "starknet";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../A1priv/A1priv";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { cairo } from "starknet";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_6" }); 

    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // const accountAddress0=account1BraavosSepoliaAddress;
    // const privateKey0 = account1BraavosSepoliaPrivateKey;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    // Generate public and private key pair.
// eth pub = 0x020125f902671a2f0d5d5cf8308e02e895deac5ee9a6dbe1f472676f09fb1ddef4
// pubX    = 0x00000000000000000000000000000000deac5ee9a6dbe1f472676f09fb1ddef4
// pubY    = 0x0000000000000000000000000000000020125f902671a2f0d5d5cf8308e02e89
    const realPrivKey = "0xea9ab79f16178372c78b8fcd8c6507a8a131ba947b5b6562c5084d70dc48f247";
    const privateKeyETH = eth.ethRandomPrivateKey();
    const strkPriv = stark.randomAddress();
    //const privateKeyETH = strkPriv;
    console.log('New account :\nprivateKey=', privateKeyETH);
    console.log("strk priv =", strkPriv);
    console.log("strk pub  =", ec.starkCurve.getStarkKey(strkPriv));
    const ethSigner = new EthSigner(privateKeyETH);
    const pubKeyETH = await ethSigner.getPubKey();
    console.log("eth pub =", pubKeyETH);
    const pubKeyETHy = addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-32)));
    const pubKeyETHx = addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -32)));
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log('publicKey =', pubKeyETH, "\n          =", BigInt(pubKeyETH));
    console.log("max       =", num.toHex(ec.starkCurve.CURVE.Fp.ORDER), "\n");

    //declare ETH account contract
    const compiledETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.sierra.json").toString("ascii")
    );
    const casmETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledETHaccount, casm: casmETHaccount });
    console.log('ETH account class hash =', decClassHash);
    if (!decClassHash) { await provider.waitForTransaction(declTH) };

    //process.exit(5);
    // Calculate future address of the account
    const accountETHconstructorCallData = CallData.compile([cairo.tuple( cairo.uint256( pubKeyETHx),cairo.uint256(pubKeyETHy))]);
    const contractETHaddress = hash.calculateContractAddressFromHash( pubKeyETHx, decClassHash, accountETHconstructorCallData, 0);
    console.log('Pre-calculated account address=', contractETHaddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": contractETHaddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy account
    const ETHaccount = new Account(provider, contractETHaddress, ethSigner);
    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCallData,
        addressSalt: pubKeyETHx
    });
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });