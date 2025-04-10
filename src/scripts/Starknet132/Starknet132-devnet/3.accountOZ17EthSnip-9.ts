// Deploy an account : OpenZeppelin v0.20.0,ETH signature, upgradable & compatible SNIP-9.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-devnet/3.accountOZ17EthSnip-9.ts
// Coded with Starknet.js v7.0.1 & devnet-rs v0.3.0 & starknet-devnet.js v0.2.2

import { RpcProvider, Account, shortString, hash, CallData, json, stark, ec, OutsideExecutionVersion, type OutsideExecutionOptions, cairo, type OutsideTransaction, Contract, eth, EthSigner, addAddressPadding, encode } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import assert from "assert";
dotenv.config();


async function balances(accounts: Account[], provider: RpcProvider) {
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, provider);
  console.log("devnet account0   =", formatBalance(await ethContract.call("balanceOf", [accounts[0].address]) as bigint, 18));
  console.log("devnet account1   =", formatBalance(await ethContract.call("balanceOf", [accounts[1].address]) as bigint, 18));
  console.log("devnet accountOZ17=", formatBalance(await ethContract.call("balanceOf", [accounts[2].address]) as bigint, 18), "\n");
}

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
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version,
  );
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
  const accountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo291/account_oz20_AccountEthSnip9OZ20.contract_class.json").toString("ascii"));
  const accountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo291/account_oz20_AccountEthSnip9OZ20.compiled_contract_class.json").toString("ascii"));
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
  // v0.17.0
  // const contractClassHash = "0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06";
  // v0.20.0
  // const contractClassHash = "0x5efa5705ddbfee85b4940570caf39cacf8a526a60690335dbb9001665536b85";
  const contractClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("OZ17_SNIP-9 account class declared")
  }

  // deploy
  const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(-64))));
  const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethPubKey.slice(4, -64))));
  const salt = pubKeyETHx.low;
  const sierraContract = await myProvider.getClassByHash(contractClassHash);
  const myCallData = new CallData(accountSierra.abi);
  const constructorCallData = myCallData.compile("constructor", { public_key: ethPubKey });
  console.log("constructor =", constructorCallData);
  const accountAddress = hash.calculateContractAddressFromHash(salt, contractClassHash, constructorCallData, 0);
  console.log('Precalculated account address=', accountAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAddress, 100n * 10n ** 18n, "FRI");
  console.log("account funded.");

  // deploy account
  const accountOZ17 = new Account(myProvider, accountAddress, ethSigner);
  const deployAccountPayload = {
    classHash: contractClassHash,
    constructorCalldata: constructorCallData,
    contractAddress: accountAddress,
    addressSalt: salt
  };
  const estimatedFees = await accountOZ17.estimateAccountDeployFee(deployAccountPayload, { skipValidate: false });
  console.log("Estimated fee =", estimatedFees);

  const { transaction_hash: th, contract_address: accountAXFinalAddress } = await accountOZ17.deployAccount(deployAccountPayload, { skipValidate: false });
  console.log("Final address =", accountAXFinalAddress);
  console.log("Account deployed.");
  await myProvider.waitForTransaction(th);

  // test of outside Execution.
  const version = await accountOZ17.getSnip9Version();
  if (version === OutsideExecutionVersion.UNSUPPORTED) {
    throw new Error('This account is not SNIP-9 compatible.');
  }
  const callOptions: OutsideExecutionOptions = {
    caller: account0.address,
    execute_after: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    execute_before: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };
  const call1 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account1.address,
      amount: cairo.uint256(1n * 10n ** 15n),
    },
  };
  await balances([account0, account1, accountOZ17], myProvider);
  const outsideTransaction1: OutsideTransaction = await accountOZ17.getOutsideTransaction(callOptions, call1);
  const res0 = await account0.executeFromOutside(outsideTransaction1, { maxFee: 1n * 10n ** 17n });
  await myProvider.waitForTransaction(res0.transaction_hash);
  await balances([account0, account1, accountOZ17], myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
