// classH = 0x0037c7626b50ba517835c9556b53bce57cb6633704bb702f8c2f13a44cf151d5
// account addr = 0x7f47dc7d5f2ab40ae668a195fc8eb5724333e436d87a1c37f40d39f2776d5fb
//txH in Testnet : 0x35ef8818b86b6cc8fac2d79da32a6e2ce6f34af91df5f27f87a50e931dc5664

// Deploy a falcon512 account from S2morrow
// launch with npx src/scripts/signature/falcon512/2.deployFalcon512.ts
// Coded with Starknet.js v10.0.0 + devnet 0.8.0

import { Contract, Account, json, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, stark, encode, validateAndParseAddress, type Call, constants, defaultDeployer, type InvokeTransactionReceiptResponse } from "starknet";
import fs from "fs";
import * as falcon from './pkg/falcon_rs.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { account1ReadyMainnetAddress, account1ReadyMainnetPrivateKey, account3BraavosMainnetAddress, account3BraavosMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { strkAddress } from "../../utils/constants";
import { Falcon512Signer } from "./12.falcon512Signer";

dotenv.config({ quiet: true });


async function main() {
     // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    // }

    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
    const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // mainnet

    // Check that communication with provider is OK
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Devnet.");

    // process.exit(5);
    // *** Devnet
    //const accData = await l2DevnetProvider.getPredeployedAccounts();
    // // *** initialize existing predeployed account 0 of Devnet
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account1OZSepoliaAddress;
    // const privateKey0 = account1OZSepoliaPrivateKey;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account1IntegrationOZaddress;
    //  const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;

    // *** initialize existing Argent X mainnet  account
    const accountAddress0 = account1ReadyMainnetAddress
    const privateKey0 = account1ReadyMainnetPrivateKey;

    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // ********** main code
    console.log("Account address=", account0.address);
    console.log(await displayBalances(account0.address, myProvider));

    // Connect the new contract instance (deployed in Testnet) :
    const classH = "0x0037c7626b50ba517835c9556b53bce57cb6633704bb702f8c2f13a44cf151d5";
    // deploy Test account in devnet
    const compiledSierra = json.parse(fs.readFileSync("./src/scripts/signature/falcon512/falcon512Account.sierra.json").toString("ascii")) as CompiledSierra;
    // *** crypto init
    const seed = randomBytes(32);
    const keyPair = falcon.keygen(seed) as { sk: Uint8Array, vk: Uint8Array };
    const falcon512signer2 = new Falcon512Signer(keyPair.sk, keyPair.vk);
    const packedPubK: string[] = falcon512signer2.gets2morrowPubKey(); // 29 x felt252

    // Calculate future address of the account
    const myCallData = new CallData(compiledSierra.abi);
    const formattedPubK = packedPubK.reduce((acc, value, index) => {
        acc[`s${index}`] = value;
        return acc;
    }, {} as Record<string, string>);
    console.log({ formattedPubK });
    const accountFalcon512ConstructorCalldata = myCallData.compile('constructor', { pk_packed: formattedPubK });
    const salt = packedPubK[0];
    const contractFalcon512Address = hash.calculateContractAddressFromHash(salt, classH, accountFalcon512ConstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractFalcon512Address);


    // deploy account
    console.log("nonce=", await account0.getNonce());
    const falcon512Account = new Account({ provider: myProvider, address: contractFalcon512Address, signer: falcon512signer2 });
    const myCall: Call = {

        contractAddress: constants.UDC.ADDRESS,
        entrypoint: constants.UDC.ENTRYPOINT,
        calldata: CallData.compile({
            classHash: classH,
            salt: salt,
            unique: "0",
            calldata: accountFalcon512ConstructorCalldata,
        }),
    };
    console.log("Deploy...");
    const resp0 = await account0.execute(myCall);
    const txR0 = await myProvider.waitForTransaction(resp0.transaction_hash);
    console.log("Real txH =", resp0.transaction_hash);
    console.log(txR0);
    let accountAddr: string = "";
    if (txR0.isSuccess()) {
        const resDeploy = defaultDeployer.parseDeployerEvent(txR0 as InvokeTransactionReceiptResponse);
        console.log({ resDeploy });
        accountAddr = resDeploy.address;
        console.log("Account address =", (resDeploy.address));
    }
    else {
        throw new Error("Deployment failed");
    }
    fs.writeFileSync("src/scripts/signature/falcon512/accountKeys.json", json.stringify({
        address: accountAddr,
        privKey: encode.addHexPrefix(encode.buf2hex(keyPair.sk)),
        pubKey: encode.addHexPrefix(encode.buf2hex(keyPair.vk))
    }, undefined, 2));


    // **** Fund the account address
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
    const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
    console.log("Funding...");
    const respTransfer = await strkContract.transfer(accountAddr, 3n * 10n ** 18n); // 3 STRK
    await myProvider.waitForTransaction(respTransfer.transaction_hash);

    console.log('✅ New Account created.\n   final address =', validateAndParseAddress(accountAddr));

    console.log("✅ Test completed.");


}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

