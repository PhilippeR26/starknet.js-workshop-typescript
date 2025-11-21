// Upgrade an ArgentX Cairo 0 account .
// use Starknet.js v5.19.5
// launch with npx ts-node src/scripts/devnet-forked/1.interact-forked.ts

import { CallData, Provider, Contract, Account, json, uint256, Calldata, num, cairo, Abi, RpcProvider, constants } from "starknet";
// import { account2DevnetArgentXAddress, account2DevnetArgentXPrivateKey } from "../../A2priv/A2priv";
import { account2MainnetAddress, account2MainnetPrivateKey } from "../../A-MainPriv/mainPriv";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    //initialize Provider 
    //const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5100" } });
    ;
    const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_6" });
    console.log('✅ Connected to Mainnet.');

    // Account 2 Mainnet become Account2 devnet after fork
    const accountAddress=account2MainnetAddress;
    const newImplementation = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
    const oldProxyClass = await provider.getClassAt(accountAddress);
    const proxyArgentX = new Contract(oldProxyClass.abi, accountAddress, provider);
    const res1 = await proxyArgentX.get_implementation();
    const oldImplementationCH = num.toHex(res1.implementation)
    console.log("old class hash implemented =", oldImplementationCH);
    const oldImplementationClass = await provider.getClassByHash(oldImplementationCH);
    const contractArgentX = new Contract(oldImplementationClass.abi, accountAddress, provider);
    const call1 = contractArgentX.populate("upgrade", {
        implementation: newImplementation,
        calldata: [0]
    });
    console.log("calldata =", call1.calldata);
    const accountArgentX = new Account(provider, accountAddress, account2MainnetPrivateKey);
    contractArgentX.connect(accountArgentX);
    const { transaction_hash: th1 } = await contractArgentX.upgrade(call1.calldata);
    console.log("th1 =", th1);
    const tr1 = await provider.waitForTransaction(th1);
    console.log("tr1 =", tr1);
    // wait next block, to officialize new implementation
    const newCH = await provider.getClassHashAt(accountAddress);
    console.log("new class hash =", newCH);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });