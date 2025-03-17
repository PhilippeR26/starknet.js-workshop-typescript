
// Test rpc 0.8 new websocket IP.
// Launch with npx ts-node src/scripts/webSocket/5.testWSconnect.ts
// Coded with Starknet.js v7.0.0-beta.3

import { json, WebSocketChannel, WSSubscriptions } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse } from "@starknet-io/types-js";
import { WebSocket } from "isows";
// import * as dotenv from "dotenv";
// dotenv.config();

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // pathfinder Testnet
    const wsUrl = "ws://localhost:9545/rpc/v0_8";
    // juno Testnet
    // const wsUrl = "ws://localhost:6071/v0_8";
    const myWS = new WebSocketChannel({ nodeUrl: wsUrl });
    try {
        await myWS.waitForConnection();
        console.log("connected0 =", myWS.isConnected());
    } catch (error: any) {
        console.log("E1", error.message);
        process.exit(1);
    }

    // disconnect/reconnect
    console.log("Disconnect...");
    myWS.disconnect();
    const resQuit = await myWS.waitForDisconnection();
    console.log("After disconnect. Connected3 =", myWS.isConnected(), resQuit);

    if (resQuit === WebSocket.CLOSED) {
        if (!myWS.isConnected()) {
            console.log("Reconnect...");
            myWS.reconnect();
            await myWS.waitForConnection();
        }
    }
    else {
        console.log("E2", resQuit);
        process.exit(2);
    }
    console.log("Connected2 =", myWS.isConnected());


    console.log("Disconnect...");
    myWS.disconnect();
    const resQuit4 = await myWS.waitForDisconnection();
    console.log({ resQuit4 });
    console.log("After disconnect. Connected4 =", myWS.isConnected());


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


