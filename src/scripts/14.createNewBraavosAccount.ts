// Deploy a new Braavos wallet (Cairo1, contract v1.2.0).
// launch with : npx src/scripts/14.createNewBraavosAccount.ts
// Coded with Starknet.js v8.1.2 & Devnet 0.5.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, type BigNumberish, shortString, config } from "starknet";
import { deployBraavosAccount, calculateAddressBraavos } from "./braavos/3d.deployBraavos110v3";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";
import { ETransactionVersion } from "@starknet-io/types-js";

async function main() {
    // launch Devnet with a new console window
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
    config.set("logLevel","FATAL");
    console.log("Devnet : url =", devnet.provider.url);
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()), 
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-Devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account({
        provider: myProvider,
        address: devnetAccounts[0].address,
        signer: devnetAccounts[0].private_key
    });
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // declare
    const accountBraavosBaseSierra = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosBaseAccount110.contract_class.json").toString("ascii"));
    const accountBraavosBaseCasm = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosBaseAccount110.compiled_contract_class.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountBraavosBaseSierra);
    console.log("Braavos account declare in progress...");
    const respDecl = await account0.declareIfNot({ contract: accountBraavosBaseSierra, casm: accountBraavosBaseCasm });
    const contractBraavosClassHash = respDecl.class_hash;
    if (respDecl.transaction_hash) { await myProvider.waitForTransaction(respDecl.transaction_hash) };
    console.log("Braavos base contract class hash :", respDecl.class_hash);
    const accountBraavosSierra = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosAccount110.contract_class.json").toString("ascii"));
    const accountBraavosCasm = json.parse(fs.readFileSync("./compiledContracts/cairo284/braavos_account_BraavosAccount110.compiled_contract_class.json").toString("ascii"));
    const respDecl2 = await account0.declareIfNot({ contract: accountBraavosSierra, casm: accountBraavosCasm });
    console.log("Braavos contract class hash :", respDecl2.class_hash);
    if (respDecl2.transaction_hash) { await myProvider.waitForTransaction(respDecl2.transaction_hash) };

    // Calculate future address of the Braavos account
    const privateKeyBraavosBase = stark.randomAddress();
    console.log('Braavos account Private Key =', privateKeyBraavosBase);
    const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
    console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);


    const calldataBraavos = new CallData(accountBraavosBaseSierra.abi);
    type StarkPubKey = { pub_key: BigNumberish };
    const myPubKey: StarkPubKey = { pub_key: starkKeyPubBraavosBase };
    const constructorBraavosCallData = calldataBraavos.compile("constructor", {
        stark_pub_key: myPubKey,
    });
    const accountBraavosAddress = hash.calculateContractAddressFromHash(starkKeyPubBraavosBase, contractBraavosClassHash, constructorBraavosCallData, 0);
    console.log('Precalculated account address=', accountBraavosAddress);

    // fund account address before account creation
    await devnet.provider.mint(accountBraavosAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(accountBraavosAddress, 100n * 10n ** 18n, "FRI"); // 100 STRK

    const respDeploy = deployBraavosAccount(
        privateKeyBraavosBase, 
        myProvider, 
        undefined,
        ETransactionVersion.V3 // 👈👈 V1 or V3 deploy transaction
    );
    const txR = await myProvider.waitForTransaction((await respDeploy).transaction_hash);
    console.log("Transaction receipt =", txR);
    console.log("Account created.\nFinal address =", accountBraavosAddress);
    console.log('✅ Braavos wallet deployed.');

    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });