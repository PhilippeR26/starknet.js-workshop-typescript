// Use a Ledger Nano S+/X Starknet APP 2.2.0 to sign a transaction.
// Use of Ledger library.
// Launch with npx ts-node src/scripts/ledgerNano/7.testLib.ts
// Coded with Starknet.js v6.16.0 + experimental & devnet-rs v0.2.0 & starknet-devnet.js v0.2.0

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
import { StarknetClient, type DeployAccountFields, type DeployAccountV1Fields, type TxFields, type TxV1Fields } from "@ledgerhq/hw-app-starknet";
import LogC from "../utils/logColors";
import { sha256 } from '@noble/hashes/sha256';


dotenv.config();

async function main() {
  const myLedgerTransport = await TransportNodeHid.create();

  // *** transfer ***
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const EthContract = new Contract(compiledERC20Contract.abi, ethAddress);

  // console.log("aaa");
  const MASK_31 = 2n ** 31n - 1n; // 2 ** 31 - 1
  const int31 = (n: bigint) => Number(n & MASK_31);

  const starkLedger = new StarknetClient(myLedgerTransport);
  const version = await starkLedger.getAppVersion();
  console.log({ version });

  const rStrk: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("starknet"))))).toString();
  const rLedW: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("LedgerW"))))).toString();
  const path = "m/2645'/" + rStrk + "'/" + rLedW + "'/0'/0'/0";
  console.log({ path });

  // Get the Stark public key
  const publicKey = await starkLedger.getPubKey(path);
  console.log({ publicKey });

  // Sign a hash
  let signature = await starkLedger.signHash(path, "0x06944d8c6b0e496672d5713a5ddc93ce9245f9866d114d284cd6c96b7be1a49f");
  console.log("Hash signature =", signature);

  // ********** Sign a V1 Tx
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

  const resp210 = await starkLedger.signTxV1(path, calls, txDetails);
  console.log({ resp210 });

  // ******** Sign a V3 Tx
  const txDetailsV3: TxFields = {
    account_deployment_data: [],
    chainId: constants.StarknetChainId.SN_MAIN,
    accountAddress: "0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
    feeDataAvailabilityMode: "L1",
    nonce: 1,
    nonceDataAvailabilityMode: "L1",
    paymaster_data: [],
    resourceBounds: {
      l1_gas: {
        max_amount: "0x3ad",
        max_price_per_unit: "0x5cff80d86108b",
      },
      l2_gas: {
        max_amount: "0x0",
        max_price_per_unit: "0x0",
      },
    },
    tip: 0,
  }

  const resp210V3 = await starkLedger.signTx(path, calls, txDetailsV3);
  console.log({ resp210V3 });

  // ******* sign a deploy account V1
  const deployAccountDetailV1: DeployAccountV1Fields = {
    contractAddress: "0x016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc9",
    max_fee: "1000000000000",
    chainId: "0x534e5f4d41494e",
    nonce: "0",
    class_hash: "0x01c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb",
    contract_address_salt: "0x01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf",
    constructor_calldata: ["0xddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d7936", "0x0"],
  };
  const respDeplAccountV1 = await starkLedger.signDeployAccountV1(path, deployAccountDetailV1);
  console.log({ respDeplAccountV1 });

  // ******sign a deploy account V3 
  let deployAccountDetailV3: DeployAccountFields = {
    contractAddress: "0x016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc9",
    tip: 0,
    resourceBounds: {
      l1_gas: {
        max_amount: "0x3ad",
        max_price_per_unit: "0x5cff80d86108b",
      },
      l2_gas: {
        max_amount: "0x0",
        max_price_per_unit: "0x0",
      },
    },
    paymaster_data: [],
    chainId: "0x534e5f4d41494e",
    nonce: 0,
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
    constructor_calldata: ["0xddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d7936", "0x0"],
    class_hash: "0x01c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb",
    contract_address_salt: "0x01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf",
  };
  const respDeplAccountV3 = await starkLedger.signDeployAccount(path, deployAccountDetailV3);
  console.log({ respDeplAccountV3 });

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });