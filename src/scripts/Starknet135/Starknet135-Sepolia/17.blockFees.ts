// Get statistics of tip from last blocks.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/17.blockFees.ts
// Coded with Starknet.js v7.6.2

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, type BlockIdentifier, type TXN_HASH, provider, BlockTag, } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "./10.getBalance"
import { wait } from "../../utils/utils";
import { TXN_TYPE_INVOKE, type BlockWithTxs, type INVOKE_TXN_V3, type RESOURCE_BOUNDS_MAPPING } from "@starknet-io/types-js";
import { assert } from "../../utils/assert";
dotenv.config();


async function main() {
  // ********* Mainnet **************
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_8" });
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  // logger.setLogLevel("ERROR");
  // config.set("legacyMode",true);
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");

  // *** Devnet
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;


  // *** initialize existing Sepolia Testnet account
  // non SNIP-9 account:
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // SNIP-9 compatible accounts:
  // const accountAddress0 = account3ArgentXSepoliaAddress;
  // const privateKey0 = account3ArgentXSepoliaPrivateKey;
  const accountAddress0 = account2BraavosSepoliaAddress;
  const privateKey0 = account2BraavosSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');

  type TipStats = {
    minTip: bigint,
    maxTip: bigint,
    averageTip: bigint,
  }

  /**
   * Get Statistics of `tip` values in a range of blocks.
   * Calculation starts from `blockIdentifier` and go backwards, 
   * up until `maxBlocks` blocks are processed, 
   * or at least 10 INVOKE V3 transactions are processed.
   * @param {BlockIdentifier} [blockIdentifier = 'latest'] higher block scanned. Can be 'pending', 'latest' or a block number (an integer type).
   * @param {number} [maxBlocks = 3] Maximum number of blocks scanned.
   * @param {number} [minTxsNecessary = 10] Minimum number of Invoke V3 transactions scanned.
   * @returns {TipStats | undefined} an object with min, max, average tip (all bigint type), or if no transaction was found, returns `undefined`.
   * @example
   * ```ts
   * const result = await getTipStatsFromBlock(BlockTag.PENDING);
   * // result = { minTip: 0n, maxTip: 2000000000n, averageTip: 608695652n } 
   */
  async function getTipStatsFromBlock(blockIdentifier: BlockIdentifier = "latest", maxBlocks: number = 3, minTxsNecessary: number = 10): Promise<TipStats | undefined>
  // BlockIdentifier = this.blockIdentifier
  {
    assert(Number.isInteger(maxBlocks), "maxBlocks parameter must be an integer.");
    assert(maxBlocks >= 1, "maxBlocks parameter must be greater or equal to 1.");
    let blockData: BlockWithTxs = (await myProvider.getBlockWithTxs(blockIdentifier)) as BlockWithTxs;
    console.log("l1_data_gas_price", blockData.l1_data_gas_price.price_in_fri, "\nBlock num =", blockData.block_number);
    let currentBlock: number = typeof blockData.block_number === "undefined" ? (await myProvider.getBlockLatestAccepted()).block_number + 1 : blockData.block_number;
    const oldestBlock = currentBlock - maxBlocks + 1;
    let qtyTxsProcessed: number = 0;
    let maxTip: bigint = 0n;
    let minTip: bigint = constants.RANGE_FELT.max;
    let sumTip: bigint = 0n;
    const previousBlock = async () => {
      blockData = (await myProvider.getBlockWithTxs(currentBlock)) as BlockWithTxs;
    }
    while (true) {
      console.log("process block#", currentBlock);
      const txsInvoke = blockData.transactions.filter((tx) => tx.type === TXN_TYPE_INVOKE && tx.version === "0x3");

      console.log("Qty tx =", blockData.transactions.length, ", valid =", txsInvoke.length);
      if (txsInvoke.length === 0) {
        console.log("No invoke tx v3 in this block");
        currentBlock -= 1;
        if (currentBlock < oldestBlock) break;
        await previousBlock();
      } else {
        txsInvoke.forEach((tx) => {
          const txV3 = tx as unknown as (
            INVOKE_TXN_V3 & { transaction_hash: TXN_HASH }
          );
          const tip = BigInt(txV3.tip);
          console.log({txV3});
          minTip = tip < minTip ? tip : minTip;
          maxTip = tip > maxTip ? tip : maxTip;
          sumTip += tip;
        });
        qtyTxsProcessed += txsInvoke.length;
        if (qtyTxsProcessed < minTxsNecessary) {
          currentBlock -= 1;
          if (currentBlock < oldestBlock) break;
          await previousBlock();
        } else break;
      }
    }
    console.log({ qtyTxsProcessed });
    if (qtyTxsProcessed === 0) return undefined;

    const averageTip = sumTip / BigInt(qtyTxsProcessed);
    return { minTip, maxTip, averageTip }
  }

  // const stats = await getTipStatsFromBlock(BlockTag.PENDING);
  // const stats = await getTipStatsFromBlock(BlockTag.LATEST);
  // const stats = await getTipStatsFromBlock(892623);
  // const stats = await getTipStatsFromBlock(892623, 10);
  const stats = await getTipStatsFromBlock(892623, 10, 3);
  console.log("result is", stats, "\n");

  const bounds = {
    l1_data_gas: { max_amount: BigInt('0x186a0'), max_price_per_unit: BigInt('0x5af3107a400000') },
    l1_gas: { max_amount: BigInt('0x186a0'), max_price_per_unit: BigInt('0x11c37937e08000') },
    l2_gas: { max_amount: BigInt('0x5f5e100'), max_price_per_unit: BigInt('0xba43b7400') }
  };

  const maxFeeAuthorized =
    bounds.l1_data_gas.max_amount * bounds.l1_data_gas.max_price_per_unit
    + bounds.l1_gas.max_amount * bounds.l1_gas.max_price_per_unit
    + bounds.l2_gas.max_amount * bounds.l2_gas.max_price_per_unit;
  console.log({ maxFeeAuthorized });
  const tip = 2_000_000n;
  const maxFeeAuthorizedWithTip =
    bounds.l1_data_gas.max_amount * bounds.l1_data_gas.max_price_per_unit
    + bounds.l1_gas.max_amount * bounds.l1_gas.max_price_per_unit
    + bounds.l2_gas.max_amount * (bounds.l2_gas.max_price_per_unit + tip);
  console.log({ maxFeeAuthorizedWithTip });

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

