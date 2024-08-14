// test signature message snip-12 (SNIP-12 new version). 
// launch with npx ts-node src/scripts/signature/4c.signSnip12vActive.ts
// coded with Starknet.js v6.12.0

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData, CairoCustomEnum } from "starknet";
import PromptSync from "prompt-sync";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();
const prompt = PromptSync();

async function main() {
  // console.log("eee");
  // const result=prompt("ttt");
  // console.log(result);
  // process.exit();
  //initialize Provider with DEVNET, reading .env file
  const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  console.log("Provider connected");

  const account = new Account(provider, "0x12345656868", "0x9776453623451351");
  console.log('✅ account 0 connected.');

  // creation of message signature 
  // EIP712
  const myTypedData: TypedData = {
    domain: {
      name: "WeaponGift",
      chainId: "1",
      version: "1",
      revision: "1",
    },
    message: {
      to_authorize:
        [
          {
            execute_after: 100, 
            execute_before: 200, 
            sub: {
              gift_type: { axle: [] },
              test: 10
            },
          },
          {
            execute_after: 100, 
            execute_before: 200, 
            sub: {
              gift_type: { axle: [] },
              test: 10
            },
          },
        ],
      nonce: 345,
    },
    primaryType: "Authorize",
    types: {
      Authorize: [
        {
          name: "to_authorize",
          type: "Transaction*",
        },

        {
          name: "nonce",
          type: "felt",
        },
      ],
      Transaction: [
        {
          name: "execute_after",
          type: "u128",
        },
        {
          name: "execute_before",
          type: "u128",
        },
        {
          name: "sub",
          type: "Example",
        },
      ],
      Example: [
        {
          name: "gift_type",
          type: "enum",
          contains: "Reward"
        },
        {
          "name": "test",
          "type": "u128"
        }
      ],
      Reward: [
        { name: "sword", type: "()" },
        { name: "axle", type: "()" },
        { name: "shield", type: "()" },
        { name: "crossbow", type: "()" },
      ],
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
        {
          name: "revision",
          type: "shortstring",
        },
      ],
    },
  };


  //  fs.writeFileSync('./tmp.json', json.stringify(typedDataValidate, undefined, 2));
  const signature2: Signature = await account.signMessage(myTypedData) as WeierstrassSignatureType;
  console.log("sig2 =", signature2);




  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

