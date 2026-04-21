
// Use a falcon512 account from S2morrow
// launch with npx src/scripts/signature/falcon512/3.useFalcon512Account.ts
// Coded with Starknet.js v10.0.0 + devnet 0.8.0

import { Contract, Account, json, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, stark, encode, validateAndParseAddress, type Call, constants, defaultDeployer, type InvokeTransactionReceiptResponse } from "starknet";
import fs from "fs";
import * as falcon from './pkg/falcon_rs.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { Falcon512Signer } from "./12.falcon512Signer";
import { displayBalances } from "../../utils/displayBalances";
import { strkAddress } from "../../utils/constants";

dotenv.config({ quiet: true });


async function main() {
    // initialize Provider 
    //          👇👇👇
    // 🚨🚨🚨 launch script 2 before this script. 
    //          👆👆👆
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }

    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Devnet.");

    //process.exit(5);
    // *** Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account1OZSepoliaAddress;
    // const privateKey0 = account1OZSepoliaPrivateKey;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account1IntegrationOZaddress;
    //  const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // ********** main code
    const accountData = json.parse(fs.readFileSync("./src/scripts/signature/falcon512/accountKeys.json").toString("ascii"));

    const privK = encode.hexStringToUint8Array(
        accountData.privKey.startsWith("0x")
            ? accountData.privKey.slice(2)
            : accountData.privKey
    );
    const pubK = encode.hexStringToUint8Array(
        accountData.pubKey.startsWith("0x")
            ? accountData.pubKey.slice(2)
            : accountData.pubKey
    );
    console.log("privK length:", privK.length); 
    console.log("pubK length:", pubK.length);   
    const falcon512Signer = new Falcon512Signer(privK, pubK);
    const falcon512Account = new Account({ address: accountData.address, provider: myProvider, signer: falcon512Signer })
    console.log("Account address=", falcon512Account.address);
    console.log(await displayBalances(falcon512Account.address, myProvider));

    // **** transfer STRK from falcon account to account0
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({
        abi: compiledERC20Contract.abi,
        address: strkAddress,
        providerOrAccount: falcon512Account
    });
    console.log("Transfer...");
    const respTransfer = await strkContract.withOptions({ skipValidate: false }).transfer(account0.address, 1n * 10n ** 10n);
    await myProvider.waitForTransaction(respTransfer.transaction_hash);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

