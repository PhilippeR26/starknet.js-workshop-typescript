// create a new abstracted account in devnet-rs
// launch with npx ts-node src/scripts/10.createAccountAbstraction.ts
// Coded with Starknet.js v6.23.0

import { Account, ec, json, hash, CallData, RpcProvider, shortString } from "starknet";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";
import * as dotenv from "dotenv";
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

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // my customized Cairo 0 account, with administrators :

    // Generate public and private key pair.
    const AAprivateKey = process.env.AA_NEW_ACCOUNT_PRIVKEY ?? "";
    // or for random private key :
    //const privateKey=stark.randomAddress() ;
    console.log('privateKey=', AAprivateKey);
    const AAstarkKeyPub = ec.starkCurve.getStarkKey(AAprivateKey);
    console.log('publicKey=', AAstarkKeyPub);
    //declare my wallet contract
    const compiledAAaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo060/myAccountAbstraction-old.json").toString("ascii")
    );
//    const AAaccountClashHass = "0x1d926edb81b7ef0efcb67dd4558a6dffc2bf31a8bc9c3fe7832a5ec3d1b70da";
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ contract: compiledAAaccount });
    console.log('Customized account class hash =', decCH);
    await myProvider.waitForTransaction(declTH);

    // Calculate future address of the account
    const AAaccountConstructorCallData = CallData.compile({ super_admin_address: account0.address, publicKey: AAstarkKeyPub });
    const AAcontractAddress = hash.calculateContractAddressFromHash(AAstarkKeyPub, decCH, AAaccountConstructorCallData, 0);
    console.log('Precalculated account address=', AAcontractAddress);
    // fund account address before account creation
    await devnet.provider.mint(AAcontractAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(AAcontractAddress, 100n * 10n ** 18n, "WEI"); // 100 STRK
    // deploy account
    const AAaccount = new Account(myProvider, AAcontractAddress, AAprivateKey);
    const { transaction_hash, contract_address } = await AAaccount.deployAccount({ classHash: decCH, constructorCalldata: AAaccountConstructorCallData, addressSalt: AAstarkKeyPub }, { maxFee: 9_000_000_000_000_000 });
    console.log('✅ New customized account created.\n   final address =', contract_address);
    await myProvider.waitForTransaction(transaction_hash);

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

