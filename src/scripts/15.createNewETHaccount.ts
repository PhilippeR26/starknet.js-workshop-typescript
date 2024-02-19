// create a new OZ account in devnet
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts
// Coded with Starknet.js v6.0.0, Starknet-devnet-rs v0.1.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants } from "starknet";
import { secp256k1 } from '@noble/curves/secp256k1';

import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../A1priv/A1priv";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_5" }); 

    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // ****** Sepolia
    //  const accountAddress0=account1BraavosSepoliaAddress;
    //  const privateKey0 = account1BraavosSepoliaPrivateKey;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    //const privateKeyETH = eth.ethRandomPrivateKey();
    const privateKeyETH = encode.sanitizeHex(num.toHex("0x45397ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"));
    const noblePublicKey = encode.addHexPrefix(encode.buf2hex(secp256k1.getPublicKey(encode.removeHexPrefix(privateKeyETH), false)));

    const strkPriv = stark.randomAddress();
    //const privateKeyETH = strkPriv;
    console.log('New account :\nprivateKey=', privateKeyETH);
    console.log("strk priv =", strkPriv);
    console.log("strk pub  =", ec.starkCurve.getStarkKey(strkPriv));
    const ethSigner = new EthSigner(privateKeyETH);
    const pubKeyETH = encode.addHexPrefix(encode.removeHexPrefix(await ethSigner.getPubKey()).padStart(128, "0"));
    console.log("nob pub =", noblePublicKey);
    console.log("eth pub =", pubKeyETH);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -64))));
    // const pubKeyETHx = cairo.uint256("0xa9a02d48081294b9bb0d8740d70d3607feb20876964d432846d9b9100b91eefd");
    // const pubKeyETHy = cairo.uint256("0x18b410b5523a1431024a6ab766c89fa5d062744c75e49efb9925bf8025a7c09e");
    const salt = pubKeyETHx.low;
    // const salt="0x35fd004a5c41f16b44b556d166b20ea765075c3d5f22156ef26a55970e622ab";

    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
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
    if (!decClassHash) { await provider.waitForTransaction(declTH) };

    //process.exit(5);
    // Calculate future address of the account
    //const accountCallData=new CallData(compiledETHaccount.abi);
    const accountETHconstructorCalldata = CallData.compile([cairo.tuple(pubKeyETHx, pubKeyETHy)]);
    const contractETHaddress = hash.calculateContractAddressFromHash(salt, decClassHash, accountETHconstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractETHaddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": contractETHaddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy account
    const ETHaccount = new Account(provider, contractETHaddress, ethSigner);
    const transactionHash = hash.calculateDeployAccountTransactionHash(
        {
            contractAddress: contractETHaddress,
            classHash: decClassHash,
            constructorCalldata: accountETHconstructorCalldata,
            salt: salt,
            version: "0x2",
            maxFee: "0x69e5202b42800",
            chainId: constants.StarknetChainId.SN_GOERLI,
            nonce: 0,
        }
    );
    const txHBytes = encode.utf8ToArray(encode.removeHexPrefix(encode.sanitizeHex(transactionHash)));

    console.log("Calculated transaction hash =", transactionHash, txHBytes);
    const nobleSignature = secp256k1.sign(txHBytes, BigInt(privateKeyETH));
    console.log("Noble signature =",num.toHex (nobleSignature.r),num.toHex (nobleSignature.s),nobleSignature.recovery);
    const recoveredPubKey = nobleSignature.recoverPublicKey(encode.removeHexPrefix(encode.sanitizeHex(transactionHash)));
    console.log( "recoveredPubKey =",num.toHex(recoveredPubKey.px),num.toHex(recoveredPubKey.py) );
    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCalldata,
        addressSalt: salt
    }, { skipValidate: true, maxFee: "0x69e5202b42800" }
    );
    await provider.waitForTransaction(transaction_hash);
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
