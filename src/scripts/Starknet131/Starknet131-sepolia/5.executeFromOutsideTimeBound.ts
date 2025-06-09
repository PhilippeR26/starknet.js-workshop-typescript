// SNIP-9 execute transactions from outside.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/5.executeFromOutsideTimeBound.ts
// Coded with Starknet.js v7.4.0 + experimental 

import { RpcProvider, Account, Contract, json, cairo, shortString, OutsideExecutionVersion, type OutsideTransaction } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
import { outsideExecution, OutsideExecutionOptions } from 'starknet';
import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey } from "../../../A1priv/A1priv";
import { displayBalances } from "../../utils/displayBalances";

dotenv.config();


async function main() {
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8", specVersion: "0.8.1" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = accountSTRKoz20snip9Address;
  const privateKey0 = accountSTRKoz20snip9PrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account1 = new Account(myProvider, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey);
  console.log("Accounts connected.\n");

  console.log("Account0 (signer) =");
  await displayBalances(account0.address, myProvider);
  console.log("\nAccount1 (executor) =");
  await displayBalances(account1.address, myProvider);
  // 
  // ******************** Create outside executions
  //
  console.log("account0 version =", await account0.getSnip9Version());
  console.log("account1 version =", await account1.getSnip9Version());

  const now0 = Math.floor(Date.now() / 1000);
  const lastBlockTimestamp = (await myProvider.getBlock()).timestamp;
  console.log("Now Unix      =", now0, "\nlast Starknet =", lastBlockTimestamp);
  const callOptions: OutsideExecutionOptions = {
    // caller: "ANY_CALLER",
    caller: account1.address,
    execute_after: 0, // must be lower than last block timestamp to be able to proceed immediately
    execute_before: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };


  const call1 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account1.address,
      amount: cairo.uint256(1n * 10n ** 14n),
    },
  };

  // account A is compatible with SNIP-9
  const outsideTransaction1: OutsideTransaction = await account0.getOutsideTransaction(callOptions, call1);
  console.log("OT1 =", outsideTransaction1);
  // account B can be not compatible with SNIP-9
  // no mandatory order to proceed
  const res0 = await account1.executeFromOutside(outsideTransaction1);
  await myProvider.waitForTransaction(res0.transaction_hash);
  console.log("Account0 (signer) =");
  await displayBalances(account0.address, myProvider);
  console.log("\nAccount1 (executor) =");
  await displayBalances(account1.address, myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });