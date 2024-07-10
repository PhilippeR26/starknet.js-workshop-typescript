// Read STRK contract in Sepolia Testnet
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/3.readSTRK.ts
// Coded with Starknet.js v6.10.0


import { Account, RpcProvider, Contract, shortString, constants, json } from "starknet";
import { account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, account0OZSepoliaAddress } from "../../../A1priv/A1priv";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

async function main() {
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local Sepolia Testnet node
    const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" }); // Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); // Mainnet

    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected.");

    // **** initialize existing pre-deployed devnet-rs account 
    //     console.log("Account 0 connected.\n");
    // console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    // console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // **** Sepolia
    const accountAddress0 = account3ArgentXSepoliaAddress;
    const privateKey0 = account3ArgentXSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log("ArgentX Account 3 connected.\n");

    // *****************************************
    // test of transfer
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
    const balETH = await ethContract.call("balanceOf", [account0.address]) as bigint;
    console.log("Account has a balance of :", formatBalance(balETH, 18), "ETH");

    const resp = await ethContract.transfer(account0OZSepoliaAddress, 2n * 10n ** 14n);
    await myProvider.waitForTransaction(resp.transaction_hash);
    const balETH2 = await ethContract.call("balanceOf", [account0.address]) as bigint;
    console.log("OZ account has a balance of :", formatBalance(balETH2, 18), "ETH");

    console.log("✅ Test completed");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
