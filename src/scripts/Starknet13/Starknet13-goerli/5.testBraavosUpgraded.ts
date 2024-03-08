// An old Braavos account (Cairo 0- v0.0.11) has been upgraded to Cairo 1 - v1.0.0. 
// In this case, you have a Cairo 0 proxy using a Cairo 1 implementation class.
// Let's discover what could go wrong?
// launch with npx src/scripts/Starknet13/Starknet13-goerli/5.testBraavosUpgraded.ts
// Coded with Starknet.js v6.1.4 in Goerli testnet

import { Account, json, RpcProvider, Contract, cairo, Uint256, num, uint256, shortString, Abi, BigNumberish } from "starknet";
import { account2BraavosTestnetAddress, account2BraavosTestnetPrivateKey, account1BraavosTestnetAddress } from "../../../A1priv/A1priv";
import { DAIaddress, DAIaddressGoerli, ethAddress } from "../../utils/constants";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import fs from "fs";


async function main() {
    // local network Pathfinder on Testnet
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0.5" });
    // Blast Testnet
    const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" });
    // to be sure to be connected :
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    // testnet
    const account0Address = account2BraavosTestnetAddress;
    const privateKey0 = account2BraavosTestnetPrivateKey;
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('AX account connected.\n');
    console.log("property Cairo version before interact =", account0.cairoVersion);
    console.log("account cairo version from getCairoVersion =", await account0.getCairoVersion());
    console.log("property Cairo version after interact =", account0.cairoVersion);
    console.log("nonce =", await account0.getNonce());
    // process.exit(5);
    // read abi of ETH
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

    // try to transfer
    const bal = await ethContract.balanceOf(account0.address);
    const decimals = Number(await ethContract.decimals());
    console.log("Account balance=", formatBalance(bal, decimals), "ETH");
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
