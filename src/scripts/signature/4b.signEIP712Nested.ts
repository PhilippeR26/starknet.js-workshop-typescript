// Test an EIP712 message. 
// coded with Starknet.js v5.21.1
// launch with npx ts-node src/scripts/signature/4b.signEIP712test.ts

import { Account, ec, RpcProvider, encode, typedData, Signature, stark, ArraySignatureType, WeierstrassSignatureType, type TypedData } from "starknet";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨 launch in 'starknet-devnet-rs' the command 'cargo run --release -- --seed 0' before using this script
//    👆👆👆
async function main() {
    //initialize Provider with DEVNET
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    console.log("Provider connected");

    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const accountAddress0 = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    console.log('OZ_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey0);
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    console.log('✅ OZ predeployed account 0 connected.');

    // creation of message signature
    // const privateKey = stark.randomAddress();
    const privateKey = privateKey0;
    const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
    const fullPubKey = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false))); // complete public key
    console.log("publicKey calculated =", starknetPublicKey, typeof (starknetPublicKey));
    console.log('fullpubKey =', fullPubKey);

    const typedMessage: TypedData = {
        domain: {
            chainId: "Starknet Mainnet",
            name: "Dappland",
            version: "1.0",
        },
        message: {
            MessageId: 345,
            From: {
                Name: "Edmund",
                Address: "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
            },
            To: {
                Name: "Alice",
                Address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
            },
            Nft_to_transfer: {
                Collection: "Stupid monkeys",
                Address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                Nft_id: 112,
                Negociated_for: {
                    Qty: "18.4569325643",
                    Unit: "ETH",
                    Token_address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                    Amount: "0x100243260D270EB00",
                }
            },
            Comment1: "Monkey with banana, sunglasses,",
            Comment2: "and red hat.",
            Comment3: "",
        },
        primaryType: "TransferERC721",
        types: {
            Account1: [
                {
                    name: "Name",
                    type: "string",
                },
                {
                    name: "Address",
                    type: "felt",
                },
            ],
            Nft: [
                {
                    name: "Collection",
                    type: "string",
                },
                {
                    name: "Address",
                    type: "felt",
                },
                {
                    name: "Nft_id",
                    type: "felt",
                },
                {
                    name: "Negociated_for",
                    type: "Transaction",
                },
            ],
            Transaction: [
                {
                    name: "Qty",
                    type: "string",
                },
                {
                    name: "Unit",
                    type: "string",
                },
                {
                    name: "Token_address",
                    type: "felt",
                },
                {
                    name: "Amount",
                    type: "felt",
                },
            ],
            TransferERC721: [
                {
                    name: "MessageId",
                    type: "felt",
                },
                {
                    name: "From",
                    type: "Account1",
                },
                {
                    name: "To",
                    type: "Account1",
                },
                {
                    name: "Nft_to_transfer",
                    type: "Nft",
                },
                {
                    name: "Comment1",
                    type: "string",
                },
                {
                    name: "Comment2",
                    type: "string",
                },
                {
                    name: "Comment3",
                    type: "string",
                },

            ],
            StarkNetDomain: [
                {
                    name: "name",
                    type: "string",
                },
                {
                    name: "chainId",
                    type: "felt",
                },
                {
                    name: "version",
                    type: "string",
                },
            ],
        },
    };
    const msgHash = typedData.getMessageHash(typedMessage, account0.address);
    //const msgHash=await account0.hashMessage(typedMessage);
    const signature: Signature = await account0.signMessage(typedMessage) as WeierstrassSignatureType;
    const arr: ArraySignatureType = stark.formatSignature(signature);
    const sig2: WeierstrassSignatureType = new ec.starkCurve.Signature(BigInt(arr[0]), BigInt(arr[1]));
    const res = await account0.verifyMessage(typedMessage, sig2);
    console.log(" :>> ", res);
    console.log("Hash =", msgHash, "\nSignature =", signature);

   const signature2: Signature = await account0.signMessage(typedMessage) as WeierstrassSignatureType;
    const verif = ec.starkCurve.verify(signature2, msgHash, fullPubKey);
    console.log("verif outside of Starknet : result =", verif);

    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

