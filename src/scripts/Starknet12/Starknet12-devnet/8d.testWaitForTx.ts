// test in devnet-rs/rpc0.5.0 a contract that can be rejected.
// launch with npx ts-node src/scripts/cairo12/cairo12-devnet/8c.testTxResponse.ts
// Coded with Starknet.js v5.24.3

import { constants, Contract, Account, json, shortString, RpcProvider, TransactionFinalityStatus, TransactionExecutionStatus, SuccessfulTransactionReceiptResponse, ReceiptTx, RejectedTransactionReceiptResponse, RevertedTransactionReceiptResponse } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account2TestnetAddress, account2TestnetPrivateKey } from "../../../A1priv/A1priv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
// And launch first script 8.
//          👆👆👆

function wait(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

async function trackResponse(provider: RpcProvider, txH: string) {
    let end: number = 0;
    const start = new Date().getTime();
    console.log("txH =", txH);
    for (let i = 0; i < 20; i++) {
        let txR: any;
        try { txR = await provider.getTransactionReceipt(txH) }
        catch { txR = i.toString() + ": TxH not yet in memPool." };
        if (!!txR.execution_status) {
            if (!end) { end = new Date().getTime() }
            console.log("txR", i.toString() + ": execution =", txR.execution_status, ",", txR.finality_status);
        } else {
            console.log("txR", txR);
        }
        await wait(250);
    }
    const txR2 = await provider.waitForTransaction(txH);
    if (!end) { end = new Date().getTime() };
    // console.log("txR2 =", txR2);
    // const response=transactionResponse(txR2);
    //console.log("response =",response);
    console.log("Duration (s) =", (end - start) / 1000);
}

async function main() {

    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0.5" });

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    //const privateKey0 = account2TestnetPrivateKey;
    //const accountAddress0: string = account2TestnetAddress;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");


    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));

    //          👇👇👇 Put here the result of script 8
    const contractAddress = "0x69fe61bc198a70983c333e47f4ee225a195a8032dbad64a4d1e70e9a11a3423";
    //const contractAddress = "0x1073c451258ff87d4e280fb00bc556767cdd464d14823f84fcbb8ba44895a34"; 

    const myTestContract = new Contract(compiledSierra.abi, contractAddress, provider);
    myTestContract.connect(account0);
    console.log('✅ Test Contract connected =', myTestContract.address);

    // console.log(myTestContract.functions);
    const rpcV = await provider.getSpecVersion();
    console.log("rpc version =", rpcV);
    const count1 = await myTestContract.get_counter();
    console.log("counter =", count1);
    // use 100 to have a success.
    // use any other u8 to have a reverted tx.
    console.log("***invoke succeeded :");
    const { transaction_hash: txH1 } = await myTestContract.invoke("test_fail", [100], { maxFee: 1 * 10 ** 15 }); // maxFee is necessary 
    const receipt1 = (await provider.waitForTransaction(txH1,
        {
            successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2],
            errorStates: [TransactionExecutionStatus.REVERTED],
        },));
    // const re1:Receipt={}
    let result: string = "";
    let cont: SuccessfulTransactionReceiptResponse | undefined = undefined;
    receipt1.match({
        success: (txR: SuccessfulTransactionReceiptResponse) => {
            result = "Success";
            cont = txR
        },
        _: () => { result = "Failure" },
    });
    if (receipt1.isSuccess()) { cont = receipt1.value as SuccessfulTransactionReceiptResponse }
    // if ("type" in receipt1){console.log("type =",receipt1.type)};
    console.log("receipt1 =", receipt1, result, cont);
    console.log("result =", result, cont);

    const txR = receipt1;
    console.log(txR.statusReceipt, txR.value);
    console.log(txR.isSuccess(), txR.isRejected(), txR.isReverted(), txR.isError());
    txR.match({
        success: () => { console.log('Success') },
        _: () => { console.log('Unsuccess') },
    });

    txR.match({
        success: (txR: SuccessfulTransactionReceiptResponse) => { console.log("Success =", txR) },
        rejected: (txR: RejectedTransactionReceiptResponse) => { console.log("Rejected =", txR) },
        reverted: (txR: RevertedTransactionReceiptResponse) => { console.log("Reverted =", txR) },
        error: (err: Error) => { console.log("An error occured =", err) },
    });

    process.exit(1);
    // console.log("***invoke reverted standard (shall stop):");
    const { transaction_hash: txH2 } = await myTestContract.invoke("test_fail", [10], { maxFee: 1 * 10 ** 15 }); // maxFee is necessary 
    // const receipt2 = await provider.waitForTransaction(txH2);
    // console.log("receipt2 =", receipt2);

    // console.log("***invoke reverted (with error option REVERTED shall stop):");
    // const receipt3 = await provider.waitForTransaction(txH2,
    //     {
    //         successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2],
    //         errorStates: [TransactionExecutionStatus.REVERTED],
    //     },);
    // console.log("receipt3 =", receipt3);

    console.log("***invoke reverted (with error option REJECTED shall not stop):");
    const receipt4 = await provider.waitForTransaction(txH2,
        {
            successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2],
            errorStates: [TransactionExecutionStatus.REJECTED],
        },);
    console.log("receipt4 =", receipt4);

    console.log("***invoke reverted (with error option [] shall stop):");
    const receipt5 = await provider.waitForTransaction(txH2,
        {
            successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2],
            errorStates: [],
        },);
    console.log("receipt5 =", receipt5);


    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });