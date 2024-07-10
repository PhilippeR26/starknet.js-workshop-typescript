// Deploy a new ArgentX wallet.
// launch with : npx ts-node src/scripts/3a.createArgentXcairo0.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.0.1


import { Provider, Account, ec, json, stark, hash, CallData, RpcProvider } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // Declare Proxy and ArgentXaccount classes in devnet :
    // const argentXproxyClassHash = "0x4a5cae61fa8312b0a3d0c44658b403d3e4197be80027fd5020ffcdf0c803331";
    // const argentXaccountClassHash = "0x5cd533592dd40ee07a087e120dd30a7bd24efd54471a65755cc1d553094c7d7";

    const ArgentXproxyCompiled = json.parse(fs.readFileSync("./compiledContracts/cairo060/ArgentProxy_0_2_3.json").toString("ascii"));
    const ArgentXaccountCompiled = json.parse(fs.readFileSync("./compiledContracts/cairo060/ArgentAccount_0_2_3.json").toString("ascii"));

    // declare & deploy ArgentX proxy
    const { transaction_hash: AXPth, class_hash: AXPch } = await account0.declare({ contract: ArgentXproxyCompiled });
    console.log("proxy class hash =", AXPch);
    // declare ArgentXaccount
    const { transaction_hash: AXAth, class_hash: AXAch } = await account0.declare({ contract: ArgentXaccountCompiled });
    console.log("account contract class hash =", AXAch);
    await provider.waitForTransaction(AXPth);
    await provider.waitForTransaction(AXAth);

    // Calculate future address of the ArgentX account
    const privateKeyAX = process.env.AA_NEW_ACCOUNT_PRIVKEY ?? "";
    console.log('AX_ACCOUNT3_DEVNET_PRIVKEY=', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    const AXproxyConstructorCallData = CallData.compile({
        implementation: AXAch,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: starkKeyPubAX, guardian: "0" }),
    });
    const AXproxyAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, AXPch, AXproxyConstructorCallData, 0);
    console.log('Precalculated account address=', AXproxyAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": AXproxyAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);

    // deploy ArgentX account
    const accountAX = new Account(provider, AXproxyAddress, privateKeyAX);
    const deployAccountPayload = {
        classHash: AXPch,
        constructorCalldata: AXproxyConstructorCallData,
        contractAddress: AXproxyAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log('Transaction hash =', AXdAth);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });