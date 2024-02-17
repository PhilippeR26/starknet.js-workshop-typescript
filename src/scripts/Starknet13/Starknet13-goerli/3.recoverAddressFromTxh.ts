// Invoke JediSwap
// launch with npx ts-node src/scripts/Starknet13/Starknet13-goerli/3.recoverAddressFromTxh.ts
// Coded with Starknet.js v6.0.0 

import { RpcProvider, shortString, parseUDCEvent, type InvokeTransactionReceiptResponse, addAddressPadding } from "starknet";
import { blastKey } from "../../../A-MainPriv/mainPriv";

async function main() {
    // Blast Testnet
    const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" });
    // to be sure to be connected :
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    const txH = "0x1abc87b9f6d13c5d71e4b48e999cbefdb25bb14cb41adf2565346ad4cae160";
    const txReceipt = await provider.getTransactionReceipt(txH) as InvokeTransactionReceiptResponse;
    const resDeploy = parseUDCEvent(txReceipt);
    console.log(resDeploy);
    console.log("Contract address =", addAddressPadding(resDeploy.address));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
