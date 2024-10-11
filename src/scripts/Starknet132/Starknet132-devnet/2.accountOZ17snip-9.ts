// Deploy an account : OpenZeppelin v0.17.0, upgradable & compatible SNIP-9.
// Launch with npx ts-node src/scripts/Starknet132/Starknet132-devnet/2.accountOZ17snip-9.ts
// Coded with Starknet.js v6.14.1 & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, shortString, hash, CallData, json, stark, ec, OutsideExecutionVersion, type OutsideExecutionOptions, cairo, type OutsideTransaction, Contract } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();


async function balances(accounts: Account[], provider: RpcProvider) {
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, provider);
  console.log("devnet account0   =", formatBalance(await ethContract.call("balanceOf", [accounts[0].address]) as bigint, 18));
  console.log("devnet account1   =", formatBalance(await ethContract.call("balanceOf", [accounts[1].address]) as bigint, 18));
  console.log("devnet accountOZ17=", formatBalance(await ethContract.call("balanceOf", [accounts[2].address]) as bigint, 18),"\n");
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
  const accountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.contract_class.json").toString("ascii"));
  const accountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.compiled_contract_class.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountSierra);
  console.log("Class Hash of contract =", ch);

  // Calculate future address of the  account
  const privateKey = stark.randomAddress();
  console.log('account Private Key =', privateKey);
  const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
  console.log('account Public Key  =', starkKeyPub);

  // declare
  const respDecl = await account0.declareIfNot({ contract: accountSierra, casm: accountCasm });
  // const contractClassHash = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
  const contractClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("OZ17_SNIP-9 account class declared")
  }

  const calldata = new CallData(accountSierra.abi);
  const constructorCallData = calldata.compile("constructor", {
    public_key: starkKeyPub,
  });
  console.log("constructor =", constructorCallData);
  const accountAddress = hash.calculateContractAddressFromHash(starkKeyPub, contractClassHash, constructorCallData, 0);
  console.log('Precalculated account address=', accountAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAddress, 100n * 10n ** 18n, "FRI");
  console.log("account funded.");

  // deploy account
  const accountOZ17 = new Account(myProvider, accountAddress, privateKey);
  const deployAccountPayload = {
    classHash: contractClassHash,
    constructorCalldata: constructorCallData,
    contractAddress: accountAddress,
    addressSalt: starkKeyPub
  };
  const { transaction_hash: th, contract_address: accountAXFinalAddress } = await accountOZ17.deployAccount(deployAccountPayload);
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
  await balances([account0, account1, accountOZ17],myProvider);
  const outsideTransaction1: OutsideTransaction = await accountOZ17.getOutsideTransaction(callOptions, call1);
  const res0 = await account0.executeFromOutside(outsideTransaction1);
  await myProvider.waitForTransaction(res0.transaction_hash);
  await balances([account0, account1, accountOZ17],myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
