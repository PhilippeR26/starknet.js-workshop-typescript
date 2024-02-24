// create a new OZ ETHEREUM account in devnet-rs
// launch with npx ts-node src/scripts/15.createNewETHaccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants, Contract } from "starknet";
import { secp256k1 } from '@noble/curves/secp256k1';

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "./utils/constants";
import { formatBalance } from "./utils/formatBalance";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // ******** Devnet-rs
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    //const privateKeyETH = eth.ethRandomPrivateKey();
    const privateKeyETH = encode.sanitizeHex(num.toHex("0x45397ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"));
    console.log('New account :\neth privateKey=', privateKeyETH);
    const ethSigner = new EthSigner(privateKeyETH);
    const pubKeyETH = encode.addHexPrefix(encode.removeHexPrefix(await ethSigner.getPubKey()).padStart(128, "0"));
    console.log("eth pub key =", pubKeyETH);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -64))));
    const salt = pubKeyETHx.low;
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log("salt    =", num.toHex(salt));

    //declare ETH account contract
    const compiledETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.sierra.json").toString("ascii")
    );
    const casmETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledETHaccount, casm: casmETHaccount });
    console.log('ETH account class hash =', decClassHash);
    if (declTH) { await provider.waitForTransaction(declTH) } else[console.log("Already declared.")];
    console.log("✅ Declare of class made.");

    // Calculate future address of the account
    const accountETHconstructorCalldata = CallData.compile([cairo.tuple(pubKeyETHx, pubKeyETHy)]);
    const contractETHaddress = hash.calculateContractAddressFromHash(salt, decClassHash, accountETHconstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractETHaddress);

    // ******** Devnet- fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": contractETHaddress,
        "amount": 10_000_000_000_000_000_000,
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    const { data: answer2 } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": contractETHaddress,
        "amount": 10_000_000_000_000_000_000,
        "unit": "FRI",
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer2); // 10 STRK

    // deploy account
    const ETHaccount = new Account(provider, contractETHaddress, ethSigner, undefined, constants.TRANSACTION_VERSION.V2);
    const feeEstimation = await ETHaccount.estimateAccountDeployFee({ classHash: decClassHash, addressSalt: salt, constructorCalldata: accountETHconstructorCalldata });
    console.log("Fee estim =", feeEstimation);

    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCalldata,
        addressSalt: salt
    }, {
        maxFee: feeEstimation.suggestedMaxFee
    }
    );
    console.log("Real txH =", transaction_hash);
    const txR = await provider.waitForTransaction(transaction_hash);
    console.log({ txR });
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);

    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
    const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, account0);
    const balETH = await ethContract.call("balanceOf", [ETHaccount.address]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [ETHaccount.address]) as bigint;
    console.log("ETH account has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("ETH account has a balance of :", formatBalance(balSTRK, 18), "STRK");

    console.log('✅ Test performed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
