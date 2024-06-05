// create a new abstracted account in devnet
// and test of events
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/9.Cairo0event.ts
// Coded with Starknet.js v6.9.0, Starknet-devnet-rs v0.0.5

import { Account, ec, json, hash, CallData, RpcProvider, Contract, type SuccessfulTransactionReceiptResponse, events } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { resetDevnetNow } from "../../utils/resetDevnetFunc";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");
    await resetDevnetNow();

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // my customized Cairo 0 account, with administrators :

    // Generate public and private key pair.
    const AAprivateKey = process.env.AA_NEW_ACCOUNT_PRIVKEY ?? "";
    // or for random private key :
    //const privateKey=stark.randomAddress() ;
    console.log('privateKey=', AAprivateKey);
    const AAstarkKeyPub = ec.starkCurve.getStarkKey(AAprivateKey);
    console.log('publicKey=', AAstarkKeyPub);
    //declare my wallet contract
    const compiledAAaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo060/myAccountAbstraction-old.json").toString("ascii")
    );
    const myAbiEvents= events.getAbiEvents(compiledAAaccount.abi);
                console.log("AbiEvents=",myAbiEvents);
    //    const AAaccountClashHass = "0x1d926edb81b7ef0efcb67dd4558a6dffc2bf31a8bc9c3fe7832a5ec3d1b70da";
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ contract: compiledAAaccount });
    console.log('Customized account class hash =', decCH);
    await provider.waitForTransaction(declTH);

    // Calculate future address of the account
    const AAaccountConstructorCallData = CallData.compile({ super_admin_address: account0.address, publicKey: AAstarkKeyPub });
    const AAcontractAddress = hash.calculateContractAddressFromHash(AAstarkKeyPub, decCH, AAaccountConstructorCallData, 0);
    console.log('Precalculated account address=', AAcontractAddress);
    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": AAcontractAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);
    // deploy account
    const AAaccount = new Account(provider, AAcontractAddress, AAprivateKey);
    const { transaction_hash, contract_address } = await AAaccount.deployAccount({ classHash: decCH, constructorCalldata: AAaccountConstructorCallData, addressSalt: AAstarkKeyPub }, { maxFee: 9000000000000000 });
    console.log('✅ New customized account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);
    const myAAContract = new Contract(compiledAAaccount.abi, AAcontractAddress, account0);
    const resp0 = await myAAContract.invoke("add_admin", [0x1234]);
    const txR0 = await provider.waitForTransaction(resp0.transaction_hash);
    txR0.match(
        {
            success: (txR: SuccessfulTransactionReceiptResponse) => {
                console.log("raw event=", txR.events);
                const parsedEvents = myAAContract.parseEvents(txR0);
                console.log(parsedEvents);
            },
            _: () => {
                console.log('Unsuccess');
            },
        }
    );
    console.log("✅ Test completed.");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

