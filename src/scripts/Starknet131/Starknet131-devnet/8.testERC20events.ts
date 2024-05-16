// recover the ERC transfers.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/8.testERC20events.ts
// Coded with Starknet.js v6.8.0 + starknet devnet-rs 0.0.5

import { Contract, Account, json, shortString, RpcProvider, CallData, Call, Calldata, type SuccessfulTransactionReceiptResponse, uint256 } from "starknet";
import fs from "fs";
import axios from "axios";

type EVENT = {
    from_address: string;
} & EVENT_CONTENT;

type EVENT_CONTENT = {
    keys: string[];
    data: string[];
};
type Transfer = {
    token: string,
    from: string,
    to: string,
    amount: bigint,
}

function extractTransfers(events: EVENT[]): Transfer[] {
    const transfer = "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9";
    const transfers: Transfer[] = events.reduce((acc: Transfer[], myEvent: EVENT) => {
        if (myEvent.keys[0] === transfer) {
            return [...acc, {
                token: myEvent.from_address,
                from: myEvent.keys[1],
                to: myEvent.keys[2],
                amount: uint256.uint256ToBN({ low: myEvent.data[1], high: myEvent.data[0] })
            } as Transfer]
        } else {
            return acc
        }
    }, [] as Transfer[]);
    return transfers;
}

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

    const erc20mintableSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
    const erc20mintableCasm = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.casm.json").toString("ascii"));
    const DECIMALS = 2;

    // define the constructor :
    const erc20CallData: CallData = new CallData(erc20mintableSierra.abi);
    const ERC20ConstructorCallData: Calldata = erc20CallData.compile("constructor", {
        name: "niceToken",
        symbol: "NIT",
        decimals: DECIMALS,
        initial_supply: 10000, // 100 tokens with 2 decimals
        owner: account0.address
    });

    const deployERC20Response = await account0.declareAndDeploy({
        contract: erc20mintableSierra,
        casm: erc20mintableCasm,
        constructorCalldata: ERC20ConstructorCallData
    });
    console.log("ERC20 declared hash: ", deployERC20Response.declare.class_hash);
    console.log("ERC20 deployed at address: ", deployERC20Response.deploy.contract_address);

    // Get the erc20 contract address
    const erc20Address = deployERC20Response.deploy.contract_address;
    // Create a new erc20 contract object
    const erc20 = new Contract(erc20mintableSierra.abi, erc20Address, provider);
    erc20.connect(account0);
    console.log("ERC20 deployed.");

    const transferCallData1: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 10
    });
    const transferCallData2: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 20
    });
    console.log("Transfer...");
    const { transaction_hash: transferTxHash } = await account0.execute([transferCallData1, transferCallData2]);
    const txReceipt = await provider.waitForTransaction(transferTxHash);
    txReceipt.match({
        _: () => {
            console.log('Unsuccess tx!');
        },
        success: (receipt: SuccessfulTransactionReceiptResponse) => {
            const transfers: Transfer[] = extractTransfers(receipt.events);
            console.log("ERC transfers :\n", transfers);
        },
    });


    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
