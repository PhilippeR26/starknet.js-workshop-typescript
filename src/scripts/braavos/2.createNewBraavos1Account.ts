// Deploy a new braavos wallet.
// launch with npx ts-node src/scripts/braavos/2.createNewBraavos1Account.ts
// Coded with Starknet.js v6.15.0, starknet-devnet-rs 0.2.0

import { Provider, Account, num, RpcProvider, shortString, stark, json, hash } from "starknet";
import { calculateAddressBraavos, deployBraavosAccount, estimateBraavosAccountDeployFee } from "./3b.deployBraavos1";
import axios from "axios";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --lite-mode' in devnet-rs directory before using this script.
//          👆👆👆
async function main() {

    //initialize Provider 
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet");

    // *** initialize existing predeployed account 0 of Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log('predeployed devnet account0 connected.\n');

    // declare
    const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.sierra.json").toString("ascii"));
    const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_BraavosBase100.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountBraavosBaseSierra);
    console.log("Braavos account declare in progress...");
    const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
    const contractBraavosClassHash = respDecl.class_hash;
    if (respDecl.transaction_hash) { await myProvider.waitForTransaction(respDecl.transaction_hash) };
    console.log("Braavos base contract class hash :", respDecl.class_hash);
    const accountBraavosSierra = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.sierra.json").toString("ascii"));
    const accountBraavosCasm = json.parse(fs.readFileSync("./compiledContracts/cairo251/braavos_account_Braavos100.casm.json").toString("ascii"));
    const respDecl2 = await account0.declareIfNot({ contract: accountBraavosSierra, casm: accountBraavosCasm });
    console.log("Braavos contract class hash :", respDecl2.class_hash);
    if (respDecl2.transaction_hash) { await myProvider.waitForTransaction(respDecl2.transaction_hash) };
    
    // Calculate future address of the Braavos account
    const privateKeyBraavos = stark.randomAddress();
    console.log('Braavos_ACCOUNT_PRIVATE_KEY=', privateKeyBraavos);
    const BraavosProxyAddress = calculateAddressBraavos(privateKeyBraavos);

    const myMaxFee = 2 * 10 ** 15; // defined manually as estimateFee fails.
    // // estimate fees
    // const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavos, myProvider);
    // console.log("calculated fee =", estimatedFee);

    // fund account address before account creation       
    await l2DevnetProvider.mint(BraavosProxyAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await l2DevnetProvider.mint(BraavosProxyAddress, 100n * 10n ** 18n, "WEI"); // 100 STRK

    // deploy Braavos account
    const { transaction_hash, contract_address: BraavosAccountFinalAddress } = await deployBraavosAccount(privateKeyBraavos, myProvider,myMaxFee);

    console.log('Transaction hash =', transaction_hash);
    await myProvider.waitForTransaction(transaction_hash);
    console.log('✅ Braavos wallet deployed at', BraavosAccountFinalAddress);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
