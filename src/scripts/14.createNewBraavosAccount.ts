// Deploy a new Braavos wallet (Cairo1, contract v1.0.0).
// launch with : npx src/scripts/14.createNewBraavosAccount.ts
// Coded with Starknet.js v6.1.4, Starknet-devnet-rs v0.3.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, Contract, type BigNumberish, RPC, constants, num } from "starknet";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "./braavos/3b.deployBraavos1";
import { account3BraavosTestnetPrivateKey } from "../A1priv/A1priv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // declare
    const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.sierra.json").toString("ascii"));
    const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountBraavosBaseSierra);
    console.log("Braavos account declare in progress...");
    const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
    const contractBraavosClassHash = respDecl.class_hash;
    if (respDecl.transaction_hash) { await provider.waitForTransaction(respDecl.transaction_hash) };
    console.log("Braavos base contract class hash :", respDecl.class_hash);
    const accountBraavosSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.sierra.json").toString("ascii"));
    const accountBraavosCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.casm.json").toString("ascii"));
    const respDecl2 = await account0.declareIfNot({ contract: accountBraavosSierra, casm: accountBraavosCasm });
    const contractBraavosClassHash2 = respDecl2.class_hash;
    console.log("Braavos contract class hash :", respDecl2.class_hash);
    if (respDecl2.transaction_hash) { await provider.waitForTransaction(respDecl2.transaction_hash) };

    // Calculate future address of the Braavos account
    const privateKeyBraavosBase = stark.randomAddress();
    console.log('Braavos account Private Key =', privateKeyBraavosBase);
    const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
    console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);


    const calldataBraavos = new CallData(accountBraavosBaseSierra.abi);
    type StarkPubKey = { pub_key: BigNumberish };
    const myPubKey: StarkPubKey = { pub_key: starkKeyPubBraavosBase };
    const constructorBraavosCallData = calldataBraavos.compile("constructor", {
        stark_pub_key: myPubKey,
    });
    const accountBraavosAddress = hash.calculateContractAddressFromHash(starkKeyPubBraavosBase, contractBraavosClassHash, constructorBraavosCallData, 0);
    console.log('Precalculated account address=', accountBraavosAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": accountBraavosAddress,
        "amount": 10_000_000_000_000_000_000
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    const { data: answer2 } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": accountBraavosAddress,
        "amount": 10_000_000_000_000_000_000,
        "unit": "FRI"
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer2); // 10 ETH

    // deploy Braavos account
    const myMaxFee = 2 * 10 ** 15; // defined manually as estimateFee fails.

    // estimateFee do not work. If you have the solution, I am interested...
    // const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavosBase, provider,{skipValidate:true});
    // console.log("calculated fee =", estimatedFee);

    const respDeploy = deployBraavosAccount(privateKeyBraavosBase, provider, myMaxFee);
    const txR = await provider.waitForTransaction((await respDeploy).transaction_hash);
    console.log("Transaction receipt =", txR);
    console.log("Account created.\nFinal address =", accountBraavosAddress);

    console.log('✅ Braavos wallet deployed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });