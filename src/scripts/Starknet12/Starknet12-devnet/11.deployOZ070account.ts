// deploy in devnet the Cairo 2.2.0 OZ account.
// launch with npx ts-node src/scripts/cairo12-devnet/11.deployOZ070account.ts
// Coded with Starknet.js v5.17.0

import { constants, Provider, Contract, Account, json, shortString, RpcProvider, ec, CallData ,hash} from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --cairo-compiler-manifest /D/Cairo1-dev/cairo/Cargo.toml' before using this script (with Cairo 2.2.0 fetched and built).
//          👆👆👆

async function main() {

    // initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    // const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.99:9545/rpc/v0.4" });

    // Check that communication with provider is OK
    const bl = await provider.getBlock('latest');
    console.log("Block =", bl.block_number);

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n In progress...");

    console.log("A")
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo220/openzeppelin070Account.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo220/openzeppelin070Account.casm.json").toString("ascii"));


    const privateKeyOZ = "0x987654321aabbccddeeff";
    const starkKeyPubOZ = ec.starkCurve.getStarkKey(privateKeyOZ);

    const declareResponse = await account0.declare({ contract: compiledSierra, casm: compiledCasm });
    const contractOZ070ClassHash = declareResponse.class_hash;
    // const contractClassHash = "0x2bfd9564754d9b4a326da62b2f22b8fea7bbeffd62da4fcaea986c323b7aeb";
    console.log('✅ OZ 070 account contract declared with classHash =', contractOZ070ClassHash);
    await provider.waitForTransaction(declareResponse.transaction_hash);

    const accountOZconstructorCallData = CallData.compile({ publicKey: starkKeyPubOZ });
    const contractOZaddress = hash.calculateContractAddressFromHash( starkKeyPubOZ,contractOZ070ClassHash, accountOZconstructorCallData, 0);
    console.log('Precalculated account address=', contractOZaddress);
    // fund account address before account creation
        
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": contractOZaddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); //50 ETH

    console.log("Deploy of contract in progress...");
    const accountOZ = new Account(provider, contractOZaddress, privateKeyOZ,"1");
    const { transaction_hash:th2, contract_address:accountOZAddress } = await accountOZ.deployAccount({ 
        classHash: contractOZ070ClassHash, 
        constructorCalldata: accountOZconstructorCallData, 
        addressSalt: starkKeyPubOZ 
    });
    console.log("Account deployed at address =",accountOZAddress);
    // account OZ 070 = "0x06c9cb47e3bb345fcccbba0fc51bac5c706701523a20f203b11dbb66bd648612"
    await provider.waitForTransaction(th2);

    

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });