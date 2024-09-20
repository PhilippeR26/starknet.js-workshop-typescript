// test signature message snip-12 (SNIP-12 old version). 
// launch with npx ts-node src/scripts/signature/4d.signSnip12simple.ts
// coded with Starknet.js v6.12.0+experimental, devnet-rs 0.2.0-rc.2

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData, type BigNumberish, CallData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider();
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local Sepolia Testnet node
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
  type GiftAuthorize = {
    date_start: BigNumberish,
    gift_id: BigNumberish
  };
  const myGift: GiftAuthorize = {
    date_start: 2345,
    gift_id: 101
  };

  const appName = "Gift";
  const myTypedData: TypedData = {
    domain: {
      name: appName,
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      version: "1",
      revision: TypedDataRevision.ACTIVE,
    },
    message: myGift,
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
          name: "date_start",
          type: "felt"
        },
        {
          name: "gift_id",
          type: "u128"
        }
      ]
    }
  }
  console.log("selector domain0=", hash.getSelectorFromName("\"StarknetDomain\"(\"name\":\"shortstring\",\"chainId\":\"shortstring\",\"version\":\"shortstring\")"));
  console.log("selector Message=", hash.getSelectorFromName("\"Message\"(\"date_start\":\"felt\",\"gift_id\":\"u128\")"));

  //  fs.writeFileSync('./tmp.json', json.stringify(typedDataValidate, undefined, 2));
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
  const a=constants.StarknetChainId.SN_MAIN;
  console.log("deployment of contract in progress...");

  const snip12Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo270/snip12message_checkMessageGift.sierra.json").toString("ascii"));
  const snip12Casm = json.parse(fs.readFileSync("./compiledContracts/cairo270/snip12message_checkMessageGift.casm.json").toString("ascii"));
  // class hash = 0x3ad8ba2088fa51a2bb8fbf8ca7688546bbe107a2c3f61385372aad1b3634853
  // addr in Sepolia Testnet = 0xa836bc7b9d9c94885289d49f543b3bed06c9df6f4a12bba4a662fe9390af5a
  const deployResponse = await account0.declareAndDeploy({ contract: snip12Sierra, casm: snip12Casm });
  console.log("class=", deployResponse.declare.class_hash);
  console.log("addr=", deployResponse.deploy.address);
  const contractAddress = deployResponse.deploy.address;
  const snip12Contract = new Contract(snip12Sierra.abi, contractAddress, myProvider);
  const snipCallData = new CallData(snip12Sierra.abi);
  console.log(snip12Contract.functions);

  // const snjsHash = hash.computePoseidonHashOnElements([100, 200, 300]);
  // console.log({ snjsHash });
  // const strkHash = await snip12Contract.test_poseidon(100, 200, 300) as bigint;
  // console.log("strkHash=", num.toHex(strkHash));

  const hashDomain = typedData.getStructHash(myTypedData.types, 'StarknetDomain', myTypedData.domain, TypedDataRevision.ACTIVE);
  console.log("SNJS :", { hashDomain });
  const myCalldata = snipCallData.compile("get_hash_domain", { name: appName, chain: constants.StarknetChainId.SN_SEPOLIA });
  console.log({ myCalldata });
  const domainHash = await snip12Contract.call("get_hash_domain", myCalldata);
  console.log("Starknet: domainHash", num.toHex(domainHash as bigint), num.toHex(domainHash as bigint) == hashDomain ? "is valid ✅" : "is wrong ❌");
  
  const messageHash = await snip12Contract.get_hash_message(myGift, account0.address) as bigint;
  console.log("messageHash", num.toHex(messageHash), num.toHex(messageHash as bigint) == msgHash ? "is valid ✅" : "is wrong ❌");

  console.log("current gift =",await snip12Contract.get_current_gift());
  console.log("process a valid message...");
  const myCall=snip12Contract.populate("process_message", {
    message: myGift,
    signature: stark.formatSignature( signature2)
  })
  const res0=await account0.execute(myCall);
  const txR0=await myProvider.waitForTransaction(res0.transaction_hash);
  const current0=await snip12Contract.get_current_gift();
  console.log("current gift =",current0, num.toBigInt(current0)==num.toBigInt (myGift.gift_id) ? "is valid ✅" : "is wrong ❌");

  console.log("process a wrong message (should fail with 0 value)...");
  const myCall1=snip12Contract.populate("process_message", {
    message: {date_start:myGift.date_start,gift_id: num.toBigInt(myGift.gift_id)+1n},
    signature: stark.formatSignature( signature2)
  })
  const res1=await account0.execute(myCall1);
  const txR1=await myProvider.waitForTransaction(res1.transaction_hash);
  const current1=await snip12Contract.get_current_gift();
  console.log("current gift =",current1, num.toBigInt(current1)==num.toBigInt (myGift.gift_id) ? "is valid ✅" : "is wrong ❌");


  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

