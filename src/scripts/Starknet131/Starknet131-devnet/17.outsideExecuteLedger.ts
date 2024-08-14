// SNIP-9 execute transactions from outside, using Ledger hardware wallet.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/17.outsideExecuteLedger.ts
// Coded with Starknet.js v6.11.0 + experimental & devnet-rs v0.1.2 & starknet-devnet.js v0.1.0

import { RpcProvider, Account, Contract, json, cairo, shortString, EOutsideExecutionVersion, type OutsideTransaction, num, LedgerSigner } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
import { outsideExecution, OutsideExecutionOptions } from 'starknet';
import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import { deployAccountArgentX4 } from "./12.deployArgentX4";
import { deployAccountArgentX3 } from "./13.deployArgentX3";
import { deployAccountBraavos } from "./11.deployBraavos";
import { deployAccountOpenzeppelin14 } from "./14.deployOZ14";
import { deployAccountNoERC165 } from "./15.deployNoIntrospection";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { deployLedgerAccount } from "../../ledgerNano/4.deployLedgerAccount";
import { wait } from "../../utils/utils";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script.
// A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v1.1.1 installed and selected.
// The ledger shall not be locked when launching this script.
//          👆👆👆

const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));

async function balance(account: Account, provider: RpcProvider):Promise<string> {
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, provider);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, provider);
  return formatBalance(await ethContract.call("balanceOf", [account.address]) as bigint, 18);
}

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

  const executorAccount = new Account(myProvider, accountAddress0, privateKey0);
  const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  console.log("Accounts connected.\n");

  // *********** Deploy Ledger account *************
  //

  const myLedgerTransport = await TransportNodeHid.create();
  const myLedgerSigner = new LedgerSigner(myLedgerTransport, 0);
  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  console.log("Deployment of account in progress");
  const deployAccountDefinition = await deployLedgerAccount(myProvider, executorAccount, pubK);
  console.log({ deployAccountDefinition });
  const ledger0addr = deployAccountDefinition.address;
  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner);

  // 
  // ******************** Create outside executions
  //

  const callOptions: OutsideExecutionOptions = {
    caller: executorAccount.address,
    execute_after: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    execute_before: Math.floor(Date.now() / 1000) + 3600 * 14, // 14 hours from now
  };
  const call1 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account1.address,
      amount: cairo.uint256(1n * 10n ** 18n),
    },
  };
  const call2 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account2.address,
      amount: cairo.uint256(2n * 10n ** 18n),
    },
  };
  const call3 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account1.address,
      amount: cairo.uint256(3n * 10n ** 18n),
    },
  };
  const call4 = {
    contractAddress: ethAddress,
    entrypoint: 'transfer',
    calldata: {
      recipient: account2.address,
      amount: cairo.uint256(4n * 10n ** 18n),
    },
  };
  console.log("It's 6PM. Before night, we will now pre-sign 3 outside transactions.");
  console.log("Sign now on the Ledger Nano for :\n- Transfer 1 ETH to account1.\n- Transfer 2 ETH to account2.");
  const outsideTransaction1: OutsideTransaction = await ledgerAccount.getOutsideTransaction(callOptions, [call1, call2]);
  console.log("O1 =", outsideTransaction1);

  console.log("Sign now on the Ledger Nano for :\n- Transfer 3 ETH to account1.");
  const outsideTransaction2: OutsideTransaction = await ledgerAccount.getOutsideTransaction(callOptions, call3);
  console.log("O2 =", outsideTransaction2);
  console.log("Sign now on the Ledger Nano for :\n- Transfer 4 ETH to account1.");
  const outsideTransaction3: OutsideTransaction = await ledgerAccount.getOutsideTransaction(callOptions, call4);
  console.log("O3 =", outsideTransaction3);

  // **** execution ****
  console.log( "Imagine we are 5 hours later, in a backend that knows the 3 `OutsideTransaction` objects.");
  await wait(5000);
  console.log(" Ledger Account balance =",await balance(ledgerAccount, myProvider));
  console.log("Backend Account balance =",await balance(executorAccount, myProvider));
  console.log("Backend Account balance =",await balance(account1, myProvider));
  console.log("Backend Account balance =",await balance(account2, myProvider));

  console.log("The backend has detected a situation that execute Transaction 2.");
  const res0 = await executorAccount.executeFromOutside(outsideTransaction2);
  await myProvider.waitForTransaction(res0.transaction_hash);
  console.log(" Ledger Account balance =",await balance(ledgerAccount, myProvider));
  console.log("Backend Account balance =",await balance(executorAccount, myProvider));
  console.log("Backend Account balance =",await balance(account1, myProvider));
  console.log("Backend Account balance =",await balance(account2, myProvider));

  console.log("The backend has detected a situation that execute simultaneously Transactions 1 & 3.");
 const res1 = await executorAccount.executeFromOutside([outsideTransaction1, outsideTransaction3]);
  await myProvider.waitForTransaction(res1.transaction_hash);
  console.log(" Ledger Account balance =",await balance(ledgerAccount, myProvider));
  console.log("Backend Account balance =",await balance(executorAccount, myProvider));
  console.log("Backend Account balance =",await balance(account1, myProvider));
  console.log("Backend Account balance =",await balance(account2, myProvider));

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });