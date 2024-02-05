// Create a new OpenZeppelin account in Starknet Sepolia testnet. Step 3/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/3.deployOZaccount.ts
// Coded with Starknet.js v5.24.3
import { Account, ec, json, Provider, hash, CallData, RpcProvider, Contract, cairo, stark, shortString, constants } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, goerliIntegrationUrl, account1IntegrationGoerliAXaddress, account1IntegrationGoerliAXprivateKey, account2IntegrationGoerliOZ081privateKey } from "../../../A1priv/A1priv";
import { infuraKey, account2MainnetAddress, account2MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { addrETH } from "../../../A2priv/A2priv";
import { junoNMtestnet } from "../../../A1priv/A1priv";


async function main() {
    // initialize Provider 
    // Starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // Goerli Testnet
    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" }); 
    // Goerli Integration
    const provider = new RpcProvider({ nodeUrl: goerliIntegrationUrl });
    // local Sepolia Testnet node :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); 
    // local Sepolia Integration node :
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_6" }); 
    // mainnet :
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_6" }); //v0.6.0
// Check that communication with provider is OK
console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
const payload_Pathfinder = {
    jsonrpc: '2.0',
    id: 1,
    method: 'pathfinder_version',
    params: []
};
const payload_Juno = {
    jsonrpc: '2.0',
    id: 1,
    method: 'juno_version',
    params: []
};
const response = await axios.post(goerliIntegrationUrl.slice(0,26)+"/rpc/pathfinder/v0.1", payload_Pathfinder);
console.log('Version:', response.data);

// *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X Goerli Testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress
    // *** initialize existing account Goerli Integration  
    const accountAddress0 = account1IntegrationGoerliAXaddress;
    const privateKey0 = account1IntegrationGoerliAXprivateKey;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress
    // *** initialize existing Sepolia Testnet account
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    //  const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const OZaccount0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V2);
    // new Open Zeppelin account v0.8.1 :
    // deploy account
    const OZ081ClassHash = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    const starkKeyPub = ec.starkCurve.getStarkKey(account2IntegrationGoerliOZ081privateKey);

    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, OZ081ClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);

    const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, addrETH, OZaccount0);
    const myCall = ethContract.populate("transfer",
        {
            recipient: OZcontractAddress,
            amount: cairo.uint256(5 * 10 ** 15),
        });
    const res = await OZaccount0.execute(myCall);
    await provider.waitForTransaction(res.transaction_hash);
    console.log("transferred 0.005 ETH");

    const OZaccount = new Account(provider, OZcontractAddress, account2IntegrationGoerliOZ081privateKey);
    const resDeployAccount = await OZaccount.deployAccount({
        classHash: OZ081ClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub
    });
    console.log("res =", resDeployAccount);
    await provider.waitForTransaction(resDeployAccount.transaction_hash);
    console.log("✅ New OpenZeppelin account created");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });