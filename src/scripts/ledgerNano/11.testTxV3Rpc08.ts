// Use a Ledger Nano S+/X Starknet APP 2.2.5 to sign a transaction in a node rpc 0.8.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/10.testLedger225-rpc08.ts
// Coded with Starknet.js v7.0.0-beta.3 + experimental & devnet-rs v0.3.0 & starknet-devnet.js v0.2.2

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner221, constants, type V2InvocationsSignerDetails, type Call, hash, type V3InvocationsSignerDetails, getLedgerPathBuffer111, type TypedData, getLedgerPathBuffer221, type BigNumberish, CallData, stark, ec, ETransactionVersion, config, logger, LedgerSigner225 } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";
import { transactionVersion } from "starknet/dist/utils/hash";
import { keypress } from "../utils/utils";
dotenv.config();

async function displayBalances(addr: BigNumberish, myProv: RpcProvider) {
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, myProv);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, myProv);
  const balETH = await EthContract.call("balanceOf", [addr]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [addr]) as bigint;
  console.log("Ledger account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
  console.log("Ledger account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");

}

async function main() {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script.
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.2.3 installed and selected.
  // The blind signing parameter must be activated.
  // The ledger shall not be locked when launching this script.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.8" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  console.log("Devnet connected.");

  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 



  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  // *** initialize existing predeployed account 0 of Devnet
  const listAccounts = await l2DevnetProvider.getPredeployedAccounts();
  const accountAddress0: string = listAccounts[0].address;
  const privateKey0 = listAccounts[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0, undefined, ETransactionVersion.V3);
  console.log("Account connected.\n");
  // logger.setLogLevel('ERROR');
  // config.set("legacyMode", true);


  //
  console.log("A");
  const myLedgerTransport = await TransportNodeHid.create();
  console.log("B");
  const myLedgerSigner = new LedgerSigner225(myLedgerTransport, 0);
  console.log("C");
  const ledger0addr = "0x5cef0ae759bb1a081e5fd8d438b55991cb4ef6fdf887837e6ab55690e39b046";
  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner, undefined, ETransactionVersion.V3);


  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, myProvider);
  await displayBalances(ledgerAccount.address, myProvider);
  console.log(LogC.underscore + LogC.fg.yellow + "Sign in your Ledger for transfer of ETH" + LogC.reset);

  // *********** TX V3 ***********
  const myCall1 = EthContract.populate("transfer", [account0.address, 1n * 10n ** 12n]);
  const myCall2 = EthContract.populate("transfer", [account0.address, 2n * 10n ** 12n]);
  const myCall3 = EthContract.populate("transfer", [account0.address, 3n * 10n ** 12n]);

  console.log("Processing 1 call with account0...");
  const resV3a = await account0.execute(myCall1, { version: 3 });
  await myProvider.waitForTransaction(resV3a.transaction_hash);
  console.log("\n***** Transaction V3 (STRK fees):\nSign in the Nano...");
  console.log("Processing 1 call...");
  const resV3 = await ledgerAccount.execute(myCall1, { version: 3 });
  await myProvider.waitForTransaction(resV3.transaction_hash);
  await displayBalances(ledgerAccount.address, myProvider);

  myLedgerTransport.close();
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  // tip: 0,
  // paymasterData: [],
  // accountDeploymentData: [],
  // nonceDataAvailabilityMode: 0,
  // feeDataAvailabilityMode: 0,
  // resourceBounds: {
  //   l2_gas: { max_amount: '0x18a560', max_price_per_unit: '0x22ecb25c00' },
  //   l1_gas: { max_amount: '0x0', max_price_per_unit: '0x22ecb25c00' },
  //   l1_data_gas: { max_amount: '0xc0', max_price_per_unit: '0x22ecb25c00' }
  // },
  // walletAddress: '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691',
  // nonce: 5n,
  // maxFee: 0,
  // version: '0x3',
  // chainId: '0x534e5f5345504f4c4941',
  // cairoVersion: '1',
  // senderAddress: '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691',
  // compiledCalldata: [
  //   '1',
  //   '2087021424722619777119509474943472645767659996348769578120564519014510906823',
  //   '232670485425082704932579856502088130646006032362877466777181098476241604910',
  //   '3',
  //   '2846891009026995430665703316224827616914889274105712248413538305735679628945',
  //   '1000000000000',
  //   '0'
  // ]



  // tip: 0,
  // paymasterData: [],
  // accountDeploymentData: [],
  // nonceDataAvailabilityMode: 0,
  // feeDataAvailabilityMode: 0,
  // resourceBounds: {
  //   l2_gas: { max_amount: '0x1a61c0', max_price_per_unit: '0x22ecb25c00' },
  //   l1_gas: { max_amount: '0x0', max_price_per_unit: '0x22ecb25c00' },
  //   l1_data_gas: { max_amount: '0x1e0', max_price_per_unit: '0x22ecb25c00' }
  // },
  // walletAddress: '0x5cef0ae759bb1a081e5fd8d438b55991cb4ef6fdf887837e6ab55690e39b046',
  // nonce: 0n,
  // maxFee: 0,
  // version: '0x3',
  // chainId: '0x534e5f5345504f4c4941',
  // cairoVersion: '1',
  // senderAddress: '0x5cef0ae759bb1a081e5fd8d438b55991cb4ef6fdf887837e6ab55690e39b046',
  // compiledCalldata: [
  //   '1',
  //   '2087021424722619777119509474943472645767659996348769578120564519014510906823',
  //   '232670485425082704932579856502088130646006032362877466777181098476241604910',
  //   '3',
  //   '2846891009026995430665703316224827616914889274105712248413538305735679628945',
  //   '1000000000000',
  //   '0'
  // ]