
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/8.testWSevents.ts
// Coded with Starknet.js v7.5.0 + experimental

import { cairo, Contract, constants, hash, num, type Subscription } from 'starknet';
import { json, WebSocketChannel } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type EMITTED_EVENT, type SubscriptionEventsResponse } from "@starknet-io/types-js";
import { WebSocket } from "isows";
import { ethAddress, strkAddress } from "../utils/constants";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // *** pathfinder Testnet
    const wsUrl = "ws://localhost:9545/rpc/v0_8";
    // const wsUrl = process.env.NEXT_PUBLIC_WS_PROVIDER ?? "";
    // *** juno Testnet
    // const wsUrl = "ws://localhost:6071/ws/rpc/v0_8";
    console.log("wsUrl =", wsUrl);
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
    console.log("transfer=", num.toHex(hash.starknetKeccak("Transfer")));
    const strkSubscription2ID: Subscription = await myWS.subscribeEvents(strkAddress, [[num.toHex(hash.starknetKeccak("Transfer"))]]);
    console.log("subscribe Events strk 2 response =", strkSubscription2ID);
    let counterEth: number = 0;
    let counterStrk: number = 0;
    let counter2Strk: number = 0;
    ethSubscriptionID.on(function (txS: EMITTED_EVENT) {
        counterEth++;
        console.log("tx event ETH #", counterEth, "=", txS);
    }
    );
    strkSubscriptionID.on(function (txS: EMITTED_EVENT) {
        counterStrk++;
        console.log("tx event STRK #", counterStrk, "=", txS);
    }
    );
    strkSubscription2ID.on(function (txS: EMITTED_EVENT) {
        counter2Strk++;
        console.log("tx event 2 STRK #", counter2Strk, "=", txS);
    }
    );



    console.log("press a key to stop to wait messages.");
    await keypress();

    console.log("Unsubscribe...");
    await ethSubscriptionID.unsubscribe();
    await strkSubscriptionID.unsubscribe();
    await strkSubscription2ID.unsubscribe();

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


