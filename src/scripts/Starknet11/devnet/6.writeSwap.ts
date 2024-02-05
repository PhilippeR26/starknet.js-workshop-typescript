// Read a Swap contract in mainnet and declare it in devnet
// Launch with npx ts-node src/scripts/devnet/6.writeSwap.ts
// Coded with Starknet.js v5.9.1, starknet-devnet 0.5.1

import { Provider, Contract, Account, uint256, constants, CallData, hash, CompiledContract, LegacyCompiledContract, Program,json } from "starknet";
import { ensureEnvVar } from "../../util";

import fs from "fs";
import * as pako from "pako";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆

const decompress = (base64: string) => Buffer.from(pako.ungzip(Buffer.from(base64, 'base64'))).toString();


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
    console.log("priv =",privateKey0);
    console.log("addr =",account0Address);
    console.log('existing OZ account0 connected in devnet.\n');

    // read abi

    // const contractAddress = "0x07a6f98c03379b9513ca84cca1373ff452a7462a3b61598f0af5bb27ad7f76d1"; //mainnet 10Kswap
    const classHash="0x0514718bb56ed2a8607554c7d393c2ffd73cbab971c120b00a2ce27cc58dd1c1";
    const compressedContract = await providerMain.getClassByHash(classHash);
    if (("program" in compressedContract) && compressedContract.abi) { // Cairo 0
        const decompressedProgram = json.parse(decompress(compressedContract.program));
        fs.writeFileSync('./src/scripts/mainnet/swap_program.json', json.stringify(decompressedProgram,undefined,2));
        console.log(decompressedProgram.main_scope);
        const compiledContract: LegacyCompiledContract = {
            entry_points_by_type: compressedContract.entry_points_by_type,
            abi: compressedContract.abi,
            program: decompressedProgram
        }
        fs.writeFileSync('./src/scripts/mainnet/swap_contract.json', json.stringify(compiledContract,undefined,2));
         }else{
        // Cairo 1
    }
    console.log("declare deploy in progress...");
    const compiledTest = json.parse(fs.readFileSync("./src/scripts/mainnet/swap_contract.json").toString("ascii"));
      const declareResponseTest = await account0.declare({ contract: compiledTest});

     console.log('Test Contract Class Hash =', declareResponseTest.class_hash);

    //     fs.writeFileSync('./src/scripts/mainnet/swap.json', JSON.stringify(compressedContract,undefined,2));
    //     if (compressedContract.abi === undefined) { throw new Error("No Abi.") }
    //     console.log(JSON.stringify(compressedContract.abi[6],undefined,2));
    // process.exit(100);
    //const routerSwap = new Contract(compressedContract.abi, contractAddress, providerDev);
    // routerSwap.connect(account0);

    // const amountIn = uint256.bnToUint256(1n);
    // const amountOutMin = uint256.bnToUint256(1n);
    // const path = ["0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    // "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"];


    // const callParamsWrite = CallData.compile(
    //     {
    //         amountIn: amountIn,
    //         amountOutMin:amountOutMin,
    //         path: path,
    //         to: account0Address,
    //         deadline : 1234567
    //     }
    // )
    // console.log (callParamsWrite);

    // //const result=routerSwap.swapExactTokensForTokens(callParamsWrite);
    // const result=await account0.execute({
    //     contractAddress:contractAddress,
    //     entrypoint:"swapExactTokensForTokens",
    //     calldata:callParamsWrite
    // })
    // routerSwap.swapExactTokensForTokens(callParamsWrite);
    // //const result = await routerSwap.getAmountsOut(callParams);
    // //const result2 = await routerSwap.call("getAmountsOut",[callParams]);
    // await providerDev.waitForTransaction(result.transaction_hash);

    // console.log("res =", result);
    // console.log('✅ Test completed.');
    //     // amounts
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
