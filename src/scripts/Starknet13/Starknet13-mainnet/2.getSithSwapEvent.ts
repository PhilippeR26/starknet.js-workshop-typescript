// Identify SithSwap events, from the Tx hash.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-mainnet/2.getSithSwapEvent.ts
// Coded with Starknet.js v6.0.0

import { Contract, shortString, RpcProvider, hash } from "starknet";
import axios from "axios";


async function main() {
    // mainnet
    const nodeUrl = "https://free-rpc.nethermind.io/mainnet-juno/v0_6";
    const provider = new RpcProvider({ nodeUrl });
    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    const payload_Pathfinder = {
        jsonrpc: '2.0',
        id: 1,
        method: 'pathfinder_version',
        params: []
    };
    const payload_Juno = {
        jsonrpc: '2.0',
        id: 1,
        method: 'juno_version',
        params: []
    };
    const response = await axios.post(nodeUrl, payload_Juno);
    console.log('Version:', response.data);
    // process.exit(5);

    const txH = "0x05cd749141fdee52e02470630e674ecb4f2564240dacd56200541d3888d2d5ed";
    const txReceipt = await provider.getTransactionReceipt(txH);
    console.log(txReceipt.events);
    const sierraSithSwapUsdcUsdt = await provider.getClassByHash("0x07eb597ad7d9ba28ea1db162cdb99e265fe22bcb00e9b690e188c2203de9e005");
    const sithSwapContract = new Contract(sierraSithSwapUsdcUsdt.abi, "0x0601f72228f73704e827de5bcd8dadaad52c652bb1e42bf492d90bbe22df2cec", provider);
    const events = sithSwapContract.parseEvents(txReceipt);
    console.log(events[2]);
    console.log(hash.getSelectorFromName("Swap"));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });