// get staking statistics (better if using your own node, because public nodes have strong limitations).
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-mainnet/1.scanStakers.ts
// Use Starknet.js v6.19.0

import { Account, Contract, json, constants, CallData, RpcProvider, hash, num, events, ParsedEvent, type CairoOption } from "starknet";
import fs from "fs";
// import { accountTestnet4privateKey, accountTestnet4Address } from "../../A1priv/A1priv";
// import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey, TonyNode } from "../../A2priv/A2priv";
import { EmittedEvent, Events } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
import { stakingAddressMainnet } from "../../utils/constants";
import type { NewStakerEvent, StakerInfo, StakerPoolInfo } from "../staking/type";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();


async function main() {
    // ***** Sepolia
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local

    // ***** mainnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });
    // mainnet :
    const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_7" }); //v0.7.0 local juno node mainnet
    console.log('✅ Connected.');

    // Connect the  contract  :
    const stakingSierra = myProvider.getClassAt(stakingAddressMainnet);
    const stakingContract = new Contract((await stakingSierra).abi, stakingAddressMainnet, myProvider);

    const currentBlock = await myProvider.getBlockNumber();
    console.log("bloc #", currentBlock);

    const keyFilter = [num.toHex(hash.starknetKeccak("NewStaker"))];
    const keys = [keyFilter];

    const startBlock = 926_062; // declaration of staking class 0x031578ba8535c5be427c03412d596fe17d3cecfc2b4a3040b841c009fe4ac5f5
    let continuationToken: string | undefined = "0";
    let chunkNum: number = 1;
    let eventsList: EmittedEvent[] = [];
    while (continuationToken) {
        const eventsRes = await myProvider.getEvents({
            from_block: {
                block_number: startBlock
            },
            to_block: {
                block_number: currentBlock
            },
            address: stakingAddressMainnet,
            keys: keys,
            chunk_size: 100,
            continuation_token: continuationToken === "0" ? undefined : continuationToken
        });
        const nbEvents = eventsRes.events.length;
        continuationToken = eventsRes.continuation_token;
        console.log("chunk nb =", chunkNum, ".", nbEvents, "events recovered.");
        console.log("continuation_token =", continuationToken);
        eventsList.push(...eventsRes.events);
        chunkNum++;
    }

    console.log("nb of events filtered", eventsList.length);
    console.log("last one=", eventsList[eventsList.length - 1]);

    const abiEvents = events.getAbiEvents(stakingContract.abi);
    const abiStructs = CallData.getAbiStruct(stakingContract.abi);
    const abiEnums = CallData.getAbiEnum(stakingContract.abi);
    const parsedEvents = events.parseEvents(eventsList, abiEvents, abiStructs, abiEnums);
    console.log('1st parsed event =', parsedEvents[0]);

    // get all stakers addresses
    const creationEvents: NewStakerEvent[] = parsedEvents.map((ev: ParsedEvent) => {
        const res: NewStakerEvent = ev['contracts::staking::interface::Events::NewStaker'] as NewStakerEvent;
        return res;
    });
    const stakersAddresses: bigint[] = creationEvents.map((ev: NewStakerEvent) => BigInt(ev.staker_address)).filter((obj, index, self) => index === self.findIndex((o) => o === obj));
    console.log(stakersAddresses, stakersAddresses.length);
    // get data from stakers
    const stakersData: CairoOption<StakerInfo>[] = await Promise.all(stakersAddresses.map(async (stakerAddr: bigint) => {
        const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(stakerAddr));
        return info6;
    }));
    console.log("Staker info =", stakersData[0], "\nPool info =", stakersData[0].unwrap()?.pool_info);
    // total Staked
    const totalOfStakers: bigint = stakersData.reduce((fri: bigint, currentOption: CairoOption<StakerInfo>) => {
        if (currentOption.isSome()) {
            return fri + BigInt((currentOption.unwrap() as StakerInfo).amount_own)
        } else { return fri }
    }, 0n);
    console.log("total STRK of stakers =", formatBalance(totalOfStakers, 18));

    const totalOfPools: bigint = stakersData.reduce((fri: bigint, currentOption: CairoOption<StakerInfo>) => {
        if (currentOption.isSome()) {
            const stakerData: StakerInfo = currentOption.unwrap() as StakerInfo;
            if (stakerData.pool_info.isSome()) {
                return fri + BigInt((stakerData.pool_info.unwrap() as StakerPoolInfo).amount)
            } else { return fri }

        } else { return fri }
    }, 0n);
    console.log("total STRK of pools =", formatBalance(totalOfPools, 18));
    console.log("total STRK staked =", formatBalance(totalOfStakers + totalOfPools, 18));


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
