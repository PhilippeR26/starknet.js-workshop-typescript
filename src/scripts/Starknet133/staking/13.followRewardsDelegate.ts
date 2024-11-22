// track rewards in a pool
// launch with npx src/scripts/Starknet133/staking/13.followRewardsDelegate.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import type { StakerInfo, PoolMemberInfo, StakerPoolInfo } from "./type";
import { strkSierra, compiledSierraStake, STAKING_ADDRESS, compiledSierraPool } from "./constants";
import LogC from "../../utils/logColors";
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
  const accountAddress2 = account3ArgentXSepoliaAddress;
  const privateKey2 = account3ArgentXSepoliaPrivateKey;

  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account2 = new Account(myProvider, accountAddress2, privateKey2);

  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);

  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);



  const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info6.isSome()) {
    console.log("staker already exists");
    process.exit()
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
    pool_enabled: true, // pool activated from creation
    commission: 800, // 8%
  });
  console.log("🔜 Stake 1 STRK with pool activated...");
  const resp0 = await account0.execute([approveCall1, stakeCall]);
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error0", txR0); process.exit(); }


  const info0: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  let poolAddress: string = "";
  if (info0.isSome()) {
    const info = info0.unwrap() as StakerInfo;
    console.log("Staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("pool_info =", poolInfo);
      poolAddress = num.toHex(poolInfo.pool_contract);
      console.log(LogC.fg.green, "pool_address =", poolAddress, LogC.reset);
      console.log("initial rewards staker =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
      console.log("initial rewards delegator =", formatBalance(BigInt(poolInfo.unclaimed_rewards), 18), "STRK");
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }


  console.log("🔜 Delegate 2 STRK...");
  // const poolAddress="0x1b9b0a1e5d7c5a8b9813d575977804270e94c07bed2fb8bae2357dbc4ec5ed";
  const poolContract = new Contract(compiledSierraPool.abi, poolAddress, myProvider);
  const bal5 = await strkContract.balanceOf(account2.address);
  console.log("Initial balance account2 =", formatBalance(bal5, 18));
  const approvePoolCall2 = strkContract.populate("approve", {
    spender: poolAddress,
    amount: 2n * 10n ** 18n
  });
  const delegateCall = poolContract.populate("enter_delegation_pool", {
    reward_address: account2.address,
    amount: 2n * 10n ** 18n,
  });
  const resp6 = await account2.execute([approvePoolCall2, delegateCall]);
  const txR6 = await account2.waitForTransaction(resp6.transaction_hash);
  if (txR6.isSuccess()) { console.log("Success.") } else { console.log("Error6", txR6); process.exit(); }
  const info9: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info9.isSome()) {
    const info = info9.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);
  }
  else { console.log("No staker"); process.exit() }
  const info12: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info12.isSome()) {
    const info = info12.unwrap() as PoolMemberInfo;
    console.log("get_pool_member_info =", info);
  }
  else { console.log("No pool"); process.exit() }

  const bal8 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal8, 18));
  console.log("Wait 4' to have some rewards");
  await wait(4 * 60 * 1000);

  console.log("🔜 claim pool...");

  const info39: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info0.isSome()) {
    const info = info0.unwrap() as StakerInfo;
    console.log(info);
    console.log("Staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("rewards staker =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
      console.log("rewards delegator =", formatBalance(BigInt(poolInfo.unclaimed_rewards), 18), "STRK");
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }

  const claimPoolCall = poolContract.populate("claim_rewards", {
    pool_member: account2.address,
  });
  const resp12 = await account2.execute(claimPoolCall);
  const txR12 = await account2.waitForTransaction(resp12.transaction_hash);
  if (txR12.isSuccess()) { console.log("Success.") } else { console.log("Error12", txR12); process.exit() }
  const info40: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info40.isSome()) {
    const info = info40.unwrap() as StakerInfo;
    console.log(info);
    console.log("Staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("rewards staker =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
      console.log("rewards delegator =", formatBalance(BigInt(poolInfo.unclaimed_rewards), 18), "STRK");
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }

  const bal9 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal9, 18));
  console.log("Wait 4' to have some rewards");
  await wait(4 * 60 * 1000);


  console.log("🔜 Total undelegate 2 STRK...");
  console.log("Init...");
  const totalWithdrawInitCall = poolContract.populate("exit_delegation_pool_intent", {
    amount: 2n * 10n ** 18n,
  });
  const resp7 = await account2.execute(totalWithdrawInitCall);
  const txR7 = await account2.waitForTransaction(resp7.transaction_hash);
  if (txR7.isSuccess()) { console.log("Success.") } else { console.log("Error7", txR7); process.exit() }

  const info41: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info41.isSome()) {
    const info = info41.unwrap() as StakerInfo;
    console.log("Staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("rewards staker =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
      console.log("rewards delegator =", formatBalance(BigInt(poolInfo.unclaimed_rewards), 18), "STRK");
    }
    else { console.log("No pool"); process.exit(); }
    const info13: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(account2.address);
    if (info13.isSome()) {
      const infoP = info13.unwrap() as PoolMemberInfo;
      console.log("get_pool_member_info =", infoP);
      console.log("rewards delegator =", formatBalance(BigInt(infoP.unclaimed_rewards), 18), "STRK");
      const pool_time = infoP.unpool_time.unwrap()?.seconds as BigNumberish;
      console.log({ pool_time });
      const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
      console.log("wait", durationSec + "s (", durationSec / 60 + "')");
      await wait(durationSec * 1000);
    }
    else { console.log("No pool"); process.exit() }
  }
  else { console.log("No staker"); process.exit() }

  const bal12 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal12, 18));



  console.log("Action...");
  const undelegateActionCall = poolContract.populate("exit_delegation_pool_action", {
    pool_member: account2.address
  });
  const resp8 = await account2.execute(undelegateActionCall);
  const txR8 = await account2.waitForTransaction(resp8.transaction_hash);
  if (txR8.isSuccess()) { console.log("Success.") } else { console.log("Error8", txR8); process.exit(); }
  const info42: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info42.isSome()) {
    const info = info42.unwrap() as StakerInfo;
    console.log("Staked =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("rewards staker =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
      console.log("rewards delegator =", formatBalance(BigInt(poolInfo.unclaimed_rewards), 18), "STRK");
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }
  const bal4 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal4, 18));


  console.log("🔜 Unstake 1 STRK...")
  console.log("Init...");
  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall);
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info4.isSome()) {
    const info = info4.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);
    const pool_time = info.unstake_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No staker"); process.exit() }

  console.log("Action...");
  const unstakeActionCall = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const resp4 = await account0.execute(unstakeActionCall);
  const txR4 = await account0.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error4", txR4); process.exit(); }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info5.isSome()) {
    const info = info5.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);
  }
  else { console.log("No staker. OK."); }
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


