// Test WebSocket Rpc providers (equivalent of 1.testRpcVersion, but for WS).
// launch with npx ts-node src/scripts/webSocket/10.testWSprovidersXXXXXXX.ts
// Coded with Starknet.js v10.6.4

import { shortString, WebSocketChannel } from "starknet";

import { LogC } from "../utils/logColors";
import * as dotenv from "dotenv";
import { alchemyKey } from "../../A-MainPriv/mainPriv";
import {
    equilibriumPathfinderTestnetWs,
    SNFnodeUrl,
    spaceShardJunoTestnetNodeWs,
    spaceShardPathfinderTestnetNodeWs,
} from "../../A1priv/A1priv";
import { DEVNET_PORT } from "../../constants";
dotenv.config({ quiet: true });

// Max time (ms) allowed to open the socket.
const CONNECTION_TIMEOUT = 10_000;
// Max time (ms) allowed to answer a request or a subscription.
const REQUEST_TIMEOUT = 15_000;

/** Rejects if the promise is not settled before `ms` milliseconds. */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(label + " timeout (" + ms + " ms)")), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timeoutId!);
    }
}

/**
 * Closes the channel, ignoring any error raised by the closure.
 * Some nodes (starknet-devnet) close the socket abnormally (code 1006) instead of doing
 * the close handshake : `waitForDisconnection()` then rejects with an ErrorEvent, which
 * has to be swallowed here - the disconnection is the expected result anyway.
 */
async function closeChannel(channel: WebSocketChannel): Promise<void> {
    try {
        channel.disconnect();
        await withTimeout(channel.waitForDisconnection(), CONNECTION_TIMEOUT, "disconnection");
    } catch {
        // nothing to do : the socket is closed or unusable.
    }
}

async function testWsProvider(wsUrl: string): Promise<string> {
    let result: string = LogC.fg.yellow + "*** " + wsUrl;
    // no auto-reconnect : a dead endpoint must fail fast, and must not keep the process alive.
    const channel = new WebSocketChannel({
        nodeUrl: wsUrl,
        autoReconnect: false,
        requestTimeout: REQUEST_TIMEOUT,
    });
    // without this listener, a socket error is reported by Node as an unhandled event.
    channel.on("error", () => { });

    try {
        await withTimeout(channel.waitForConnection(), CONNECTION_TIMEOUT, "connection");
    } catch (error: any) {
        await closeChannel(channel);
        return result + LogC.fg.red + "\nImpossible to connect to this WebSocket endpoint. " +
            (error?.message ?? "") + LogC.reset;
    }
    result = result + LogC.fg.green + "\nWebSocket connected." + LogC.reset;

    // A socket can be open without answering the Starknet RPC methods.
    try {
        const chainId = await channel.sendReceive<string>("starknet_chainId");
        result = result + "\nChain Id = " + shortString.decodeShortString(chainId);
    } catch (error: any) {
        result = result + LogC.fg.red + "\nNo answer to starknet_chainId. " +
            (error?.message ?? "") + LogC.reset;
    }

    try {
        const specVersion = await channel.sendReceive<string>("starknet_specVersion");
        result = result + "\nThis provider use a rpc version " + specVersion;
    } catch (error: any) {
        result = result + LogC.fg.red + "\nNo answer to starknet_specVersion. " +
            (error?.message ?? "") + LogC.reset;
    }

    // An endpoint exposing a wss:// address does not necessarily accept starknet_subscribe... requests.
    try {
        const sub = await channel.subscribeNewHeads();
        result = result + LogC.fg.green + "\nSubscriptions are supported (id " + sub.id + ")." + LogC.reset;
        await sub.unsubscribe();
    } catch (error: any) {
        result = result + LogC.fg.red + "\nSubscriptions are NOT supported. " +
            (error?.message ?? "") + LogC.reset;
    }

    await closeChannel(channel);
    return result;
}

async function main() {

    const localIP = "26";

    const listWsProvider = [

        // ************** local starknet-devnet : `/ws` path on the devnet port
        // 🚨 launch first : npx starknet-devnet --seed 0 --port 5150
        "ws://127.0.0.1:5050/ws",

        // ************** Sepolia testnet
        "wss://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/" + alchemyKey,
        "wss://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/" + alchemyKey,
        "wss://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
        equilibriumPathfinderTestnetWs,
        // my local Pathfinder (testnet) : same port as HTTP, but the path is mandatory
        "ws://192.168.1." + localIP + ":9545/rpc/v0_10",
        "wss://sepolia."+SNFnodeUrl+"/juno/ws/v0_10",

        // *************** Mainnet
        "wss://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/" + alchemyKey,
        "wss://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_9/" + alchemyKey,
        "wss://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
        // my local Juno (mainnet) : dedicated port, enabled with the `--ws` option (default port 6061)
        "ws://192.168.1." + localIP + ":6061/ws/v0_10",
        "wss://mainnet."+SNFnodeUrl+"/juno/ws/v0_10"
     ]

    for (const url of listWsProvider) {
        console.log(await testWsProvider(url) + "\n");
    }

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
