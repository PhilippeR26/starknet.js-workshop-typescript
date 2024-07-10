// SNIP-9 execute transactions from outside.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/16.ExecuteFromOutside.ts
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant } from "starknet";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { LedgerUSBnodeSigner } from "./3.ClassLedgerSigner";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";

dotenv.config();

async function main() {
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
  console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
  console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
  const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
  const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
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
  const myLedgerSigner = new LedgerUSBnodeSigner(0);
  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log({ pubK, fullPubK });
  const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  const ledger0addr = deployAccountDefinition.address;
  console.log({ deployAccountDefinition });
  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner)
  const classH = myProvider.getClassAt(deployAccountDefinition.address);


  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, ledgerAccount);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, ledgerAccount);
  const balETH = await ethContract.call("balanceOf", [ledger0addr]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [ledger0addr]) as bigint;
  console.log("OZ account has a balance of :", formatBalance(balETH, 18), "ETH");
  console.log("OZ account has a balance of :", formatBalance(balSTRK, 18), "STRK");

  const resp=await ethContract.transfer(account0.address,2n*10n**15n);
  await myProvider.waitForTransaction(resp.transaction_hash);
  const balETH2 = await ethContract.call("balanceOf", [ledger0addr]) as bigint;
  console.log("OZ account has a balance of :", formatBalance(balETH2, 18), "ETH");

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });