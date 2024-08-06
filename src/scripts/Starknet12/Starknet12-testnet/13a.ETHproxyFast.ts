// interact with old ETH ERC20 (was with proxy)
// launch with npx ts-node src/scripts/13a.ETHproxyFast.ts
// Coded with Starknet.js v5.17.0

import { Contract, json, uint256, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    // initialize provider
    const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" });

    const ETHproxyAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20.abi, ETHproxyAddress, provider);
    console.log('ETH Contract connected at =', ethContract.address);

    // Interactions with the contract
    const bal = await ethContract.balanceOf("0x3ed25d84463bc077196174405644a845b52b7ea25534cccb7f351a1a5047926");
    const decimals = await ethContract.decimals()
    // as it's a Cairo v0 contract :
    const bal2 = Number(uint256.uint256ToBN(bal.balance));
    const decimals2 = Number(decimals.decimals);
    const bal3 = bal2 / (10 ** decimals2);
    console.log("Balance =", bal3);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });