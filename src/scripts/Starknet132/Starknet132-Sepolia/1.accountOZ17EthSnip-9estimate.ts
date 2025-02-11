// Estimate fees of an OpenZeppelin v0.17.0,ETH signature account, upgradable & compatible SNIP-9.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/1.accountOZ17EthSnip-9estimate.ts
// Coded with Starknet.js v6.14.1 & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, shortString, hash, CallData, json, stark, ec, OutsideExecutionVersion, type OutsideExecutionOptions, cairo, type OutsideTransaction, Contract, eth, EthSigner, addAddressPadding, encode, num } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import assert from "assert";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
import type { INVOKE_TXN_RECEIPT } from "@starknet-io/types-js";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --lite-mode' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  // **** Sepolia
  const accountAddress0 = account1BraavosSepoliaAddress;
  const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  console.log("Accounts connected.\n");

  // declare & deploy account
  // const accountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountEthSnip9OZ17.contract_class.json").toString("ascii"));

  // Calculate future address of the  account
  // const privateKeyETH = eth.ethRandomPrivateKey();
  // console.log('account Private Key =', privateKeyETH);
  // const ethSigner = new EthSigner(privateKeyETH);
  // const ethPubKey = await ethSigner.getPubKey();
  // console.log('account Public Key  =', ethPubKey);

  // declared
  const contractClassHash = "0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06";

  // deploy
  // const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(-64))));
  // const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(4, -64))));
  // const salt = pubKeyETHx.low;
  // const myCallData = new CallData(accountSierra.abi);
  // const constructorCallData = myCallData.compile("constructor", { public_key: ethPubKey });
  // console.log("constructor =", constructorCallData);
  // const accountAddress = hash.calculateContractAddressFromHash(salt, contractClassHash, constructorCallData, 0);
  // console.log('Precalculated account address=', accountAddress);

  // // fund account address before account creation
   const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
   const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
  // console.log("initBalance account 0 =",formatBalance((await ethContract.call("balanceOf", [account0.address])) as bigint,18),"ETH");

  // const mintCall=ethContract.populate("transfer",{
  //   recipient: accountAddress,
  //   amount: 1n * 10n ** 16n,
  // });
  // const respTransfer = await account0.execute(mintCall,{maxFee:1n*10n**14n}); // today, standard fees are not enough in Testnet 
  // await myProvider.waitForTransaction(respTransfer.transaction_hash);
  // console.log("account funded.");
  // console.log("final Balance account 0 =",formatBalance((await ethContract.call("balanceOf", [account0.address])) as bigint,18),"ETH");
  // console.log("init Balance ETH account =",formatBalance(await ethContract.call("balanceOf", [accountAddress]) as bigint, 18),"ETH");

  // // deploy account
  // const accountEthOZ17 = new Account(myProvider, accountAddress, ethSigner);
  // const deployAccountPayload = {
  //   classHash: contractClassHash,
  //   constructorCalldata: constructorCallData,
  //   contractAddress: accountAddress,
  //   addressSalt: salt
  // };
  // const { transaction_hash: th, contract_address: accountAXFinalAddress } = await accountEthOZ17.deployAccount(deployAccountPayload, { maxFee: 5n * 10n ** 15n });
  // console.log("Final address =", accountAXFinalAddress);
  // console.log("Account deployed.");
  // await myProvider.waitForTransaction(th);
  // console.log("after account deployed Balance =",await ethContract.call("balanceOf", [accountAddress]));

  // already created :
  const ethSigner = new EthSigner(accountETHoz17snip9PrivateKey);
  const accountEthOZ17 = new Account(myProvider, accountETHoz17snip9Address, ethSigner);
  
  // test fees V2
  console.log("ETH account=", formatBalance(await ethContract.call("balanceOf", [accountEthOZ17.address]) as bigint, 18),"ETH");
  const myCall = ethContract.populate("transfer", {
    recipient: account0.address,
    amount: 1n * 10n ** 5n,
  });
  const res0 = await accountEthOZ17.estimateInvokeFee(myCall, { skipValidate: true });
  console.log("skip Validate =", res0);
  console.log("overall_fee =",formatBalance(res0.overall_fee,18),"ETH" );
  console.log("suggestedMaxFee =",formatBalance(res0.suggestedMaxFee,18),"ETH" );
  
  const res1 = await accountEthOZ17.estimateInvokeFee(myCall, { skipValidate: false });
  console.log("\nincluding Validate =", res1);
  console.log("overall_fee =",formatBalance(res1.overall_fee,18),"ETH" );
  console.log("suggestedMaxFee =",formatBalance(res1.suggestedMaxFee,18),"ETH" );
  const res2 = accountEthOZ17.execute(myCall, { maxFee: 5n * 10n ** 15n });
  const txR = await myProvider.waitForTransaction((await res2).transaction_hash);
  console.log("\nreally spent =",formatBalance(num.toBigInt((txR.value as unknown as INVOKE_TXN_RECEIPT).actual_fee.amount),18),"ETH" );

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
