// Use a Ledger Nano S+/X Starknet APP 1.1.1 to sign a transaction.
// launch with npx ts-node src/scripts/ledgerNano/5.testLedgerAccount.ts
// Coded with Starknet.js v6.12.0 & devnet-rs v0.1.2 & starknet-devnet.js v0.0.5

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";

dotenv.config();

async function main() {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script.
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v1.1.1 installed and selected.
  // The ledger shall not be locked when launching this script.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  await l2DevnetProvider.restart();
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

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  console.log("Accounts connected.\n");
  //
  // *********** Deploy account *************
  //
  const myLedgerTransport = await TransportNodeHid.create();
  const myLedgerSigner = new LedgerSigner(myLedgerTransport, 0);
  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  console.log("Deployment of account in progress");
  const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  const ledger0addr = deployAccountDefinition.address;
  console.log({ deployAccountDefinition });
  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner);
  const classH = myProvider.getClassAt(deployAccountDefinition.address);

  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, ledgerAccount);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, ledgerAccount);
  const balETH = await EthContract.call("balanceOf", [ledger0addr]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [ledger0addr]) as bigint;
  console.log("Ledger account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
  console.log("Ledger account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");

  console.log(LogC.underscore + LogC.fg.yellow + "Sign in your Ledger for a transfer of 0.2 ETH" + LogC.reset);
  const resp = await EthContract.transfer(account0.address, 2n * 10n ** 17n);
  myLedgerTransport.close();
  await myProvider.waitForTransaction(resp.transaction_hash);
  const balETH2 = await EthContract.call("balanceOf", [ledger0addr]) as bigint;
  console.log("Ledger account has a balance of :", formatBalance(balETH2, 18), "ETH");

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });