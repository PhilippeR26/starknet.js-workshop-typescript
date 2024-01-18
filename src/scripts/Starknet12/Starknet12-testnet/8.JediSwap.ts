// Invoke JediSwap
// launch with npx ts-node src/scripts/Starknet12/Starknet12-testnet/8.JediSwap.ts
// Coded with Starknet.js v6.0.0 beta11

import { Account, json, RpcProvider, Contract, cairo, Uint256, num, uint256, shortString, Abi } from "starknet";
import { account2TestnetAddress, account2TestnetPrivateKey } from "../../../A1priv/A1priv";
import { DAIaddress, DAIaddressGoerli, ethAddress } from "../../utils/constants";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import fs from "fs";


async function main() {
    // local network Pathfinder on Testnet with rpc 0.5.0
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0.5" });
    // Blast Testnet
    const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0.5" });
    // to be sure to be connected :
    console.log("Provider connected at", shortString.decodeShortString(await provider.getChainId()));

    // testnet
    const privateKey0 = account2TestnetPrivateKey;
    const account0Address = account2TestnetAddress;
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('AX account connected.\n');

    //read abi of JediSwap (behind a proxy)
    const swapContractAddress = "0x02bcc885342ebbcbcd170ae6cafa8a4bed22bb993479f49806e72d96af94c965";
    const swapAbiFilePath = "./src/scripts/Starknet12/Starknet12-testnet/8a.JediSwap.abi.json";
    let swapAbi: Abi;
    if (!fs.existsSync(swapAbiFilePath)) {
        const compiledProxyContract = await provider.getClassAt(swapContractAddress);
        const proxyContract = new Contract(compiledProxyContract.abi, swapContractAddress, provider);
    type Res = {
        implementation: bigint
    }
    const classH = await proxyContract.call("get_implementation_hash") as Res;
    const swapCompiled = await provider.getClassByHash(classH.implementation);
        swapAbi = swapCompiled.abi;
        fs.writeFileSync(swapAbiFilePath, json.stringify(swapAbi, undefined, 2));
    }
    else {
        swapAbi = json.parse(fs.readFileSync(swapAbiFilePath).toString("ascii"));
    }
    const swapContract = new Contract(swapAbi, swapContractAddress, account0);
    
    //read abi of ETH
    const ethAbiFilePath = "./src/scripts/Starknet12/Starknet12-testnet/8b.Eth.abi.json";
    let ethAbi: Abi;
    if (!fs.existsSync(ethAbiFilePath)) {
        ethAbi = (await provider.getClassAt(ethAddress)).abi; 
        fs.writeFileSync(ethAbiFilePath, json.stringify(ethAbi, undefined, 2));
    }
    else {
        ethAbi = json.parse(fs.readFileSync(ethAbiFilePath).toString("ascii"));
    }
    const ethContract = new Contract(ethAbi, ethAddress, account0);

    // authorize a swap
    const bal = await ethContract.balanceOf(account0.address);
    const decimals = Number(await ethContract.decimals());
    console.log("Account balance=", formatBalance(bal, decimals), "ETH\nApproval of ETH...");
    const res = await ethContract.approve(swapContractAddress, cairo.uint256(1.2 * 10 ** 15)) // wei
    const approveReceipt = await provider.waitForTransaction(res.transaction_hash);
    
    // perform the swap
    const adminAddr = account0.address;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    console.log("deadline =", deadline);

    const myCall = swapContract.populate("swap_exact_tokens_for_tokens",
        {
            amountIn: cairo.uint256(1 * 10 ** 15),
            amountOutMin: cairo.uint256(100),
            path: [ethAddress, DAIaddressGoerli],
            to: adminAddr,
            deadline
        })
    console.log("swap call=", myCall,"\nSwap in progress...");
    const resp = await account0.execute(myCall);
    console.log("Tx hash =",resp.transaction_hash);
    const txReceipt = await provider.waitForTransaction(resp.transaction_hash);
    console.log("Receipt =", txReceipt.execution_status);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });