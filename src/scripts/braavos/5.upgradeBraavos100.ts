// Upgrade a Braavos 0.0.11 (Cairo 0) account to a v1.0.0 (Cairo 1) account in Goerli Testnet.
// use Starknet.js v6.1.4
// launch with npx ts-node src/scripts/braavos/5.upgradeBraavos100.ts

import { CallData, Contract, Account, json, Calldata, num, cairo, Abi, constants, RpcProvider, shortString } from "starknet";
import { account2BraavosTestnetAddress, account2BraavosTestnetPrivateKey } from "../../A1priv/A1priv";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    //initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_6" });
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    console.log('✅ Connected to Goerli Testnet.');

    // initialize existing deployed account 
    const accountAddress0 = account2BraavosTestnetAddress;
    const privateKey0 = account2BraavosTestnetPrivateKey;

    const newImplementationClass = "0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253";
    const proxyClass = await provider.getClassAt(accountAddress0);
    const contractProxyBraavos = new Contract(proxyClass.abi, accountAddress0, provider);
    const currentImplementation = await contractProxyBraavos.call("get_implementation") as any;
    console.log("get_implementation =", currentImplementation);
    const implementationClass = await provider.getClassByHash(currentImplementation.implementation);
    const contractBraavos = new Contract(implementationClass.abi, accountAddress0, provider);
    console.log(contractBraavos.functions);
    const call1 = contractBraavos.populate("upgrade", {
        new_implementation: newImplementationClass
    });
    console.log("calldata =", call1);
    const accountBraavos = new Account(provider, accountAddress0, privateKey0);
    //contractBraavos.connect(accountBraavos);
    console.log("Upgrade in progress ...")
    const { transaction_hash: th1 } = await accountBraavos.execute(call1);
    console.log("transaction hash 1 =", th1);
    const tr1 = await provider.waitForTransaction(th1);
    console.log("transaction receipt 1 =", tr1);
    console.log("Upgrade to v1.0.0 successfully performed.")
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
