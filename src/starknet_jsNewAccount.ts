// Deploy and use an ERC20, monetized by a new account
// Launch with : npx ts-node src/starknet_jsNewAccount.ts
// Coded with Starknet.js v5.21.0, Starknet-devnet-rs v0.1.0

import fs from "fs";
import { Account, Contract, ec, json, uint256, hash, CallData, Call, Calldata, cairo, Uint256, RpcProvider, shortString } from "starknet";
import axios from "axios";
import * as dotenv from "dotenv";
import { resetDevnetNow } from "./scripts/utils/resetDevnetFunc";
import { formatBalance } from "./scripts/utils/formatBalance";
dotenv.config();

//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆

async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    const accountAddress: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log("Account 0 connected.\n");

    // creation of new account in Devnet
    console.log('C20_NEW_ACCOUNT_PRIVATE_KEY=', process.env.C20_NEW_ACCOUNT_PRIVKEY);
    const privateKeyC20 = process.env.C20_NEW_ACCOUNT_PRIVKEY ?? "";
    const starkKeyPubC20 = ec.starkCurve.getStarkKey(privateKeyC20);
    console.log('C20 new account publicKey =', starkKeyPubC20);
    // declare account contract
    const accountOZ081Sierra = json.parse(
        fs.readFileSync("./compiledContracts/cairo241/accountOZ081.sierra.json").toString("ascii")
    );
    const accountOZ081Casm = json.parse(
        fs.readFileSync("./compiledContracts/cairo241/accountOZ081.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ contract: accountOZ081Sierra, casm: accountOZ081Casm });
    console.log('Account class hash =', decCH);
    await provider.waitForTransaction(declTH);

    // Calculate future address of the account
    const accountCallData: CallData = new CallData(accountOZ081Sierra.abi);
    const accountConstructorCallData: Calldata = accountCallData.compile("constructor", [starkKeyPubC20]);
    const C20contractAddress = hash.calculateContractAddressFromHash(starkKeyPubC20, decCH, accountConstructorCallData, 0);
    console.log('Precalculated account address=', C20contractAddress);
    // fund account address before account creation (50 ETH)
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": C20contractAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);
    // deploy account
    const accountC20 = new Account(provider, C20contractAddress, privateKeyC20); // with Starknet.js v5.21.0, automatic recognize of the Cairo version of the account
    const { transaction_hash, contract_address } = await accountC20.deployAccount({ classHash: decCH, constructorCalldata: accountConstructorCallData, addressSalt: starkKeyPubC20 });
    console.log('New account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);

    // Deploy an ERC20 contract 
    console.log("Deployment Tx - ERC20 Contract to StarkNet...");

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
        owner: accountC20.address
    });

    console.log("constructor=", ERC20ConstructorCallData);
    const deployERC20Response = await accountC20.declareAndDeploy({
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
    erc20.connect(accountC20);

    // Check balance - should be 100
    console.log(`Calling StarkNet for account balance...`);
    const balanceInitial = await erc20.balanceOf(accountC20.address) as bigint;
    console.log("accountC20 has a balance of :", formatBalance(balanceInitial, DECIMALS));

    // Mint 5 tokens to account address
    console.log("Invoke Tx - Minting 5 tokens to accountC20...");
    const { transaction_hash: mintTxHash } = await erc20.mint(accountC20.address, 500n, { maxFee: 900_000_000_000_000 }); // maxFee optional
    // Wait for the invoke transaction to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Minting...`);
    await provider.waitForTransaction(mintTxHash);
    // Check balance - should be 105
    console.log(`Calling StarkNet for account balance...`);
    const balanceBeforeTransfer = await erc20.balanceOf(accountC20.address) as bigint;
    console.log("accountC20 has a balance of :", formatBalance(balanceBeforeTransfer, DECIMALS));

    // Execute tx transfer of 2x10 tokens, showing 3 ways to write data in Starknet
    console.log(`Invoke Tx - Transfer 3x10 tokens back to erc20 contract...`);
    const transferCallData: Call = erc20.populate("transfer", {
        recipient: erc20Address,
        amount: 1000
    });
    console.log("Transfer 1...");
    const { transaction_hash: transferTxHash } = await accountC20.execute(transferCallData, undefined, { maxFee: 900_000_000_000_000 });  // maxFee optional
    await provider.waitForTransaction(transferTxHash);

    console.log("Transfer 2...");
    const { transaction_hash: transferTxHash2 } = await erc20.transfer(erc20Address, 1000n);
    await provider.waitForTransaction(transferTxHash2);

    console.log("Transfer 3...");
    const { transaction_hash: transferTxHash3 } = await erc20.transfer(...transferCallData.calldata as string[], { parseRequest: false });
    // Warning message is normal with the ParseRequest option de-activated
    await provider.waitForTransaction(transferTxHash3);

    // Check balance after transfer - should be 75
    console.log(`Calling StarkNet for account balance...`);
    const balanceAfterTransfer = await erc20.balanceOf(accountC20.address);
    console.log("account0 has a balance of :", formatBalance(balanceAfterTransfer, DECIMALS));
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });