// declare & deploy ETH & STRK mintable tokens.
// use of standard deployer
// launch with npx ts-node src/scripts/Starknet135/Starknet135-devnet/5.declareDeployETHSTRK.ts
// Coded with Starknet.js v7.5.0 & devnet v0.4.2

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type TransactionReceiptValue, type SuccessfulTransactionReceiptResponse, config, cairo, logger, type CairoAssembly, type CompiledSierra } from "starknet";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, junoNMtestnet } from "../../../A1priv/A1priv";
import { account1BraavosMainnetAddress, account1BraavosMainnetPrivateKey, alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
import { DevnetProvider } from "starknet-devnet";

import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

async function displayBalancesNewTokens(accountAddr: string, ETHaddr: string, STRKaddr: string, myProv: RpcProvider) {
  const balETH = BigInt((await myProv.callContract({
    contractAddress: ETHaddr,
    entrypoint: "balanceOf",
    calldata: CallData.compile({ address: accountAddr }),
  }))[0]);
  const balSTRK = BigInt((await myProv.callContract({
    contractAddress: STRKaddr,
    entrypoint: "balanceOf",
    calldata: CallData.compile({ address: accountAddr }),
  }))[0]);

  console.log("Account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");
  console.log("Account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
}

//          👇👇👇
// 🚨🚨🚨   Launch Devnet before using this script.
//          👆👆👆
async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.8.1" });
  const devnet = new DevnetProvider({ timeout: 40_000 });
  if (!(await devnet.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7", specVersion: "0.7.1" }); // local Sepolia Testnet node
  // ***** Sepolia Testnet 
  //const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8", specVersion: "0.8.1" });
  // ***** Mainnet
  // const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7", specVersion: "0.7.1" }); 

  config.set('legacyMode', true);
  logger.setLogLevel('ERROR');

  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet");

  // initialize existing predeployed account 0 of Devnet
  const devnetAccounts = await devnet.getPredeployedAccounts();
  const accountAddress0 = devnetAccounts[0].address;
  const privateKey0 = devnetAccounts[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0,
    // undefined, "0x2"
  );
  console.log("Account connected.\n");


  // Declare & deploy Test contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/STRK.sierra.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/STRK.casm.json").toString("ascii")) as CairoAssembly;
  const compiledSierraETH = json.parse(fs.readFileSync("./compiledContracts/ETH.sierra.json").toString("ascii")) as CompiledSierra;
  const compiledCasmETH = json.parse(fs.readFileSync("./compiledContracts/ETH.casm.json").toString("ascii")) as CairoAssembly;
  console.log("constructor =", compiledSierra.abi.find((item) => item.type == "constructor"));
  // process.exit(5);
  const resDecl = await account0.declareIfNot({
    contract: compiledSierra,
    casm: compiledCasm,
  });
  if (resDecl.transaction_hash) {
    console.log("new class hash STRK =", resDecl.class_hash);
    await myProvider.waitForTransaction(resDecl.transaction_hash);
  } else {
    console.log("STRK class already declared");
  };
  const classHashSTRK = resDecl.class_hash;
  console.log({ classHashSTRK });


  const resDecl2 = await account0.declareIfNot({
    contract: compiledSierraETH,
    casm: compiledCasmETH,
  });
  if (resDecl2.transaction_hash) {
    console.log("new class hash ETH =", resDecl2.class_hash);
    await myProvider.waitForTransaction(resDecl2.transaction_hash);
  } else {
    console.log("ETH class already declared");
  };
  const classHashETH = resDecl2.class_hash;
  console.log({ classHashETH });
  const contractCallData = new CallData(compiledSierra.abi)
  const constructor = contractCallData.compile('constructor', {
    name: 'StarkNet Token',
    symbol: 'STRK',
    decimals: 18,
    initial_supply: 100n * 10n ** 18n,
    recipient: account0.address,
    permitted_minter: account0.address,
    provisional_governance_admin: account0.address,
    upgrade_delay: 0,
  });
  // console.log({ constructor });
  const deployResponse = await account0.deployContract({
    classHash: classHashSTRK,
    constructorCalldata: constructor,
  });
  const STRKNewAddress = deployResponse.contract_address;
  // console.log(deployResponse);

  const contractCallDataETH = new CallData(compiledSierraETH.abi)
  const constructorETH = contractCallDataETH.compile('constructor', {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    initial_supply: 10n * 10n ** 18n,
    recipient: account0.address,
    permitted_minter: account0.address,
    provisional_governance_admin: account0.address,
    upgrade_delay: 0,
  });
  // console.log({ constructorETH });
  const deployResponseETH = await account0.deployContract({
    classHash: classHashETH,
    constructorCalldata: constructorETH,
  });
  const ETHNewAddress = deployResponseETH.contract_address;
  // console.log(deployResponseETH);

  await displayBalancesNewTokens(account0.address, ETHNewAddress, STRKNewAddress, myProvider);

  // Connect the new contract instance :
  const STRKContract = new Contract(compiledSierra.abi, deployResponse.contract_address, myProvider);
  STRKContract.connect(account0);
  const ETHContract = new Contract(compiledSierraETH.abi, deployResponseETH.contract_address, myProvider);
  ETHContract.connect(account0);

  console.log("mint 10 STRK...");
  const myCall = STRKContract.populate("permissioned_mint", {
    account: account0.address,
    amount: 10n * 10n ** 18n,
  });
  const res = await account0.execute(myCall);
  const txR = await myProvider.waitForTransaction(res.transaction_hash);

  console.log("mint 1 ETH...");
  const myCallETH = ETHContract.populate("permissioned_mint", {
    account: account0.address,
    amount: 1n * 10n ** 18n,
  });
  const res2 = await account0.execute(myCallETH);
  const txR2 = await myProvider.waitForTransaction(res2.transaction_hash);


  await displayBalancesNewTokens(account0.address, ETHNewAddress, STRKNewAddress, myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });