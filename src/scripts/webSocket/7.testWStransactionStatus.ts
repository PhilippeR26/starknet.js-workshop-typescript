
// Test rpc 0.8 new websocket with Starknet.js.
// Launch with npx ts-node src/scripts/webSocket/7.testWStransactionStatus.ts
// Coded with Starknet.js v7.5.0 + experimental

import { json, WebSocketChannel } from "starknet";
import { formatBalance } from "../utils/formatBalance";
// import WebSocket from 'ws';
import { keypress, wait } from "../utils/utils";
import { SubscriptionNewHeadsResponse, type NEW_TXN_STATUS, type SubscriptionTransactionsStatusResponse } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

//        👇👇👇
// 🚨🚨🚨 launch first a Pathfinder/Juno node with webSocket activated.
//        👆👆👆

async function main() {
    // *** pathfinder Testnet
     const wsUrl = "ws://localhost:9545/rpc/v0_8";
    // *** pathfinder Spaceshard
    // const wsUrl = process.env.NEXT_PUBLIC_WS_PROVIDER ?? "";
    // *** juno Testnet
    // const wsUrl = "ws://localhost:6071/ws/rpc/v0_8";
    const myWS = new WebSocketChannel({ nodeUrl: wsUrl });
    try {
        await myWS.waitForConnection();
        console.log("is WS connected =", myWS.isConnected());
    } catch (error: any) {
        console.log("E1", error.message);
        process.exit(1);
    }


    // subscribe transaction status
    const tx1 = "0x7f0dce88163f6565139d677f86ded8c396b449ed098272c6b06c5d2bddeae43";
    const tx1SubscriptionID = await myWS.subscribeTransactionStatus(tx1);
    console.log("***subscribe TransactionStatus1 response =", tx1SubscriptionID);
    await wait(2000);

    const tx2 = "0x673d61f5a7d94ab378af127e53eec82603be9c00de7201558abbcde12ee3118";
    const tx2SubscriptionID = await myWS.subscribeTransactionStatus(tx2);
    console.log("***subscribe TransactionStatus2 response =", tx2SubscriptionID);
    await wait(2000);

    const tx3SubscriptionID = await myWS.subscribeTransactionStatus("0x260b26e71896d78641fbcdcb84d1fb496481af395805f5f1777245c7602039f");
    console.log("***subscribe TransactionStatus3 response =", tx3SubscriptionID);
    await wait(2000);


    let counterTx1: number = 0;
    let counterTx2: number = 0;
    let counterTx3: number = 0;
    tx1SubscriptionID.on((txS: NEW_TXN_STATUS) => {
        counterTx1++;
        console.log("***: txID1", counterTx1, "=", txS);
    }
    );
tx2SubscriptionID.on((txS: NEW_TXN_STATUS) => {
        counterTx2++;
        console.log("***: txID2", counterTx2, "=", txS);
    }
    );
tx3SubscriptionID.on((txS: NEW_TXN_STATUS) => {
        counterTx3++;
        console.log("***: txID3", counterTx3, "=", txS);
    }
    );

    console.log("press a key to stop to wait messages.");
    // await keypress();
     await wait(5000);
    // console.log("Unsubscribe transactionStatus 2 ...");
    // const statusTxStatus2 = await myWS.unsubscribe(tx1SubscriptionID);
    // console.log({ statusTxStatus2 });
    // const subscriptions2 = myWS.subscriptions;
    // console.log({ subscriptions2 });
    // const statusTxStatus2b = await myWS.unsubscribe(tx2SubscriptionID);
    // console.log({ statusTxStatus2b });
    // const subscriptions2b = myWS.subscriptions;
    // console.log({ subscriptions2b });

    console.log("unsubscribe all ()...");
    const statusTxStatus3 = await tx1SubscriptionID.unsubscribe();
    console.log({ statusTxStatus3 });
    const statusTxStatus4 = await tx2SubscriptionID.unsubscribe();
    const statusTxStatus5 = await tx3SubscriptionID.unsubscribe();

    // const st=await myWS.unsubscribe(tx2SubscriptionID);
    // console.log({st});



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
