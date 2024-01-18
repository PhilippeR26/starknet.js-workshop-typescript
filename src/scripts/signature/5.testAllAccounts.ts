// Test an EIP712 message. Verification wit ArgentX, Braavos, OpenZeppelin
// coded with Starknet.js v6.0.0 beta6+special
// launch with npx ts-node src/scripts/signature/5.testAllAccounts.ts

import { Account, ec, RpcProvider, encode, typedData, Signature, stark, ArraySignatureType, WeierstrassSignatureType,json,CallData, hash, cairo } from "starknet";

import * as dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import { account2BraavosTestnetAddress, account2BraavosTestnetPrivateKey, account3TestnetAddress, account3TestnetPrivateKey } from "../../A1priv/A1priv";
import LogC from "../utils/logColors";
dotenv.config();

//    👇👇👇
// 🚨 launch in 'starknet-devnet-rs' the command 'cargo run --release -- --seed 0' before using this script
//    👆👆👆

async function createOZ():Promise<{OZaddr:string,OZpk:string}> {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin account v0.8.0 (Cairo 1) :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    // or for random private key :
    //const privateKey = stark.randomAddress();
    console.log('New account OZ080 :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);
    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.sierra.json").toString("ascii")
    );
    const casmOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo231/openzeppelin080Account.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZAccount, casm: casmOZAccount });
    console.log('OpenZeppelin account class hash =', decClassHash);
    if (declTH) await provider.waitForTransaction(declTH);

    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash( starkKeyPub,decClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);
    
    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": OZcontractAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    
    // deploy account
    const OZaccount = new Account(provider, OZcontractAddress, privateKey);
    const { suggestedMaxFee: estimatedFee1 } = await OZaccount.estimateAccountDeployFee({ 
        classHash: decClassHash, 
        addressSalt: starkKeyPub, 
        constructorCalldata: OZaccountConstructorCallData });
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({ 
        classHash: decClassHash, 
        constructorCalldata: OZaccountConstructorCallData, 
        addressSalt: starkKeyPub 
    }, { maxFee: estimatedFee1*11n/10n });
    //const { transaction_hash, contract_address } = await OZaccount.deployAccount({ classHash: OZaccountClashHash, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub }); // without estimateFee
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);
    return {OZaddr:contract_address,OZpk:privateKey}

}

async function createAX():Promise<{AXaddr:string,AXpk:string}> {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");
    
    const accountAXsierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/ArgentXaccount030.sierra.json").toString("ascii"));
    const accountAXcasm = json.parse(fs.readFileSync("./compiledContracts/cairo200/ArgentXaccount030.casm.json").toString("ascii"));
    const ch=hash.computeContractClassHash(accountAXsierra);
    console.log("Class Hash of ArgentX contract =",ch);
    
    // Calculate future address of the ArgentX account
    const privateKeyAX = stark.randomAddress();
    console.log('AX account Private Key =', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX account Public Key  =', starkKeyPubAX);
    
    // declare
    const respDecl=await account0.declareIfNot({contract:accountAXsierra,casm:accountAXcasm});
    const contractAXclassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
    //const contractAXclassHash=respDecl.class_hash;
    await provider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX Cairo 1 contract declared")

    const calldataAX = new CallData(accountAXsierra.abi);
    const ConstructorAXCallData = calldataAX.compile("constructor", {
        owner: starkKeyPubAX,
        guardian: "0"
    });
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, ConstructorAXCallData, 0);
    console.log('Precalculated account address=', accountAXAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": accountAXAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH

    // deploy ArgentX account
    const accountAX = new Account(provider, accountAXAddress, privateKeyAX); 
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: ConstructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAddress } = await accountAX.deployAccount(deployAccountPayload);
    console.log("Final address =",accountAXFinalAddress);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');
    return {AXaddr:accountAXFinalAddress,AXpk:privateKeyAX}
}

async function main() {
    //initialize Provider with DEVNET
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    console.log("Provider connected");
    const providerTestnet= new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_6" });

    // initialize existing pre-deployed account 0 of Devnet
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const accountAddress0 = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    console.log('OZ_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey0);
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('✅ OZ pre-deployed account 0 connected.');

    // creation of message signature
    // const privateKey = stark.randomAddress();
    const privateKey = privateKey0;
    const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
    const fullPubKey = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false))); // complete public key
    console.log("publicKey calculated =", starknetPublicKey, typeof (starknetPublicKey));
    console.log('fullPubKey =', fullPubKey);

    //devnet
    const {OZaddr,OZpk}=await createOZ();
    const OZaccount=new Account(provider,OZaddr,OZpk);
    // const {AXaddr,AXpk}=await createAX();
    const AXaccount=new Account(providerTestnet,account3TestnetAddress,account3TestnetPrivateKey);
    // testnet
    const {BRaddr,BRpk}={BRaddr:account2BraavosTestnetAddress,BRpk:account2BraavosTestnetPrivateKey}
    const BRaccount=new Account(providerTestnet,BRaddr,BRpk);


    const typedMessage: typedData.TypedData = {
        domain: {
            chainId: "Starknet Mainnet",
            name: "Dappland",
            version: "1.0",
            hashing_function: "pedersen"
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
                    Amount: 18456932564300000000n,
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
                {
                    name: "hashing_function",
                    type: "string",
                },
            ],
        },
    };
    const msgHash = typedData.getMessageHash(typedMessage, account0.address);
    //const msgHash=await account0.hashMessage(typedMessage);
    const signature0: Signature = await account0.signMessage(typedMessage);
    const arr: ArraySignatureType = stark.formatSignature(signature0);
    const sig2: WeierstrassSignatureType = new ec.starkCurve.Signature(BigInt(arr[0]), BigInt(arr[1]));
    const res = await account0.verifyMessage(typedMessage, sig2);
    console.log(" :>> ", res);
    console.log("Hash =", msgHash, "\nSignature =", signature0);

    console.log(LogC.fg.blue,"▶️ Verify Devnet-OZ050 (cairo 0):",LogC.reset);
    const signatureOZ0: Signature = await account0.signMessage(typedMessage);
    const signatureOZ: Signature = await OZaccount.signMessage(typedMessage);
    const resOZ0 = await account0.verifyMessage(typedMessage, signatureOZ0);
    console.log("isValidSignature OZ050 with signature valid :",resOZ0);
    try{
        const resOZ0wrong = await account0.verifyMessage(typedMessage, signatureOZ);
        console.log("isValidSignature OZ050 with wrong signature :",resOZ0wrong);
    } catch (err) {
        console.log("isValidSignature OZ050 with wrong signature : fail", err);

    }

    console.log(LogC.fg.blue,"▶️ Verify Devnet-OZ080 :",LogC.reset);
    const resOZ = await OZaccount.verifyMessage(typedMessage, signatureOZ);
    console.log("isValidSignature OZ080 with signature valid :",resOZ);
    try{
    const resOZwrong = await OZaccount.verifyMessage(typedMessage, signature0);
    console.log("isValidSignature OZ080 with wrong signature :",resOZwrong);
    }catch(err){
    console.log("isValidSignature OZ080 with wrong signature : fail",err);
    }

    console.log(LogC.fg.blue,"▶️ Verify Devnet-ArgentX :",LogC.reset);
    const signatureAX: Signature = await AXaccount.signMessage(typedMessage);
    const resAX = await AXaccount.verifyMessage(typedMessage, signatureAX);
    console.log("isValidSignature AX with signature valid :",resAX);
    try{
    const resAXwrong = await AXaccount.verifyMessage(typedMessage, signature0);
    console.log("isValidSignature AX with wrong signature :",resAXwrong);
    }catch(err){
    console.log("isValidSignature AX with wrong signature : fail",err);
    }

    console.log(LogC.fg.blue,"▶️ Verify Devnet-Braavos :",LogC.reset);
    const signatureBR: Signature = await BRaccount.signMessage(typedMessage);
    const resBR = await BRaccount.verifyMessage(typedMessage, signatureBR);
    console.log("isValidSignature BR with signature valid :",resBR);
    try{
    const resBRwrong = await BRaccount.verifyMessage(typedMessage, signature0);
    console.log("isValidSignature BR with wrong signature :",resBRwrong);
    }catch(err){
    console.log("isValidSignature BR with wrong signature : fail",err);
    }

    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

