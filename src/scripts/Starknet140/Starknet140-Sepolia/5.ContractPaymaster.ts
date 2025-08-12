// Test  paymaster in Contract instance.
// launch with npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/5.ContractPaymaster.ts
// Coded with Starknet.js v8.1.2 +experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, type Call, BlockTag, PaymasterRpc, cairo, type PaymasterDetails, type PaymasterFeeEstimate } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
dotenv.config();




async function main() {
    // initialize Provider 
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" , blockIdentifier: BlockTag.PRE_CONFIRMED, }); // only starknet-devnet
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    // }

    // const url = "http://192.168.1.34:9545/rpc/v0_9"; // local Pathfinder Testnet node (Starlink network)
    // const url = "http://localhost:9545/rpc/v0_9";
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // my local Juno Sepolia Testnet node (Starlink network)
    // const url = "http://localhost:6070/rpc/v0_9";
    const url = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"; // Public Blast Pathfinder testnet
    // const url = equilibriumPathfinderTestnetUrl; // Pathfinder testnet from Equilibrium team
    // const url = spaceShardPathfinderTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team
    // const url = spaceShardJunoTestnetNodeUrl; // private Pathfinder testnet from SpaceShard team
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0
    const myProvider = new RpcProvider({
        nodeUrl: url,
    });

    // Check that communication with provider is OK
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet.");

    //process.exit(5);
    // *** Devnet
    // const accData = await l2DevnetProvider.getPredeployedAccounts();
    // // *** initialize existing predeployed account 0 of Devnet
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;


    // *** initialize existing Sepolia Testnet account
    const accountAddress0 = account2TestBraavosSepoliaAddress;
    const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const myPaymaster = new PaymasterRpc({ nodeUrl: "https://sepolia.paymaster.avnu.fi", });

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0, paymaster: myPaymaster });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // ********** main
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/STRK.sierra.json").toString("ascii"));

    const myTestContract = new Contract({ abi: compiledSierra.abi, address: strkAddress, providerOrAccount: account0 });

    // ********** transactions with paymaster
    console.log("Transaction in progress...");
    const myCall: Call = myTestContract.populate("transfer", [account1OZSepoliaAddress, cairo.uint256(300)]);
    const gasToken = '0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080'; // USDC in Testnet
    const feesDetails: PaymasterDetails = {
        feeMode: { mode: 'default', gasToken },
    };
    const feeEstimation = await account0.estimatePaymasterTransactionFee([myCall], feesDetails);
    // ask here to the user to accept this fee

    // normal paymaster (in Account)
    console.log("transfer0...");
    const res0 = await account0.executePaymasterTransaction(
        [myCall],
        feesDetails,
        feeEstimation.suggested_max_fee_in_gas_token
    );
    const txR0 = await myProvider.waitForTransaction(res0.transaction_hash);
    console.log(txR0);

    // estimate paymaster in Contract
    const estim = (await myTestContract.estimate("transfer", [account1OZSepoliaAddress, cairo.uint256(100)], {
        paymasterDetails: feesDetails,
    })) as PaymasterFeeEstimate;
    console.log(estim);

    // paymaster invoke in Contract
    console.log("transfer1...");
    const res1 = await myTestContract.invoke("transfer", [account1OZSepoliaAddress, cairo.uint256(200)], {
        paymasterDetails: feesDetails,
        maxFeeInGasToken: 2n * 10n ** 5n,
    });
    const txR1 = await myProvider.waitForTransaction(res1.transaction_hash);
    console.log(txR1);

    // paymaster transaction in Contract
    console.log("transfer2...");
    const res2 = await myTestContract.withOptions({
        paymasterDetails: feesDetails,
        maxFeeInGasToken: 2n * 10n ** 8n,
    }).transfer(account1OZSepoliaAddress, cairo.uint256(400));
    const txR2 = await myProvider.waitForTransaction(res2.transaction_hash);
    console.log(txR2);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });