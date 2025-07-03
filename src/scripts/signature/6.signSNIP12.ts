// test signature message snip-12. 
// launch with npx ts-node src/scripts/signature/6.signSNIP12.ts
// coded with Starknet.js v7.5.1

import { Account, ec, hash, json, Contract, encode, shortString, WeierstrassSignatureType, ArraySignatureType, stark, RpcProvider, Signature, num, type TypedData, constants, TypedDataRevision, typedData, type BigNumberish, CallData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // const l2DevnetProvider = new DevnetProvider();
  // **** Pathfinder Testnet local
   const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.34:9545/rpc/v0_7" }); // local Sepolia Testnet node
  // **** Juno Testnet local
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.34:6070/rpc/v0_7" }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); // Mainnet
  console.log("Provider connected");

  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet-devnet-rs");

  // initialize existing predeployed account 0 of Devnet
  // const devnetAccounts = await l2DevnetProvider.getPredeployedAccounts();
  // const account0Addr = devnetAccounts[0].address;
  // const privateKey = devnetAccounts[0].private_key;
  // Sepolia Testnet
   const account0Addr=account1TestBraavosSepoliaAddress;
   const privateKey = account1TestBraavosSepoliaPrivateKey;

  const fullPublicKey = stark.getFullPublicKey(privateKey);
  const account0 = new Account(myProvider, account0Addr, privateKey);
  console.log("Account 0 connected.\nAddress =", account0.address, "\n");
     const accountAXAddr=account3ArgentXSepoliaAddress;
   const accountAXPrivKey=account3ArgentXSepoliaPrivateKey;
  const accountAX=new Account(myProvider,accountAXAddr,accountAXPrivKey);
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
  //  const msgHash = await account0.hashMessage(myTypedData);
  const msgHash = typedData.getMessageHash(myTypedData, account0.address);
  console.log("msgHash=", msgHash);

  const signature2: Signature = await accountAX.signMessage(myTypedData) as WeierstrassSignatureType;
  console.log("sig2 =", signature2);

  const isValid4 = await myProvider.verifyMessageInStarknet(msgHash, signature2, account0.address);
  console.log({ isValid4 });
  

  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

