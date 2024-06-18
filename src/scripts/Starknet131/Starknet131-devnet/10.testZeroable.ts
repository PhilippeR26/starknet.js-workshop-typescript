// test a contract using Zeroable.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/2.testZeroable.ts
// Coded with Starknet.js v6.9.0

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish } from "starknet";
import { type RPC } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ETransactionVersion2 } from "@starknet-io/types-js";
dotenv.config();

async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");
  // process.exit(5);

  // *** initialize existing predeployed account 0 of Devnet
  console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
  console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
  const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
  const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  console.log("Account connected.\n");

  type te=ETransactionVersion2;
  const rrr:te=ETransactionVersion2.V2;

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/zeroable.sierra.json").toString("ascii"));
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/zeroable.casm.json").toString("ascii"));
  const constructor = CallData.compile([]);
  const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm, constructorCalldata: constructor });
  console.log(deployResponse);
  const testContract = new Contract(compiledSierra.abi, deployResponse.deploy.contract_address, account0);

  type Point = {
    x: BigNumberish,
    y: BigNumberish,
    z: BigNumberish
  }

  type InFlight = {
    position: Point
  }

  // fn get_nonZero_u128(self: @TContractState) -> NonZero:: <u128>;
  // fn send_nonZero_u64(self: @TContractState, inp: NonZero:: <u64>) -> u64;
  // fn get_nonZero_felt(self: @TContractState) -> NonZero:: <felt252>;
  // fn send_nonZero_felt(self: @TContractState, inp: NonZero:: <felt252>) -> felt252;
  // fn get_nonZero_u256(self: @TContractState) -> NonZero:: <u256>;
  // fn send_nonZero_u256(self: @TContractState, inp: NonZero:: <u256>) -> u256;
  // fn get_nonZero_struct(self: @TContractState) -> InFlight;
  // fn send_nonZero_struct(self: @TContractState, where: InFlight) -> bool;

  const res0 = (await testContract.call("get_nonZero_u128")) as bigint;
  console.log("NonZero::<u128>", res0);
  const res1 = await testContract.call("get_nonZero_felt");
  console.log("NonZero::<felt252>", res1);
  const res3 = (await testContract.call("get_nonZero_u256")) as bigint;
  console.log("NonZero::<u256>", num.toHex(res3));
  const res4 = (await testContract.call("get_nonZero_struct")) as InFlight;
  console.log("struct NonZero::<u256>", res4,"\n",num.toHex(res4.position.z));

  const res2 = await testContract.call("send_nonZero_u64", [200]);
  console.log("send NonZero::<u64>", res2);
  const res5 = await testContract.call("send_nonZero_felt", [300]);
  console.log("send NonZero::<felt252>", res5);
  const res6 = (await testContract.call("send_nonZero_u256", ["0x5656236523452345234523524524510abcabcabcabcabcabcabacabcabbacab"])) as bigint;
  console.log("send NonZero::<u256>", num.toHex(res6));
  const pt:Point={x:100,y:200,z:"0x5656236523452345234523524524510abcabcabcabcabcabcabacabcabbacab"};
  const where:InFlight={position:pt};
  const res7 = (await testContract.call("send_nonZero_struct", [where])) as boolean;
  console.log("send struct NonZero::<u256>", res7);
  const myCalldata=new CallData(testContract.abi);
  const myCall=myCalldata.compile("send_nonZero_struct",{where});
  console.log("myCall=",myCall);
  const res8 = await testContract.call("send_nonZero_struct",myCall);
  console.log("call : send struct NonZero::<u256>", res8);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });