// test Websocket subscription in local network Pathfinder Mainnet
// launch with npx ts-node 
// Coded with Starknet.js v5.20.0

import { constants, Provider, Contract, Account, json, shortString, RpcProvider, SequencerProvider } from "starknet";
import { WebSocket } from "ws";
import fs from "fs";
import { account1Testnet2ArgentXAddress, account1Testnet2ArgentXprivateKey, TonyNode } from "../../A2priv/A2priv";
import { account2TestnetAddress, account2TestnetPrivateKey, junoNMtestnet } from "../../A1priv/A1priv";
import { account4MainnetAddress, account4MainnetPrivateKey, infuraKey, alchemyKey, blastKey, lavaMainnetKey, junoNMmainnet } from "../../A-MainPriv/mainPriv";
import { junoNMtestnet2 } from "../../A2priv/A2priv";

function wait(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

async function main() {
    //initialize Provider 

    // *** Mainnet ***
    // Infura node rpc for Mainnet :
    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.infura.io/v3/' + infuraKey });
    // Blast node rpc for mainnet :
    //const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.blastapi.io/' + blastKey + "/rpc/v0.4" });
    //const provider = new RpcProvider({ nodeUrl: "https://g.w.lavanet.xyz:443/gateway/strk/rpc-http/"+lavaMainnetKey});
    // Nethermind Juno node rpc for Mainnet (only whitelisted access) :
    //const provider = new RpcProvider({ nodeUrl: junoNMmainnet });
    // alchemy
    //const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.g.alchemy.com/v2/' + alchemyKey });
    // mainnet sequencer (soon deprecated) :
    //const provider = new SequencerProvider({ network: constants.NetworkName.SN_MAIN });
    // my personal local Pathfinder node
    const provider = new RpcProvider({ nodeUrl: 'http://192.168.1.99:9545/rpc/v0.4' });

    const wsClient = new WebSocket("ws://192.168.1.99:6080");

    // initialize existing Argent X account

    const account0Address = account4MainnetAddress;
    const account0PrivKey = account4MainnetPrivateKey;

    console.log('existing_ACCOUNT_ADDRESS=', account0Address);
    const account0 = new Account(provider, account0Address, account0PrivKey);
    console.log('existing account connected.\n');

    // Mainnet 
    // console.log(await wsClient.listMethods());
    // await wsClient.subscribe("pathfinder_subscribe_newHeads");
    // console.log("Start.");
    let count: number = 2;
    // wsClient.on("open",async ()=>{
    //     await wsClient.subscribe("newHeads");                
    // });
    // while (!count){
    //     wsClient.on("pathfinder_subscription_newHead",(block)=>{
    //         console.log("block #",count,block);
    //         count--;
    //     })
    // }
    // await wsClient.unsubscribe("newHeads");
    // await wsClient.close();

    // with call
    count = 2;
    wsClient.on("open", async () => {
        wsClient.send("pathfinder_subscribe_newHeads");
    });
    wsClient.on("newHead", (block) => {
        console.log("block #", count, block);
        count--;
    });
    while (!count) {

        wait(5000);
        console.log("retest.")
    }
    wsClient.send("pathfinder_unsubscribe_newHeads");;
    wsClient.close();

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });