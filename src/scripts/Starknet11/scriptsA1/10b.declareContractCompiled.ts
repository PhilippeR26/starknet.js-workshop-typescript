// Deploy in devnet.
// Launch with npx ts-node src/scripts/devnet/6.writeSwap.ts
// Coded with Starknet.js v5.9.1, starknet-devnet 0.5.1

import { Provider, Contract, Account, uint256, constants, CallData, hash, CompiledContract, LegacyCompiledContract, Program, json } from "starknet";
import { ensureEnvVar } from "../../util";

import fs from "fs";
import * as pako from "pako";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          Reset devnet before use : 'source ./src/scripts/resetDevnet.sh'
//          👆👆👆


async function main() {
    //initialize the Provider in mainnet
    const providerMain = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });
    const providerDev = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });

    const chainIdMain = await providerMain.getChainId();
    console.log('Connected to the  network  (Mainnet)=', chainIdMain);

    // connect existing predeployed account 0 of Devnet
    const privateKey0 = ensureEnvVar("OZ_ACCOUNT0_DEVNET_PRIVATE_KEY");
    const account0Address: string = ensureEnvVar("OZ_ACCOUNT0_DEVNET_ADDRESS");
    const account0 = new Account(providerDev, account0Address, privateKey0);
    console.log("priv =", privateKey0);
    console.log("addr =", account0Address);
    console.log('existing OZ account0 connected in devnet.\n');

    // declare
    console.log("declare deploy in progress...");
    const compiledTest = json.parse(fs.readFileSync("./src/scripts/scriptsA1/erc20_contract.json").toString("ascii"));
    const declareResponseTest = await account0.declare({ contract: compiledTest });

    console.log('Test Contract Class Hash =', declareResponseTest.class_hash);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
