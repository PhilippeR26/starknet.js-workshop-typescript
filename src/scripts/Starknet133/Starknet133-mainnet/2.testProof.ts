// Test a contract about proof
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-mainnet/2.testProof.ts
// Use Starknet.js v6.24.0

import { Account, Contract, json, constants, CallData, RpcProvider, hash, num, events, ParsedEvent, type CairoOption, shortString } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account2BraavosMainnetAddress } from "../../../A-MainPriv/mainPriv";
dotenv.config();


async function main() {
    // ***** Sepolia
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local

    // ***** mainnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });
    const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7" });
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_7" }); //v0.7.0 local juno node mainnet
    console.log('✅ Connected.');

    // Connect the  contract  :
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Mainnet");

    // *** Devnet-rs 
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // *** initialize existing Argent X mainnet  account
    const accountAddress0 = account2BraavosMainnetAddress
    const privateKey0 = account2BraavosMainnetAddress;
    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account0OZSepoliaAddress;
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account1IntegrationOZaddress;
    // const privateKey0 = account1IntegrationOZprivateKey;
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS =', accountAddress0);
    console.log('existing account connected.\n');

    // *** test
    const proofAddress = "0x03ff7ac09c7301c7cdff4e07e0da6b0efd736e3b5506294a06bc85bb6735a95b";
    const proofSierra = await myProvider.getClassAt(proofAddress);
    const proofContract = new Contract(proofSierra.abi, proofAddress, myProvider);
    const myCall = proofContract.populate("verify_proof", {
        proof: { // reclaim::reclaim::Proof
            claim_info: { // reclaim::reclaim::ClaimInfo
                provider: "pr1", // "core::byte_array::ByteArray"
                parameters: "param1", // "core::byte_array::ByteArray"
                context: "con", // "core::byte_array::ByteArray"
            },
            signed_claim: { // reclaim::reclaim::SignedClaim
                claim: { // reclaim::reclaim::CompleteClaimData
                    identifier: 0, // "core::integer::u256"
                    byte_identifier: "test1", // core::byte_array::ByteArray"
                    owner: "owner1", // "core::byte_array::ByteArray"
                    epoch: "abc", // "core::byte_array::ByteArray"
                    timestamp_s: "time", // "core::byte_array::ByteArray"
                },
                signatures: [// core::array::Array::<reclaim::reclaim::ReclaimSignature>
                    {
                        r: 0, // core::integer::u256
                        s: 0, // core::integer::u256
                        v: 0, // core::integer::u32
                    }
                ],
            },
        },
    }
    );
    console.log(myCall);
    const res = await account0.execute(myCall);
    console.log(res);
    const txR = await myProvider.waitForTransaction(res.transaction_hash);
    console.log(txR);


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
