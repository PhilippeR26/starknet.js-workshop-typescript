// test a contract using Zeroable.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/2.testZeroable.ts
// Coded with Starknet.js v6.9.0

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash } from "starknet";
import { type RPC } from "starknet";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, junoNMtestnet } from "../../../A1priv/A1priv";
import { account1BraavosMainnetAddress, account1BraavosMainnetPrivateKey, alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";

import fs from "fs";
import * as dotenv from "dotenv";
import { ETransactionVersion2 } from "@starknet-io/types-js";
dotenv.config();

async function main() {
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");
  // process.exit(5);

  // initialize existing predeployed account 0 of Devnet
  // console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
  // console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
  // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
  // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
  // **** Sepolia
  const accountAddress0 = account1BraavosSepoliaAddress;
  const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  console.log("Account connected.\n");

  type te=ETransactionVersion2;
  const rrr:te=ETransactionVersion2.V2;

  // // const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  // const testAddress= "0x07be990e59999c2e4210d2e42f99c5701bb641da25ccccad14b206c2f0acb2c2";
  // const testContract = await myProvider.getClassAt(testAddress);
  // const myContract=new Contract( testContract.abi,testAddress,account0);
  // // function : pause(some_param) 
  // // type : some_param: core::zeroable::NonZero::<core::integer::u128>
  // const res=await myContract.invoke("pause",[200]);



  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });