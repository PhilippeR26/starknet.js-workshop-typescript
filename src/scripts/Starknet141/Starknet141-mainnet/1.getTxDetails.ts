// Get the transaction Report of a transaction hash.
// 
// launch with npx ts-node src/scripts/Starknet141/Starknet141-mainnet/1.getTxDetails.ts
// Coded with Starknet.js v10.0.0


import { Provider, RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, Call, cairo, shortString, CairoCustomEnum, type BigNumberish, BlockTag, CairoBytes31, config, type EstimateFeeResponseOverhead, constants } from "starknet";
import devnetProvider, { DevnetProvider } from "starknet-devnet";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, chainStackTestnet } from "../../../A1priv/A1priv";
import { account1BraavosMainnetAddress, account1BraavosMainnetPrivateKey, alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account2IntegrationAXaddress, account2IntegrationAXprivateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey, account4IntegrationOZ20address, account4IntegrationOZ20privateKey, account5IntegrationOZ20address, account5IntegrationOZ20privateKey, accountIntegrationAdrienAddress, accountIntegrationAdrienPrivateKey, AdrienIntegrationUrl, equilibriumPathfinderIntegrationUrl } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config({ quiet: true });


//          👇👇👇
// 🚨🚨🚨   If nzecessary, launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆

async function main() {
    // *** devnet
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });

    // *** Sepolia
     const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia Testnet node (Freebox)
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 

    // *** Mainnet
   // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Mainnet

    // *** Paradex
    // const myProvider = new RpcProvider({ nodeUrl: "https://rpc.api.prod.paradex.trade/rpc/v0_9"  }); // Paradex mainnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://rpc.api.testnet.paradex.trade/rpc/v0_9"  }); // Paradex testnet 

    // *** integration Sepolia
    //const myProvider = new RpcProvider({ nodeUrl: equilibriumPathfinderIntegrationUrl }); // Integration Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node (Freebox)
    // const myProvider = new RpcProvider({ nodeUrl: AdrienIntegrationUrl }); // Adrien Integration Sepolia node

    const bl = await myProvider.getBlockWithTxHashes();
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", bl.starknet_version,
        ", block #", bl.block_number,
    );
    console.log("Provider connected to Starknet.");
    // console.log(bl)
    // process.exit(5);

    // **** initialize existing predeployed account 0 of Devnet
    // const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    // const accountAddress0 = "0x28563f81a0e454ddd3d6c136e4db728a9a98ffac97effc974dbf2fd68d22815";
    // const privateKey0 = "0x18455cfa3e966a746248fc68dcc315d4ccc449ad3e12f53211848499e6c946a";
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;
    // **** Sepolia
    //  const accountAddress0 = account1BraavosSepoliaAddress;
    //  const privateKey0 = account1TestBraavosSepoliaPrivateKey;
    // const accountAddress0 = account2TestBraavosSepoliaAddress;
    // const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    const accountAddress0 = account1BraavosMainnetAddress;
    const privateKey0 = account1BraavosMainnetPrivateKey;
    // **** Integration Sepolia
    // const accountAddress0 = account1IntegrationOZ8address;
    // const privateKey0 = account1IntegrationOZ8privateKey;
    //  const accountAddress0 = account2IntegrationAXaddress;
    //  const privateKey0 = account2IntegrationAXprivateKey;
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;
    // const accountAddress0 = account4IntegrationOZ20address;
    // const privateKey0 = account4IntegrationOZ20privateKey;
    //  const accountAddress0 = account5IntegrationOZ20address;
    //  const privateKey0 = account5IntegrationOZ20privateKey;
    // **** Integration sepolia special
    // const accountAddress0 = accountIntegrationAdrienAddress;
    // const privateKey0 = accountIntegrationAdrienPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log("Account 0 connected.\n");
    console.log("Account address =", num.toHex64(account0.address));
    // process.exit(1);

    // ********* main code ************

    const txH = "0x3b8da656f920607a8b529f204e15037c877c74c727defc93890fdab292695bc";
    const tx = await myProvider.getTransactionByHash(txH);
    console.log("Transaction =", tx);
    const txR = await myProvider.getTransactionReceipt(txH);
    if (txR.isSuccess()) {
        console.log("txResult =", txR);
       // console.log("Events =", txR.events);
    }
    const txT = await myProvider.getTransactionTrace(txH);
    console.log("Trace =", txT);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
