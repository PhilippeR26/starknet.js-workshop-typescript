// Use a Ledger Nano S+/X Starknet APP 2.3.1 to sign a transaction in a node rpc 0.7.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/13.testSignerRpc08V3.ts
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
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.8.1" });
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

  const account0 = new Account(myProvider, accountAddress0, privateKey0, "1", ETransactionVersion.V2);
  console.log("Account connected.\n");
  logger.setLogLevel('ERROR');
  config.set("legacyMode", true);

  
  console.log("A");
  const myLedgerTransport = await TransportNodeHid.create();
  console.log("B");
  const myLedgerSigner = new LedgerSigner231(myLedgerTransport, 0);
  console.log("C");


    // sign Message
    console.log("Sign a message in the Nano...")
    const message: TypedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Airdrop: [
          { name: 'address', type: 'felt' },
          { name: 'amount', type: 'felt' },
        ],
        Validate: [
          { name: 'id', type: 'felt' },
          { name: 'from', type: 'felt' },
          { name: 'amount', type: 'felt' },
          { name: 'nameGamer', type: 'string' },
          { name: 'endDate', type: 'felt' },
          { name: 'itemsAuthorized', type: 'felt*' }, // array of felt
          { name: 'chkFunction', type: 'selector' }, // name of function
          { name: 'rootList', type: 'merkletree', contains: 'Airdrop' }, // root of a merkle tree
        ],
      },
      primaryType: 'Validate',
      domain: {
        name: 'myToto', // put the name of your dapp to ensure that the signatures will not be used by other DAPP
        version: '1',
        chainId: shortString.encodeShortString('SN_SEPOLIA'), // shortString of 'SN_SEPOLIA' (or 'SN_MAIN'), to be sure that signature can't be used by other network.
      },
      message: {
        id: '0x0000004f000f',
        from: '0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066',
        amount: '400',
        nameGamer: 'Hector26',
        endDate: '0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c',
        itemsAuthorized: ['0x01', '0x03', '0x0a', '0x0e'],
        chkFunction: 'check_authorization',
        rootList: [
          {
            address: '0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79',
            amount: '1554785',
          },
          {
            address: '0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b',
            amount: '2578248',
          },
          {
            address: '0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1',
            amount: '4732581',
          },
          {
            address: '0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a',
            amount: '913548',
          },
        ],
      },
    };
  
    const resSignM = await myLedgerSigner.signMessage(message, account0.address);
    console.log({ resSignM });
  
  


  myLedgerTransport.close();
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });