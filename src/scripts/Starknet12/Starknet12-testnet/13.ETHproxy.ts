// interact with old ETH ERC20 (was with proxy)
// launch with npx ts-node src/scripts/13.ETHproxy.ts
// Coded with Starknet.js v5.17.0

import { Contract, json, num, uint256, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    // initialize provider
    const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" });

    const ETHproxyAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"; // address of ETH proxy
    const compiledProxy = await provider.getClassAt(ETHproxyAddress); // abi of proxy
    const proxyContract = new Contract(compiledProxy.abi, ETHproxyAddress, provider);
    const { address: implementationAddress } = await proxyContract.implementation();
    // specific to this proxy : Implementation() returns an address of implementation.
    // Other proxies returns generally a class hash of implementation
    console.log("implementation ERC20 Address =", num.toHex(implementationAddress));
    const classHashERC20Class = await provider.getClassHashAt(num.toHex(implementationAddress)); // read the class hash related to this contract address.
    console.log("classHash of ERC20 =", classHashERC20Class);
    const compiledERC20 = await provider.getClassByHash(classHashERC20Class); // final objective : the answer contains the abi of the ERC20.
    fs.writeFileSync('./compiledContracts/erc20ETH.json', json.stringify(compiledERC20, undefined, 2));

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