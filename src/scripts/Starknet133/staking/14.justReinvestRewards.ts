// Reinvest the unclaimed rewards
// launch with npx ts-node src/scripts/Starknet133/staking/14.justReinvestRewards.ts
// Coded with Starknet.js v7.0.0-beta.3

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, constants, config } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import { compiledSierraStake, STAKING_ADDRESS, strkSierra } from "./constants";
import type { PoolMemberInfo, StakerInfo } from "./type";
dotenv.config();


async function main() {
  config.set("legacyMode", true);
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = await RpcProvider.create({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  // **** Mainnet
  // const myProvider = await RpcProvider.create({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7" });

  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });
  // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  //const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = account2TestBraavosSepoliaAddress;
  const privateKey0 = account2TestBraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V3);
  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);
  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);


  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Balance of account0 =", formatBalance(bal0, 18), "STRK");


  console.log("🔜 claim...");
  let rewards: bigint = 0n;
  const info8: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info8.isSome()) {
    const info = info8.unwrap() as StakerInfo;
    rewards = BigInt(info.unclaimed_rewards_own);
    console.log("Current staking amount =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    console.log("unclaimed_rewards =", rewards, formatBalance(rewards, 18), "STRK");
  }
  else { console.log("No staker"); }
  const claimCall = stakingContract.populate("claim_rewards", {
    staker_address: account0.address
  });
  const resp5 = await account0.execute(claimCall);
  const txR5 = await account0.waitForTransaction(resp5.transaction_hash);
  if (txR5.isSuccess()) { console.log("Success.") } else { console.log("Error5", txR5); process.exit() }
  const bal3 = await strkContract.balanceOf(account0.address);
  console.log("New balance account0 =", formatBalance(bal3, 18), "STRK");


  console.log("🔜 Reinvest rewards...");
  const approveCall1 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: rewards,
  });
  const increaseCall1 = stakingContract.populate("increase_stake", {
    staker_address: account0.address,
    amount: rewards,
  });
  const resp1 = await account0.execute([approveCall1, increaseCall1]);
  const txR1 = await account0.waitForTransaction(resp1.transaction_hash);
  if (txR1.isSuccess()) { console.log("Success.") } else { console.log("Error1", txR1) }
  const bal1 = await strkContract.balanceOf(account0.address);
  console.log("Final balance account0 =", formatBalance(bal1, 18), "STRK");

  const info1: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info1.isSome()) {
    const info1b = info1.unwrap() as StakerInfo;
    console.log("New staking amount =", formatBalance(BigInt(info1b.amount_own), 18), "STRK");
  }
  else { console.log("No staker"); }


  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


