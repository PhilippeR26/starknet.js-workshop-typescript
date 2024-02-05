// Deploy a new ArgentX wallet in devnet.
// launch with : npx ts-node src/scripts/devnet/3.createNewArgentXaccount.ts
// coded using Starknet v5.5.0

import { Provider, Account, ec, json, stark, hash,CallData,num } from "starknet";

import fs from "fs";
import axios from "axios";
import { ensureEnvVar } from "../../util";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (ensureEnvVar("STARKNET_PROVIDER_BASE_URL") != "http://127.0.0.1:5050") {
        console.log("This script work only on local devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: ensureEnvVar("STARKNET_PROVIDER_BASE_URL") } });
    console.log('STARKNET_PROVIDER_BASE_URL=', ensureEnvVar("STARKNET_PROVIDER_BASE_URL"));

    // connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_DEVNET_ADDRESS=', ensureEnvVar("OZ_ACCOUNT0_DEVNET_ADDRESS"));
    console.log('OZ_ACCOUNT0_DEVNET_PRIVATE_KEY=', ensureEnvVar("OZ_ACCOUNT0_DEVNET_PRIVATE_KEY"));
    const privateKey0 = ensureEnvVar("OZ_ACCOUNT0_DEVNET_PRIVATE_KEY");
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey0);
    const account0Address: string = ensureEnvVar("OZ_ACCOUNT0_DEVNET_ADDRESS");
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing OZ account0 connected.\n');

    // Declare Proxy and ArgentXaccount classes in devnet :
    //const argentXproxyClassHash = "0x4a5cae61fa8312b0a3d0c44658b403d3e4197be80027fd5020ffcdf0c803331";
    //const argentXaccountClassHash = "0x5cd533592dd40ee07a087e120dd30a7bd24efd54471a65755cc1d553094c7d7";

    const ArgentXproxyCompiled = json.parse(fs.readFileSync("./compiledContracts/ArgentXproxy_0_2_3_1.json").toString("ascii"));
    const ArgentXaccountCompiled = json.parse(fs.readFileSync("./compiledContracts/ArgentXimplementation_0_2_3_1.json").toString("ascii"));
    // declare & deploy ArgentX proxy
    const { transaction_hash: AXPth, class_hash: AXPch } = await account0.declare({ contract: ArgentXproxyCompiled });
    console.log("proxy class hash =",AXPch);
    // declare ArgentXaccount
    const { transaction_hash: AXAth, class_hash: AXAch } = await account0.declare({ contract: ArgentXaccountCompiled.program });
    console.log("implementation contract class hash =",AXAch);

    await provider.waitForTransaction(AXPth);
    await provider.waitForTransaction(AXAth);

    // Calculate future address of the ArgentX account
    const privateKeyAX = num.toHex(BigInt(ensureEnvVar("AX_ACCOUNT3_DEVNET_PRIVKEY")));
    const expectedPubKeyAX = ensureEnvVar("AX_ACCOUNT3_DEVNET_ADDRESS");
    console.log('AX_ACCOUNT3_DEVNET_PRIVKEY=', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log("calculated AX account public key =",starkKeyPubAX);
    console.log("expected AX account public key   =",expectedPubKeyAX);
    const contractDeployer=CallData.compile({
        signer: starkKeyPubAX, 
        guardian: "0" 
    })
    const AXproxyConstructorCallData = CallData.compile({ 
        implementation: AXAch, 
        selector: hash.getSelectorFromName("initialize"), 
        calldata: contractDeployer, 
    });
    const AXcontractAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, AXPch, AXproxyConstructorCallData, 0);
    console.log('Precalculated account address =', AXcontractAddress);
    console.log('Expected account address      =', AXcontractAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": AXcontractAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);

    // deploy ArgentX account
    const accountAX = new Account(provider, AXcontractAddress, privateKeyAX);
    const deployAccountPayload = { 
        classHash: AXPch, 
        constructorCalldata: AXproxyConstructorCallData, 
        contractAddress: AXcontractAddress, 
        addressSalt: starkKeyPubAX };
    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log('Transaction hash =', AXdAth);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed at address =',AXcontractFinalAdress);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });