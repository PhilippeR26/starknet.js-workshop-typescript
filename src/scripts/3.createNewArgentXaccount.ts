// Deploy a new ArgentX wallet (Cairo1, v0.4.0).
// launch with : npx ts-node ssrc/scripts/3.createNewArgentXaccount.ts
// Coded with Starknet.js v6.23.0

import { RpcProvider, Account, ec, json, hash, CallData, CairoOption, CairoOptionVariant, CairoCustomEnum, shortString } from "starknet";
import { Devnet } from "starknet-devnet";
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
    console.log("devnet url =", devnet.provider.url);
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet-devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // create account
    const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii"));
    const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountAXsierra);
    console.log("Class Hash of ArgentX contract =", ch);

    // Calculate future address of the ArgentX account
    const privateKeyAX = "0x1234567890abcdef987654321";
    console.log('AX account Private Key =', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX account Public Key  =', starkKeyPubAX);

    // declare
    const respDecl = await account0.declareIfNot({ contract: accountAXsierra, casm: accountAXcasm });
    if (respDecl.transaction_hash) {
        await myProvider.waitForTransaction(respDecl.transaction_hash);
        console.log("ArgentX Cairo 1 contract declared");
    } else { console.log("Already declared.") };

    const contractAXclassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; //v0.4.0
    //const contractAXclassHash=respDecl.class_hash;
    const calldataAX = new CallData(accountAXsierra.abi);
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None)
    const constructorAXCallData = calldataAX.compile("constructor", {
        owner: axSigner,
        guardian: axGuardian
    });
    console.log("constructor =", constructorAXCallData);
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, constructorAXCallData, 0);
    console.log('Precalculated account address=', accountAXAddress);

    // fund account address before account creation
    await devnet.provider.mint(accountAXAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(accountAXAddress, 100n * 10n ** 18n, "FRI"); // 100 STRK

    // deploy ArgentX account
    const accountAX = new Account(myProvider, accountAXAddress, privateKeyAX);
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: constructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload);
    console.log("Final address =", accountAXFinalAddress);
    await myProvider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

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