// Test transactions V 3 in devnet-rs commit 3bf2452.
// launch with npx ts-node src/scripts/Starknet13/Starknet13-devnet/1a.transactionV3.ts
// Coded with Starknet.js v6.0.0 B7

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, ec, CallData, hash, cairo } from "starknet";
import fs from "fs";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZaddress, account1IntegrationOZprivateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import axios from "axios";
dotenv.config();




async function main() {
    // initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_6" }); // Goerli Testnet
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9545/rpc/v0_6" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());


    // *** Devnet-rs 
    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // *** initialize existing Argent X Goerly Testnet  account
    // const privateKey0 = account5TestnetPrivateKey;
    // const accountAddress0 = account5TestnetAddress
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    // *** initialize existing Sepolia Testnet account
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V3);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.casm.json").toString("ascii"));
    // const contractAddress = "0x01073c451258ff87d4e280fb00bc556767cdd464d14823f84fcbb8ba44895a34"; //Goerli Testnet
    // const contractAddress = "0x37bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0"; //Sepolia Testnet
    // const contractAddress = "0x33852427be21d24eca46797a31363597f52afcc315763ce32e83e5218eed2e3"; //Sepolia Integration
    const contractAddress = "0x91a3dc3889d4ba79829c0b97c04a793d038093232923405a5b34045893548d"; // devnet-rs

    const compiledERC20 = json.parse(fs.readFileSync("./compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const contractETH = new Contract(compiledERC20.abi, ethAddress, provider);
    const contractSTRK = new Contract(compiledERC20.abi, strkAddress, provider);

    const initialEth = await contractETH.balanceOf(account0.address) as bigint;
    const initialStrk = await contractSTRK.balanceOf(account0.address) as bigint;

    const myTestContract = new Contract(compiledSierra.abi, contractAddress, provider);
    myTestContract.connect(account0);

    // ********** transaction V3

    const myCall = myTestContract.populate("test_fail", [100]);
    const fee = await account0.estimateInvokeFee(myCall);
    console.log("fee=", fee);
    const { transaction_hash: txH } = await account0.execute(myCall, undefined, {
        version: 3,
        //maxFee: 0,
        //feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
        resourceBounds: {
            l1_gas: {
                max_amount: num.toHex(2600),
                max_price_per_unit: num.toHex(10 ** 12)
            },
            l2_gas: {
                max_amount: "0x00",
                max_price_per_unit: "0x00"
            }
        }
    });

    const txR = await provider.waitForTransaction(txH);
    console.log(txR);
    const { transaction_hash: txH1 } = await myTestContract.test_fail(100);


    // *********** declare V3

    const compiledRejectSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/string.sierra.json").toString("ascii"));
    const compiledRejectCasm = json.parse(fs.readFileSync("./compiledContracts/cairo240/string.casm.json").toString("ascii"));
    const feeD = await account0.estimateDeclareFee({ contract: compiledRejectSierra, casm: compiledRejectCasm },{version: 3});
    console.log("declare Fee =", feeD);
    const resDec=await account0.declare({contract:compiledRejectSierra , casm:compiledRejectCasm },{
        version: 3,
        //maxFee: 0,
        //feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
        resourceBounds: {
            l1_gas: {
                max_amount: "0x00",
                max_price_per_unit: "0x00"
            },
            l2_gas: {
                max_amount: num.toHex(5000),
                max_price_per_unit: num.toHex(10 ** 12)
            }
        }
    })
    console.log("decl txH =",resDec.transaction_hash)
    const txRD=await provider.waitForTransaction(resDec.transaction_hash);
    console.log("txR declare =",txRD);
    // *************** deploy account V3
    const compiledAccountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.sierra.json").toString("ascii"));
    const compiledAccountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.casm.json").toString("ascii"));
    const privateKeyOZ = "0x987654321aabbccddeefff";
    const starkKeyPubOZ = ec.starkCurve.getStarkKey(privateKeyOZ);

    const declareResponse = await account0.declareIfNot({ contract: compiledAccountSierra, casm: compiledAccountCasm }, { version: 2 });
    const contractOZ080ClassHash = declareResponse.class_hash;
    if (declareResponse.transaction_hash) await provider.waitForTransaction(declareResponse.transaction_hash);
    const accountOZconstructorCallData = CallData.compile({ publicKey: starkKeyPubOZ });
    const contractOZaddress = hash.calculateContractAddressFromHash(starkKeyPubOZ, contractOZ080ClassHash, accountOZconstructorCallData, 0);
    console.log('Precalculated account address=', contractOZaddress);

    const feeA = await account0.estimateAccountDeployFee({ classHash: contractOZ080ClassHash, addressSalt: starkKeyPubOZ, constructorCalldata: accountOZconstructorCallData });
    console.log("Deploy account Fee =", feeA);


    // fund account address before account creation

     const txE=await account0.execute({contractAddress:ethAddress,entrypoint:"transfer",calldata:[contractOZaddress,cairo.uint256(10**18)]});
     await provider.waitForTransaction(txE.transaction_hash);
    const txT = await account0.execute({ contractAddress: strkAddress, entrypoint: "transfer", calldata: [contractOZaddress, cairo.uint256(8 * 10 ** 15)] });
    await provider.waitForTransaction(txT.transaction_hash);

    const accountOZEth = await contractETH.balanceOf(contractOZaddress) as bigint;
    const accountOZStrk = await contractSTRK.balanceOf(contractOZaddress) as bigint;


    console.log("Account to create : \nETH balance =", formatBalance(accountOZEth, 18));
    console.log("STRK balance =", formatBalance(accountOZStrk, 18));

    console.log("Deploy of contract in progress...");
    const accountOZ = new Account(provider, contractOZaddress, privateKeyOZ,);
    const { transaction_hash: th2, contract_address: accountOZAddress } = await accountOZ.deployAccount({
        classHash: contractOZ080ClassHash,
        constructorCalldata: accountOZconstructorCallData,
        addressSalt: starkKeyPubOZ
    }, { version: 3 });
    console.log("Account deployed at address =", accountOZAddress);
    // // account OZ 070 = "0x06c9cb47e3bb345fcccbba0fc51bac5c706701523a20f203b11dbb66bd648612"
    const txR2 = await provider.waitForTransaction(th2);
    console.log(txR2);
    const accountOZStrk2 = await contractSTRK.balanceOf(contractOZaddress) as bigint;
    console.log("STRK balance 2 =", formatBalance(accountOZStrk2, 18));


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