// Create a new OpenZeppelin account in Starknet Sepolia integration. Step 2/3
// launch with npx ts-node src/scripts/Starknet12/Starknet12-integration/2.checkFunding.ts
// Coded with Starknet.js v5.24.3

import { Account, ec, json, hash, CallData, RpcProvider, Contract, cairo, stark, uint256 } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { account0OZSepoliaAddress, account7TestnetAddress, account7TestnetPrivateKey } from "../../../A1priv/A1priv";
import { infuraKey, account4MainnetAddress, account4MainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import { account1IntegrationOZ8address,account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { account2IntegrationAXaddress, account2IntegrationAXprivateKey } from "../../../A2priv/A2priv";

import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";


// In Sepolia, use the bridge https://sepolia.etherscan.io/address/0x6BC7a9f029E5E0CFe84c5b8b1acC0EA952EAed3b#writeProxyContract
// Use the function 4 : deposit (0xe2bbb158)
// with params (for ETH) :
// deposit= 0.1
// amount (uint256)= 99000000000000000  // put a value < 0.1 ETH
// l2Recipient (uint256)= 0xxxxxxxxxxxxxxx4


async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0.5" }); // local pathfinder sepolia testnet node
    const chId=provider.getChainId();
    console.log("Provider connected.");
    const contractFilePathERC20 = "./compiledContracts/cairo060/ERC20ETH.json";
    const compiledEthContract = json.parse(fs.readFileSync(contractFilePathERC20).toString("ascii"));

    const ethContract = new Contract(compiledEthContract.abi, ethAddress, provider);
    console.log('ETH ERC20 contract connected at =', ethContract.address);

    const res1 = await ethContract.balanceOf(account1IntegrationOZ8address);
    const balance = BigInt(uint256.uint256ToBN(res1.balance));
    console.log("addr: ", account1IntegrationOZ8address, res1, balance);
    console.log("Node report that account owns", formatBalance(balance, 18), "ETH");

    // const OZ080ClassHash = "0x5400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c";
    // const contractAXclassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003"; // ArgentX Cairo 1 v0.3.0
    // const isDecl=await provider.getClassByHash(contractAXclassHash);


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
