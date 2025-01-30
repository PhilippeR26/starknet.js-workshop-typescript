// Deploy and use an ERC20, monetized by an existing account
// Launch with : npx ts-node src/starknet_jsExistingAccount.ts
// Coded with Starknet.js v6.23.0

import fs from "fs";
import { Account, Contract, json, CallData, Calldata, Call, RpcProvider, shortString, units } from "starknet";
import { Devnet } from "starknet-devnet";
import * as dotenv from "dotenv";
import { formatBalance } from "./scripts/utils/formatBalance";
import { DEVNET_PORT, DEVNET_VERSION } from "./constants";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";
dotenv.config();


async function main() {
    // launch devnet-rs with a new console window
    const outputStream = fs.createWriteStream("./src/scripts/devnet-out.txt");
    await events.once(outputStream, "open");
    // the following line is working in Linux. To adapt or remove for other OS
    cp.spawn("gnome-terminal", ["--", "bash", "-c", "pwd; tail -f ./src/scripts/devnet-out.txt; read"]);
    const devnet = await Devnet.spawnVersion(DEVNET_VERSION, {
        stdout: outputStream,
        stderr: outputStream,
        keepAlive: false,
        args: ["--seed", "0", "--port", DEVNET_PORT]
    });
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url });
    console.log("devnet-rs : url =", devnet.provider.url);
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\n");

    // Deploy an ERC20 contract 
    console.log("Deployment Tx - ERC20 Contract to Starknet...");

    // Constructor of the ERC20 contract :
    // fn constructor(
    //     ref self: ContractState,
    //     name: felt252,
    //     symbol: felt252,
    //     decimals: u8,
    //     initial_supply: u256,
    //     owner: ContractAddress
    // )

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

    console.log("constructor=", ERC20ConstructorCallData);
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
    const erc20 = new Contract(erc20mintableSierra.abi, erc20Address, myProvider);
    erc20.connect(account0);

    // Check balance - should be 100
    console.log(`Calling StarkNet for account balance...`);
    const balanceInitial = await erc20.balanceOf(account0.address) as bigint;
    console.log("account0 has a balance of :", formatBalance(balanceInitial, DECIMALS));

    // Mint 5 tokens to account address
    console.log("Invoke Tx - Minting 5 tokens to account0...");
    const { transaction_hash: mintTxHash } = await erc20.mint(account0.address, 500n, { maxFee: 900_000_000_000_000 }); // maxFee optional
    // Wait for the invoke transaction to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Minting...`);
    await myProvider.waitForTransaction(mintTxHash);
    // Check balance - should be 105
    console.log(`Calling StarkNet for account balance...`);
    const balanceBeforeTransfer = await erc20.balanceOf(account0.address) as bigint;
    console.log("account0 has a balance of :", formatBalance(balanceBeforeTransfer, DECIMALS));

    // Execute tx transfer of 2x10 tokens, showing 3 ways to write data in Starknet
    console.log(`Invoke Tx - Transfer 3x10 tokens back to erc20 contract...`);
    const transferCall: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 1000
    });
    console.log("Transfer 1...");
    const { transaction_hash: transferTxHash } = await account0.execute(transferCall, { maxFee: 900_000_000_000_000 });  // maxFee optional
    await myProvider.waitForTransaction(transferTxHash);

    console.log("Transfer 2...");
    const { transaction_hash: transferTxHash2 } = await erc20.transfer(erc20Address, 1000n);
    await myProvider.waitForTransaction(transferTxHash2);

    console.log("Transfer 3...");
    const { transaction_hash: transferTxHash3 } = await erc20.transfer(...transferCall.calldata as string[], { parseRequest: false });
    // Warning message is normal with the ParseRequest option de-activated
    await myProvider.waitForTransaction(transferTxHash3);

    console.log("Transfer 4...");
    const transferCall1: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 200
    });
    const transferCall2: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 300
    });
    const { transaction_hash: transferTxHash4 } = await account0.execute([transferCall1, transferCall2]);  // execute several operations in the same transaction (Only Starknet makes it possible)
    await myProvider.waitForTransaction(transferTxHash4);

    // Check balance after transfer - should be 70
    console.log(`Calling Starknet for account balance...`);
    const balanceAfterTransfer = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", formatBalance(balanceAfterTransfer, DECIMALS));

    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet-rs stopped. Pid :", pid, "\nYou can close the log window.");
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });