// test l1<->l2 messaging in local devnets.
// Launch with npx ts-node src/scripts/l1l2messaging/1.l1l2devnet.ts
// Coded with Starknet.js v6.10.0 & starknet-devnet.js v0.0.2

import { Account, RpcProvider, Contract, shortString, constants, json, type CompiledSierra, type CompiledSierraCasm, selector } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import * as ethers from "ethers";

import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../A1priv/A1priv";
import fs from "fs";
import { ethAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import LogC from "../utils/logColors";
import * as dotenv from "dotenv";
dotenv.config();

// *******************************
// To run this script, you need to run 2 devnets :
// 1. One devnet for l2 (Starknet) : use starknet-devnet-rs from
//    https://github.com/0xSpaceShard/starknet-devnet-rs
//    use v0.1.1 at least.
//    run with `cargo run --release -- --seed 0  --state-archive-capacity full --lite-mode`
// 2. One devnet for l1 (Ethereum) : use anvil.
//    Install with `cargo install --git https://github.com/foundry-rs/foundry anvil --locked --force
//    Launch with `anvil`
//    If forked, use `anvil --fork-url https://eth-sepolia.g.alchemy.com/v2/xxx`

async function main() {
    // Connect l2 devnet Starknet-devnet-rs
    const l2DevnetProviderSNJS = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit(5);
    }
    await l2DevnetProvider.restart();
    console.log("chain Id =", shortString.decodeShortString(await l2DevnetProviderSNJS.getChainId()), ", rpc", await l2DevnetProviderSNJS.getSpecVersion());
    console.log("l2 provider connected.");

    // Connect l1 devnet Anvil
    const L1_URL = "http://127.0.0.1:8545";
    const l1Provider = new ethers.JsonRpcProvider(L1_URL);
    console.log("l1 provider connected.");

    // Initialize existing pre-deployed l2 devnet-rs account 
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const l2Account = new Account(l2DevnetProviderSNJS, accountAddress0, privateKey0);
    console.log("l2 account connected.");

    // Initialize pre-deployed l1 account
    const l1Signers = await l1Provider.listAccounts();
    const l1Signer = l1Signers[0];
    console.log("l1 account connected.\n");

    // deploy contract in l2 (source in ./contracts/*)
    const l2Sierra = (json.parse(fs.readFileSync("./src/scripts/l1l2messaging/contracts/l1l2.sierra.json").toString("ascii"))) as CompiledSierra;
    const l2Casm = (json.parse(fs.readFileSync("./src/scripts/l1l2messaging/contracts/l1l2.casm.json").toString("ascii"))) as CompiledSierraCasm;
    const l2Resp = await l2Account.declareAndDeploy(({ contract: l2Sierra, casm: l2Casm }));
    const l2Contract = new Contract(l2Sierra.abi, l2Resp.deploy.contract_address, l2Account);
    console.log("l2 example contract deployed at :", l2Contract.address);

    // deploy 2 contracts in l1 (sources in ./contracts/*)
    const mockStarknetMessagingArtifact = json.parse(fs.readFileSync("./src/scripts/l1l2messaging/contracts/MockStarknetMessaging.sol.json").toString("ascii"));
    const mockStarknetMessagingFactory = new ethers.ContractFactory(
        mockStarknetMessagingArtifact.abi,
        mockStarknetMessagingArtifact.bytecode,
        l1Signer,
    );
    const messageCancellationDelay = 5 * 60; // ctor arg: seconds
    const mockStarknetMessaging = (await mockStarknetMessagingFactory.deploy(
        messageCancellationDelay,
    )) as ethers.Contract;
    await mockStarknetMessaging.waitForDeployment();
    const l1MessagingAddress = await mockStarknetMessaging.getAddress();
    await l2DevnetProvider.postman.loadL1MessagingContract(L1_URL, l1MessagingAddress);
    console.log("l1 messaging contract deployed at :", l1MessagingAddress);

    const l1ExampleArtifact = json.parse(fs.readFileSync("./src/scripts/l1l2messaging/contracts/L1L2Example.sol.json").toString("ascii"));
    const l1ExampleFactory = new ethers.ContractFactory(
        l1ExampleArtifact.abi,
        l1ExampleArtifact.bytecode,
        l1Signer,
    );
    const l1Example = (await l1ExampleFactory.deploy(
        l1MessagingAddress,
    )) as ethers.Contract;
    await l1Example.waitForDeployment();
    const l1ExampleAddress = await l1Example.getAddress();
    console.log("l1 example contract deployed at :", l1ExampleAddress, "\n");

    // **********************************************
    // Send all pending messages : Withdraw L2 --> L1
    const user = 1n;
    const InitialBalance = 100n;
    const withdrawAmount = 10n;
     console.log(LogC.fg.blue+LogC.underscore+"Send all messages of withdrawal : L2 -> L1 :"+LogC.reset);
    await l2DevnetProviderSNJS.waitForTransaction((await l2Contract.increase_balance(user, InitialBalance)).transaction_hash);
    console.log("l2 user has", InitialBalance, "tokens.");
    const myCall1 = l2Contract.populate("withdraw", [user, withdrawAmount, l1ExampleAddress]); // generates message 1
    const myCall2 = l2Contract.populate("withdraw", [user, withdrawAmount * 2n, l1ExampleAddress]); // generates message 2
    await l2DevnetProviderSNJS.waitForTransaction(
        (await l2Account.execute([myCall1, myCall2])).transaction_hash,
    );
    console.log("2 requests to withdraw a total of", withdrawAmount * 3n, "tokens.")
    const bal0 = await l2Contract.get_balance(user);
    console.log("After withdraw request in l2, l2 user has", bal0, "tokens.");
    const pendingMessages = await l2DevnetProvider.postman.flush({dryRun: true}); // `true` to just read the pending messages, without proceeding.
    console.log("Pending messages :", pendingMessages.messages_to_l1);
    const t0 = Date.now();
    await l2DevnetProvider.postman.flush(); // transfer all pending messages 
    console.log("Flush duration =", (Date.now() - t0) / 1000 + "s.");
    console.log("2 messages transferred to l1.");
    const initL1Balance = await l1Example.userBalances(user);
    console.log("l1 user has", initL1Balance, "tokens.");
    await l1Example.withdraw(l2Contract.address, user, withdrawAmount); // consume message 1
    await l1Example.withdraw(l2Contract.address, user, withdrawAmount * 2n); // consume message 2
    const finalL1Balance = await l1Example.userBalances(user);
    console.log("After l1 withdrawal, l1 user has", finalL1Balance, "tokens.✅\n");

    // **********************************************
    // Send all pending messages : deposit L1 --> L2
    console.log(LogC.fg.blue+LogC.underscore+ "Send all messages of deposit : L1 -> L2 :"+LogC.reset);
    const depositAmount = 4n;
    const l1Fee = 1n;
    await l1Example.deposit(l2Contract.address, user, depositAmount, { value: l1Fee }); // deposit 1
    console.log("Request to deposit", depositAmount, "tokens.");
    await l1Example.deposit(l2Contract.address, user, depositAmount*2n, { value: l1Fee*2n }); // deposit 2
    console.log("Request to deposit", depositAmount * 2n, "tokens.");
    const balAfterDeposit = await l1Example.userBalances(user);
    console.log("After l1 deposit, l1 user has now", balAfterDeposit, "tokens.");
    const bal3 = await l2Contract.get_balance(user);
    console.log("l2 user has", bal3, "tokens.");
    const flushL1Response = await l2DevnetProvider.postman.flush();
    console.log("Pending messages :", flushL1Response.messages_to_l2);
    console.log("message transferred to l2.");
    const l2newBal = await l2Contract.get_balance(user);
    console.log("l2 user has now", l2newBal, "tokens.✅\n");

    // *******************************************
    // Build and send a message L2 --> L1
    console.log(LogC.fg.blue + LogC.underscore + "Build & send one withdrawal message : L2 -> L1 :" + LogC.reset);
    const bal4 = await l2Contract.get_balance(user);
    console.log("l2 user has", bal4, "tokens.");
    await l2DevnetProviderSNJS.waitForTransaction(
        (await l2Contract.withdraw(user, withdrawAmount, l1MessagingAddress,
        )).transaction_hash,
    ); // generate message
    const pendingMessages2 = await l2DevnetProvider.postman.flush({ dryRun: true });
    console.log("pending messages :", pendingMessages2);
    const { message_hash: MessageH } = await l2DevnetProvider.postman.consumeMessageFromL2(
        l2Contract.address,
        l1MessagingAddress,
        [0, user, withdrawAmount],
    ); // send message 
    const pendingMessages3 = await l2DevnetProvider.postman.flush({ dryRun: true });
    console.log("After `consumeMessageFromL2` pending messages :", pendingMessages3);
    console.log("Message has been sent to L1, but without flushing the pending txs.");
    const bal2 = await l2Contract.get_balance(user);
    console.log("l2 user has now", bal2, "tokens.");
    console.log("message to L1 : message Hash =", MessageH, "✅\n");

    // *******************************************
    // Build and send a message to L2 without using L1 
    console.log(LogC.fg.blue+LogC.underscore+ "Send a message to L2 without using L1 :"+LogC.reset);
    const bal5 = await l2Contract.get_balance(user);
    console.log("l2 user has", bal5, "tokens.");
    const bal1BeforeDeposit = await l1Example.userBalances(user);
    console.log("l1 user has ", bal1BeforeDeposit, "tokens.");
    console.log("Create direct message to deposit", depositAmount, "tokens");
    const { transaction_hash: transaction_hash0 } = await l2DevnetProvider.postman.sendMessageToL2(
        l2Contract.address,
        selector.getSelector("deposit"),
        l1ExampleAddress,
        [user, depositAmount],
        0, // nonce
        1, // paid fee on l1
    );
    await l2DevnetProviderSNJS.waitForTransaction(transaction_hash0);
    const bal1 = await l2Contract.get_balance(user);
    const bal1AfterDeposit = await l1Example.userBalances(user);
    console.log("l2 user has now", bal1, "tokens.");
    console.log("l1 user has still", bal1AfterDeposit, "tokens (direct messaging has been processed without using l1 contract)✅\n");

    console.log("✅ Test completed");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
