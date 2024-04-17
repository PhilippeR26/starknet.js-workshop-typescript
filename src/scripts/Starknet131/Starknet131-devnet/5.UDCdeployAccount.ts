// deploy in testnet a contracgt.
// launch with npx ts-node src/scripts/Starknet12/Starknet-testnet/2a.deployTestERC721.ts
// Coded with Starknet.js v6.6.6 + starknet devnet-rs 0.0.3

import { constants, Provider, Contract, Account, json, shortString, RpcProvider, hash, CallData, Call, stark, InvokeFunctionResponse, Calldata, ec, type InvokeTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, parseUDCEvent, type CompiledSierra } from "starknet";
import fs from "fs";
import axios from "axios";
import { ethAddress } from "../../utils/constants";


async function main() {
    // initialize Provider
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" }); // testnet
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
    //const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    // //devnet-rs
    const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";

    // initialize existing Argent X testnet  account
    // const accountAddress0 = account5TestnetAddress
    // const privateKey0 = account5TestnetPrivateKey;

    // // initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS =', account0.address);
    console.log('existing account connected.\n');

    // openzeppelin account
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey =', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey =', starkKeyPub);
    const contractClassHash = "0x61dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    const compiledContract = await provider.getClassByHash(contractClassHash);
    const myCallData = new CallData(compiledContract.abi);
    const constructor: Calldata = myCallData.compile(
        "constructor",
        {
            public_key: starkKeyPub,
        });
    const salt = stark.randomAddress();
    const addressDepl = hash.calculateContractAddressFromHash(ec.starkCurve.pedersen(account0.address, salt), contractClassHash, constructor, constants.UDC.ADDRESS);
    console.log("address=", addressDepl);
    const myCall: Call = {

        contractAddress: constants.UDC.ADDRESS,
        entrypoint: constants.UDC.ENTRYPOINT,
        calldata: CallData.compile({
            classHash: contractClassHash,
            salt: salt,
            unique: "1",
            calldata: constructor,
        }),
    };
    console.log("constructor =", constructor);
    console.log("Deploy of account in progress...");
    // *** with account.deployContract()
    // const { transaction_hash: txHDepl, address } = await account0.deployContract({ classHash: contractClassHash, constructorCalldata: constructor });
    // console.log("Address =", address);
    // *** with account.execute()
    const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]); // you can add other txs here

    console.log("TxH =", txHDepl);
    const txR = await provider.waitForTransaction(txHDepl);
    let accountAddr: string = "";
    txR.match({
        success: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log('Success =', txR, "\n", txR.events);
            const resDeploy = parseUDCEvent(txR as InvokeTransactionReceiptResponse);
            console.log(resDeploy);
            accountAddr = resDeploy.address;
            console.log("Account address =", (resDeploy.address));
        },
        _: () => {
            console.log('Unsuccess');
            process.exit(5);
        },
    });
    console.log("✅ Account deployed.");

    // test of transfer
    const myAccount = new Account(provider, accountAddr, privateKey);
    const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/erc20OZ070decimals.sierra.json").toString("ascii")) as CompiledSierra;
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": accountAddr,
        "amount": 10_000_000_000_000_000_000,
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    const ethContract = new Contract(erc20Sierra.abi, ethAddress, myAccount);
    const res0 = await ethContract.transfer(account0.address, 200);
    const txR0 = await provider.waitForTransaction(res0.transaction_hash);
    console.log(txR0)

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
