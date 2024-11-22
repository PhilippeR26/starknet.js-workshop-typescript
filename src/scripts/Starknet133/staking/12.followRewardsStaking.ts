// check rewards of a Staker.
// Launch with npx src/scripts/Starknet133/staking/12.followRewardsStaking.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import type { StakerInfo } from "./type";
import { strkSierra, compiledSierraStake, STAKING_ADDRESS } from "./constants";
dotenv.config();


async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
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
  const accountAddress0 = account1TestBraavosSepoliaAddress;
  const privateKey0 = account1TestBraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);

  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);

  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);

  const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info6.isSome()) {
    console.log("Staker already exists."); process.exit();
  }
  else { console.log("No staker. OK."); }

  const approveCall1 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: 1n * 10n ** 18n
  });
  const approveCall2 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: 2n * 10n ** 18n
  });
  const stakeCall = stakingContract.populate("stake", {
    reward_address: account0.address,
    operational_address: account0.address,
    amount: 1n * 10n ** 18n,
    pool_enabled: false,
    commission: 0,
  });
  console.log("🔜 Stake 1 STRK...");
  const resp0 = await account0.execute([approveCall1, stakeCall]);
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error0", txR0); process.exit() }

  // crash if no staker address
  // console.log("staker_info =", await stakingContract.staker_info(account0.address));


  const info0: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info0.isSome()) {
    const info = info0.unwrap() as StakerInfo;
    console.log("staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    console.log("initial rewards =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker");process.exit() }

  console.log("wait 1'...");
  await wait(60 * 1000);
  const info36: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info36.isSome()) {
    const info = info36.unwrap() as StakerInfo;
    console.log("rewards =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker");process.exit() }


  console.log("wait 1'...");
  await wait(60 * 1000);
  const info37: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info37.isSome()) {
    const info = info37.unwrap() as StakerInfo;
    console.log("rewards =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker");process.exit() }

  console.log("🔜 Unstake...")
  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall);
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error3", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info4.isSome()) {
    const info = info4.unwrap() as StakerInfo;
    // console.log("get_staker_info =", info);
    console.log("rewards=", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");

    const pool_time = info.unstake_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No staker"); process.exit() }
  const info38: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info38.isSome()) {
    const info = info38.unwrap() as StakerInfo;
    console.log("rewards =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker");process.exit() }

  console.log("Action...");
  const unstakeActionCall = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const resp4 = await account0.execute(unstakeActionCall);
  const txR4 = await account0.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error4", txR4) }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info5.isSome()) {
    const info = info5.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);
    console.log("rewards=", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");

  }
  else { console.log("No staker"); }
  const bal1 = await strkContract.balanceOf(account0.address);
  console.log("Final balance account0 =", formatBalance(bal1, 18));



  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


