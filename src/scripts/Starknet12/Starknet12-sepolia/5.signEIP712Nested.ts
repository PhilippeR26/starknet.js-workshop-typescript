// Test an EIP712 message. 
// launch with npx ts-node src/scripts/Starknet12/Starknet12-sepolia/5.signEIP712Nested.ts
// coded with Starknet.js v6.7.0 + sepolia

import { Account, ec, hash, RpcProvider, json, Contract, encode, shortString, typedData, WeierstrassSignatureType, constants, Signature, stark, CallData, num, type TypedData } from "starknet";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, } from "../../../A1priv/A1priv";

import * as dotenv from "dotenv";
import fs from "fs";
import { SignatureType } from "@noble/curves/abstract/weierstrass";
import { sign } from "crypto";
import { ethAddress } from "../../utils/constants";
dotenv.config();

//    👇👇👇
// 🚨 launch in 'starknet-devnet-rs' the command 'cargo run --release -- --seed 0' before using this script
//    👆👆👆
async function main() {
    //initialize Provider with local Pathfinder Sepolia
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" });
    const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    console.log('STARKNET provider connected.');

    // initialize existing pre-deployed account 0
    const accountAddress0 = account0OZSepoliaAddress;
    const privateKey0 =  account0OZSepoliaPrivateKey;
    console.log('OZ_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey0);
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('✅deployed account 0 connected.');

    // creation of message signature
    // const privateKey = stark.randomAddress();
    const privateKey = privateKey0;
    const fullPubKey = encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false)); // complete public key
    const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
    console.log("publicKey calculated =", starknetPublicKey, typeof (starknetPublicKey));
    console.log('fullpubKey =', fullPubKey);

    const typedMessage : TypedData = {
        "types": {
          "StarkNetDomain": [
            { "name": "name", "type": "felt" },
            { "name": "version", "type": "felt" },
            { "name": "chainId", "type": "felt" }
          ],
          "Person": [
            { "name": "name", "type": "felt" },
            { "name": "wallet", "type": "felt" }
          ],
          "Mail": [
            { "name": "from", "type": "Person" },
            { "name": "to", "type": "Person" },
            { "name": "contents", "type": "felt" }
          ]
        },
        "primaryType": "Mail",
        "domain": {
          "name": "StarkNet Mail",
          "version": "1",
          "chainId": 1
        },
        "message": {
          "from": {
            "name": "Cow",
            "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          "to": {
            "name": "Bob",
            "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          "contents": "Hello, Bob!"
        }
      }
      
    const msgHash=typedData.getMessageHash(typedMessage,account0.address);
    console.log("msgHash=",msgHash);
    const msgHashAcc=await account0.hashMessage(typedMessage);
    console.log("msgHashAcc=",msgHashAcc);

    const signature  = await account0.signMessage(typedMessage);
    const sigArray=stark.formatSignature(signature);
    console.log("Signature =", signature,"\n",sigArray);
    // const res = await account0.verifyMessage(typedMessage, signature);
    // console.log("bool response >> ", res);
     const res2 = await account0.verifyMessageHash(msgHash, sigArray);
     console.log("bool response >> ", res2);
   const resp=await account0.callContract({
        contractAddress: account0.address,
        entrypoint: 'isValidSignature',
        calldata: CallData.compile({
          hash: num.toBigInt(msgHash).toString(),
          signature: sigArray,
        }),
      });
      console.log("resp=", shortString.decodeShortString(resp[0]));

    const isVerified=ec.starkCurve.verify(signature as SignatureType, msgHash, fullPubKey);
    console.log("verified by Noble (boolean) =",isVerified);

    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

