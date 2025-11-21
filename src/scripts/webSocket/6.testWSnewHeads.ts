
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/6.testWSnewHeads.ts
// Coded with Starknet.js v7.5.0 + experimental

import { json, WebSocketChannel, type Subscription } from "starknet";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type BLOCK_HEADER } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // *** pathfinder Testnet
    // const wsUrl = "ws://localhost:9545/rpc/v0_9";
    const wsUrl = process.env.NEXT_PUBLIC_WS_PROVIDER ?? "";
    // const wsUrl = "wss://starknet-mainnet.public.blastapi.io/rpc/v0_8";
    // *** juno Testnet
    // const wsUrl = "ws://localhost:6071/ws/rpc/v0_8";
    // const wsUrl = "wss://free-rpc.nethermind.io/sepolia-juno/rpc/v0_8";
    console.log("wsUrl =", wsUrl);

    const myWS = new WebSocketChannel({ nodeUrl: wsUrl });
    try {
        const conn = await myWS.waitForConnection();
        console.log("connected0 =", myWS.isConnected());
    } catch (error: any) {
        console.log("Err1", error.message);
        process.exit(1);
    }

    // subscribe newHeads 
    console.log("subscribe newHeads...");
    const newHeadsSubscription = await myWS.subscribeNewHeads();
    console.log("subscribe newHead response =", newHeadsSubscription);
    if (!newHeadsSubscription) {
        throw new Error("newHead subscription failed");
    }
    newHeadsSubscription.on(function (newHead: BLOCK_HEADER) {
        console.log("newHead event =", newHead, newHead.block_number);
    });




    console.log("press a key to stop to wait messages.");
    await keypress();

    console.log("unsubscribe newHead...");
    const statusUnsubscribeNewHeads = await newHeadsSubscription.unsubscribe();
    console.log({ statusUnsubscribeNewHeads }); // true/false
    // const expectedId = myWS.subscriptions.get(WSSubscriptions.NEW_HEADS);
    //console.log("wait for newHeads unsubscribed , ID", expectedId, "...");
    // const subscriptionId = await myWS.waitForUnsubscription(newHeadsID); // to use if unsubscription occurred somewhere else in the code
    // console.log("Done for new Heads...", subscriptionId);


    console.log("Disconnect...");
    myWS.disconnect();
    // const resQuit4 = await myWS.waitForDisconnection();
    // console.log({ resQuit4 });
    console.log("After disconnect. Connected4 =", myWS.isConnected());


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


