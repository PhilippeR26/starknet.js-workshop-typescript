// Use a Ledger Nano S+/X Starknet APP 2.1.1 to sign a transaction.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/6.testLedgerAccount211.ts
// Coded with Starknet.js v6.14.1 + experimental & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner211, constants, type V2InvocationsSignerDetails, type Call, hash, type V3InvocationsSignerDetails, getLedgerPathBuffer111, type TypedData, getLedgerPathBuffer211, type BigNumberish } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";
dotenv.config();

const int31 = (n: bigint) => Number(n & constants.MASK_31);

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
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.1.1 installed and selected.
  // The ledger shall not be locked when launching this script.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  // await l2DevnetProvider.restart();

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
  const myLedgerTransport = await TransportNodeHid.create();
  const myLedgerSigner = new LedgerSigner211(myLedgerTransport, 0);


   const pubK = await myLedgerSigner.getPubKey();
   const fullPubK = await myLedgerSigner.getFullPubKey();
   console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  const a=getLedgerPathBuffer211(0);
  console.log(a);
     console.log("Deployment of account in progress");
  const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  const ledger0addr = deployAccountDefinition.address;
  console.log({ deployAccountDefinition });
  const classH = myProvider.getClassAt(deployAccountDefinition.address);

  // const ledger0addr = "0x2d34493371ecc17dffed3f9e359c5b3ff13ccaf5c46a66ec7152017f0e2db87";


  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner);

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

  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, myProvider);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, myProvider);
  await displayBalances(ledgerAccount.address, myProvider);
  console.log(LogC.underscore + LogC.fg.yellow + "Sign in your Ledger for a transfer of 0.2 ETH" + LogC.reset);

  // *********** TX V1 ***********
  console.log("Transaction V1 (ETH fees):\nSign in the Nano...");


  const myCall = EthContract.populate("transfer", [account0.address, 2n * 10n ** 17n]);
  const resV1 = await ledgerAccount.execute(myCall);
  console.log("Processing...");
  await myProvider.waitForTransaction(resV1.transaction_hash);
  await displayBalances(ledgerAccount.address, myProvider);

  // *** using LedgerSigner.signTxV1
  // const calls: Call[] = [
  //   {
  //     contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  //     entrypoint: "transfer",
  //     calldata: ["0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
  //       "0x9184e72a000",
  //       "0x0"]
  //   },
  // ];
  // const txDetails = {
  //   accountAddress: "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9",
  //   max_fee: "171699675780",
  //   chainId: constants.StarknetChainId.SN_MAIN,
  //   nonce: "28",
  // }
  // const txDet: V2InvocationsSignerDetails = {
  //   walletAddress: txDetails.accountAddress,
  //   chainId: constants.StarknetChainId.SN_MAIN,
  //   cairoVersion: "1",
  //   maxFee: txDetails.max_fee,
  //   nonce: txDetails.nonce,
  //   version: "0x1"
  // };
  //  const res = await myLedgerSigner.signTxV1(txDet, calls);
  //  console.log({ res });

  // await myProvider.waitForTransaction(resp.transaction_hash);

  // *********** TX V3 ***********
  console.log("\nTransaction V3 (STRK fees):\nSign in the Nano...");
  const resV3 = await ledgerAccount.execute(myCall, { version: 3 });
  console.log("Processing...");
  await myProvider.waitForTransaction(resV3.transaction_hash);
  await displayBalances(ledgerAccount.address, myProvider);

  // *** using LedgerSigner.signTxV3
  // const txDetailsV3: V3InvocationsSignerDetails = {
  //   chainId: constants.StarknetChainId.SN_MAIN,
  //   nonce: "28",
  //   accountDeploymentData: [],
  //   paymasterData: [],
  //   cairoVersion: "1",
  //   feeDataAvailabilityMode: "L1",
  //   nonceDataAvailabilityMode: "L1",
  //   resourceBounds: {
  //     l1_gas: {
  //       max_amount: "0x2a00",
  //       max_price_per_unit: "0x5c00000"
  //     },
  //     l2_gas: {
  //       max_amount: "0x00",
  //       max_price_per_unit: "0x00"
  //     },
  //   },
  //   tip: 0,
  //   version: "0x3",
  //   walletAddress: account0.address
  // }
  // const res2 = await myLedgerSigner.signTxV3(txDetailsV3, calls);
  // console.log({ res2 });
  myLedgerTransport.close();

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });