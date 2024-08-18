// Test an ArgentX 0.4.0 account using secp256r1 signature (NIST P256)
// launch with npx ts-node src/scripts/signature/16.testAccountSecp256r1.ts
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.2 & starknet-devnet.js v0.1.0

import { RpcProvider, Account, Contract, json, cairo, shortString, EOutsideExecutionVersion, type OutsideTransaction, hash, CallData, CairoCustomEnum, CairoOption, CairoOptionVariant, encode, stark, constants, num, type Call } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../utils/formatBalance";
import { ethAddress, strkAddress } from "../utils/constants";
import { deployAccountArgentX4secp256r1 } from "../Starknet131/Starknet131-devnet/19.deployArgentX4secp256r1";
import { p256RandomPrivateKey, ArgentP256Signer } from "./15.signerArgentSecp256r1";
import type { DeployAccountResp } from "../utils/types";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script.
//          👆👆👆


async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  console.log("Account0 connected.\n");

  // *********** Deploy P256 account *************
  const accountAX4definition = await deployAccountArgentX4secp256r1(myProvider, account0);

  //
  // *********** test account *************
  //

  const accountAX4P256: Account = accountAX4definition.account;

  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  console.log("P256 account=", formatBalance(await ethContract.call("balanceOf", [accountAX4P256.address]) as bigint, 18));
  console.log("account1 account=", formatBalance(await ethContract.call("balanceOf", [account1.address]) as bigint, 18));
  const myCall1: Call = ethContract.populate("transfer", {
    recipient: account1.address,
    amount: cairo.uint256(1n * 10n ** 18n),
  });
  console.log("myCall =",myCall1);
  console.log("transfer of 1 ETH in progress...");
  const res = await accountAX4P256.execute(myCall1,{maxFee:1n * 10n ** 16n}); // super extra fees needed
  const txR=await myProvider.waitForTransaction(res.transaction_hash);
  console.log(txR.value);
  console.log("P256 account=", formatBalance(await ethContract.call("balanceOf", [accountAX4P256.address]) as bigint, 18));
  console.log("account1 account=", formatBalance(await ethContract.call("balanceOf", [account1.address]) as bigint, 18));

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });