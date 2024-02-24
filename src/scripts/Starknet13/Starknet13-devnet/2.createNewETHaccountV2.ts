// create a new OZ account in devnet
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants ,Contract} from "starknet";
import { secp256k1 } from '@noble/curves/secp256k1';
import { account1TestnetAddress, account1TestnetPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // ******** Devnet-rs
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    //const privateKeyETH = eth.ethRandomPrivateKey();
    const privateKeyETHraw="0x97ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"; // 3 missing leading zeros to have 32 bytes
    const privateKeyETHformatted = encode.addHexPrefix(encode.removeHexPrefix(privateKeyETHraw).padStart(64, "0"));
    const privateKeyETHbuffer=num.hexToBytes(privateKeyETHraw);

    //const privateKeyETH = strkPriv;
    console.log('New account :\nprivateKey=', privateKeyETHformatted);
    const ethSigner = new EthSigner(privateKeyETHraw);
    const ethSigner2 = new EthSigner(privateKeyETHbuffer);
    const pub=await ethSigner.getPubKey();
    const pub2=await ethSigner2.getPubKey();
    console.log({pub,pub2});
    const pubKeyETH = await ethSigner.getPubKey();
    console.log("eth pub =", pubKeyETH);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -64))));
    const salt = pubKeyETHx.low;
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log("salt    =", num.toHex(salt));
    //process.exit(5);

    //declare ETH account contract
    const compiledETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.sierra.json").toString("ascii")
    );
    const casmETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledETHaccount, casm: casmETHaccount });
    console.log('ETH account class hash =', decClassHash);
    if (declTH) { await provider.waitForTransaction(declTH) } else { console.log("Already declared.") };

    // Calculate future address of the account
    const accountETHconstructorCalldata = CallData.compile([cairo.tuple(pubKeyETHx, pubKeyETHy)]);
    const contractETHaddress = hash.calculateContractAddressFromHash(salt, decClassHash, accountETHconstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractETHaddress);
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
    const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, account0);

    // ******** Devnet- fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": contractETHaddress,
        "amount": 10_000_000_000_000_000_000,
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    const { data: answer2 } = await axios.post('http://127.0.0.1:5050/mint', {
        "address": contractETHaddress,
        "amount": 10_000_000_000_000_000_000,
        "unit": "FRI",
    }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer2); // 10 STRK

    // deploy account
    const ETHaccount = new Account(provider, contractETHaddress, ethSigner, undefined, constants.TRANSACTION_VERSION.V2);
    const feeEstimation = await ETHaccount.estimateAccountDeployFee({ classHash: decClassHash, addressSalt: salt, constructorCalldata: accountETHconstructorCalldata });
    console.log("Fee estim =", feeEstimation);
    const transactionHash = hash.calculateDeployAccountTransactionHash(
        {
            contractAddress: contractETHaddress,
            classHash: decClassHash,
            constructorCalldata: accountETHconstructorCalldata,
            salt: salt,
            version: "0x1",
            maxFee: "0xa9e5202b42800",
            chainId: constants.StarknetChainId.SN_GOERLI,
            nonce: 0,
        }
    );
  
    console.log("Calculated transaction hash =", transactionHash);
    
    // ********* transaction V2
    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCalldata,
        addressSalt: salt
    }, {  maxFee: "0xa9e5202b42800" }
    );

    console.log("Real txH =", transaction_hash);
    const txR = await provider.waitForTransaction(transaction_hash);
    console.log({ txR });
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);


    const balETH = await ethContract.call("balanceOf", [ETHaccount.address]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [ETHaccount.address]) as bigint;
    console.log(" ETH account has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("ETH account has a balance of :", formatBalance(balSTRK, 18), "STRK");

    // ********** test transaction
    const ethContract2 = new Contract(compiledERC20Contract.abi, ethAddress, ETHaccount);
    const respTransfer = await ethContract2.transfer(account0.address, 1 * 10 ** 15);
    console.log("✅ Transfer performed");
    await provider.waitForTransaction(respTransfer.transaction_hash);

    // ********* test declare
    const accountTestSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/name.sierra.json").toString("ascii"));
    const accountTestCasm = json.parse(fs.readFileSync("./compiledContracts/cairo241/name.casm.json").toString("ascii"));
    const feeEstimationDecl = await ETHaccount.estimateDeclareFee({ contract: accountTestSierra, casm: accountTestCasm });
    console.log({ feeEstimationDecl });
    // process.exit(5);

    const { transaction_hash: declTH2, class_hash: decClassHash2 } = await ETHaccount.declareIfNot({ contract: accountTestSierra, casm: accountTestCasm }, { maxFee: feeEstimationDecl.suggestedMaxFee * 2n });
    console.log('test contract class hash =', decClassHash2);
    console.log("✅ Declare proceeded");
    if (declTH2) { await provider.waitForTransaction(declTH2) } else { console.log("Already declared.") };

    // ********** test deploy contract
    const feeEstimationDeploy = await ETHaccount.estimateDeployFee({ classHash: decClassHash2 });
    const { contract_address: deployAddress, transaction_hash: txHDepl } = await ETHaccount.deployContract({ classHash: decClassHash2 }, { maxFee: feeEstimationDeploy.suggestedMaxFee * 2n });
    console.log("deploy address =", deployAddress);
    console.log("✅ Deploy contract performed");
    if (txHDepl) { await provider.waitForTransaction(txHDepl) } else { console.log("Already declared.") };

    console.log('✅ Tests performed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
