// Read a declared erc20 contract in devnet.
// Launch with npx ts-node src/scripts/devnet/10.getContractCompiled.ts
// Coded with Starknet.js v5.9.1, starknet-devnet 0.5.1

import { Provider, Contract, Account, uint256, constants, CallData, hash, CompiledContract, LegacyCompiledContract, Program, json } from "starknet";
import { ensureEnvVar } from "../../util";

import fs from "fs";
import * as pako from "pako";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          Launch also src/starknet_jsExistingAccount.ts
//          👆👆👆

const decompress = (base64: string) => Buffer.from(pako.ungzip(Buffer.from(base64, 'base64'))).toString();


async function main() {
    //initialize the Providers in mainnet and testnet
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

    // read abi

    const classHash = "0x74953440d81a1b2deb04905bec239d8879f98bad63350ec550a07a7ff13dbc0";
    const compressedContract = await providerDev.getClassByHash(classHash);
    if (("program" in compressedContract) && compressedContract.abi) { // Cairo 0
        const decompressedProgram = json.parse(decompress(compressedContract.program));
        fs.writeFileSync('./src/scripts/devnet/erc20_program.json', json.stringify(decompressedProgram, undefined, 2));
        console.log(decompressedProgram.main_scope);
        const compiledContract: LegacyCompiledContract = {
            entry_points_by_type: compressedContract.entry_points_by_type,
            abi: compressedContract.abi,
            program: decompressedProgram
        }
        fs.writeFileSync('./src/scripts/devnet/erc20_contract.json', json.stringify(compiledContract, undefined, 2));
    } else {
        // Cairo 1
    }
    console.log('✅ Recover completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
