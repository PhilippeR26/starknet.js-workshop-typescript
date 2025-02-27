// Test transactions V 3 in Goerli integration.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-integrationGoerli/2.transactionV3.ts
// Use 
// - Goerli Testnet network
// - Pathfinder 0.10.3-rc0, connected '0_6'
// - Account ArgentX from class 0x2846...
// - Account shall contain gETH and gSTRK.
// Coded with Starknet.js v6.0.0.beta7

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, hash, CallData, cairo, ec } from "starknet";
import fs from "fs";
import { account1IntegrationGoerliAXaddress, account1IntegrationGoerliAXprivateKey, account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account5TestnetAddress, account5TestnetPrivateKey, goerliIntegrationUrl } from "../../../A1priv/A1priv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";



async function main() {
    // mainnet
    const nodeUrl = "https://free-rpc.nethermind.io/mainnet-juno/v0_6";
    const provider = new RpcProvider({ nodeUrl  }); 

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

    const txH = "0x42b8d079e3e8a2d68b5b240302cc35b7be7c0e00e388deb7db00482982c6c56";
    const trace = await provider.getTransactionTrace(txH);
    console.log(trace);







    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });