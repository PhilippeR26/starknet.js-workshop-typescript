// send an array of shortstring and receive it as a ByteArray.
// launch with npx ts-node src/scripts/Starknet135/Starknet135-devnet/6.lonstringByteArray.ts
// Coded with Starknet.js v7.6.2 & devnet v0.4.3

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type TransactionReceiptValue, type SuccessfulTransactionReceiptResponse, config, cairo, logger, type CairoAssembly, type CompiledSierra } from "starknet";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, junoNMtestnet } from "../../../A1priv/A1priv";
import { account1BraavosMainnetAddress, account1BraavosMainnetPrivateKey, alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
import { DevnetProvider } from "starknet-devnet";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


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

  // config.set('legacyMode', true);
  // logger.setLogLevel('ERROR');

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
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2114/long_string_ArrayToByteArray.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2114/long_string_ArrayToByteArray.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  const dummyContract = new Contract(compiledSierra.abi, "0x123");
  console.log("functions =", dummyContract.functions);
  console.log("constructor =", compiledSierra.abi.find((item) => item.type == "constructor"));
  const resDecl = await account0.declareIfNot({
    contract: compiledSierra,
    casm: compiledCasm,
  });
  if (resDecl.transaction_hash) {
    console.log("new class hash =", resDecl.transaction_hash);
    await myProvider.waitForTransaction(resDecl.transaction_hash);
  } else {
    console.log("Already declared");
  };
  const classHash = resDecl.class_hash;
  console.log({ classHash });
  const contractCallData = new CallData(compiledSierra.abi)
  const constructor = contractCallData.compile('constructor', {
    name: 'Token',
    symbol: 'ERC20',
    decimals: 18,
    initial_supply: 10n * 10n ** 18n,
    owner: account0.address,
  });
  console.log({ constructor });
  const deployResponse = await account0.deployContract({
    classHash: classHash,
    constructorCalldata: undefined,
  });
  // console.log(deployResponse);
  // const deployResponse = await account0.deploy({ classHash:"0x67b6b4f02baded46f02feeed58c4f78e26c55364e59874d8abfd3532d85f1ba", constructorCalldata: constructor });
  //console.log(deployResponse);
  // Connect the new contract instance :
  const myTestContract = new Contract(compiledSierra.abi, deployResponse.contract_address, myProvider);
  myTestContract.connect(account0);

  const test = "Quae bene cognita si teneas, natura videtur libera continuo, dominis privata superbis, ipsa sua per se sponte omnia dis agere expers. Nam pro sancta deum tranquilla pectora pace, quae placidum degunt aevom vitamque serenam, quis regere immensi summam, quis habere profundi indu manu validas potis est moderanter habenas, quis pariter caelos omnis convertere, et omnis ignibus aetheriis terras suffire feracis";
  const array = shortString.splitLongString(test);
  console.log(array);
  const str = await myTestContract.convert_felt252_array_to_bytearray(array);
  console.log(str);

  console.log('✅ Test Contract connected at =', myTestContract.address);



  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });