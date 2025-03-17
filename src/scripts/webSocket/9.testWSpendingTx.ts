
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/9.testWSpendingTx.ts
// Coded with Starknet.js v7.0.0-beta.3

import { json, WebSocketChannel, WSSubscriptions } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type SubscriptionEventsResponse, type SubscriptionPendingTransactionsResponse } from "@starknet-io/types-js";
import { WebSocket } from "isows";
import { strkAddress } from "../utils/constants";
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
        console.log("is WS connected =", myWS.isConnected());
    } catch (error: any) {
        console.log("E1", error.message);
        process.exit(1);
    }


    // subscribe pending tx
    const txStatusID = await myWS.subscribePendingTransaction();
    console.log("subscribe pending tx response =", txStatusID);
    if (!txStatusID) {
        throw new Error("pending tx subscription failed");
    }

    const subscriptions = myWS.subscriptions;
    console.log({ subscriptions });
    console.log("get tx status =", myWS.subscriptions.get(WSSubscriptions.PENDING_TRANSACTION));

    let i: number = 0;
    myWS.onPendingTransaction = function (pendingTx: SubscriptionPendingTransactionsResponse) {
        i++
        console.log("pending tx event", i, "=", pendingTx);
    }


    console.log("press a key to stop to wait messages.");
    await keypress();

    const expectedId2 = myWS.subscriptions.get(WSSubscriptions.PENDING_TRANSACTION);
    console.log("Unsubscribe pending tx", expectedId2, "...");
    const statusTxStatus = await myWS.unsubscribePendingTransaction();
    console.log({ statusTxStatus });
    // const subscriptionId2 = await myWS.waitForUnsubscription(expectedId2); // to use if unsubscription occurred somewhere else in the code
    // console.log("Done for pending tx...", subscriptionId2);



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


