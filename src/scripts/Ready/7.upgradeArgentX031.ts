// Upgrade for V3 transaction an ArgentX account in Goerli Testnet.
// use Starknet.js v6.0.0
// launch with npx ts-node src/scripts/argentX/7.upgradeArgentX031.ts

import { CallData, Contract, Account, json, Calldata, num, cairo, Abi, constants, RpcProvider, shortString } from "starknet";
import { account2TestnetAddress, account2TestnetPrivateKey } from "../../A1priv/A1priv";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    //initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0.5" });
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    console.log('✅ Connected to Goerli Testnet.');

    // initialize existing deployed account 
    const accountAddress0 = account2TestnetAddress;
    const privateKey0 = account2TestnetPrivateKey;

    const newImplementationClass = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";
    const contractClass = await provider.getClassAt(accountAddress0);
    const contractArgentX = new Contract(contractClass.abi, accountAddress0, provider);
     const call1 = contractArgentX.populate("upgrade", {
        new_implementation: newImplementationClass,
        calldata: [0]
    });
    console.log("calldata =", call1.calldata);
    const accountArgentX = new Account(provider, accountAddress0, privateKey0);
    contractArgentX.connect(accountArgentX);

    console.log("Upgrade in progress ...")
    const { transaction_hash: th1 } = await contractArgentX.upgrade(call1.calldata);
    console.log("transaction hash 1 =", th1);
    const tr1 = await provider.waitForTransaction(th1);
    console.log("transaction receipt 1 =", tr1);
    console.log("Upgrade to v0.3.1 successfully performed.")
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
