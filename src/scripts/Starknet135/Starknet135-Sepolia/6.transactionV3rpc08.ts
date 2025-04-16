// Test transactions V 3 in devnet-rs v0.3.0 (rpc0.8
// ).
// launch with npx ts-node src/scripts/Starknet13/Starknet13-devnet/1a.transactionV3.ts
// Coded with Starknet.js v6.0.0 B7

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type EstimateFee } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import type { ResourceBounds } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();




async function main() {
    // initialize Provider 
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
        const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
        if (!(await l2DevnetProvider.isAlive())) {
            console.log("No l2 devnet.");
            process.exit();
        }
    
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8",specVersion:constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Sepolia testnet.");

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
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // const compiled260Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.sierra.json").toString("ascii"));
    // const compiled260Casm = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.casm.json").toString("ascii"));
    // const deploy260Response = await account0.declareAndDeploy({ contract: compiled260Sierra, casm: compiled260Casm });
    // const contract260Address = deploy260Response.deploy.address;
    // console.log({ contract260Address });
    //process.exit(5);

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.casm.json").toString("ascii"));
     const contractAddress = "0x37bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0"; //Sepolia Testnet
    // const contractAddress = "0x33852427be21d24eca46797a31363597f52afcc315763ce32e83e5218eed2e3"; //Sepolia Integration
    //const contractAddress = "0x362c175938ed6d1db7feb4559824d33bc443fdbaab0f3ab0180920a9f2b39f5"; // devnet
    //  const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm });
    //  const contractAddress = deployResponse.deploy.address;

    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const contractETH = new Contract(compiledERC20.abi, ethAddress, myProvider);
    const contractSTRK = new Contract(compiledERC20.abi, strkAddress, myProvider);

    const initialEth = await contractETH.balanceOf(account0.address) as bigint;
    const initialStrk = await contractSTRK.balanceOf(account0.address) as bigint;

    const myTestContract = new Contract(compiledSierra.abi, contractAddress, myProvider);
    myTestContract.connect(account0);

    // ********** transaction V3
        console.log("Transaction V3 in progress...");
    const myCall = myTestContract.populate("test_fail", [100]);
     const { transaction_hash: txH0 } = await account0.execute(myCall, {version:3});
     const txR0 = await myProvider.waitForTransaction(txH0);
     console.log("tx0 OK.");
    // const fee: EstimateFee = await account0.estimateInvokeFee(myCall, { version: 3 });
    //             // type EstimateFee {
    //             //     gas_consumed: bigint;
    //             //     overall_fee: bigint;
    //             //     gas_price: bigint;
    //             //     unit: PRICE_UNIT;
    //             //     suggestedMaxFee: bigint;
    //             //     resourceBounds: ResourceBounds;
    //             //     data_gas_consumed: bigint;
    //             //     data_gas_price: bigint;
    //             // }
    // console.log("estimation fee =", fee);
    // const { transaction_hash: txH1 } = await account0.execute(myCall, {
    //     version:3,
    //      resourceBounds: fee.resourceBounds
    // });
    // const txR1 = await myProvider.waitForTransaction(txH1);
    // console.log("tx1 OK.");
    
    

    // *********** declare V3

    // const compiledRejectSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/string.sierra.json").toString("ascii"));
    // const compiledRejectCasm = json.parse(fs.readFileSync("./compiledContracts/cairo240/string.casm.json").toString("ascii"));
    // const feeD = await account0.estimateDeclareFee({ contract: compiledRejectSierra, casm: compiledRejectCasm });
    // console.log("declare Fee =", feeD);
    // // const resDec=await account0.declare({contract:compiledRejectSierra , casm:compiledRejectCasm },{
    // //     // version: 3,
    // //     // maxFee: 0,
    // //     // feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    // //     // resourceBounds: {
    // //     //     l1_gas: {
    // //     //         max_amount: num.toHex(2600),
    // //     //         max_price_per_unit: num.toHex(10 ** 12)
    // //     //     },
    // //     //     l2_gas: {
    // //     //         max_amount: num.toHex(2600),
    // //     //         max_price_per_unit: num.toHex(10 ** 12)
    // //     //     }
    // //     // }
    // // })
    // // console.log("decl txH =",resDec.transaction_hash)
    // // const txRD=await provider.waitForTransaction(resDec.transaction_hash);
    // // console.log("txR declare =",txRD);

    // *************** deploy account V3
    // const compiledAccountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.sierra.json").toString("ascii"));
    // const compiledAccountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.casm.json").toString("ascii"));
    // const privateKeyOZ = "0x987654321aabbccddeefff";
    // const starkKeyPubOZ = ec.starkCurve.getStarkKey(privateKeyOZ);

    // const declareResponse = await account0.declareIfNot({ contract: compiledAccountSierra, casm: compiledAccountCasm }, { version: 2 });
    // const contractOZ080ClassHash = declareResponse.class_hash;
    // if (declareResponse.transaction_hash) await myProvider.waitForTransaction(declareResponse.transaction_hash);
    // const accountOZconstructorCallData = CallData.compile({ publicKey: starkKeyPubOZ });
    // const contractOZaddress = hash.calculateContractAddressFromHash(starkKeyPubOZ, contractOZ080ClassHash, accountOZconstructorCallData, 0);
    // console.log('Precalculated account address=', contractOZaddress);

    // const feeA = await account0.estimateAccountDeployFee({ classHash: contractOZ080ClassHash, addressSalt: starkKeyPubOZ, constructorCalldata: accountOZconstructorCallData });
    // console.log("Deploy account Fee =", feeA);


    // // fund account address before account creation

    // // const txE=await account0.execute({contractAddress:ethAddress,entrypoint:"transfer",calldata:[contractOZaddress,cairo.uint256(10**18)]});
    // // await provider.waitForTransaction(txE.transaction_hash);
    // const txT = await account0.execute({ contractAddress: strkAddress, entrypoint: "transfer", calldata: [contractOZaddress, cairo.uint256(8 * 10 ** 15)] });
    // await myProvider.waitForTransaction(txT.transaction_hash);

    // const accountOZEth = await contractETH.balanceOf(contractOZaddress) as bigint;
    // const accountOZStrk = await contractSTRK.balanceOf(contractOZaddress) as bigint;


    // console.log("Account to create : \nETH balance =", formatBalance(accountOZEth, 18));
    // console.log("STRK balance =", formatBalance(accountOZStrk, 18));

    // console.log("Deploy of contract in progress...");
    // const accountOZ = new Account(myProvider, contractOZaddress, privateKeyOZ,);
    // const { transaction_hash: th2, contract_address: accountOZAddress } = await accountOZ.deployAccount({
    //     classHash: contractOZ080ClassHash,
    //     constructorCalldata: accountOZconstructorCallData,
    //     addressSalt: starkKeyPubOZ
    // }, { version: 3 });
    // console.log("Account deployed at address =", accountOZAddress);
    // // // account OZ 070 = "0x06c9cb47e3bb345fcccbba0fc51bac5c706701523a20f203b11dbb66bd648612"
    // const txR2 = await myProvider.waitForTransaction(th2);
    // console.log(txR2);
    // const accountOZStrk2 = await contractSTRK.balanceOf(contractOZaddress) as bigint;
    // console.log("STRK balance 2 =", formatBalance(accountOZStrk2, 18));


    const finalEth = await contractETH.balanceOf(account0.address);
    const finalStrk = await contractSTRK.balanceOf(account0.address);
    console.log("Reduction of ETH balance =", formatBalance(initialEth - finalEth, 18));
    console.log("Reduction of STRK balance =", formatBalance(initialStrk - finalStrk, 18));


    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });