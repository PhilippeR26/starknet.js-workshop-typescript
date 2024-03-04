// Deploy a new braavos account (Cairo 1) in Sepolia Testnet.
// use Starknet.js v6.0.0.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-sepolia/6.createNewBraavos1Account.ts

import { Account, cairo, CallData, Contract, ec, hash, json, num, RpcProvider, shortString, stark, type BigNumberish } from "starknet";
import { calculateAddressBraavos, deployBraavosAccount, estimateBraavosAccountDeployFee } from "../../braavos/3b.deployBraavos1";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { ethAddress } from "../../utils/constants";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    //initialize Provider 
    const nodeUrl = "https://starknet-sepolia.public.blastapi.io/rpc/v0_6";
    const provider = new RpcProvider({ nodeUrl }); // Goerli Testnet
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    const account0Address = account1BraavosSepoliaAddress;
    const privateKeyAccount0 = account1BraavosSepoliaPrivateKey;
    const account0 = new Account(provider, account0Address, privateKeyAccount0);
    console.log('Deployed account connected.\n');

    // Calculate future address of the Braavos account
    const privateKeyBraavos = stark.randomAddress();
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(privateKeyBraavos);
    console.log('New Braavos_account :');
    console.log("Private key =", privateKeyBraavos);
    console.log("Public key =", starkKeyPubBraavos);
    const BraavosAddress = calculateAddressBraavos(privateKeyBraavos);
    console.log('Precalculated new account address =', BraavosAddress);

    //process.exit(5);  


    // fund account address before account creation  
    const myFee = 2n * 10n ** 15n; // fee defined manually
    const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(ethSierra.abi, ethAddress, account0);
    const myCall = ethContract.populate("transfer",
        {
            recipient: BraavosAddress,
            amount: cairo.uint256(myFee),
        });
    const res = await account0.execute(myCall);
    await provider.waitForTransaction(res.transaction_hash);
    console.log("transferred 0.002 ETH");

    // deploy Braavos account
    const { transaction_hash, contract_address: BraavosAccountFinalAddress } = await deployBraavosAccount(privateKeyBraavos, provider, myFee);

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
