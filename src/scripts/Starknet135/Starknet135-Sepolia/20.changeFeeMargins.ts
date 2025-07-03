// Change fees margin.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/20.changeFeeMargins.ts
// Coded with Starknet.js v7.6.2

import { RpcProvider, shortString, Account, type BlockIdentifier, BlockTag, json, Contract, type EstimateFee, stark, type FeeEstimate, type ResourceBoundsOverheadRPC08, type ResourceBounds, num, } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import axios from "axios";
import type { BlockWithTxHashes } from "@starknet-io/types-js";
import { strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
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

  const strkSierra = json.parse(fs.readFileSync("./compiledContracts/erc20STRK.json").toString("ascii"));
  const strkContract = new Contract(strkSierra, strkAddress, account0);
  const myCall = strkContract.populate("transfer",
    {
      recipient: accountETHoz17snip9Address,
      amount: 1n * 10n ** 3n,
    });
  const estimate: EstimateFee = await account0.estimateInvokeFee(myCall, { tip: 1n * 10n ** 9n });
  console.log(estimate);


  /**
   * Define the fee resource bounds from an `estimatefee` function.  
   * Without `pricePercentage`, `percentage` is applied everywhere (prices and max_amount).  
   * With `pricePercentage`, `percentage` is applied on `max_amount` parameters,
   * and `pricePercentage` is applied on `price` parameters.
   * @param estimate 
   * @param {number} percentage 50 means +50%, 0 means unchanged, -50 means -50%.
   * @param {number} pricePercentage 50 means +50%, 0 means unchanged, -50 means -50%.
   * @returns {ResourceBounds} Can be used in any function using `UniversalDetails`
   * @example
   * ```ts
   * const estimate = await account0.estimateInvokeFee(myCall);
   * const resourceBounds = stark.setResourceBounds(estimate, 40, 10);
   * const response = await account0.execute(myCall, { resourceBounds });
   * // resourceBounds = estimated max amounts increased by 40%, and estimated max prices increased by 10%.
   * ```
   */
  function setResourceBounds(estimate: EstimateFee, percentage: number, pricePercentage?: number): ResourceBounds {
    const fe: FeeEstimate = {
      l1_data_gas_consumed: Number(estimate.l1_data_gas_consumed),
      l1_data_gas_price: Number(estimate.l1_data_gas_price),
      l1_gas_consumed: Number(estimate.l1_gas_consumed),
      l1_gas_price: Number(estimate.l1_gas_price),
      l2_gas_consumed: Number(estimate.l2_gas_consumed),
      l2_gas_price: Number(estimate.l2_gas_price),
      overall_fee: Number(estimate.overall_fee),
      unit: estimate.unit,
    };
    console.log({ fe });
    const overHead: ResourceBoundsOverheadRPC08 = {
      l1_data_gas: { max_amount: percentage, max_price_per_unit: pricePercentage ?? percentage },
      l1_gas: { max_amount: percentage, max_price_per_unit: pricePercentage ?? percentage },
      l2_gas: { max_amount: percentage, max_price_per_unit: pricePercentage ?? percentage },
    }
    console.log({ overHead });
    return stark.estimateFeeToBounds(fe, overHead);
  }
  const resourceBounds = setResourceBounds(estimate, 100, 10);
  console.log({ resourceBounds });
  const res = await account0.execute(myCall, { resourceBounds });
  await myProvider.waitForTransaction(res.transaction_hash);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

