// test signature message snip-12 (SNIP-12 old version). 
// launch with npx ts-node src/scripts/signature/4d.signSnip12simple.ts
// coded with Starknet.js v6.12.0+experimental

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider();
  console.log("Provider connected");

  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet-devnet-rs");

  // initialize existing predeployed account 0 of Devnet
  const devnetAccounts = await l2DevnetProvider.getPredeployedAccounts();
  const privateKey = devnetAccounts[0].private_key;
  const fullPublicKey = ec.getFullPublicKey(privateKey);
  const account0 = new Account(myProvider, devnetAccounts[0].address, privateKey);
  console.log("Account 0 connected.\nAddress =", account0.address, "\n");
  // creation of message signature 
  // EIP712
  const message = [
    { description: "no tags", tags: undefined },
    { description: "empty tags", tags: [] },
    {
      description: "single tag",
      tags: [{ name: "Content-Type", value: "image/png" }],
    },
    {
      description: "multiple tags",
      tags: [
        { name: "Content-Type", value: "image/png" },
        { name: "hello", value: "world" },
        { name: "lorem", value: "ipsum" },
      ],
    },
  ];

  const myTypedData: TypedData = {
    domain: {
      name: "Dappland",
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      version: "1.0.2",
      revision: TypedDataRevision.ACTIVE,
    },
    message: {
      tag: 2345
    },
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
          name: "tag",
          type: "u128"
        }
      ]
    }
  }

  //  fs.writeFileSync('./tmp.json', json.stringify(typedDataValidate, undefined, 2));
  const msgHash = await account0.hashMessage(myTypedData);
  const msgHash2 = typedData.getMessageHash(myTypedData, account0.address);

  const signature1: WeierstrassSignatureType = ec.starkCurve.sign(msgHash, privateKey);
  const signature2: Signature = await account0.signMessage(myTypedData) as WeierstrassSignatureType;
  console.log("sig2 =", signature2);

  const isValid1 = ec.starkCurve.verify(signature1, msgHash, fullPublicKey);
  const isValid = typedData.verifyMessage(myTypedData, signature2, fullPublicKey, account0.address);
  const isValid2 = typedData.verifyMessage(msgHash, signature2, fullPublicKey);
  const isValid3 = await myProvider.verifyMessageInStarknet(myTypedData, signature2, account0.address);
  const isValid4 = await myProvider.verifyMessageInStarknet(msgHash, signature2, account0.address);
  console.log({ isValid, isValid1, isValid2, isValid3, isValid4 });
  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

