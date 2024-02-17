// Deploy a new braavos account (Cairo 0) in Goerli Testnet.
// use Starknet.js v6.0.0, Goerli testnet
// launch with npx ts-node src/scripts/braavos/2a.createNewBraavos0AccountGoerli.ts

import {  Account, cairo, Contract, json, num, RpcProvider, shortString, stark } from "starknet";
import { calculateAddressBraavos, deployBraavosAccount, estimateBraavosAccountDeployFee } from "./3a.deployBraavos";
import {account2TestnetAddress , account2TestnetPrivateKey } from "../../A1priv/A1priv";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethAddress } from "../utils/constants";
dotenv.config();


async function main() {
    //initialize Provider 
    const nodeUrl = "https://free-rpc.nethermind.io/goerli-juno/v0_6";
    const provider = new RpcProvider({ nodeUrl }); // Goerli Testnet
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    const account0Address=account2TestnetAddress;
    const privateKeyAccount0 = account2TestnetPrivateKey;
    const account0 = new Account(provider, account0Address, privateKeyAccount0);
    console.log('Deployed account connected.\n');

    // Calculate future address of the Braavos account
    const privateKeyBraavos = stark.randomAddress();
    console.log('New Braavos_ACCOUNT_PRIVATE_KEY=', privateKeyBraavos);
    const BraavosProxyAddress = calculateAddressBraavos(privateKeyBraavos);

    console.log('Precalculated new account address =', BraavosProxyAddress);
    
    // estimate fees
    const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavos, provider);
    console.log("calculated fee =", estimatedFee);



    // fund account address before account creation       
  const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, ethAddress, account0);
    const myCall = ethContract.populate("transfer",
        {
            recipient: BraavosProxyAddress,
            amount: cairo.uint256(5 * 10 ** 15),
        });
    const res = await account0.execute(myCall);
    await provider.waitForTransaction(res.transaction_hash);
    console.log("transferred 0.005 ETH");

    // deploy Braavos account
    const { transaction_hash, contract_address: BraavosAccountFinalAddress } = await deployBraavosAccount(privateKeyBraavos, provider,estimatedFee);

    console.log('Transaction hash =', transaction_hash);
    await provider.waitForTransaction(transaction_hash);
    console.log('✅ Braavos wallet deployed at', BraavosAccountFinalAddress);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
