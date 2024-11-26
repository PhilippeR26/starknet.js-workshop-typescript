// test encoding/decoding of Buffer to send a binary ByteArray
// launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/2.sendBytes.ts
// Coded with Starknet.js v6.14.1

import { BigNumberish, shortString, num, byteArray, RpcProvider, Account, json, Contract, CallData, parseCalldataField, type ByteArray, encode, Call } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
// import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config();




async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
  // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  //const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = "0x02579c9648C12448C2BD146a8F3b10294eE3E9F904D604B84a9881db268bE303";
  const privateKey0 = "0x06d03790ab394535c840f72c780ebbec24d3b485465939e49b4ab20c121e1a78";
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);

  

  // **** if deployed in Sepolia :
  const address = "0x07f1bfe30248603d742c4134f25057d03e520d80b65f11febf68434df2972f32";
  const {abi}=await myProvider.getClassAt(address);
 // console.log(abi);
  const myContract=new Contract(abi,address,account0);
  type PostParams={
     content_URI: string,
     profile_address: BigNumberish,
     channel_id: BigNumberish,
     community_id: BigNumberish,
  };
  const params:PostParams={
    content_URI:"zert/eezrt/tre/eyeryreyr/sqfqsfqsfd/sfgsdfgsddsy.gif",
    profile_address:"0x12345",
    channel_id:2,
    community_id:3
  }
  const myCall:Call=myContract.populate("post",{post_params:params});
  const resp=await account0.execute(myCall,{maxFee:10n**14n});
  
  console.log("✅ end of script.");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


