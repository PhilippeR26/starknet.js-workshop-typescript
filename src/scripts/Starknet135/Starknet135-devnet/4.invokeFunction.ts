// Test provider.invokeFunction (only rpc0.8), to use an external signature.
// launch with npx ts-node src/scripts/Starknet135/Starknet135-devnet/4.invokeFunction.ts
// Coded with Starknet.js v7.3.0 & Devnet v0.4.1 & starknet-devnet.js v0.4.0

import { constants, Contract, Account, json, shortString, RpcProvider,  type InvocationsSignerDetails, type Invocation, Signer, type Call, type InvocationsDetailsWithNonce, transaction, type Calldata } from "starknet";
import fs from "fs";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();


async function main() {
    // initialize Provider 
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }

    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Devnet.");

    // *** Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const accountAddress1 = accData[1].address;
    const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account1OZSepoliaAddress;
    // const privateKey0 = account1OZSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    const account0Signer = new Signer(privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const contractETH = new Contract(compiledERC20.abi, ethAddress, myProvider);
    const contractSTRK = new Contract(compiledERC20.abi, strkAddress, myProvider);
    const initialEth = await contractETH.balanceOf(account0.address) as bigint;
    const initialStrk = await contractSTRK.balanceOf(account0.address) as bigint;

    // estimate tx
    const myCall: Call = contractETH.populate("transfer", [accountAddress1, 1n * 10n ** 12n]);

    const estimateFees = await account0.estimateFee(myCall);
    const details: InvocationsSignerDetails = {
        resourceBounds: estimateFees.resourceBounds,
        walletAddress: account0.address,
        nonce: await account0.getNonce(),
        version: "0x3",
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        tip: 0,
        paymasterData: [],
        accountDeploymentData: [],
        nonceDataAvailabilityMode: "L1",
        feeDataAvailabilityMode: "L1",
        cairoVersion: "1",
        skipValidate: true,
    };

    // signature can come from a fronted using a hardware wallet (Ledger Nano, ...) :
    const signature = await account0Signer.signTransaction([myCall], details);

    const calldataTx: Calldata = transaction.getExecuteCalldata([myCall], "1");
    const functionInvocation: Invocation = { 
        signature, 
        ...myCall, 
        contractAddress: account0.address, 
        calldata: calldataTx 
    };
    const detailsInvoke: InvocationsDetailsWithNonce = {
        nonce: details.nonce,
        version: details.version,
        resourceBounds: details.resourceBounds,
        tip: details.tip,
        paymasterData: details.paymasterData,
        accountDeploymentData: details.accountDeploymentData,
        nonceDataAvailabilityMode: details.nonceDataAvailabilityMode,
        feeDataAvailabilityMode: details.feeDataAvailabilityMode,
    };
   const resp = await myProvider.invokeFunction(functionInvocation, detailsInvoke);
    console.log("resp=", resp);
    await myProvider.waitForTransaction(resp.transaction_hash);

    const finalEth = await contractETH.balanceOf(account0.address);
    const finalStrk = await contractSTRK.balanceOf(account0.address);
    console.log("Reduction of ETH balance =", formatBalance(initialEth - finalEth, 18));
    console.log("Reduction of STRK balance =", formatBalance(initialStrk - finalStrk, 18));

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });