// create a new OZ account in devnet
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v6.9.0, Starknet-devnet-rs v0.1.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, stark } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin account v0.14.0 (Cairo 1) :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);
    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.sierra.json").toString("ascii")
    );
    const casmOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZAccount, casm: casmOZAccount });
    console.log('OpenZeppelin account class hash =', decClassHash);
    if (declTH) { await provider.waitForTransaction(declTH); }

    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, decClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": OZcontractAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy account
    const OZaccount = new Account(provider, OZcontractAddress, privateKey);
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub,
        contractAddress: OZcontractAddress
    });
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });