// Use a Ledger Nano S+/X Starknet APP 2.2.0 to sign a transaction.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/6.testLedgerAccount221.ts
// Coded with Starknet.js v6.16 + experimental & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner221, constants, type V2InvocationsSignerDetails, type Call, hash, type V3InvocationsSignerDetails, getLedgerPathBuffer111, type TypedData, getLedgerPathBuffer221, type BigNumberish, CallData, stark, ec } from "starknet";
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
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.2.0 installed and selected.
  // The blind signing parameter must be activated.
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
  console.log("Deployment of AX account in progress");
  const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  const ledger0addr = deployAccountDefinition.address;
  console.log({ deployAccountDefinition });
  const classH = myProvider.getClassAt(deployAccountDefinition.address);

  // const ledger0addr = "0x59c7bc02433c4ee91231d864e54d0256728c3dd2f9a3d4296c2b6a13ee6df66";


  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner);

  // // sign Message
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

  // *********** TX V3 ***********
  console.log("\nTransaction V3 (STRK fees):\nSign in the Nano...");
  const resV3 = await ledgerAccount.execute(myCall, { version: 3 });
  console.log("Processing...");
  await myProvider.waitForTransaction(resV3.transaction_hash);
  await displayBalances(ledgerAccount.address, myProvider);

  // ******* declare OZ Account (common) *****
  // declare & deploy account
  const accountOZSierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.contract_class.json").toString("ascii"));
  const accountOZCasm = json.parse(fs.readFileSync("./compiledContracts/cairo282/account_oz17_AccountStrkSnip9OZ17.compiled_contract_class.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountOZSierra);
  console.log("OZ Class Hash of contract =", ch);
  // declare
  const respDecl = await account0.declareIfNot({ contract: accountOZSierra, casm: accountOZCasm });
  // const contractClassHash = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
  const contractOZClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("OZ17_SNIP-9 account class declared")
  }
  const calldata = new CallData(accountOZSierra.abi);

  // create account V1 *********
  // Calculate future address of the  account

  const myLedgerSigner1 = new LedgerSigner221(myLedgerTransport, 1);


  const pubK1 = await myLedgerSigner1.getPubKey();
  
  console.log('account Public Key1  =', pubK1);

  const constructorCallData = calldata.compile("constructor", {
    public_key: pubK1,
  });
  console.log("constructor =", constructorCallData);
  const accountAddress = hash.calculateContractAddressFromHash(pubK1, contractOZClassHash, constructorCallData, 0);
  console.log('Precalculated account address=', accountAddress);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAddress, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAddress, 100n * 10n ** 18n, "FRI");
  console.log("account funded.");

  // deploy account v1
  console.log("\nDeploy Account V1 (ETH fees):\nSign in the Nano...");
  const accountOZ17 = new Account(myProvider, accountAddress, myLedgerSigner1);
  const deployAccountPayload = {
    classHash: contractOZClassHash,
    constructorCalldata: constructorCallData,
    contractAddress: accountAddress,
    addressSalt: pubK1
  };
  const { transaction_hash: th, contract_address: accountOZFinalAddress } = await accountOZ17.deployAccount(deployAccountPayload, { version: 1 });
  console.log("Final address =", accountOZFinalAddress);
  console.log("Account deployed v1.");
  await myProvider.waitForTransaction(th);

  // deploy account V3 *********
  // Calculate future address of the  account
  console.log("\nDeploy Account V3 (STRK fees):\nSign in the Nano...");
  const myLedgerSigner3 = new LedgerSigner221(myLedgerTransport, 2);

  const pubK2 = await myLedgerSigner3.getPubKey();
  
  console.log('account Public Key2  =', pubK2);

  const constructorCallData3 = calldata.compile("constructor", {
    public_key: pubK2,
  });
  console.log("constructor =", constructorCallData3);
  const accountAddress3 = hash.calculateContractAddressFromHash(pubK2, contractOZClassHash, constructorCallData3, 0);
  console.log('Precalculated account address=', accountAddress3);

  // fund account address before account creation
  await l2DevnetProvider.mint(accountAddress3, 10n * 10n ** 18n, "WEI");
  await l2DevnetProvider.mint(accountAddress3, 100n * 10n ** 18n, "FRI");
  console.log("account funded.");

  // deploy account v3
  const accountOZ17V3 = new Account(myProvider, accountAddress3, myLedgerSigner3);
  const deployAccountPayload3 = {
    classHash: contractOZClassHash,
    constructorCalldata: constructorCallData3,
    contractAddress: accountAddress3,
    addressSalt: pubK2
  };
  const { transaction_hash: th3, contract_address: accountOZFinalAddress3 } = await accountOZ17V3.deployAccount(deployAccountPayload3, { version: 3 });
  console.log("Final address =", accountOZFinalAddress3);
  console.log("Account deployed v1.");
  await myProvider.waitForTransaction(th3);


  myLedgerTransport.close();
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });