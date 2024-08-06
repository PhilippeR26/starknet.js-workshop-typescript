// Connect a predeployed OZ account in devnet. 
// address and PrivKey are displayed when lanching starknet-devnet, and have been  stored in .env file.
// coded with Starknet.js v5.19.5+commit
// launch with npx ts-node src/scripts/signature/signEIP712-V5.ts

import { Account, ec, hash, json, Contract, encode, shortString, typedData, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData } from "starknet";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//    👇👇👇
// 🚨 launch 'starknet-devnet --seed 0' before using this script
//    👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    console.log("Provider connected");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const accountAddress: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account = new Account(provider, accountAddress, privateKey0);
    console.log('✅ OZ predeployed account 0 connected.');

    // creation of message signature
    // const privateKey = stark.randomAddress();
    const privateKey = privateKey0;
    const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
    console.log("publicKey calculated =", starknetPublicKey, typeof (starknetPublicKey));
    const fullPubKey = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false))); // complete public key
    console.log('fullpubKey =', fullPubKey);

    const message = [1, 128, 18, 14];
    const msgHash = hash.computeHashOnElements(message);
    const signature1: WeierstrassSignatureType = ec.starkCurve.sign(msgHash, privateKey);


    // EIP712
    const typedDataValidate: TypedData = {
        types: {
            StarkNetDomain: [
                { name: "name", type: "string" },
                { name: "version", type: "felt" },
                { name: "chainId", type: "felt" },
            ],
            Airdrop: [
                { name: "address", type: "felt" },
                { name: "amount", type: "felt" }
            ],
            Validate: [
                { name: "id", type: "felt" },
                { name: "from", type: "felt" },
                { name: "amount", type: "felt" },
                { name: "nameGamer", type: "string" },
                { name: "endDate", type: "felt" },
                { name: "itemsAuthorized", type: "felt*" }, // array of felt
                { name: "chkFunction", type: "selector" }, // name of function
                { name: "rootList", type: "merkletree", contains: "Airdrop" } // root of a merkle tree
            ]
        },
        primaryType: "Validate",
        domain: {
            name: "myDapp", // put the name of your dapp to ensure that the signatures will not be used by other DAPP
            version: "1",
            chainId: shortString.encodeShortString("SN_GOERLI"), // shortString of 'SN_GOERLI' (or 'SN_MAIN' or 'SN_GOERLI2'), to be sure that signature can't be used by other network.
        },
        message: {
            id: "0x0000004f000f",
            from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
            amount: "400",
            nameGamer: "Hector26",
            endDate: "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
            itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
            chkFunction: "check_authorization",
            rootList: [
                {
                    address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                    amount: "1554785",
                }, {
                    address: "0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b",
                    amount: "2578248",
                }, {
                    address: "0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1",
                    amount: "4732581",
                }, {
                    address: "0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a",
                    amount: "913548",
                },
            ]
        },
    };
    const signature2: Signature = await account.signMessage(typedDataValidate) as WeierstrassSignatureType;
    console.log("sig2 =", signature2);
    const sig2arr: ArraySignatureType = stark.signatureToHexArray(signature2)
    const sig2rs: WeierstrassSignatureType = signature2;


    // on receiver side, with account (that needs privKey)
    const result = await account.verifyMessage(typedDataValidate, sig2arr);
    console.log("Result by account (boolean)=", result);
    const msgHash5 = typedData.getMessageHash(typedDataValidate, account.address);
    const result3 = await account.verifyMessageHash(msgHash5, sig2arr);
    console.log("Result  by account (boolean)=", result3);
    // on receiver side, without account  (so, without privKey)
    const isVerified = ec.starkCurve.verify(sig2rs, msgHash5, fullPubKey);
    console.log("verified off chain by Noble (boolean) =", isVerified);

    // on receiver side, verify on chain, without account (so, without privKey)
    const compiledAccount = json.parse(fs.readFileSync("./compiledContracts/cairo060/Account_0_5_1.json").toString("ascii"));
    const contractAccount = new Contract(compiledAccount.abi, accountAddress, provider);

    // The call of isValidSignature will generate an error if not valid
    let result2: boolean;
    try {
        await contractAccount.isValidSignature(msgHash5, sig2arr);
        result2 = true;
    } catch {
        result2 = false;
    }
    console.log("Result on-chain (boolean) =", result2);

    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

