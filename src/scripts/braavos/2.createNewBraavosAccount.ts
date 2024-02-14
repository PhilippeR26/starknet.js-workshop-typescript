// Deploy a new braavos wallet.
// use Starknet.js v5.11.1, starknet-devnet 0.5.2
// launch with npx ts-node src/scripts/braavos/2.createNewBraavosAccount.ts

import { Provider, Account, num, RpcProvider } from "starknet";
import { calculateAddressBraavos, deployBraavosAccount, estimateBraavosAccountDeployFee } from "./3a.deployBraavos";
import { account3BraavosTestnetAddress, account3BraavosTestnetPrivateKey } from "../../A1priv/A1priv";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    //          👇👇👇
    // 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --fork-network alpha-goerli' before using this script.
    //          👆👆👆

    //initialize Provider 
    const providerDevnet = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050"  });

    const privateKeyAccount0 = "0xe3e70682c2094cac629f6fbed82c07cd";
    const account0Address: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(providerDevnet, account0Address, privateKeyAccount0);
    console.log('predeployed devnet account0 connected.\n');

    // Calculate future address of the Braavos account
    const privateKeyBraavos = account3BraavosTestnetPrivateKey;
    console.log('Braavos_ACCOUNT_PRIVATE_KEY=', privateKeyBraavos);
    const BraavosProxyAddress = calculateAddressBraavos(privateKeyBraavos);

    console.log('Precalculated account address=', BraavosProxyAddress);
    console.log('Stored account address       =', num.cleanHex(account3BraavosTestnetAddress));

    if (num.cleanHex(account3BraavosTestnetAddress) !== BraavosProxyAddress) {
        throw Error("Wrong address!");
    }
    // estimate fees
    const estimatedFee = await estimateBraavosAccountDeployFee(privateKeyBraavos, providerDevnet);
    console.log("calculated fee =", estimatedFee);

    // fund account address before account creation       
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": BraavosProxyAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy Braavos account
    const { transaction_hash, contract_address: BraavosAccountFinalAddress } = await deployBraavosAccount(privateKeyBraavos, providerDevnet,estimatedFee);

    console.log('Transaction hash =', transaction_hash);
    await providerDevnet.waitForTransaction(transaction_hash);
    console.log('✅ Braavos wallet deployed at', BraavosAccountFinalAddress);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
