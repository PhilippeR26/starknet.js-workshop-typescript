// Use a Ledger Nano S+/X Starknet APP 2.1.0 to sign a transaction.
// Use of Ledger library.
// Launch with npx ts-node src/scripts/ledgerNano/7.testLib.ts
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
import { StarknetClient, type TxFields, type TxV1Fields } from "@ledgerhq/hw-app-starknet";
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

  const stark = new StarknetClient(myLedgerTransport);
  const version = await stark.getAppVersion();
  console.log({ version });

  const rStrk: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("starknet"))))).toString();
  const rLedW: string = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256("LedgerW"))))).toString();
  const path = "m/2645'/" + rStrk + "'/" + rLedW + "'/0'/0'/0";
  console.log({ path });

  // Get the Stark public key
  const publicKey = await stark.getPubKey(path);
  console.log({ publicKey });

  // Sign a hash
  let signature = await stark.signHash(path, "0x06944d8c6b0e496672d5713a5ddc93ce9245f9866d114d284cd6c96b7be1a49f");
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

  const resp210 = await stark.signTxV1(path, calls, txDetails);
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

  const resp210V3 = await stark.signTx(path, calls, txDetailsV3);
  console.log({ resp210V3 });

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });