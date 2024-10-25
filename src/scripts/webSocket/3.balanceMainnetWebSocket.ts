// Connect to a Mainnet node, located in a remote computer in the local network.
// Launch with npx ts-node src/scripts/webSocket/1.balanceMainnetWebSocket.ts
// Coded with Starknet.js v5.21.0

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
// 🚨🚨🚨 launch first a Juno node with webSocket activated.
//        👆👆👆


async function main() {
    
    let wsOpen: boolean = false;
    const start0 = new Date().getTime();
    let end0: number=0;
    const ws = new WebSocket("ws://192.168.1.11:6061"); //nethermind juno node
    console.log("A");
    ws.on('open', function open() { end0 = new Date().getTime();wsOpen = true; });
    await waitFor(() => wsOpen);
    console.log("ws opened in",end0-start0,"ms.");
    const start = new Date().getTime();
    let end: number;
    ws.send('{"jsonrpc" : "2.0", "method" : "starknet_chainId","params" : [],  "id" : 8}');
    console.log("B");

    ws.on('message', function message(data) {
        end = new Date().getTime();
        console.log('received: %s', data, ". Duration =", end - start, "ms.");
    });
    console.log("C");
    await wait(10 * 1000); // 10 sec
    console.log("press a key to stop the scan.");
    await keypress();
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
