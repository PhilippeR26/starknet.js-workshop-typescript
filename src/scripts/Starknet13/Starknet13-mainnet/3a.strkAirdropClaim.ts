// Verify the status of your account for the STRK airdrop.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-mainnet/3.strkAirdrop.ts
// Coded with Starknet.js v6.1.2

import { Contract, shortString, RpcProvider, hash, json, type BigNumberish, type Uint256, num, type CairoCustomEnum, Account, cairo, type Invocations, TransactionType } from "starknet";
import { account2BraavosMainnetAddress, account2BraavosMainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import fs from "fs";
import axios from "axios";

//        👇👇👇
// 🚨🚨🚨 First, download the 10 files from https://github.com/starknet-io/provisions-data/tree/main/starknet
//        👆👆👆

type ClaimDatabase = {
    identity: BigNumberish,
    amount: BigNumberish, // STRK
    merkle_index: BigNumberish,
    merkle_path_len: BigNumberish,
    merkle_path: BigNumberish[]
}
type ClaimDataCall = {
    identity: BigNumberish,
    balance: Uint256, // FRI
    index: BigNumberish,
    merkle_path: BigNumberish[]
}

async function main() {
    // mainnet
    const nodeUrl = "https://free-rpc.nethermind.io/mainnet-juno/v0_6";
    const provider = new RpcProvider({ nodeUrl });
    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    // adapt the account address to your case 👇👇👇
    // hex address, 64 lowercase characters with 0x prefix

    const myStarknetAccountAddress = "0x05b520e60a961523f5c125d178dff557f7206cfc49106bd15bb68d29da907da7";
    // 0x05b520e60a961523f5c125d178dff557f7206cfc49106bd15bb68d29da907da7
    // 0x004eba3c292ca3980fc9b995b05246e50bb5b90740bc6004f2e1d0dd28fa3803
    let airdropAddress: BigNumberish = "0x00";
    let airdropType: string | undefined;
    let myClaim: ClaimDataCall | undefined;
    for (let fileId = 6; fileId < 11; fileId++) {
        console.log("search in file", fileId, "in progress...");
        // adapt the path to your case 👇👇👇
        const fileContent = json.parse(fs.readFileSync("./src/scripts/Starknet13/Starknet13-mainnet/airdrop/starknet-" + fileId.toString() + ".json").toString("ascii"));
        airdropAddress = fileContent.contract_address;
        airdropType = fileContent.type;
        const list: ClaimDatabase[] = fileContent.eligibles;
        const result: ClaimDatabase | undefined = list.find((claim) => claim.identity == myStarknetAccountAddress);
        if (!!result) {
            myClaim = {
                identity: result.identity,
                balance: cairo.uint256( BigInt(result.amount)*10n**18n) ,
                index: result.merkle_index,
                merkle_path: result.merkle_path
            };
            break;
        }
    }
    if (myClaim) {
        console.log("Airdrop for :", airdropType);
        console.log({ myClaim });
        const airdropSierraAbi = json.parse(fs.readFileSync("./compiledContracts/cairo253/strkAirdrop.abi.json").toString("ascii"));
        const airdropContract = new Contract(airdropSierraAbi, num.toHex(airdropAddress), provider);
        const result: CairoCustomEnum = await airdropContract.is_claimable(myClaim);
        console.log("Status of your Starknet account =", result.activeVariant());
        const myAccount = new Account(provider, account2BraavosMainnetAddress, account2BraavosMainnetPrivateKey);
        airdropContract.connect(myAccount);
        const claimCall = airdropContract.populate("claim", {
            claim_data: myClaim
        });
        console.log({ claimCallData: claimCall });
        //const result1 = await myAccount.execute(claimCallData);
        // console.log("txH =", result1.transaction_hash);
        // const txR = await provider.waitForTransaction(result1.transaction_hash);
        // console.log({ txR });
        const invocation1: Invocations = [
            {
                type: TransactionType.INVOKE,
                ...claimCall
            },
        ];
        const result1 = await myAccount.simulateTransaction(invocation1)as any;
        console.log( "result simulate =",result1 );
        console.log("trace=",result1[0].transaction_trace)
        console.log("trace calls =",result1[0].transaction_trace.execute_invocation)
    }
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });