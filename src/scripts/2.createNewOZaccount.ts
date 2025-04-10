// Create a new OZ 17 account in devnet
// Launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v7.0.1 & Devnet 0.3.0

import { Account, ec, json, hash, CallData, RpcProvider, stark, shortString, config, ETransactionVersion } from "starknet";
import { Devnet, DevnetProvider } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";


async function main() {
    // launch devnet with a new console window
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
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url, specVersion: "0.8" });
    // already running Devnet
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.8" });
    // const devnet = new DevnetProvider({ timeout: 40_000 });
    if (!(await devnet.provider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log("devnet : url =", devnet.provider.url);
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-devnet.");

    config.set('legacyMode', true); // useful for rpc 0.7

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // new Open Zeppelin account v0.17.0 (Cairo 1) :

    // declare OZ wallet contract
    const accountSierra = json.parse(
        fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.contract_class.json").toString("ascii")
    );
    const accountCasm = json.parse(
        fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.compiled_contract_class.json").toString("ascii")
    );
    console.log("Declare account if necessary...");
    const ch = hash.computeContractClassHash(accountSierra);
    console.log("Calculated class Hash of contract =", ch);
    const { transaction_hash: declTH, class_hash: contractClassHash } = await account0.declareIfNot({ contract: accountSierra, casm: accountCasm });
    console.log('OpenZeppelin account class hash created =', contractClassHash);
    if (declTH) { await myProvider.waitForTransaction(declTH); }

    console.log("Deploy account...");
    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    //const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey =', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey =', starkKeyPub);

    // Calculate future address of the account
    const accountCallData = new CallData(accountSierra.abi);
    const constructorCallData = accountCallData.compile("constructor", {
        public_key: starkKeyPub,
    });
    console.log("constructor =", constructorCallData);
    const accountAddress = hash.calculateContractAddressFromHash(starkKeyPub, contractClassHash, constructorCallData, 0);
    console.log('Precalculated account address=', accountAddress);

    // fund account address before account creation
    await devnet.provider.mint(accountAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(accountAddress, 100n * 10n ** 18n, "FRI"); // 100 STRK

    // deploy account
    const OZaccount = new Account(myProvider, accountAddress, privateKey, undefined, ETransactionVersion.V2);
    console.log("Deploy account...");
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({
        classHash: contractClassHash,
        constructorCalldata: constructorCallData,
        addressSalt: starkKeyPub,
        contractAddress: accountAddress
    });
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
    await myProvider.waitForTransaction(transaction_hash);

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