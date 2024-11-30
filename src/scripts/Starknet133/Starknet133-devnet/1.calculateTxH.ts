// Verify the status of your account for the STRK airdrop.
// launch with npx ts-node src/scripts/Starknet133/Starknet133-sepolia/1.providerSimulate.ts
// Coded with Starknet.js v6.17.0

import { Contract, shortString, RpcProvider, Account, type Invocations, TransactionType, AccountInvocations, AccountInvocationItem, AllowArray, Call, UniversalDetails, num, stark, InvocationsSignerDetails, Signer, V2InvocationsSignerDetails, V3InvocationsSignerDetails, hash, transaction } from "starknet";
import { account2BraavosMainnetAddress, account2BraavosMainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import fs from "fs";
import axios from "axios";
import { strkSierra } from "../staking/constants";
import { strkAddress } from "../../utils/constants";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress } from "../../../A1priv/A1priv";
import { ETransactionVersion, ETransactionVersion2, ETransactionVersion3 } from "starknet-types-07";
import { DevnetProvider } from "starknet-devnet";


class SpecialAccount extends Account {
    public async calculateTxH(
        transactions: AllowArray<Call>,
        transactionsDetail: UniversalDetails = {}
    ): Promise<string> {
        const details = transactionsDetail;
        const calls = Array.isArray(transactions) ? transactions : [transactions];
        const nonce = num.toBigInt(details.nonce ?? (await this.getNonce()));
        const version = stark.toTransactionVersion(
            this.getPreferredVersion(ETransactionVersion.V1, ETransactionVersion.V3), // TODO: does this depend on cairo version ?
            details.version
        );
        const estimate = await this.getUniversalSuggestedFee(
            version,
            { type: TransactionType.INVOKE, payload: transactions },
            {
                ...details,
                version,
            }
        );
        const chainId = await this.getChainId();
        const signerDetails: InvocationsSignerDetails = {
            ...stark.v3Details(details),
            resourceBounds: estimate.resourceBounds,
            walletAddress: this.address,
            nonce,
            maxFee: estimate.maxFee,
            version,
            chainId,
            cairoVersion: await this.getCairoVersion(),
        };
        const compiledCalldata = transaction.getExecuteCalldata(calls, signerDetails.cairoVersion);
        if (Object.values(ETransactionVersion2).includes(signerDetails.version as any)) {
            const det = signerDetails as V2InvocationsSignerDetails;
            return hash.calculateInvokeTransactionHash({
                ...det,
                senderAddress: det.walletAddress,
                compiledCalldata,
                version: det.version,
            });
        } else if (Object.values(ETransactionVersion3).includes(signerDetails.version as any)) {
            const det = signerDetails as V3InvocationsSignerDetails;
            return hash.calculateInvokeTransactionHash({
                ...det,
                senderAddress: det.walletAddress,
                compiledCalldata,
                version: det.version,
                nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
                feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
            });
        } else {
            throw Error('unsupported signTransaction version');
        }
    }
}

async function main() {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    // ****  Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
    // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node

    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet");

    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;
    // **** Sepolia
    // const accountAddress0 = account1TestBraavosSepoliaAddress;
    // const privateKey0 = account1TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    const accountAddress2 = accData[2].address;

    const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);



    const myCall = strkContract.populate("transfer", {
        recipient: accountAddress2,
        amount: 100,
    });
    console.log({ myCall });

    const specialAccount = new SpecialAccount(myProvider, accountAddress0, privateKey0);
    const txH: string = await specialAccount.calculateTxH(myCall);
    console.log({ txH });

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });