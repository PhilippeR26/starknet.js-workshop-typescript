
// Connect to a Mainnet node, located in a remote computer in the local network.
// Launch with npx ts-node src/scripts/webSocket/1.balanceMainnetWebSocket.ts
// Coded with Starknet.js v5.21.0

import { json } from "starknet";
import { formatBalance } from "../utils/formatBalance";
import WebSocket from 'ws';
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

async function keypress(): Promise<void> {
    process.stdin.setRawMode(true);
    return new Promise(resolve => process.stdin.once('data', data => {
        const byteArray = [...data];
        if (byteArray.length > 0 && byteArray[0] === 3) {
            console.log('^C');
            process.exit(1);
        }
        process.stdin.setRawMode(false);
        resolve();
    }))
}

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder node with webSocket activated.
//        👆👆👆

async function main() {

    let wsOpen: boolean = false;
    const start0 = new Date().getTime();
    let end0: number = 0;
    const ws = new WebSocket("ws://192.168.1.44:9545/ws");
    console.log("A");
    ws.on('open', function open() {
        end0 = new Date().getTime();
        wsOpen = true;
    });
    await waitFor(() => wsOpen);
    console.log("ws opened in", end0 - start0, "ms.");
    const start = new Date().getTime();
    let end: number;
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_subscribe","params" : ["newHeads"],  "id" : 1}');
    console.log("B");

    ws.on('message', function message(data) {
        end = new Date().getTime();
        const newData = json.parse(data.toString("ascii"));
        console.log("received. Duration =", end - start, "ms.");
        const newBloc = json.parse(data.toString("ascii"));
        if (!!newBloc.result.result) {
            console.log(newBloc.result.result);
        } else {
            console.log(newBloc);
        }
    });
    console.log("C");
    await wait(10 * 1000); // 10 sec
    console.log("press a key to stop the scan.");
    await keypress();
    ws.send('{"jsonrpc" : "2.0", "method" : "pathfinder_unsubscribe","params" : ["newHeads"],  "id" : 1}');
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


