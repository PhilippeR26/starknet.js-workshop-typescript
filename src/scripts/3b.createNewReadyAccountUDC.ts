// Deploy a new ArgentX wallet (Cairo1, v0.4.0).
// launch with : npx ts-node ssrc/scripts/3.createNewArgentXaccount.ts
// Coded with Starknet.js v8.5.0 & Devnet 0.5.0

import { RpcProvider, Account, ec, json, hash, CallData, CairoOption, CairoOptionVariant, CairoCustomEnum, shortString, config, CairoBytes31, type Call, constants, type InvokeFunctionResponse, type SuccessfulTransactionReceiptResponse, events as eventsTx, type InvokeTransactionReceiptResponse } from "starknet";
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
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url, specVersion: "0.9.0" });
    config.set("logLevel", "FATAL");
    console.log("devnet url =", devnet.provider.url);
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account({
        provider: myProvider,
        address: devnetAccounts[0].address,
        signer: devnetAccounts[0].private_key
    });
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // create account
    const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo2100/Ready050Account.sierra.json").toString("ascii"));
    const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo2100/Ready050Account.casm.json").toString("ascii"));
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
        console.log("Ready contract declared");
    } else { console.log("Already declared.") };

    const contractAXclassHash = respDecl.class_hash;
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

    
    const myCall: Call = {

        contractAddress: constants.UDC.ADDRESS,
        entrypoint: constants.UDC.ENTRYPOINT,
        calldata: CallData.compile({
            classHash: contractAXclassHash,
            salt: starkKeyPubAX,
            unique: "1",
            calldata: constructorAXCallData,
        }),
    };
    console.log("constructor =", constructorAXCallData);
    console.log("Deploy of account in progress...");
    // *** with account.deployContract()
    // const { transaction_hash: txHDepl, address } = await account0.deployContract({ classHash: contractClassHash, constructorCalldata: constructor });
    // console.log("Address =", address);
    // *** with account.execute()
    const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]); // you can add other txs here

    console.log("TxH =", txHDepl);
    const txR = await myProvider.waitForTransaction(txHDepl);
    let accountAddr: string = "";
    txR.match({
        SUCCEEDED: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log('Success =', txR, "\n", txR.events);
            const resDeploy = account0.deployer.parseDeployerEvent(txR as InvokeTransactionReceiptResponse);
            console.log(resDeploy);
            accountAddr = resDeploy.address;
            console.log("Account address =", (resDeploy.address));
        },
        _: () => {
            console.log('Unsuccess');
            process.exit(5);
        },
    });





    // deploy ArgentX account
    const accountAX = new Account({ provider: myProvider, address: accountAddr, signer: privateKeyAX });
    
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