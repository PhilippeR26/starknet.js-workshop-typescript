// Use a Ledger Nano S+/X Starknet APP 2.1.0 to sign a transaction.
// launch with npx ts-node src/scripts/ledgerNano/5.testLedgerAccount.ts
// Coded with Starknet.js v6.14.1 + experimental & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

import { RpcProvider, Account, Contract, json, shortString, LedgerSigner, LedgerSigner210, num, addAddressPadding, encode, constants, getLedgerPathBuffer210, getLedgerPathBuffer110, type V2InvocationsSignerDetails, type Call, hash } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { deployLedgerAccount } from "./4.deployLedgerAccount";
import { ethAddress, strkAddress } from "../utils/constants";
import { formatBalance } from "../utils/formatBalance";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import LogC from "../utils/logColors";
import { sha256 } from '@noble/hashes/sha256';



dotenv.config();

const int31 = (n: bigint) => Number(n & constants.MASK_31);

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
  const myLedgerSigner = new LedgerSigner210(myLedgerTransport, 0);


  // const pubK = await myLedgerSigner.getPubKey();
  // const fullPubK = await myLedgerSigner.getFullPubKey();
  // console.log("Read public key in Ledger =\n", { pubK, fullPubK });
  // console.log("Deployment of account in progress");
  // const deployAccountDefinition = await deployLedgerAccount(myProvider, account0, pubK);
  // const ledger0addr = deployAccountDefinition.address;
  // console.log({ deployAccountDefinition });
  // const classH = myProvider.getClassAt(deployAccountDefinition.address);

  const ledger0addr = "0x7faee44dcea5cba1da495f8e9d6095660e9ac2cfd0f754fc92a3cf3a5d929ad";


  const ledgerAccount = new Account(myProvider, ledger0addr, myLedgerSigner);


  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress, ledgerAccount);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, ledgerAccount);
  const balETH = await EthContract.call("balanceOf", [ledger0addr]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [ledger0addr]) as bigint;
  console.log("Ledger account 0 has a balance of :", formatBalance(balETH, 18), "ETH");
  console.log("Ledger account 0 has a balance of :", formatBalance(balSTRK, 18), "STRK");

  console.log(LogC.underscore + LogC.fg.yellow + "Sign in your Ledger for a transfer of 0.2 ETH" + LogC.reset);

  console.log("start");
  //  const stark = new Stark.StarknetClient(myLedgerTransport);
  const myCall = EthContract.populate("transfer", [account0.address, 2n * 10n ** 17n]);
  console.log({myCall});
  // const rStrk: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("starknet"))))).toString();
  // const rLedW: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("LedgerW"))))).toString();
  // const path="m/2645'/"+rStrk+"'/"+rLedW+"'/0'/0'/0";
  // console.log({path});
  // const txDetails: TxV1Fields = {
  //   accountAddress:
  //     ledgerAccount.address,
  //   max_fee: "171699675780",
  //   chainId: "0x534e5f4d41494e",
  //   nonce: "0"
  // };

  // const resp210=await stark.signTxV1(path,[myCall],txDetails);
  // console.log({resp210});

  // const calldata= [
  //   '2846891009026995430665703316224827616914889274105712248413538305735679628945',
  //   '200000000000000000',
  //   '0'
  // ];
  // const p0Hex=num.toHex(calldata[0]);
  // const p0Pad=addAddressPadding(num.toHex(calldata[0]));
  // const p0Buf=num.hexToBytes(p0Pad);
  // console.log({p0Hex});
  // console.log({p0Pad});
  // console.log({p0Buf});

  // const p1Hex=num.toHex(calldata[1]);
  // const p1Buf=num.hexToBytes(addAddressPadding(num.toHex(calldata[1])));
  // console.log({p1Hex});
  // console.log({p1Buf});

  // const resp = await EthContract.transfer(account0.address, 2n * 10n ** 16n);


  let txDetails = {
		accountAddress: "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9",
		max_fee: "171699675780",
		chainId: "0x534e5f4d41494e",
		nonce: "28",
	}
	
	// let calls = [
	// 	{ 
	// 		to: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
	// 		selector: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
	// 		calldata: ["0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
	// 				"0x9184e72a000",
	// 				"0x0"]
	// 	},     
	// ]

  let calls: Call[] = [
		{ 
			contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			entrypoint: "transfer",
			calldata: ["0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
					"0x9184e72a000",
					"0x0"]
		},     
	];
  console.log(hash.getSelector("transfer"));
  const txDet: V2InvocationsSignerDetails={
    walletAddress: txDetails.accountAddress,
    chainId: constants.StarknetChainId.SN_MAIN,
    cairoVersion: "1",
    maxFee: txDetails.max_fee,
    nonce: txDetails.nonce,
    version: "0x1"
  };
  const res=await myLedgerSigner.signTxV1(txDet,calls);
  console.log({res});

  myLedgerTransport.close();
  // await myProvider.waitForTransaction(resp.transaction_hash);
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