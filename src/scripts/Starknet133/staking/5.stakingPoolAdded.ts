// Create a validator staker without any pool, then create a pool.
// launch with npx src/scripts/Starknet133/staking/5.stakingPoolAdded.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import LogC from "../../utils/logColors";
import { strkSierra, compiledSierraStake, STAKING_ADDRESS, compiledSierraPool } from "./constants";
import type { StakerInfo, PoolMemberInfo } from "./type";
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
    const info6b = info6.unwrap()
    if (!!info6b) {
      console.log("staker already exists");
      process.exit()
    }
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
    pool_enabled: false, // pool activated from creation
    commission: 0,
  });
  console.log("🔜 Stake 1 STRK without pool...");
  const resp0 = await account0.execute([approveCall1, stakeCall]);
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error", txR0); process.exit(); }


  console.log("🔜 Create a pool...");
  const openPoolCall = stakingContract.populate("set_open_for_delegation", {
    commission: 800, // 8% 
  });
  const resp13 = await account0.execute([approveCall1, openPoolCall]);
  const txR13 = await account0.waitForTransaction(resp13.transaction_hash);
  if (txR13.isSuccess()) { console.log("Success.") } else { console.log("Error", txR13); process.exit(); }
  const info: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  let poolAddress: string = "";
  if (info.isSome()) {
    const info0 = info.unwrap() as StakerInfo;
      console.log("Staked =", formatBalance(BigInt(info0.amount_own), 18), "STRK");
      if (info0.pool_info.isSome()) {
        const poolInfo = info0.pool_info.unwrap();
        if (!!poolInfo) {
          console.log("pool_info =", poolInfo);
          poolAddress = num.toHex(poolInfo.pool_contract);
          console.log(LogC.fg.green,"pool_address =", poolAddress, LogC.reset);
        }
      }
      else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }



  console.log("🔜 Delegate 2 STRK...");
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
  if (txR6.isSuccess()) { console.log("Success.") } else { console.log("Error", txR6); process.exit(); }
  const info9: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info9.isSome()) {
    const info9b = info9.unwrap()
    if (!!info9b) {
      console.log("get_staker_info =", info9b);
    }
  }
  else { console.log("No staker"); process.exit() }
  const info12: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info12.isSome()) {
    const info12b = info12.unwrap()
    if (!!info12b) {
      console.log("get_pool_member_info =", info12b);
    }
  }
  else { console.log("No pool"); process.exit() }

  console.log("🔜 Increase 1 STRK in pool..");
  const bal6 = await strkContract.balanceOf(account2.address);
  console.log("balance account2 =", formatBalance(bal6, 18));
  const approvePoolCall1 = strkContract.populate("approve", {
    spender: poolAddress,
    amount: 1n * 10n ** 18n
  });
  const IncreasePollCall = poolContract.populate("add_to_delegation_pool", {
    pool_member: account2.address,
    amount: 1n * 10n ** 18n,
  });
  const resp9 = await account2.execute([approvePoolCall1, IncreasePollCall]);
  const txR9 = await account2.waitForTransaction(resp9.transaction_hash);
  if (txR9.isSuccess()) { console.log("Success.") } else { console.log("Error", txR9); process.exit(); }
  const info15: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info15.isSome()) {
    const info15b = info15.unwrap()
    if (!!info15b) {
      console.log("get_staker_info =", info15b);
    }
  }
  else { console.log("No staker"); process.exit() }
  const info16: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info16.isSome()) {
    const info = info16.unwrap()
    if (!!info) {
      console.log("get_pool_member_info =", info);
    }
  }
  else { console.log("No pool"); process.exit() }

  console.log("🔜 claim pool...");
  const bal8 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal8, 18));
  console.log("Wait 2' to have some rewards");
  await wait(2 * 60 * 1000);
  const info20: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info20.isSome()) {
    const info = info20.unwrap() as PoolMemberInfo;
    console.log("get_pool_member_info =", info);
  }
  else { console.log("No pool"); process.exit() }
  const claimPoolCall = poolContract.populate("claim_rewards", {
    pool_member: account2.address,
  });
  const resp12 = await account2.execute(claimPoolCall);
  const txR12 = await account2.waitForTransaction(resp12.transaction_hash);
  if (txR12.isSuccess()) { console.log("Success.") } else { console.log("Error tx", txR12); process.exit() }
  const info21: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info21.isSome()) {
    const info = info21.unwrap() as PoolMemberInfo;
    console.log("get_pool_member_info =", info);
  }
  else { console.log("No pool"); process.exit() }
  const bal9 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal9, 18));

  console.log("🔜 partial withdraw 1 STRK...");
  console.log("Init...");
  const partialWithdrawInitCall = poolContract.populate("exit_delegation_pool_intent", {
    amount: 1n * 10n ** 18n,
  });
  const resp10 = await account2.execute(partialWithdrawInitCall);
  const txR10 = await account2.waitForTransaction(resp10.transaction_hash);
  if (txR10.isSuccess()) { console.log("Success.") } else { console.log("Error tx"); process.exit() }

  const info17: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info17.isSome()) {
    const info = info17.unwrap();
    if (!!info) {
      console.log("get_staker_info =", info);
    }
  }
  else { console.log("No staker"); process.exit() }
  const info18: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info18.isSome()) {
    const info = info18.unwrap() as PoolMemberInfo;
    console.log("get_pool_member_info =", info);
    const pool_time = info.unpool_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No pool"); process.exit() }

  console.log("Action...");
  const undelegateAction1Call = poolContract.populate("exit_delegation_pool_action", {
    pool_member: account2.address
  });
  const resp11 = await account2.execute(undelegateAction1Call);
  const txR11 = await account2.waitForTransaction(resp11.transaction_hash);
  if (txR11.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }
  const info19: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info19.isSome()) {
    const info = info19.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);

  }
  else { console.log("No staker"); }

  const bal7 = await strkContract.balanceOf(account2.address);
  console.log("Balance account2 =", formatBalance(bal7, 18));



  console.log("🔜 Total withdraw 2 STRK...");
  console.log("Init...");
  const totalWithdrawInitCall = poolContract.populate("exit_delegation_pool_intent", {
    amount: 2n * 10n ** 18n,
  });
  const resp7 = await account2.execute(totalWithdrawInitCall);
  const txR7 = await account2.waitForTransaction(resp7.transaction_hash);
  if (txR7.isSuccess()) { console.log("Success.") } else { console.log("Error") }

  const info10: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info10.isSome()) {
    const info10b = info10.unwrap();
    if (!!info10b) {
      console.log("get_staker_info =", info10b);
    }
  }
  else { console.log("No staker"); process.exit() }
  const info13: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
  if (info13.isSome()) {
    const info13b = info13.unwrap()
    if (!!info13b) {
      console.log("get_pool_member_info =", info13b);
      const pool_time = info13b.unpool_time.unwrap()?.seconds as BigNumberish;
      console.log({ pool_time });
      const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
      console.log("wait", durationSec + "s (", durationSec / 60 + "')");
      await wait(durationSec * 1000);
    }
  }
  else { console.log("No pool"); process.exit() }

  console.log("Action...");
  const undelegateActionCall = poolContract.populate("exit_delegation_pool_action", {
    pool_member: account2.address
  });
  const resp8 = await account2.execute(undelegateActionCall);
  const txR8 = await account2.waitForTransaction(resp8.transaction_hash);
  if (txR8.isSuccess()) { console.log("Success.") } else { console.log("Error") }
  const info11: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info11.isSome()) {
    const info11b = info11.unwrap();
    if (!!info11b) {
      console.log("get_staker_info =", info11b);
    }
  }
  else { console.log("No staker"); }

  const bal4 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal4, 18));



  console.log("🔜 Unstake 1 STRK...")
  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall);
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info4.isSome()) {
    const info4b = info4.unwrap();
    if (!!info4b) {
      console.log("get_staker_info =", info4b);
      const pool_time = info4b.unstake_time.unwrap()?.seconds as BigNumberish;
      console.log({ pool_time });
      const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
      console.log("wait", durationSec + "s (", durationSec / 60 + "')");
      await wait(durationSec * 1000);
    }
  }
  else { console.log("No staker"); process.exit() }
  const unstakeActionCall = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const resp4 = await account0.execute(unstakeActionCall);
  const txR4 = await account0.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error") }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info5.isSome()) {
    const info5b = info5.unwrap();
    if (!!info5b) {
      console.log("get_staker_info =", info5b);
    }
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


