// Deploy a new Braavos wallet (Cairo1, contract v1.0.0).
// launch with : npx src/scripts/14.createNewBraavosAccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, Contract, type BigNumberish } from "starknet";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { deployBraavosAccount, estimateBraavosAccountDeployFee } from "./braavos/3b.deployBraavosRpc060";
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

    const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.sierra.json").toString("ascii"));
    const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountBraavosBaseSierra);
    console.log("Class Hash of Braavos base contract =", ch);

    // Calculate future address of the Braavos account
    const privateKeyBraavosBase = stark.randomAddress();
    console.log('Braavos account Private Key =', privateKeyBraavosBase);
    const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
    console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);

    // declare
    const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
    //const contractAXclassHash = "0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b";
    const contractBraavosClassHash=respDecl.class_hash;
   if (respDecl.transaction_hash) {await provider.waitForTransaction(respDecl.transaction_hash)};
    console.log("Braavos base contract declared. Ch=",respDecl.class_hash)

    const calldataBraavos = new CallData(accountBraavosBaseSierra.abi);
    type StarkPubKey={pub_key:BigNumberish};
    const myPubKey:StarkPubKey={pub_key:starkKeyPubBraavosBase};
    const ConstructorBraavosCallData = calldataBraavos.compile("constructor", {
        stark_pub_key: myPubKey,
    });
    const accountBraavosAddress = hash.calculateContractAddressFromHash(starkKeyPubBraavosBase, contractBraavosClassHash, ConstructorBraavosCallData, 0);
    console.log('Precalculated account address=', accountBraavosAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": accountBraavosAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy Braavos account
    const accountBraavosBase = new Account(provider, accountBraavosAddress, privateKeyBraavosBase);
    const deployAccountPayload = {
        classHash: contractBraavosClassHash,
        constructorCalldata: ConstructorBraavosCallData,
        contractAddress: accountBraavosAddress,
        addressSalt: starkKeyPubBraavosBase
    };
    const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavosBase, provider);
    console.log("calculated fee =", estimatedFee);
    const respDeploy = deployBraavosAccount(privateKeyBraavosBase, provider,estimatedFee);
    // console.log("Final address =", accountBraavosBaseFinalAddress);
    // await provider.waitForTransaction(BraavosBaseCH);

    console.log('✅ Braavos wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });