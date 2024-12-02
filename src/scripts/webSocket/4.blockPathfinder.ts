
// Connect to a Testnet node, located in a remote computer in the local network. Test rpc 0.8 new IP
// Launch with npx ts-node src/scripts/webSocket/4.blockPathfinder.ts
// Coded with Starknet.js v6.15.0

import { json } from "starknet";
import { formatBalance } from "../utils/formatBalance";
import WebSocket from 'ws';
import { keypress } from "../utils/utils";
// import * as dotenv from "dotenv";
// dotenv.config();
function wait(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

async function waitFor(f: Function) {
    while (!f()) await wait(200);
    return f();
}

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder node with webSocket activated.
//        👆👆👆

async function main() {

    let wsOpen: boolean = false;
    const start0 = new Date().getTime();
    let end0: number = 0;
    const ws = new WebSocket("ws://192.168.1.11:9545/rpc/v0_8");
    console.log("A");
    ws.on('open', function open() {
        end0 = new Date().getTime();
        wsOpen = true;
    });
    await waitFor(() => wsOpen);
    console.log("ws opened in", end0 - start0, "ms.");
    const start = new Date().getTime();
    let end: number;
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_chainId","params" : [],  "id" : 2}');
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["newHeads"],  "id" : 3}');
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["events","0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"],  "id" : 4}');
    console.log("B");
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["transactionStatus","0x1a6efb583c3fa89421ea34547d47fb863f5758a4720ea3f99a2fd9e508c4f21"],  "id" : 5}');
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeNewHeads","params" : [],  "id" : 6}');
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeEvents","params" : ["0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"],  "id" : 7}');
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribeTransactionStatus","params" : ["0x1a6efb583c3fa89421ea34547d47fb863f5758a4720ea3f99a2fd9e508c4f21"],  "id" : 8}');
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_subscribePendingTransactions","params" : [],  "id" : 9}');
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_subscriptionReorg","params" : [],  "id" : 10}');
    
    
    

    ws.on('message', function message(data) {
        end = new Date().getTime();
        const newData = json.parse(data.toString("ascii"));
        console.log("\nreceived. Duration =", end - start, "ms.");
        console.log(newData);
    });
    console.log("C");
    await wait(10 * 1000); // 10 sec
    console.log("press a key to stop to wait messages.");
    await keypress();
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 0,  "id" : 20}');
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 1,  "id" : 21}');
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : 2,  "id" : 22}');
    console.log("C2");
    ws.close();
    console.log("D");


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


