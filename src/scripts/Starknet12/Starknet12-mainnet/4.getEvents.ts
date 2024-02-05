// recover events on a mainnet node, located in the local network
// use Starknet.js v5.9.1
// launch with npx ts-node src/scripts/mainnet/4.getEvents.ts

import { RpcProvider, hash, num } from 'starknet'
import { DAIaddress, USDCaddress, ethAddress } from '../../utils/constants';

async function main() {

    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060" }); // local network Juno Mainnet
    
    const keyFilter = [num.toHex(hash.starknetKeccak("Transfer"))]
    let block = await provider.getBlock('latest');
    console.log("bloc #", block.block_number);
    let continuationToken: string | undefined = "0";
    let chunkNum: number = 1;
    while (continuationToken) {
        const eventsRes = await provider.getEvents({
            from_block: {
                block_number: block.block_number - 1
            },
            to_block: {
                block_number: block.block_number
            },
            address: DAIaddress,
            keys: [keyFilter],
            chunk_size: 8,
            continuation_token: continuationToken === "0" ? undefined : continuationToken
        });
        const nbEvents = eventsRes.events.length;
        continuationToken = eventsRes.continuation_token;
        console.log("chunk nb =", chunkNum, ".", nbEvents, "events recovered.");
        console.log("continuation_token =", continuationToken);
        for (let i = 0; i < nbEvents; i++) {
            const event = eventsRes.events[i];
            console.log("event #", i, "data length =", event.data.length, "key length =", event.keys.length, ":");
            console.log("\nkeys =", event.keys, "data =", event.data)
        }
        chunkNum++;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

