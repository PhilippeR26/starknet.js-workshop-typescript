// test signature message snip-12 (SNIP-12 old version). 
// launch with npx ts-node src/scripts/signature/4f.signSnip12ByteArray.ts
// coded with Starknet.js v6.14.1, devnet-rs 0.2.0

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData, type BigNumberish, CallData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆

function nbCar(inp: string): number {
  let val: bigint = num.toBigInt(inp);
  let nbCar: number = 0;
  if (val > 0) nbCar += 1;
  while (val / num.toBigInt("0x100") > 0) {
    nbCar += 1;
    val /= num.toBigInt("0x100");
  }
  return nbCar;
}

async function main() {
  console.log("65&", num.toBigInt("0x65") & num.toBigInt("0xff00000000000000000000000000000000000000000000000000000000000000"));
  console.log("31 char&", num.toBigInt("0x4c696b6520696d6d757461626c65207661726961626c65732c20636f6e7374") & num.toBigInt("0xff000000000000000000000000000000000000000000000000000000000000"));
  console.log("0x7365 / 0x100", num.toHex(num.toBigInt("0x7365") / num.toBigInt(0x100)));
  console.log("nb31 =", nbCar("0x4c696b6520696d6d757461626c65207661726961626c65732c20636f6e7374"));
  console.log("nb4 =", nbCar("0x4c696b65"));
  console.log("nb1 =", nbCar("0x65"));
  console.log("nb0 =", nbCar("0x00"));

  // process.exit();

  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider();
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545" }); // local Sepolia Testnet node
  //  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); // Mainnet
  console.log("Provider connected");

  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet-devnet-rs");

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
  const irlText: string = "Like immutable variables, constants are values that are bound to a name.";
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
  // console.log("deployment of contract in progress...");

  const snip12Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/build_bytearray_test_bytearray.contract_class.json").toString("ascii"));
  const snip12Casm = json.parse(fs.readFileSync("./compiledContracts/cairo282/build_bytearray_test_bytearray.compiled_contract_class.json").toString("ascii"));
  // // class hash = 0x3ad8ba2088fa51a2bb8fbf8ca7688546bbe107a2c3f61385372aad1b3634853
  // // addr in Sepolia Testnet = 0xa836bc7b9d9c94885289d49f543b3bed06c9df6f4a12bba4a662fe9390af5a
  const deployResponse = await account0.declareAndDeploy({ contract: snip12Sierra, casm: snip12Casm });
  console.log("class=", deployResponse.declare.class_hash);
  console.log("addr=", deployResponse.deploy.address);
  const contractAddress = deployResponse.deploy.address;
  const snip12Contract = new Contract(snip12Sierra.abi, contractAddress, account0);
  const snipCallData = new CallData(snip12Sierra.abi);
  console.log(snip12Contract.functions);

  const hashDomain = typedData.getStructHash(myTypedData.types, 'StarknetDomain', myTypedData.domain, TypedDataRevision.ACTIVE);
  console.log("SNJS hash domain :", { hashDomain });
  const myCalldata = snipCallData.compile("get_hash_domain", { name: appName, chain: constants.StarknetChainId.SN_SEPOLIA });
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

  const myCalldataL0 = snipCallData.compile("bytes31_len", {
    inp: shortString.splitLongString(irlText)[0]
  });
  console.log({ myCalldataL: myCalldataL0 });
  console.log("len bytes31[0] =", await snip12Contract.call("bytes31_len", myCalldataL0));

  const myCalldataL2 = snipCallData.compile("bytes31_len", {
    inp: shortString.splitLongString(irlText)[2]
  });
  console.log({ myCalldataL2 });
  console.log("len bytes31[2] =", await snip12Contract.call("bytes31_len", myCalldataL2));

  const str1="e";
  console.log("0x65 =", shortString.encodeShortString(str1));
  console.log("0x65 len =", await snip12Contract.call("bytes31_len", [str1]));
  console.log("testdiv 0x65 =", num.toHex((await snip12Contract.call("test_div", ["0x65"])) as bigint));
  console.log("testdiv 0x7365 =", num.toHex((await snip12Contract.call("test_div", ["0x7365"])) as bigint));


  const myCalldataT = snipCallData.compile("bytes31_array_to_byte_array", [shortString.splitLongString(irlText)]
  );
  console.log({ myCalldataT });
  console.log("text = '" + await snip12Contract.call("bytes31_array_to_byte_array", myCalldataT) + "'");

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




  // console.log("process a wrong message (should fail with 0 value)...");
  // const myCall1=snip12Contract.populate("process_message", {
  //   message: {date_start:myGift.date_start,gift_id: num.toBigInt(myGift.gift_id)+1n},
  //   signature: stark.formatSignature( signature2)
  // })
  // const res1=await account0.execute(myCall1);
  // const txR1=await myProvider.waitForTransaction(res1.transaction_hash);
  // const current1=await snip12Contract.get_current_gift();
  // console.log("current gift =",current1, num.toBigInt(current1)==num.toBigInt (myGift.gift_id) ? "is valid ✅" : "is wrong ❌");


  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

