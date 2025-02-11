// Test estimate & simulate of outsideExecution (SNIP-9).
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-devnet/5.estimateOutsideExecution.ts
// Coded with Starknet.js v6.23.1 + custom

import { RpcProvider, Account, shortString, json, Contract, type InvokeFunctionResponse, TransactionFinalityStatus, Call, CairoCustomEnum, CallData, cairo, OutsideExecutionVersion, type OutsideExecutionOptions, outsideExecution, type OutsideTransaction, type EstimateFee, type Invocations, TransactionType } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import * as dotenv from "dotenv";
import fs from "fs";
import { deployAccountOpenzeppelin14 } from "../../Starknet131/Starknet131-devnet/14.deployOZ14";
import { deployAccountOpenzeppelin17 } from "../../Starknet131/Starknet131-devnet/14.deployOZ17";
import { ethAddress } from "../../utils/constants";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // **** local Sepolia Testnet node
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
    // ****  Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    //  **** Mainnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet");

    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;
    // **** Sepolia
    // const accountAddress0 = account1BraavosSepoliaAddress;
    // const privateKey0 = account1BraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    // deploy SNIP-9 account
    const accountExecutor = new Account(myProvider, accountAddress0, privateKey0, undefined, "0x3");
    const accountOZDefinition = await deployAccountOpenzeppelin17(myProvider, accountExecutor);
    const accountSigner = new Account(myProvider, accountOZDefinition.address.toString(), accountOZDefinition.privateK.toString(), undefined, "0x3");
    const account1 = new Account(myProvider, accData[1].address, accData[1].private_key, undefined, "0x3");
    console.log("Accounts connected.\n");
    // definition of calls
    const version = await accountSigner.getSnip9Version();
    if (version === OutsideExecutionVersion.UNSUPPORTED) {
        throw new Error('This account is not SNIP-9 compatible.');
    }
    const callOptions: OutsideExecutionOptions = {
        caller: accountExecutor.address,
        execute_after: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        execute_before: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };
    const call0 = {
        contractAddress: ethAddress,
        entrypoint: 'transfer',
        calldata: {
            recipient: account1.address,
            amount: cairo.uint256(1n * 10n ** 16n),
        },
    };
    const call1 = {
        contractAddress: ethAddress,
        entrypoint: 'transfer',
        calldata: {
            recipient: account1.address,
            amount: cairo.uint256(2n * 10n ** 17n),
        },
    };

    // *********** test estimate outsideExecution
    const outsideTransaction1: OutsideTransaction = await accountSigner.getOutsideTransaction(
        callOptions,
        [call0, call1]
    );
    const outsideExecutionCall: Call[] = outsideExecution.buildExecuteFromOutsideCall(outsideTransaction1);
    console.log(outsideExecutionCall);
    const estim: EstimateFee = await accountExecutor.estimateFee(outsideExecutionCall);
    console.log("estimate =\n", estim);

    // *********** test simulate outsideExecution
    const invocations: Invocations = [
        {
            type: TransactionType.INVOKE,
            payload: outsideExecutionCall
        },
    ];
    const responseSimulate = await accountExecutor.simulateTransaction(invocations);
    console.log("simulate =\n", responseSimulate);

    console.log("✅ Test performed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
