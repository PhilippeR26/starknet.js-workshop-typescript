// partial delegation moved to an other pool
// launch with npx src/scripts/Starknet133/staking/7.changePool.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, chainStackTestnet } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import LogC from "../../utils/logColors";
import type { StakerInfo, StakerPoolInfo, PoolMemberInfo, TimeStamp } from "./type";
import { compiledSierraPool, compiledSierraStake, STAKING_ADDRESS, strkSierra } from "./constants";
dotenv.config();


async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });
  const myProvider = new RpcProvider({ nodeUrl: chainStackTestnet });
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
  const accountAddress1 = account2BraavosSepoliaAddress;
  const privateKey1 = account2BraavosSepoliaPrivateKey;
  const accountAddress2 = account3ArgentXSepoliaAddress;
  const privateKey2 = account3ArgentXSepoliaPrivateKey;
  const accountAddress3 = account1OZSepoliaAddress;
  const privateKey3 = account1OZSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account1 = new Account(myProvider, accountAddress1, privateKey1);
  const account2 = new Account(myProvider, accountAddress2, privateKey2);
  const account3 = new Account(myProvider, accountAddress3, privateKey3);

  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);

  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);

  const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info6.isSome()) {
    const info6b = info6.unwrap()
    if (!!info6b) {
      console.log("staker already exists");
      process.exit();
    }
  }
  else { console.log("No staker. OK."); }

  const approveCall1 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: 1n * 10n ** 18n,
  });
  const approveCall2 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: 2n * 10n ** 18n,
  });
  const approveCall3 = strkContract.populate("approve", {
    spender: STAKING_ADDRESS,
    amount: 3n * 10n ** 18n,
  });
  const stake0Call = stakingContract.populate("stake", {
    reward_address: account0.address,
    operational_address: account0.address,
    amount: 3n * 10n ** 18n,
    pool_enabled: true, // pool activated from creation
    commission: 800, // 8%
  });
  const stake1Call = stakingContract.populate("stake", {
    reward_address: account1.address,
    operational_address: account1.address,
    amount: 2n * 10n ** 18n,
    pool_enabled: true, // pool activated from creation
    commission: 1000, // 10%
  });

  console.log("🔜 Stake 3 STRK in accounts 0 & 2 STRK in account 1, with pools activated...");
  const resp0 = await account0.execute([approveCall3, stake0Call]);
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error", txR0); process.exit(); }


  const info26: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  let pool0Address: string = "";
  if (info26.isSome()) {
    const info = info26.unwrap() as StakerInfo;
    console.log("Staked0 =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("pool_info0 =", poolInfo);
      pool0Address = num.toHex(poolInfo.pool_contract);
      console.log(LogC.fg.green, "pool0_address =", pool0Address, LogC.reset);
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }

  const resp18 = await account1.execute([approveCall2, stake1Call]);
  const txR18 = await account1.waitForTransaction(resp18.transaction_hash);
  if (txR18.isSuccess()) { console.log("Success.") } else { console.log("Error", txR0); process.exit(); }


  const info27: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account1.address);
  let pool1Address: string = "";
  if (info27.isSome()) {
    const info = info27.unwrap() as StakerInfo;
    console.log("Staked1 =", formatBalance(BigInt(info.amount_own), 18), "STRK");
    if (info.pool_info.isSome()) {
      const poolInfo = info.pool_info.unwrap() as StakerPoolInfo;
      console.log("pool_info1 =", poolInfo);
      pool1Address = num.toHex(poolInfo.pool_contract);
      console.log(LogC.fg.green, "pool1_address =", pool1Address, LogC.reset);
    }
    else { console.log("No pool"); process.exit(); }
  }
  else { console.log("No staker"); process.exit() }


  console.log("🔜 Delegate 3 STRK to staker0...");
  // const pool0Address="0x6884b316562b376637f9371887ad41eb1d38965a59a478234e49781b2f2170e";
  // const pool1Address="0x3c99b33212289fd3cbe4e851bbf744a4135a86e3be349c4f850ddffd901cc73";

  const pool0Contract = new Contract(compiledSierraPool.abi, pool0Address, myProvider);
  const pool1Contract = new Contract(compiledSierraPool.abi, pool1Address, myProvider);
  const bal5 = await strkContract.balanceOf(account2.address);
  console.log("Initial balance account2 =", formatBalance(bal5, 18));
  const approvePoolCall2 = strkContract.populate("approve", {
    spender: pool0Address,
    amount: 3n * 10n ** 18n
  });
  const delegateCall = pool0Contract.populate("enter_delegation_pool", {
    reward_address: account2.address,
    amount: 3n * 10n ** 18n,
  });
  const resp6 = await account2.execute([approvePoolCall2, delegateCall]);
  const txR6 = await account2.waitForTransaction(resp6.transaction_hash);
  if (txR6.isSuccess()) { console.log("Success.") } else { console.log("Error6", txR6); process.exit(); }
  const info9: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info9.isSome()) {
    const info9b = info9.unwrap() as StakerInfo;
    console.log("get_staker0_info =", info9b);
  }
  else { console.log("No staker"); process.exit() }
  const info12: CairoOption<PoolMemberInfo> = await pool0Contract.get_pool_member_info(BigInt(account2.address));
  if (info12.isSome()) {
    const info12b = info12.unwrap() as PoolMemberInfo;
    console.log("get_pool0_member_info =", info12b);
  }
  else { console.log("No pool"); process.exit() }
  const bal11 = await strkContract.balanceOf(account2.address);
  console.log("balance account2 =", formatBalance(bal11, 18));


  console.log("🔜 Move only 1 STRK from pool0 to pool1...");
  console.log("Init...");
  const partialWithdraw0InitCall = pool0Contract.populate("exit_delegation_pool_intent", {
    amount: 2n * 10n ** 18n,
  });
  const resp21 = await account2.execute(partialWithdraw0InitCall);
  const txR21 = await account2.waitForTransaction(resp21.transaction_hash);
  if (txR21.isSuccess()) { console.log("Success.") } else { console.log("Error") }

  const info30: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info30.isSome()) {
    const info = info30.unwrap() as StakerInfo;
    console.log("get_staker0_info =", info);
  }
  else { console.log("No staker"); process.exit() }
  const info31: CairoOption<PoolMemberInfo> = await pool0Contract.get_pool_member_info(account2.address);
  if (info31.isSome()) {
    const info = info31.unwrap() as PoolMemberInfo;
    console.log("get_pool0_member_info =", info);
    const pool_time = info.unpool_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No pool"); process.exit() }

  console.log("Action...");
  const changePool0Call = pool0Contract.populate("switch_delegation_pool", {
    to_staker: account1.address,
    to_pool: pool1Address,
    amount: 1n * 10n ** 18n,
  });
  const resp22 = await account2.execute(changePool0Call);
  const txR22 = await account2.waitForTransaction(resp22.transaction_hash);
  if (txR22.isSuccess()) { console.log("Success.") } else { console.log("Error22", txR22); process.exit(); }
  const info33: CairoOption<PoolMemberInfo> = await pool0Contract.get_pool_member_info(account2.address);
  if (info33.isSome()) {
    const info = info33.unwrap() as PoolMemberInfo;
    console.log("get_pool0_member_info =", info);
  }
  else { console.log("No pool. OK."); }
  const info34: CairoOption<PoolMemberInfo> = await pool1Contract.get_pool_member_info(account2.address);
  if (info34.isSome()) {
    const info = info34.unwrap() as PoolMemberInfo;
    console.log("get_pool1_member_info =", info);
  }
  else { console.log("No pool."); process.exit() }

  console.log("🔜 Move 1 other STRK to pool1...");

  console.log("Action...");
  const changePoolCall = pool0Contract.populate("switch_delegation_pool", {
    to_staker: account1.address,
    to_pool: pool1Address,
    amount: 1n * 10n ** 18n,
  });
  const resp9 = await account2.execute(changePoolCall);
  const txR9 = await account2.waitForTransaction(resp9.transaction_hash);
  if (txR9.isSuccess()) { console.log("Success.") } else { console.log("Error", txR9); process.exit(); }
  const info16: CairoOption<PoolMemberInfo> = await pool0Contract.get_pool_member_info(account2.address);
  if (info16.isSome()) {
    const info = info16.unwrap() as PoolMemberInfo;
    console.log("get_pool0_member_info =", info);
  }
  else { console.log("No pool. OK."); }
  const info3: CairoOption<PoolMemberInfo> = await pool1Contract.get_pool_member_info(account2.address);
  if (info3.isSome()) {
    const info = info3.unwrap() as PoolMemberInfo;
    console.log("get_pool1_member_info =", info);
  }
  else { console.log("No pool."); process.exit() }

  console.log("🔜 Total withdraw 1 STRK from pool0 & 2 STRK from pool1...");
  console.log("Init...");
  const totalWithdraw1InitCall = pool1Contract.populate("exit_delegation_pool_intent", {
    amount: 2n * 10n ** 18n,
  });
  const totalWithdraw0InitCall = pool0Contract.populate("exit_delegation_pool_intent", {
    amount: 1n * 10n ** 18n,
  });
  const resp7 = await account2.execute(totalWithdraw1InitCall);
  const txR7 = await account2.waitForTransaction(resp7.transaction_hash);
  if (txR7.isSuccess()) { console.log("Success.") } else { console.log("Error7", txR7); process.exit(); }
  const resp23 = await account2.execute(totalWithdraw0InitCall);
  const txR23 = await account2.waitForTransaction(resp23.transaction_hash);
  if (txR23.isSuccess()) { console.log("Success.") } else { console.log("Error23", txR23); process.exit(); }

  const info10: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info10.isSome()) {
    const info = info10.unwrap() as StakerInfo;
    console.log("get_staker0_info =", info);
  }
  else { console.log("No staker"); process.exit() }
  const info13: CairoOption<PoolMemberInfo> = await pool0Contract.get_pool_member_info(account2.address);
  if (info13.isSome()) {
    const info = info13.unwrap() as PoolMemberInfo;
    console.log("get_pool1_member_info =", info);
    const pool_time = info.unpool_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No pool"); process.exit() }

  console.log("Action...");
  const undelegateAction0Call = pool0Contract.populate("exit_delegation_pool_action", {
    pool_member: account2.address
  });
  const undelegateAction1Call = pool1Contract.populate("exit_delegation_pool_action", {
    pool_member: account2.address
  });
  const resp8 = await account2.execute(undelegateAction1Call);
  const txR8 = await account2.waitForTransaction(resp8.transaction_hash);
  if (txR8.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }
  const resp24 = await account2.execute(undelegateAction0Call);
  const txR24 = await account2.waitForTransaction(resp24.transaction_hash);
  if (txR24.isSuccess()) { console.log("Success.") } else { console.log("Error24", txR24); process.exit() }
  const info11: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account1.address));
  if (info11.isSome()) {
    const info = info11.unwrap() as StakerInfo;
    console.log("get_staker1_info =", info);
  }
  else { console.log("No staker"); process.exit(); }

  const bal4 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal4, 18));



  console.log("🔜 Unstake both stakers ...")
  const bal0 = await strkContract.balanceOf(account0.address);
  const bal3 = await strkContract.balanceOf(account1.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  console.log("Initial balance account1 =", formatBalance(bal3, 18));
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall);
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error3", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info4.isSome()) {
    const info = info4.unwrap() as StakerInfo;
    console.log("get_staker0_info =", info);
  }
  else { console.log("No staker"); process.exit() }

  const resp19 = await account1.execute(unstakeInitCall);
  const txR19 = await account1.waitForTransaction(resp19.transaction_hash);
  if (txR19.isSuccess()) { console.log("Success.") } else { console.log("Error", txR19); process.exit() }
  const info28: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account1.address));
  if (info28.isSome()) {
    const info = info28.unwrap() as StakerInfo;
    console.log("get_staker1_info =", info);
    const pool_time = info.unstake_time.unwrap()?.seconds as BigNumberish;
    console.log({ pool_time });
    const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
    console.log("wait", durationSec + "s (", durationSec / 60 + "')");
    await wait(durationSec * 1000);
  }
  else { console.log("No staker"); process.exit() }


  const unstakeAction0Call = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const unstakeAction1Call = stakingContract.populate("unstake_action", {
    staker_address: account1.address
  });
  const resp4 = await account0.execute(unstakeAction0Call);
  console.log({ resp4 });
  const txR4 = await account0.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit(); }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info5.isSome()) {
    const info = info5.unwrap() as StakerInfo;
    console.log("get_staker0_info =", info);
  }
  else { console.log("No staker0. OK."); }
  const bal1 = await strkContract.balanceOf(account0.address);
  console.log("Final balance account0 =", formatBalance(bal1, 18));

  const resp20 = await account1.execute(unstakeAction1Call);
  const txR20 = await account1.waitForTransaction(resp20.transaction_hash);
  if (txR20.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit(); }
  const info29: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account1.address));
  if (info29.isSome()) {
    const info = info29.unwrap() as StakerInfo;
    console.log("get_staker1_info =", info);
  }
  else { console.log("No staker1. OK."); }
  const bal10 = await strkContract.balanceOf(account1.address);
  console.log("Final balance account1 =", formatBalance(bal10, 18));


  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


