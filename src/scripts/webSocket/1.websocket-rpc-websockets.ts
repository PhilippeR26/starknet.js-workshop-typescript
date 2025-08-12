// test Websocket subscription in local network Pathfinder Mainnet
// launch with npx ts-node 
// Coded with Starknet.js v5.20.0

import { constants, Provider, Contract, Account, json, shortString, RpcProvider } from "starknet";
import { Client as websocketClient } from "rpc-websockets";

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

     const wsClient = new websocketClient("ws://192.168.1.34:9545");
    // const wsClient = new websocketClient("ws://192.168.1.11:6071");

    // Mainnet 
    console.log(await wsClient.listMethods());
    await wsClient.subscribe("pathfinder_subscribe_newHeads");
    console.log("Start.");
    // wsClient.on("pathfinder_subscribe_newHeads", function () { console.log("Trigger newHeads.") });
    // wait(3 * 60 * 1000); // 3 minutes
    // console.log("End.");
    // await wsClient.unsubscribe("pathfinder_subscribe_newHeads");
    let count:number=2;
    wsClient.on("open",async ()=>{
        await wsClient.subscribe("newHeads");                
    });
    while (!count){
        wsClient.on("pathfinder_subscription_newHead",(block)=>{
            console.log("block #",count,block);
            count--;
        })
    }
    await wsClient.unsubscribe("newHeads");
    await wsClient.close();

    // with call
    count=2;
    wsClient.on("open",async ()=>{
        await wsClient.call("pathfinder_subscribe_newHeads");                
    });
    while (!count){
        wsClient.on("pathfinder_subscription_newHead",(block)=>{
            console.log("block #",count,block);
            count--;
        })
    }
    await wsClient.call("pathfinder_unsubscribe_newHeads"); ;
    await wsClient.close();

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });