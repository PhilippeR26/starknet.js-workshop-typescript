
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/8.testWSevents.ts
// Coded with Starknet.js v7.0.0-beta.3

import { cairo, Contract, constants, hash, num } from 'starknet';
import { json, WebSocketChannel, WSSubscriptions } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type SubscriptionEventsResponse } from "@starknet-io/types-js";
import { WebSocket } from "isows";
import { ethAddress, strkAddress } from "../utils/constants";
// import * as dotenv from "dotenv";
// dotenv.config();

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // pathfinder Testnet
    //const wsUrl = "ws://localhost:9545/rpc/v0_8";
    // juno Testnet
    const wsUrl = "ws://localhost:6071/ws/rpc/v0_8";
    const myWS = new WebSocketChannel({ nodeUrl: wsUrl });
    try {
        await myWS.waitForConnection();
        console.log("is WS connected =", myWS.isConnected());
    } catch (error: any) {
        console.log("E1", error.message);
        process.exit(1);
    }


    // subscribe events
    const ethSubscriptionID = await myWS.subscribeEvents(ethAddress);
    console.log("subscribe Events eth response =", ethSubscriptionID);
    const strkSubscriptionID = await myWS.subscribeEvents(strkAddress);
    console.log("subscribe Events strk response =", strkSubscriptionID);
    console.log("transfer=",num.toHex(hash.starknetKeccak("Transfer")));
    const strkSubscription2ID = await myWS.subscribeEvents(strkAddress,[[num.toHex(hash.starknetKeccak("Transfer"))]]);
    console.log("subscribe Events strk 2 response =", strkSubscription2ID);
    const subscriptions = myWS.subscriptions;
    console.log({ subscriptions });
    let counterEth: number = 0;
    let counterStrk: number = 0;
    let counter2Strk: number = 0;
    myWS.onEvents = function (txS: SubscriptionEventsResponse) {
        if (txS.subscription_id == ethSubscriptionID) {
            counterEth++;
            console.log("tx event ETH #", counterEth, "=", txS);
        }
        if (txS.subscription_id == strkSubscriptionID) {
            counterStrk++;
            console.log("tx event STRK #", counterStrk, "=", txS);
        }
        if (txS.subscription_id == strkSubscription2ID) {
            counter2Strk++;
            console.log("tx event 2 STRK #", counter2Strk, "=", txS);
        }
    }


    console.log("press a key to stop to wait messages.");
    await keypress();

    console.log({ subscriptions });
    const statusTxStatus0 = await myWS.unsubscribeEvents({fromAddress:strkAddress, keys: [[num.toHex(hash.starknetKeccak("Transfer"))]]});
    const subscriptions0 = myWS.subscriptions;
    console.log({ subscriptions0 });

    const statusTxStatus = await myWS.unsubscribeEvents();
    console.log({ statusTxStatus });
    const subscriptions2 = myWS.subscriptions;
    console.log({ subscriptions2 });

    // const subscriptionId2 = await myWS.waitForUnsubscription(expectedId2); // to use if unsubscription occurred somewhere else in the code
    // console.log("Done for Events...", subscriptionId2);



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


