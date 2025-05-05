// Deploy a new braavos 1.2.0 account in Sepolia Testnet, using rpc0.7.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/5.createNewBraavos120AccountRpc7.ts
// Use Starknet.js v7.1.0.
// 🚨🚨🚨 Do not work (Rpc07 V1 & V3 signature not accepted by Braavos contract)

import { Account, cairo, CallData, config, Contract, ec, ETransactionVersion, hash, json, logger, num, RpcProvider, shortString, stark, type BigNumberish } from "starknet";
import { calculateAddressBraavos, deployBraavosAccount, estimateBraavosAccountDeployFee } from "../../braavos/3f.deployBraavos120v3rpc0708";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { ethAddress, strkAddress } from "../../utils/constants";

import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { wait } from "../../utils/utils";
dotenv.config();


async function main() {
    // *** Devnet 0.3.0 forked from Sepolia testnet
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    // }
    // *** Sepolia testnet
     const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7", specVersion: "0.7" });
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8", specVersion: "0.8" });
    //  const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" }); // juno testnet local

    logger.setLogLevel("ERROR");
    config.set("legacyMode", true);
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Sepolia testnet.");

    // *** initialize existing predeployed account 0 of Devnet
    // const accData = await l2DevnetProvider.getPredeployedAccounts();
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;
    // **** Sepolia
    const accountAddress0 = account1OZSepoliaAddress;
    const privateKey0 = account1OZSepoliaPrivateKey;
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log('Deployed account connected.\n');

    // Calculate future address of the Braavos account
    const privateKeyBraavosBase = stark.randomAddress();
    // const privateKeyBraavosBase = "0x056d8c018b779d059302e5ab6969b3dd61df19f448ecd1e95c37868a40bd1294";
    console.log('New Braavos_account :');
    console.log('Braavos account Private Key =', privateKeyBraavosBase);
    const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
    console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);
    const accountBraavosAddress = calculateAddressBraavos(privateKeyBraavosBase);
    console.log('Braavos account calculated address  =', accountBraavosAddress);


    // *** Devnet - fund account address before account creation
    // await l2DevnetProvider.mint(accountBraavosAddress, 10n * 10n ** 18n, "WEI");
    // await l2DevnetProvider.mint(accountBraavosAddress, 100n * 10n ** 18n, "FRI");


    // *** Sepolia Testnet - fund account address before account creation
    // fund account address before account creation  
    const strkFee = 5n * 10n ** 17n;
    const ethFee = 1n * 10n ** 16n;
    const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
    const strkContract = new Contract(erc20Sierra.abi, strkAddress, account0);
    const ethContract = new Contract(erc20Sierra.abi, ethAddress, account0);
    const strkCall = strkContract.populate("transfer",
        {
            recipient: accountBraavosAddress,
            amount: cairo.uint256(strkFee),
        });
    const ethCall = ethContract.populate("transfer",
        {
            recipient: accountBraavosAddress,
            amount: cairo.uint256(ethFee),
        });
    // const res = await account0.execute(strkCall);
     const res = await account0.execute(ethCall);
     await myProvider.waitForTransaction(res.transaction_hash);
    // console.log("Transferred 0.5 STRK");
     console.log("Transferred 0.01 ETH");

    // deploy Braavos account
     const respDeploy = await deployBraavosAccount(privateKeyBraavosBase, myProvider, undefined,ETransactionVersion.V2);
    // const respDeploy = await deployBraavosAccount(privateKeyBraavosBase, myProvider, undefined, ETransactionVersion.V3);
    console.log("Account deployed.");
    const txR = await myProvider.waitForTransaction(respDeploy.transaction_hash);
    console.log("Transaction receipt success =", txR.isSuccess());
    const accountBraavos = new Account(myProvider, respDeploy.contract_address, privateKeyBraavosBase);
    console.log('✅ Braavos 1.2.0 account deployed at', respDeploy.contract_address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// Sepolia txH of deploy from wallet: 0x51367ad2d2198b878e51f8271002503076e94b07b55823186dc5dfb97e63be6
