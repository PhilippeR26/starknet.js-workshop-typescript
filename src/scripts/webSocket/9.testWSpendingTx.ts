
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/9.testWSpendingTx.ts
// Coded with Starknet.js v7.5.0 + experimental

import { json, WebSocketChannel, type TXN_HASH } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type SubscriptionEventsResponse, type SubscriptionPendingTransactionsResponse, type TXN_WITH_HASH } from "@starknet-io/types-js";
import { WebSocket } from "isows";
import { strkAddress } from "../utils/constants";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // *** pathfinder Testnet
    const wsUrl = "ws://localhost:9545/rpc/v0_9";
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


    // subscribe pending tx
    const txStatusID = await myWS.subscribeNewTransactions({finalityStatus:["PRE_CONFIRMED"]});
    console.log("subscribe pending tx response =", txStatusID);
    if (!txStatusID) {
        throw new Error("pending tx subscription failed");
    }

     // console.log("get tx status =", myWS.subscriptions.get(WSSubscriptions.PENDING_TRANSACTION));

    let i: number = 0;
    txStatusID.on (function (pendingTx: TXN_HASH | TXN_WITH_HASH) {
        i++
        console.log("pending tx", i, "=", pendingTx);
    }
)


    console.log("press a key to stop to wait messages.");
    await keypress();

     console.log("Unsubscribe pending tx...");
    const statusTxStatus = await txStatusID.unsubscribe();
    console.log({ statusTxStatus });


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


