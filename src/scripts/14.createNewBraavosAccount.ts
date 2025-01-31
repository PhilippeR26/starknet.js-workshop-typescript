// Deploy a new Braavos wallet (Cairo1, contract v1.0.0).
// launch with : npx src/scripts/14.createNewBraavosAccount.ts
// Coded with Starknet.js v6.23.0

import { RpcProvider, Account, ec, json, stark, hash, CallData, type BigNumberish, shortString } from "starknet";
import { deployBraavosAccount} from "./braavos/3b.deployBraavos1";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";

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

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

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
    await devnet.provider.mint(accountBraavosAddress, 100n * 10n ** 18n, "WEI"); // 100 STRK

    // deploy Braavos account
    const myMaxFee = 2 * 10 ** 15; // defined manually as estimateFee fails.

    // estimateFee do not work. If you have the solution, I am interested...
    // const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavosBase, provider,{skipValidate:true});
    // console.log("calculated fee =", estimatedFee);

    const respDeploy = deployBraavosAccount(privateKeyBraavosBase, myProvider, myMaxFee);
    const txR = await myProvider.waitForTransaction((await respDeploy).transaction_hash);
    console.log("Transaction receipt =", txR);
    console.log("Account created.\nFinal address =", accountBraavosAddress);
    console.log('✅ Braavos wallet deployed.');

    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet-rs stopped. Pid :", pid, "\nYou can close the log window.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });