// Read   actual fees.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/18.ReadFees.ts
// Coded with Starknet.js v7.6.2

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, type BlockIdentifier, type TXN_HASH, provider, BlockTag, } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import axios from "axios";
import type { BlockWithTxs, INVOKE_TXN_V3 } from "@starknet-io/types-js";
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


  const blockData: BlockWithTxs = (await myProvider.getBlockWithTxs(892623)) as BlockWithTxs;
  console.log({blockData});
  const l1_data_gas_price=BigInt(blockData.l1_data_gas_price.price_in_fri);
  const l1_gas_price=BigInt(blockData.l1_gas_price.price_in_fri);
  const l2_gas_price=BigInt(blockData.l2_gas_price.price_in_fri);
  const txs = blockData.transactions as unknown as (
    INVOKE_TXN_V3 & { transaction_hash: TXN_HASH })[];
  const tx = txs[1];
  // console.log(tx);
  const tip = BigInt(tx.tip);
  console.log({ tip });
  const bounds = tx.resource_bounds;
  console.log("resource bounds =",tx.resource_bounds);
  const maxFeeAuthorized =
    BigInt(bounds.l1_data_gas.max_amount) * BigInt(bounds.l1_data_gas.max_price_per_unit)
    + BigInt(bounds.l1_gas.max_amount) * BigInt(bounds.l1_gas.max_price_per_unit)
    + BigInt(bounds.l2_gas.max_amount) * BigInt(bounds.l2_gas.max_price_per_unit);
  console.log({ maxFeeAuthorized });
  const txR = await myProvider.getTransactionReceipt(tx.transaction_hash);
  if (txR.isSuccess()) {
    // console.log(txR);
    const executionResources = BigInt(txR.value.execution_resources.l1_data_gas) *l1_data_gas_price + BigInt(txR.value.execution_resources.l1_gas)*l1_gas_price + BigInt(txR.value.execution_resources.l2_gas)*l2_gas_price;
    console.log(txR.value.execution_resources);
    console.log({ executionResources });
    const af = txR.value.actual_fee.amount;
    const actualFee = BigInt(af);

    console.log({ actualFee })
  }
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

