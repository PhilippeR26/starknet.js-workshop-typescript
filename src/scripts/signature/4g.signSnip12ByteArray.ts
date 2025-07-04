// Test signature message snip-12 with Cairo 2.11.4.
// Cairo 2.11 is no more able to append bytes31 to create a ByteArray.
// So a new contract has been created.
// Launch with npx ts-node src/scripts/signature/4f.signSnip12ByteArray.ts
// coded with Starknet.js v7.6.2, devnet 0.4.3

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData, type BigNumberish, CallData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 Launch Starknet-devnet before using this script
//          👆👆👆

async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider();
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545" }); // local Sepolia Testnet node
  //  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); // Mainnet

  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected");

  // initialize existing predeployed account 0 of Devnet
  const devnetAccounts = await l2DevnetProvider.getPredeployedAccounts();
  const account0Addr = devnetAccounts[0].address;
  const privateKey = devnetAccounts[0].private_key;
  // Sepolia Testnet
  // const account0Addr=account1BraavosSepoliaAddress;
  // const privateKey = account1BraavosSepoliaPrivateKey;


  const fullPublicKey = stark.getFullPublicKey(privateKey);
  const account0 = new Account(myProvider, account0Addr, privateKey);
  console.log("Account 0 connected.\nAddress =", account0.address, "\n");
  // creation of message signature 
  // EIP712
  type LongString = { to_store: BigNumberish[] };
  const irlText: string = "Quae bene cognita si teneas, natura videtur libera continuo, dominis privata superbis, ipsa sua per se sponte omnia dis agere expers. Nam pro sancta deum tranquilla pectora pace, quae placidum degunt aevom vitamque serenam, quis regere immensi summam, quis habere profundi indu manu validas potis est moderanter habenas, quis pariter caelos omnis convertere, et omnis ignibus aetheriis terras suffire feracis.";
  const longString: LongString = { to_store: shortString.splitLongString(irlText) };
  console.log({ longString });

  const appName = "ByteArrayTest";
  const myTypedData: TypedData = {
    domain: {
      name: appName,
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      version: "1",
      revision: TypedDataRevision.ACTIVE,
    },
    message: longString,
    primaryType: "Message",
    types: {
      StarknetDomain: [
        {
          name: "name",
          type: "shortstring",
        },
        {
          name: "chainId",
          type: "shortstring",
        },
        {
          name: "version",
          type: "shortstring",
        },
      ],
      Message: [
        {
          name: "to_store",
          type: "shortstring*"
        }
      ]
    }
  }

  const msgHash = await account0.hashMessage(myTypedData);
  console.log("msgHash=", msgHash);
  // const msgHash2 = typedData.getMessageHash(myTypedData, account0.address);

  const signature1: WeierstrassSignatureType = ec.starkCurve.sign(msgHash, privateKey);
  const signature2: Signature = await account0.signMessage(myTypedData) as WeierstrassSignatureType;
  console.log("sig2 =", signature2);

  const isValid1 = ec.starkCurve.verify(signature1, msgHash, fullPublicKey);
  const isValid = typedData.verifyMessage(myTypedData, signature2, fullPublicKey, account0.address);
  const isValid2 = typedData.verifyMessage(msgHash, signature2, fullPublicKey);
  const isValid3 = await myProvider.verifyMessageInStarknet(myTypedData, signature2, account0.address);
  const isValid4 = await myProvider.verifyMessageInStarknet(msgHash, signature2, account0.address);
  console.log({ isValid, isValid1, isValid2, isValid3, isValid4 });
  console.log("deployment of contract in progress...");

  const snip12Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo2114/snip12_bytearray_test_bytearray.contract_class.json").toString("ascii"));
  const snip12Casm = json.parse(fs.readFileSync("./compiledContracts/cairo2114/snip12_bytearray_test_bytearray.compiled_contract_class.json").toString("ascii"));
  // class hash = 
  // addr in Sepolia Testnet = 
  const deployResponse = await account0.declareAndDeploy({ contract: snip12Sierra, casm: snip12Casm });
  console.log("class=", deployResponse.declare.class_hash);
  console.log("addr=", deployResponse.deploy.address);
  const contractAddress = deployResponse.deploy.address;
  const snip12Contract = new Contract(snip12Sierra.abi, contractAddress, account0);
  const snipCallData = new CallData(snip12Sierra.abi);
  console.log(snip12Contract.functions);

  const hashDomain = typedData.getStructHash(myTypedData.types, 'StarknetDomain', myTypedData.domain, TypedDataRevision.ACTIVE);
  console.log("SNJS hash domain :", { hashDomain });
  const myCalldata = snipCallData.compile("get_hash_domain", { name: appName });
  console.log({ myCalldata });
  const domainHash = await snip12Contract.call("get_hash_domain", myCalldata);
  console.log("Starknet: domainHash", num.toHex(domainHash as bigint), num.toHex(domainHash as bigint) == hashDomain ? "is valid ✅" : "is wrong ❌");

  const hashStruct = typedData.getStructHash(myTypedData.types, 'Message', myTypedData.message, TypedDataRevision.ACTIVE);
  console.log("SNJS hash message struct :", { hashStruct });

  const myCalldata2 = snipCallData.compile("get_hash_struct_message", { struct_array: myTypedData.message });
  console.log({ myCalldata2 });
  const structHash = await snip12Contract.call("get_hash_struct_message", myCalldata2);
  console.log("Starknet: structHash", num.toHex(structHash as bigint), num.toHex(structHash as bigint) == hashStruct ? "is valid ✅" : "is wrong ❌");

  const messageHash = await snip12Contract.get_hash_message(longString, account0.address) as bigint;
  console.log("messageHash", num.toHex(messageHash), num.toHex(messageHash as bigint) == msgHash ? "is valid ✅" : "is wrong ❌");


  const res1 = await snip12Contract.reset_storage();
  await myProvider.waitForTransaction(res1.transaction_hash);
  console.log("initial irl = '" + (await snip12Contract.get_storage()) as string + "'");

  const myCalldataT = snipCallData.compile("to_byte_array", {
    inp: { to_store: shortString.splitLongString(irlText) }
  });
  console.log({ myCalldataT });
  const converted = (await snip12Contract.call("to_byte_array", myCalldataT)) as string;
  console.log("irlT = '" +irlText + "'");
  console.log(irlText.length,converted.length);
  console.log("text = '" +converted + "'", converted == irlText ? "is valid ✅" : "is wrong ❌");

  console.log("process a valid message...");
  const myCall = snip12Contract.populate("process_message", {
    message: longString,
    signature: stark.formatSignature(signature2),
  });
  const res0 = await account0.execute(myCall);
  const txR0 = await myProvider.waitForTransaction(res0.transaction_hash);
  // console.log(txR0);
  const resultIrl = await snip12Contract.get_storage();
  console.log("Result irl = '" + resultIrl + "'", resultIrl == irlText ? "is valid ✅" : "is wrong ❌");


  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
