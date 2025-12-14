// Use a Ledger Nano S+/X Starknet APP 2.3.1 to sign a transaction in a node rpc 0.8.
// Use of a Starknet.js signer
// Launch with npx ts-node src/scripts/ledgerNano/10.testLedger231-rpc08.ts
// Coded with Starknet.js v9.1.0 & devnet v0.7.0 & starknet-devnet.js v0.7.0

import { RpcProvider, Account, Contract, json, shortString, hash, type TypedData, getLedgerPathBuffer221, type BigNumberish, CallData, LedgerSigner231, CairoBytes31 } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";
import { keypress } from "../utils/utils";
dotenv.config();

async function displayBalances(addr: BigNumberish, myProv: RpcProvider) {
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract({
    abi: compiledERC20Contract.abi,
    address: ethAddress,
    providerOrAccount: myProv
  });
  const strkContract = new Contract({
    abi: compiledERC20Contract.abi,
    address: strkAddress,
    providerOrAccount: myProv
  });
  const balETH = await EthContract.call("balanceOf", [addr]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [addr]) as bigint;
  console.log("Ledger account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
  console.log("Ledger account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");

}

async function main() {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet directory before using this script.
  // A Ledger Nano S+/X has to be connected via USB to your laptop, with the starknet APP v2.3.1 installed and selected.
  // The blind signing parameter must be activated.
  // The ledger shall not be locked when launching this script.
  // Once the Starknet APP selected, you have 2 minutes to proceed, before the APP is locked.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  await l2DevnetProvider.restart();
  console.log("Devnet reset & restart.");

  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 



  console.log(
    "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version
  ); console.log("Provider connected to Starknet");

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

  const account0 = new Account({
    provider: myProvider,
    address: accountAddress0,
    signer: privateKey0,
  });
  console.log("Account connected.\n");

  // ******* declare OZ Account (common) *****
  // declare OZ 0.17 account
  console.log("Declare...");
  const accountOZSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2100/account_oz20_AccountStrkSnip9OZ20.contract_class.json").toString("ascii"));
  const accountOZCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2100/account_oz20_AccountStrkSnip9OZ20.compiled_contract_class.json").toString("ascii"));
  const ch = hash.computeContractClassHash(accountOZSierra);
  console.log("OZ Class Hash of contract =", ch);
  // declare
  const respDecl = await account0.declareIfNot({ contract: accountOZSierra, casm: accountOZCasm }, { tip: 0 });
  // const contractClassHash = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
  const contractOZClassHash = respDecl.class_hash;
  if (respDecl.transaction_hash) {
    await myProvider.waitForTransaction(respDecl.transaction_hash);
    console.log("OZ17_SNIP-9 account class declared")
  }
  const calldataOZ = new CallData(accountOZSierra.abi);

  // Reject contract
  const rejectSierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/reject.sierra.json").toString("ascii"));
  const rejectCasm = json.parse(fs.readFileSync("./compiledContracts/cairo260/reject.casm.json").toString("ascii"));
  const chReject = hash.computeContractClassHash(rejectSierra);
  console.log("Reject contract class hash =", chReject);
  // declare
  const respDecl2 = await account0.declareIfNot({ contract: rejectSierra, casm: rejectCasm }, { tip: 0 });
  // const contractClassHash = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
  if (respDecl2.transaction_hash) {
    await myProvider.waitForTransaction(respDecl2.transaction_hash);
    console.log("Reject class declared")
  }
  const calldataReject = new CallData(rejectSierra.abi);
  const respDeployReject = await account0.deployContract({ classHash: chReject, constructorCalldata: [] }, { tip: 0 });
  const rejectAddr = respDeployReject.address;
  const rejectContract = new Contract({
    abi: calldataReject.abi,
    address: rejectAddr,
    providerOrAccount: myProvider
  });

  //
  // *********** Deploy AX account *************
  console.log("Enter now in Starknet APP in your Nano.\nThen press a key to continue.");
  await keypress();
  console.log("A");
  const myLedgerTransport = await TransportNodeHid.create();
  const myLedgerSigner = new LedgerSigner231(myLedgerTransport, 0);
  const pubK = await myLedgerSigner.getPubKey();
  const fullPubK = await myLedgerSigner.getFullPubKey();
  console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  const a = getLedgerPathBuffer221(0);
  console.log(a);
  console.log("Deployment of AX account in progress...");
  const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK, pubK);
  const ledger0addr = deployAccountDefinition.address;
  console.log({ deployAccountDefinition });
  const classH = myProvider.getClassAt(deployAccountDefinition.address);
  // const ledger0addr = "0x59c7bc02433c4ee91231d864e54d0256728c3dd2f9a3d4296c2b6a13ee6df66";

  const ledgerAccount = new Account({
    provider: myProvider,
    address: ledger0addr,
    signer: myLedgerSigner
  });

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
  const EthContract = new Contract({
    abi: compiledERC20Contract.abi,
    address: ethAddress,
    providerOrAccount: myProvider
  });
  const strkContract = new Contract({
    abi: compiledERC20Contract.abi,
    address: strkAddress,
    providerOrAccount: myProvider
  });
  await displayBalances(ledgerAccount.address, myProvider);
  console.log(LogC.underscore + LogC.fg.yellow + "Sign in your Ledger for transfer of ETH" + LogC.reset);

  console.log("If necessary unlock the Nano.\nPress a key to continue.");
  await keypress();
  const myCall1 = EthContract.populate("transfer", [account0.address, 1n * 10n ** 12n]);
  const myCall2 = EthContract.populate("transfer", [account0.address, 2n * 10n ** 12n]);
  const myCall3 = EthContract.populate("transfer", [account0.address, 3n * 10n ** 12n]);
  // *********** TX V3 ***********
  console.log("\n***** Transaction V3 (STRK fees):\nSign in the Nano...");
  console.log("Processing 1 call...");
  const resV3 = await ledgerAccount.execute(myCall1, { tip: 0 });
  await myProvider.waitForTransaction(resV3.transaction_hash);
  console.log("If necessary unlock the Nano.\nPress a key to continue.");
  await keypress();
  console.log("Processing 3 calls...");
  const resV3b = await ledgerAccount.execute([myCall3, myCall2, myCall1], { tip: 0 });
  await myProvider.waitForTransaction(resV3b.transaction_hash);
  console.log("If necessary unlock the Nano.\nPress a key to continue.");
  await keypress();
  console.log("Call with empty calldata...");
  const myCall4 = rejectContract.populate("process_nonce", {});
  const resV1c = await ledgerAccount.execute(myCall4, { tip: 0 });
  await myProvider.waitForTransaction(resV1c.transaction_hash);
  await displayBalances(ledgerAccount.address, myProvider);


  console.log("If necessary unlock the Nano.\nPress a key to continue.");
  await keypress();
  // deploy account V3 *********
  // Calculate future address of the  account
  console.log("\nDeploy Account V3 (STRK fees):\nSign in the Nano...");
  const myLedgerSigner3 = new LedgerSigner231(myLedgerTransport, 2);
  const pubK2 = await myLedgerSigner3.getPubKey();
  console.log('account Public Key2  =', pubK2);
  const constructorCallData3 = calldataOZ.compile("constructor", {
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
  const accountOZ17V3 = new Account({
    provider: myProvider,
    address: accountAddress3,
    signer: myLedgerSigner3
  });
  const deployAccountPayload3 = {
    classHash: contractOZClassHash,
    constructorCalldata: constructorCallData3,
    contractAddress: accountAddress3,
    addressSalt: pubK2
  };
  const { transaction_hash: th3, contract_address: accountOZFinalAddress3 } = await accountOZ17V3.deployAccount(deployAccountPayload3, { tip: 0 });
  console.log("Final address =", accountOZFinalAddress3);
  console.log("Account deployed v3.");
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