// Use a Ledger Nano S+/X Starknet APP 2.3.1 to sign a transaction in a node rpc 0.7.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/9.testLedger231-rpc07.ts
// Coded with Starknet.js v7.1.0 + experimental & devnet v0.2.4 & starknet-devnet.js v0.2.2

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner221, constants, type V2InvocationsSignerDetails, type Call, hash, type V3InvocationsSignerDetails, getLedgerPathBuffer111, type TypedData, getLedgerPathBuffer221, type BigNumberish, CallData, stark, ec, ETransactionVersion, config, logger, LedgerSigner231, type InvocationsSignerDetails } from "starknet";
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
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.3.1 installed and selected.
  // The blind signing parameter must be activated.
  // The ledger shall not be locked when launching this script.
  // Once the Starknet APP selected, you have 2 minutes to proceed, before the APP is locked.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.7.1" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  await l2DevnetProvider.restart();
  console.log("devnet reset & restart.");

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

  const account0 = new Account(myProvider, accountAddress0, privateKey0, undefined, ETransactionVersion.V2);
  console.log("Account connected.\n");
  logger.setLogLevel('ERROR');
  config.set("legacyMode", true);

  
  console.log("A");
  const myLedgerTransport = await TransportNodeHid.create();
  console.log("B");
  const myLedgerSigner = new LedgerSigner231(myLedgerTransport, 0);
  console.log("C");


  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  const a = getLedgerPathBuffer221(0);
  console.log(a);
    
  const ledgerTestJson={
    "version": "0x3",
    "sender_address": "0x03fea70284ea856c2e26b561830f99391c81ab94096ce7d217ae5ee68d5b1b71",
    "tip": "0x0",
   "resource_bounds": {
      "l2_gas": {
        "max_amount": "0x1591e0",
        "max_price_per_unit": "0x18f68b63c"
      },
      "l1_gas": {
        "max_amount": "0x0",
        "max_price_per_unit": "0x11c224d01939"
      }
    },
    "paymaster_data": [],
    "chain_id": "0x534e5f5345504f4c4941",
    "nonce": "0xaa",
    "data_availability_mode": "0",
    "account_deployment_data": [],
    "calls": [
        {
            "to": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            "entrypoint": "transfer",
            "calldata": [
                "0x666666666666",
                "0x174876e800",
                "0x0"
            ]
        }
    ]
  }
  const tx = json.parse(JSON.stringify(ledgerTestJson));

  const txSNJS = {
    version: tx.version,
    walletAddress: tx.sender_address,
    tip: tx.tip,
    resourceBounds: tx.resource_bounds,
    paymasterData: tx.paymaster_data,
    chainId: tx.chain_id,
    nonce: tx.nonce,
    // "data_availability_mode": "L1",
    feeDataAvailabilityMode: "L1",
    nonceDataAvailabilityMode: "L1",
    accountDeploymentData: tx.account_deployment_data,
    cairoVersion:"1",
    calls: [{contractAddress:tx.calls[0].to, entrypoint: tx.calls[0].entrypoint, calldata: tx.calls[0].calldata}],
  };
  console.log("txSNJS =", txSNJS);
  const resTxV3 = await myLedgerSigner.signTransaction(txSNJS.calls, { ...txSNJS as InvocationsSignerDetails });
  console.log("resTxV3 =", resTxV3);
  


  myLedgerTransport.close();
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });