// Create a new OpenZeppelin account in Starknet Sepolia testnet. Step 3/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/3.deployOZaccount.ts
// Coded with Starknet.js v6.0.0-beta.13
import { Account, ec, json, Provider, hash, CallData, RpcProvider, Contract, cairo, stark, shortString, constants, uint256, Uint256 } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, goerliIntegrationUrl, account1IntegrationGoerliAXaddress, account1IntegrationGoerliAXprivateKey, account2IntegrationGoerliOZ081privateKey, account2IntegrationGoerliOZ081address } from "../../../A1priv/A1priv";
import { infuraKey, account2MainnetAddress, account2MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { junoNMtestnet } from "../../../A1priv/A1priv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";


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
    // *** initialize existing ArgentX experimental account Goerli Integration  
    //  const accountAddress0 = account1IntegrationGoerliAXaddress;
    //  const privateKey0 = account1IntegrationGoerliAXprivateKey;
    // *** initialize existing OZ081 account Goerli Integration  
     const accountAddress0 = account2IntegrationGoerliOZ081address;
     const privateKey0 = account2IntegrationGoerliOZ081privateKey;
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
    // transfer ETH to Open Zeppelin account v0.8.1 :
   
    

    const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, ethAddress, OZaccount0);
    const strkContract = new Contract(ethSierra.abi, strkAddress, OZaccount0);
    const bal0=await ethContract.balanceOf(OZaccount0.address) ;
    const bal0bi=uint256.uint256ToBN(bal0.balance);

    console.log("bal0=",formatBalance(bal0bi,18),"ETH");
    const bal1=await strkContract.balanceOf(OZaccount0.address) ;
    const bal1bi=uint256.uint256ToBN(bal1.balance);

    console.log("bal1=",formatBalance(bal1bi,18),"STRK");
     process.exit(5);
    // // ******** transfer ETH
    // const myCall = ethContract.populate("transfer",
    //     {
    //         recipient: account2IntegrationGoerliOZ081address,
    //         amount: cairo.uint256(5 * 10 ** 15),
    //     });
    // const res = await OZaccount0.execute(myCall);
    // console.log("transferred 0.005 ETH");
    // console.log("res =", res);
    // await provider.waitForTransaction(res.transaction_hash);

    // ******** transfer STRK
    const myCall = strkContract.populate("transfer",
        {
            recipient: account2IntegrationGoerliOZ081address,
            amount: cairo.uint256(10 * 10 ** 15),
        });
    const res2 = await OZaccount0.execute(myCall);
    console.log("transferred 0.010 STRK");

    
    console.log("res2 =", res2);
    await provider.waitForTransaction(res2.transaction_hash);
    console.log("✅ transfer completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });