// Estimate fees of an OpenZeppelin v0.17.0,ETH signature account, upgradable & compatible SNIP-9.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-devnet/4.accountOZ17EthSnip-9estimate.ts
// Coded with Starknet.js v6.14.1 & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, shortString, hash, CallData, json, stark, ec, OutsideExecutionVersion, type OutsideExecutionOptions, cairo, type OutsideTransaction, Contract, eth, EthSigner, addAddressPadding, encode, num } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import assert from "assert";
import type { SPEC } from "@starknet-io/types-js";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --lite-mode' in devnet-rs directory before using this script.
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
  console.log("Accounts connected.\n");

  // declare & deploy account
  const accountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountEthSnip9OZ17.contract_class.json").toString("ascii"));
  const accountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountEthSnip9OZ17.compiled_contract_class.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountSierra);
  console.log("Class Hash of contract =", ch);

  // Calculate future address of the  account
  const privateKeyETH = eth.ethRandomPrivateKey();
  console.log('account Private Key =', privateKeyETH);
  const ethSigner = new EthSigner(privateKeyETH);
  const ethPubKey = await ethSigner.getPubKey();
  console.log('account Public Key  =', ethPubKey);

  // declare
  const respDecl = await account0.declareIfNot({ contract: accountSierra, casm: accountCasm });
  // const contractClassHash = "0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06";
  const contractClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("OZ17_SNIP-9 account class declared")
  }

  // deploy
  const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(-64))));
  const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(4, -64))));
  const salt = pubKeyETHx.low;
  const myCallData = new CallData(accountSierra.abi);
  const constructorCallData = myCallData.compile("constructor", { public_key: ethPubKey });
  console.log("constructor =", constructorCallData);
  const accountAddress = hash.calculateContractAddressFromHash(salt, contractClassHash, constructorCallData, 0);
  console.log('Precalculated account address=', accountAddress);

  // fund account address before account creation
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
  const mintCall=ethContract.populate("transfer",{
    recipient: accountAddress,
    amount: 1n * 10n ** 16n,
  });
  const respTransfer = await account0.execute(mintCall);
  await myProvider.waitForTransaction(respTransfer.transaction_hash);
  console.log("initBalance of ETH account =",formatBalance((await ethContract.call("balanceOf", [accountAddress])) as bigint,18),"ETH");
  // await l2DevnetProvider.mint(accountAddress, 10n * 10n ** 18n, "WEI");
  // await l2DevnetProvider.mint(accountAddress, 100n * 10n ** 18n, "FRI");
  console.log("account funded.");

  // deploy account
  const accountEthOZ17 = new Account(myProvider, accountAddress, ethSigner);
  const deployAccountPayload = {
    classHash: contractClassHash,
    constructorCalldata: constructorCallData,
    contractAddress: accountAddress,
    addressSalt: salt
  };
  const { transaction_hash: th, contract_address: accountAXFinalAddress } = await accountEthOZ17.deployAccount(deployAccountPayload, { maxFee: 5n * 10n ** 15n });
  console.log("Final address =", accountAXFinalAddress);
  console.log("Account deployed.");
  await myProvider.waitForTransaction(th);
  console.log("after ETH account deployed Balance =",formatBalance((await ethContract.call("balanceOf", [accountAddress])) as bigint,18),"ETH");

  // test fees V2
  const myCall = ethContract.populate("transfer", {
    recipient: account0.address,
    amount: 1n * 10n ** 15n,
  });
  const res0 = await accountEthOZ17.estimateInvokeFee(myCall, { skipValidate: true });
  console.log("skip Validate =", res0);
  const res1 = await accountEthOZ17.estimateInvokeFee(myCall, { skipValidate: false });
  console.log("including Validate =", res1);
  const res2 = accountEthOZ17.execute(myCall, { maxFee: 5n * 10n ** 15n });
  const txR = await myProvider.waitForTransaction((await res2).transaction_hash);
  console.log("after execution ETH account balance =", formatBalance(await ethContract.call("balanceOf", [accountEthOZ17.address]) as bigint, 18),"ETH");

  console.log("really spent =",formatBalance (num.toBigInt((txR.value as SPEC.INVOKE_TXN_RECEIPT).actual_fee.amount),18),"ETH");

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
