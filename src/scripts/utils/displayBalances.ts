// library to display STRK, ETH & USDC balances of an account.

import { constants, Contract, json, type BigNumberish, type RpcProvider } from "starknet";
import fs from "fs";
import { formatBalance } from "./formatBalance";
import { ethAddress, strkAddress, USDCaddress, USDCaddressTestnet } from "./constants";


export async function displayBalances(addr: BigNumberish, myProv: RpcProvider) {
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, myProv);
    const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, myProv);
    const usdcAddr = (await myProv.getChainId()) === constants.StarknetChainId.SN_SEPOLIA ? USDCaddressTestnet : USDCaddress;
    const usdcContract = new Contract(compiledERC20Contract.abi, usdcAddr, myProv);
    const balETH = await EthContract.call("balanceOf", [addr]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [addr]) as bigint;
    let balUSDC: bigint=0n;
    try{
    balUSDC = await usdcContract.call("balanceOf", [addr]) as bigint;
    } catch {};
    console.log("Account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");
    console.log("Account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("Account 0 has a balance of :", formatBalance(balUSDC, 6), "USDC");
}
