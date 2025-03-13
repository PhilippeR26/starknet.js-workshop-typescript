
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/5.testWS08.ts
// Coded with Starknet.js v7 experimental

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
     const wsUrl = "ws://192.168.1.78:9545/rpc/v0_8";
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


    // subscribe transaction status
    const txStatusID = await myWS.subscribeTransactionStatus("0x7f0dce88163f6565139d677f86ded8c396b449ed098272c6b06c5d2bddeae43");
    console.log("subscribe TransactionStatus response =", txStatusID);
    if (!txStatusID) {
        throw new Error("TransactionStatus subscription failed");
    }
    // const txStatusID2 = await myWS.subscribeTransactionStatus("0xbff99a5621021b7954025192121b30efc4ea21a479931c088e905da37306f3");
    // console.log("subscribe TransactionStatus2 response =", txStatusID2);
    // if (!txStatusID2) {
    //     throw new Error("TransactionStatus2 subscription failed");
    // }


    const subscriptions = myWS.subscriptions;
    console.log({ subscriptions });
    console.log("get tx status =", myWS.subscriptions.get(WSSubscriptions.TRANSACTION_STATUS));



    console.log("press a key to stop to wait messages.");
    await keypress();

    const expectedId2 = myWS.subscriptions.get(WSSubscriptions.TRANSACTION_STATUS);
    console.log("Unsubscribe transactionStatus", expectedId2, "...");
    const statusTxStatus = await myWS.unsubscribeTransactionStatus();
    console.log({ statusTxStatus });
    const subscriptionId2 = await myWS.waitForUnsubscription(expectedId2);
    console.log("Done for transactionStatus...", subscriptionId2);



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


