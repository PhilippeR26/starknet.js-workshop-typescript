// Test transactions V 3 in devnet-rs v0.3.0 (rpc0.8
// ).
// launch with npx ts-node src/scripts/Starknet13/Starknet13-devnet/1a.transactionV3.ts
// Coded with Starknet.js v6.0.0 B7

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type EstimateFee } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import type { ResourceBounds } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
import { calculateAddressBraavos } from "../../braavos/3f.deployBraavos120v3rpc08";
dotenv.config();


async function main() {
    // initialize Provider 
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8" }); // Sepolia Testnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Sepolia testnet.");

    // *** Devnet-rs 
    // initialize existing predeployed account 0 of Devnet
    // console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    // console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // *** initialize existing Sepolia Testnet account
    const accountAddress0 = account2TestBraavosSepoliaAddress;
    const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account(myProvider, accountAddress0, privateKey0, undefined);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // const compiled260Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.sierra.json").toString("ascii"));
    // const compiled260Casm = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.casm.json").toString("ascii"));
    // const deploy260Response = await account0.declareAndDeploy({ contract: compiled260Sierra, casm: compiled260Casm });
    // const contract260Address = deploy260Response.deploy.address;
    // console.log({ contract260Address });
    //process.exit(5);

    const BraavosBaseClassHash = "0x3d16c7a9a60b0593bd202f660a28c5d76e0403601d9ccc7e4fa253b6a70c201";
    // Calculate future address of the Braavos account
    const privateKeyBraavosBase = stark.randomAddress();
    // const privateKeyBraavosBase = "0x056d8c018b779d059302e5ab6969b3dd61df19f448ecd1e95c37868a40bd1294";
    console.log('New Braavos_account :');
    console.log('Braavos account Private Key =', privateKeyBraavosBase);
    const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(privateKeyBraavosBase);
    console.log('Braavos account Public Key  =', starkKeyPubBraavosBase);
    const accountBraavosAddress = calculateAddressBraavos(privateKeyBraavosBase);
    console.log('Braavos account calculated address  =', accountBraavosAddress);

    const newAccount = new Account(myProvider, accountBraavosAddress, privateKeyBraavosBase);
    const resDepl = await newAccount.deployAccount({
        classHash: BraavosBaseClassHash,
        constructorCalldata: [starkKeyPubBraavosBase],
        addressSalt: starkKeyPubBraavosBase
    }, 
    // {resourceBounds:{

    // }}
);
    console.log(resDepl);




    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });