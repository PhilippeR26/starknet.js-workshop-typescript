// create a new OZ 14 account in devnet-rs
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v6.23.0

import { Account, ec, json, hash, CallData, RpcProvider, stark, shortString } from "starknet";
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

    // new Open Zeppelin account v0.14.0 (Cairo 1) :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);
    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.sierra.json").toString("ascii")
    );
    const casmOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZAccount, casm: casmOZAccount });
    console.log('OpenZeppelin account class hash =', decClassHash);
    if (declTH) { await myProvider.waitForTransaction(declTH); }

    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, decClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);

    // fund account address before account creation
    await devnet.provider.mint(OZcontractAddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(OZcontractAddress, 100n * 10n ** 18n, "WEI"); // 100 STRK

    // deploy account
    const OZaccount = new Account(myProvider, OZcontractAddress, privateKey);
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub,
        contractAddress: OZcontractAddress
    });
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
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