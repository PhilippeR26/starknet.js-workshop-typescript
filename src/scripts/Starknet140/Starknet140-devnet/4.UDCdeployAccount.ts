// deploy in testnet an account using UDC + transfer STRK in same tx.
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/4.UDCdeployAccount.ts
// Coded with Starknet.js v8.1.2 + starknet devnet-rs 0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, hash, CallData, Call, stark, InvokeFunctionResponse, Calldata, ec, type InvokeTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, events, type CompiledSierra, type CairoAssembly, defaultDeployer, config } from "starknet";
import fs from "fs";
import axios from "axios";
import { ethAddress, strkAddress } from "../../utils/constants";
import { DevnetProvider } from "starknet-devnet";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "../../utils/displayBalances";
import LogC from "../../utils/logColors";


async function main() {
    // initialize Provider
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_9" }); // local pathfinder testnet node
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9" });

    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    config.set("logLevel", "FATAL");

    // Starknet-devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // initialize existing Argent X testnet  account
    // const accountAddress0 = account5TestnetAddress
    // const privateKey0 = account5TestnetPrivateKey;

    // // initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account({
        provider: myProvider,
        address: accountAddress0,
        signer: privateKey0
    });
    console.log('existing_ACCOUNT_ADDRESS =', account0.address);
    console.log('existing account connected.\n');

    // openzeppelin account
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey =', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey =', starkKeyPub);
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2100/account_oz20_AccountStrkSnip9OZ20.contract_class.json").toString("ascii")) as CompiledSierra;
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2100/account_oz20_AccountStrkSnip9OZ20.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
    const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/erc20OZ070decimals.sierra.json").toString("ascii")) as CompiledSierra;

    const resDeclare = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm, });
    if (resDeclare.transaction_hash) {
        await myProvider.waitForTransaction(resDeclare.transaction_hash);
    }
    const contractClassHash = resDeclare.class_hash;
    const myCallData = new CallData(compiledSierra.abi);
    const constructor: Calldata = myCallData.compile(
        "constructor",
        {
            public_key: starkKeyPub,
        });
    const salt = stark.randomAddress();
    const addressDeploy = hash.calculateContractAddressFromHash( salt, contractClassHash, constructor, 0);
    console.log("Calculated address =", addressDeploy);
    const myCall: Call = {

        contractAddress: constants.UDC.ADDRESS,
        entrypoint: constants.UDC.ENTRYPOINT,
        calldata: CallData.compile({
            classHash: contractClassHash,
            salt: salt,
            unique: "0",
            calldata: constructor,
        }),
    };
    console.log("constructor =", constructor);
    const strkContract = new Contract({
        abi: erc20Sierra.abi,
        address: strkAddress,
        providerOrAccount: account0,
    });
    const transferCall = strkContract.populate("transfer", {
        recipient: addressDeploy,
        amount: 20n * 10n ** 18n,
    });
    console.log("Deploy of account in progress...");
    // *** with account.execute()
    const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall, transferCall]); // you can add other txs here
    console.log("TxH =", txHDepl);
    const txR = await myProvider.waitForTransaction(txHDepl);
    let accountAddr: string = "";
    txR.match({
        success: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log('Success =', txR, "\n", txR.events);
            const resDeploy = defaultDeployer.parseDeployerEvent(txR as InvokeTransactionReceiptResponse);
            console.log({ resDeploy });
            accountAddr = resDeploy.address;
            console.log("Account address =", (resDeploy.address));
        },
        _: () => {
            console.log('Unsuccess!');
            process.exit(5);
        },
    });
    console.log(LogC.fg.yellow + "Account deployed.", LogC.reset);

    // test of transfer
    const myAccount = new Account({
        provider: myProvider,
        address: accountAddr,
        signer: privateKey
    });
    await l2DevnetProvider.mint(accountAddr, 10n * 10n ** 18n, "WEI"); // 10 ETH
    // await l2DevnetProvider.mint(accountAddr, 100n * 10n ** 18n, "FRI"); // 100 STRK
    const ethContract = new Contract({
        abi: erc20Sierra.abi,
        address: ethAddress,
        providerOrAccount: myAccount
    });
    console.log("New account:");
    await displayBalances(accountAddr, myProvider);
    const res0 = await ethContract.transfer(account0.address, 200);
    const txR0 = await myProvider.waitForTransaction(res0.transaction_hash);
    console.log(txR0.isSuccess() ? "Transfer is a success." : "Transfer failed!!");

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
