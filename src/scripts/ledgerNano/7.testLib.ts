// Use a Ledger Nano S+/X Starknet APP 2.1.0 to sign a transaction.
// launch with npx ts-node src/scripts/ledgerNano/5.testLedgerAccount.ts
// Coded with Starknet.js v6.14.1 + experimental & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import {
  RpcProvider, Account, Contract, json, shortString,
  num, addAddressPadding, encode, constants,
  CallData,
  hash
} from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { StarknetClient, type TxV1Fields } from "@ledgerhq/hw-app-starknet";
import LogC from "../utils/logColors";
import { sha256 } from '@noble/hashes/sha256';



dotenv.config();

async function main() {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script.
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.1.1 installed and selected.
  // The ledger shall not be locked when launching this script.
  //          👆👆👆
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }
  // await l2DevnetProvider.restart();

  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 



  // console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  // console.log("Provider connected to Starknet");

  // *** initialize existing predeployed account 0 of Devnet
  // const listAccounts = await l2DevnetProvider.getPredeployedAccounts();
  // const accountAddress0: string = listAccounts[0].address;
  // const privateKey0 = listAccounts[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  // const account0 = new Account(myProvider, accountAddress0, privateKey0);
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  // const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  // console.log("Accounts connected.\n");
  //
  // *********** Deploy account *************
  //
  const myLedgerTransport = await TransportNodeHid.create();
  // const myLedgerSigner = new ledgerSigner210(myLedgerTransport, 0);

  // const pubK = await myLedgerSigner.getPubKey();
  // const fullPubK = await myLedgerSigner.getFullPubKey();
  // console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  // console.log("Deployment of account in progress");
  // const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  // const ledger0addr = deployAccountDefinition.address;
  // console.log({ deployAccountDefinition });
  // const classH = myProvider.getClassAt(deployAccountDefinition.address);

  //const ledger0addr = "0x7aa660358c8e7dec28433528e139fd6d56bf6c3b2a6d84b6320ffe16d80a28a";


  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress);


  // console.log("aaa");
  const MASK_31 = 2n ** 31n - 1n; // 2 ** 31 - 1
  const int31 = (n: bigint) => Number(n & MASK_31);

  const stark = new StarknetClient(myLedgerTransport);

  //  const version = await stark.getAppVersion();
  //  console.log({version});

  const rStrk: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("starknet"))))).toString();
  const rLedW: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("LedgerW"))))).toString();
  const path = "m/2645'/" + rStrk + "'/" + rLedW + "'/0'/0'/0";
  console.log({ path });

  // Get the Stark public key
  //  const publicKey = await stark.getPubKey(path);
  //  console.log({publicKey});

  // Sign a hash
  //  let signature = await stark.signHash(path, "0x06944d8c6b0e496672d5713a5ddc93ce9245f9866d114d284cd6c96b7be1a49f");
  //  console.log("Hash signature =",signature);

  // Sign a V1 Tx
  const myCall = EthContract.populate("transfer", [2846891009026995430665703316224827616914889274105712248413538305735679628945n, 2n * 10n ** 16n]);
  console.log({ myCall });


  const txDetails: TxV1Fields = {
    accountAddress: "0x7faee44dcea5cba1da495f8e9d6095660e9ac2cfd0f754fc92a3cf3a5d929ad",
    max_fee: "32100000000000",
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    nonce: "0"
  };

  const calldataNumStr = myCall.calldata ? CallData.compile(myCall.calldata) : [];
  console.log({ calldataNumStr });
  const calldataHex = calldataNumStr.map((numStr: string) => { return num.toHex(numStr) });
  const calls = [
    {
      contractAddress: myCall.contractAddress,
      entrypoint: hash.getSelector(myCall.entrypoint),
      calldata: calldataHex
    },
  ];
  console.log("calls", calls);

  const resp210 = await stark.signTxV1(path, calls, txDetails);
  // console.log({resp210});



  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });