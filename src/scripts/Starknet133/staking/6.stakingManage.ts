// Create a staker, then manage it 
// launch with npx src/scripts/Starknet133/1.stakingWithoutPool.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import { strkSierra, compiledSierraStake, STAKING_ADDRESS } from "./constants";
import type { StakerInfo } from "./type";
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
  const accountAddress3 = account1OZSepoliaAddress;
  const privateKey3 = account1OZSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account2 = new Account(myProvider, accountAddress2, privateKey2);
  const account3 = new Account(myProvider, accountAddress3, privateKey3);

  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);
  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);

  const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info6.isSome()) {
    const info = info6.unwrap() as StakerInfo;
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
  console.log("🔜 stake...");
  const resp0 = await account0.execute([approveCall1, stakeCall], { skipValidate: false });
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error", txR0); process.exit() }

  const info0: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info0.isSome()) {
    const info = info0.unwrap() as StakerInfo;
    console.log(info);
    console.log("staked amount =", formatBalance(BigInt(info.amount_own), 18), "STRK");
  }
  else { console.log("No staker"); process.exit() }

  console.log("🔜 Change operational address...");
  console.log("Declare...");
  const declareOperationalCall = stakingContract.populate("declare_operational_address", {
    staker_address: account0.address
  });
  const resp17 = await account3.execute(declareOperationalCall, { skipValidate: false });
  const txR17 = await account3.waitForTransaction(resp17.transaction_hash);
  if (txR17.isSuccess()) { console.log("Success.") } else { console.log("Error", txR17); process.exit() }
  const info25: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info25.isSome()) {
    const info = info25.unwrap() as StakerInfo;
    console.log(info);
  }
  else { console.log("No staker"); process.exit() }


  console.log("Change...");
  const changeOperationalCall = stakingContract.populate("change_operational_address", {
    operational_address: account3.address
  });
  const resp14 = await account0.execute(changeOperationalCall, { skipValidate: false });
  const txR14 = await account0.waitForTransaction(resp14.transaction_hash);
  if (txR14.isSuccess()) { console.log("Success.") } else { console.log("Error", txR14); process.exit() }
  const info22: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info22.isSome()) {
    const info = info22.unwrap() as StakerInfo;
    console.log(info);
  }
  else { console.log("No staker22"); }


  console.log("🔜 Change reward address...");
  const changeRewardCall = stakingContract.populate("change_reward_address", {
    reward_address: account2.address
  })
  const resp15 = await account0.execute(changeRewardCall, { skipValidate: false });
  const txR15 = await account0.waitForTransaction(resp15.transaction_hash);
  if (txR15.isSuccess()) { console.log("Success.") } else { console.log("Error", txR15); process.exit() }
  const info23: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info23.isSome()) {
    const info = info23.unwrap() as StakerInfo;
    console.log(info);
  }
  else { console.log("No staker"); process.exit() }


  console.log("🔜 claim...");
  const bal2 = await strkContract.balanceOf(account2.address);
  console.log("Initial balance account2 =", formatBalance(bal2, 18));
  console.log("wait 1'...");
  await wait(60 * 1000);
  const info8: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
  if (info8.isSome()) {
    const info = info8.unwrap() as StakerInfo;
    console.log("unclaimed_rewards =", info.unclaimed_rewards_own, formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker"); process.exit() }

  const claimCall = stakingContract.populate("claim_rewards", {
    staker_address: account0.address
  });
  const resp5 = await account2.execute(claimCall, { skipValidate: false });
  const txR5 = await account2.waitForTransaction(resp5.transaction_hash);
  if (txR5.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }
  const bal3 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal3, 18));
  const info7: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info7.isSome()) {
    const info = info7.unwrap() as StakerInfo;
    console.log("unclaimed_rewards =", info.unclaimed_rewards_own, formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK");
  }
  else { console.log("No staker"); process.exit() }

  console.log("🔜 Increase staking...");
  const increaseCall1 = stakingContract.populate("increase_stake", {
    staker_address: account0.address,
    amount: 1n * 10n ** 18n,
  });
  const increaseCall2 = stakingContract.populate("increase_stake", {
    staker_address: account0.address,
    amount: 2n * 10n ** 18n,
  });
  const resp2 = await account0.execute([approveCall2, increaseCall2]);
  const txR2 = await account0.waitForTransaction(resp2.transaction_hash);
  if (txR2.isSuccess()) { console.log("Success.") } else { console.log("Error", txR2) }

  const info2: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info2.isSome()) {
    const info2b = info2.unwrap();
    if (!!info2b) {
      console.log("get_staker_info =", formatBalance(BigInt(info2b.amount_own), 18), "STRK");
    }
  }
  if (info2.isNone()) { console.log("No staker"); }


  console.log("🔜 Unstake...")
  const bal0 = await strkContract.balanceOf(account2.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  console.log("wait 1'...");
  await wait(60 * 1000);
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall, { skipValidate: false });
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error3", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info(account0.address);
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

  const unstakeActionCall = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const resp4 = await account3.execute(unstakeActionCall, { skipValidate: false });
  const txR4 = await account3.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error4", txR4); process.exit() }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account3.address));
  if (info5.isSome()) {
    const info = info5.unwrap() as StakerInfo;
    console.log("get_staker_info =", info);
  }
  else { console.log("No staker. OK."); }
  const bal1 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal1, 18));



  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


