// test signature message snip-12 v2. 
// launch with npx ts-node src/scripts/signature/4c.signSnip12vActive.ts
// coded with Starknet.js v6.12.0

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData } from "starknet";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();
async function main() {
    //initialize Provider with DEVNET, reading .env file
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    console.log("Provider connected");

     const account = new Account(provider, "0x12345656868", "0x9776453623451351");
    console.log('✅ account 0 connected.');

    // creation of message signature 
    // EIP712
    const typedDataValidate: TypedData = {
        domain: {
          name: "Dappland",
          chainId: constants.StarknetChainId.SN_SEPOLIA,
          version: "1.0.2",
          revision: TypedDataRevision.ACTIVE,
          // hashing_function:"pedersen" // or "poseidon". Mandatory for Braavos
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
            Negotiated_for: {
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
              name: "Negotiated_for",
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
          StarknetDomain: [
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
            // {
            //   name: "hashing_function",
            //   type: "string",
            // },
          ],
        },
      };
    const signature2: Signature = await account.signMessage(typedDataValidate) as WeierstrassSignatureType;
    console.log("sig2 =", signature2);
    



    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

