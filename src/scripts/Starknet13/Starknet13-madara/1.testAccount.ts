// test Madara
// Coded with Starknet.js v6.1.4 in Madara testnet

import { Account, json, RpcProvider, Contract, cairo, Uint256, num, uint256, shortString, Abi, BigNumberish } from "starknet";
import { account2BraavosTestnetAddress, account2BraavosTestnetPrivateKey, account1BraavosTestnetAddress } from "../../../A1priv/A1priv";
import { DAIaddress, DAIaddressGoerli, ethAddress, strkAddress } from "../../utils/constants";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import fs from "fs";


async function main() {
    // local Madara
     const provider = new RpcProvider({ nodeUrl: "http://localhost:9944" });
    
    // to be sure to be connected :
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
//process.exit(5);
    // testnet
    const account0Address = "0x2";
    const privateKey0 = "0xc1cf1490de1352865301bb8705143f3ef938f97fdf892f1090dcb5ac7bcd1d";
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('AX account connected.\n');
    console.log("account cairo version from getCairoVersion =", await account0.getCairoVersion());
     console.log("nonce =", await account0.getNonce());
    // process.exit(5);
    // read abi of ETH
    const ethAbiFilePath = "./src/scripts/Starknet12/Starknet12-testnet/8b.Eth.abi.json";
    
        const ethAbi = json.parse(fs.readFileSync(ethAbiFilePath).toString("ascii"));
    
        const ethContract = new Contract(ethAbi, ethAddress, account0);
        const strkContract = new Contract(ethAbi, strkAddress, account0);

    // try to transfer
    const balETH = await ethContract.balanceOf(account0.address);
    const decimalsETH = Number(await ethContract.decimals());
    console.log("Account balance=",decimalsETH,balETH, formatBalance(balETH, decimalsETH), "ETH");
    // const balSTRK = await strkContract.balanceOf(account0.address);
    // const decimalsSTRK = Number(await strkContract.decimals());
    // console.log("Account balance=", formatBalance(balSTRK, decimalsSTRK), "STRK");
    process.exit(5);
    const call1 = ethContract.populate("transfer", {
        recipient: account0Address,
        amount: cairo.uint256(10)
    })
    console.log(call1);
    // crash with error 'Input too long for arguments'
    const res1 = await account0.execute(call1);
    const txR = await provider.waitForTransaction(res1.transaction_hash);
    console.log(txR);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
