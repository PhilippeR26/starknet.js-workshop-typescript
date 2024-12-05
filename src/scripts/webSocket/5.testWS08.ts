
// Test rpc 0.8 new IP
// Launch with npx ts-node src/scripts/webSocket/5.testWS08.ts
// Coded with Starknet.js v6.20.3

import { json, WebSocketChannel, WSSubscriptions } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse } from "@starknet-io/types-js";
import { WebSocket } from "isows";
// import * as dotenv from "dotenv";
// dotenv.config();

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder node with webSocket activated.
//        👆👆👆

async function main() {
    const WSurl = "ws://192.168.1.11:9545/rpc/v0_8";
    const myWS = new WebSocketChannel({ nodeUrl: WSurl });
    try {
        await myWS.waitForConnection();
        console.log("connected0 =", myWS.isConnected());
    } catch (error: any) {
        console.log("E1", error.message);
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
    }
    console.log("Connected2 =", myWS.isConnected());

    // subscribe newHeads
    const newHeadsID = await myWS.subscribeNewHeads();
    console.log("subscribe newHead response =", newHeadsID);
    if (!newHeadsID) {
        throw new Error("newHead subscription failed");
    }
    let i = 0;
    myWS.onNewHeads = async function (newHead:SubscriptionNewHeadsResponse) {
        i += 1;
        console.log("newHead event =", i, newHead);
        if (i === 2) {
            const status = await myWS.unsubscribeNewHeads();
            console.log({ status });
        }
    };
    const expectedId = myWS.subscriptions.get(WSSubscriptions.NEW_HEADS);
    console.log({ expectedId });
    const subscriptionId = await myWS.waitForUnsubscription(expectedId);
    console.log({ subscriptionId });


    const subscriptions = myWS.subscriptions;
    console.log({ subscriptions });
    const subGet = myWS.subscriptions.get(WSSubscriptions.NEW_HEADS);
    console.log({ subGet });




    console.log("press a key to stop to wait messages.");
    await keypress();

    // const status0 = await myWS.unsubscribeNewHeads();
    console.log("Disconnect...");
    myWS.disconnect();
    const resQuit4:WebSocket = await myWS.waitForDisconnection();
    console.log("After disconnect. Connected4 =", myWS.isConnected(), resQuit);


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


