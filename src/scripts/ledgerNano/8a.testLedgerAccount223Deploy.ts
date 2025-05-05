// Use a Ledger Nano S+/X Starknet APP 2.2.3 to sign a contract deployment.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/8a.testLedgerAccount223Deploy.ts
// Coded with Starknet.js v7.1.0 & devnet-rs v0.2.4 (RPC 0.7) & starknet-devnet.js v0.2.2

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner221, constants, type V2InvocationsSignerDetails, type Call, hash, type V3InvocationsSignerDetails, getLedgerPathBuffer111, type TypedData, getLedgerPathBuffer221, type BigNumberish, CallData, stark, ec, logger, config, ETransactionVersion } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { calculateAccountAddress, deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";
dotenv.config();

async function main() {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet directory before using this script.
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.2.3 installed and selected.
  // The blind signing parameter must be activated.
  // The Ledger shall not be locked when launching this script.
  //          👆👆👆
  logger.setLogLevel("ERROR");
  config.set("legacyMode", true);
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: constants.SupportedRpcVersion.v07 });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  // await l2DevnetProvider.restart();
  // console.log("devnet reset & restart.");

  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 



  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
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

  const account0 = new Account(myProvider, accountAddress0, privateKey0, "1", ETransactionVersion.V2);

  console.log("Account connected.\n");
  //
  // *********** Deploy AX account *************
  console.log("A");
  const myLedgerTransport = await TransportNodeHid.create();
  console.log("B");
  const myLedgerSigner = new LedgerSigner221(myLedgerTransport, 0);
  console.log("C");

  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  const a = getLedgerPathBuffer221(0);
  console.log(a);
  // const salt = stark.randomAddress();
  const salt = pubK;
  const ledger0addr = calculateAccountAddress(pubK, account0.address, salt);
  try {
    const classH = await myProvider.getClassHashAt(ledger0addr);
    console.log("Account already deployed!");
  } catch {
    console.log("Deployment of AX account in progress...");
    const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK, salt);
    console.log({ deployAccountDefinition });
  }
  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner, "1", ETransactionVersion.V3);


  // Reject contract
  const rejectSierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/reject.sierra.json").toString("ascii"));
  const rejectCasm = json.parse(fs.readFileSync("./compiledContracts/cairo260/reject.casm.json").toString("ascii"));
  const chReject = hash.computeContractClassHash(rejectSierra);
  console.log("Reject contract class hash =", chReject);
  const respDecl2 = await account0.declareIfNot({ contract: rejectSierra, casm: rejectCasm });
  if (respDecl2.transaction_hash) {
    await myProvider.waitForTransaction(respDecl2.transaction_hash);
    console.log("Reject class declared!")
  } else { console.log("Reject class already declared!") };
  const calldataReject = new CallData(rejectSierra.abi);

  // ***** test deploy ********
  console.log("Deploying reject contract...\nSign in Ledger...");
  const respDeployReject = await ledgerAccount.deployContract({ classHash: chReject, constructorCalldata: [] });
  const rejectAddr = respDeployReject.address;
  const rejectContract = new Contract(calldataReject.abi, rejectAddr, myProvider);
  console.log("Contract deployed");
  myLedgerTransport.close();

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });