// Initialize, use & close a validator staker
// launch with npx src/scripts/Starknet133/1.stakingWithoutPool.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
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
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);

  const compiledSierraStake = json.parse(fs.readFileSync("./compiledContracts/cairo284/contracts_Staking.contract_class_361.json").toString("ascii"));
  const compiledSierraPool = json.parse(fs.readFileSync("./compiledContracts/cairo284/contracts_Pool.contract_class_361.json").toString("ascii"));
  const strkSierra = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20.sierra.json").toString("ascii"));
  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);

  const STAKING_CLASS_HASH = "0x006aeaaecc0ca479d787d9a110e7c7edb2fff2911eaf2ec754fc2c0fb4b83389";
  const STAKING_ADDRESS = "0x03745ab04a431fc02871a139be6b93d9260b0ff3e779ad9c8b377183b23109f1";
  const stakingContract = new Contract(compiledSierraStake.abi, STAKING_ADDRESS, myProvider);

    const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info6.isSome()) {
    const info6b = info6.unwrap()
    if (!!info6b) {
      console.log("Staker already exists.");process.exit();
    }
  }
  if (info6.isNone()) { console.log("No staker. OK."); }

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
  const resp0 = await account0.execute([approveCall1, stakeCall]);
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  if (txR0.isSuccess()) { console.log("Success.") } else { console.log("Error", txR0);process.exit() }

  // crash if no staker address
  // console.log("staker_info =", await stakingContract.staker_info(account0.address));


  const info: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info.isSome()) {
    const info0 = info.unwrap()
    if (!!info0) {
      console.log("get_staker_info =", formatBalance(BigInt(info0.amount_own), 18), "STRK");
    }
  }
  if (info.isNone()) { console.log("No staker"); }

  console.log("🔜 Increase staking...");
  const increaseCall1 = stakingContract.populate("increase_stake", {
    staker_address: account0.address,
    amount: 1n * 10n ** 18n,
  });
  const increaseCall2 = stakingContract.populate("increase_stake", {
    staker_address: account0.address,
    amount: 2n * 10n ** 18n,
  });
  console.log("🔜 increase stake 2 STRK...");
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


  console.log("🔜 increase stake 1 STRK...");
  const resp1 = await account0.execute([approveCall1, increaseCall1]);
  const txR1 = await account0.waitForTransaction(resp1.transaction_hash);
  if (txR1.isSuccess()) { console.log("Success.") } else { console.log("Error") }

  const info1: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info1.isSome()) {
    const info1b = info1.unwrap();
    if (!!info1b) {
      console.log("get_staker_info =", formatBalance(BigInt(info1b.amount_own), 18), "STRK");
    }
  }
  if (info1.isNone()) { console.log("No staker"); }


    

  console.log("🔜 claim...");
  const bal2 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal2, 18));
  console.log("wait 1'...");
  await wait(60 * 1000);
  const info8: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info8.isSome()) {
    const info8b = info8.unwrap();
    if (!!info8b) {
      console.log("unclaimed_rewards =",info8b.unclaimed_rewards_own, formatBalance(BigInt(info8b.unclaimed_rewards_own), 18), "STRK");
    }
  }
  if (info8.isNone()) { console.log("No staker"); }
  const claimCall = stakingContract.populate("claim_rewards", {
    staker_address: account0.address
  })
  const resp5 = await account0.execute(claimCall);
  const txR5 = await account0.waitForTransaction(resp5.transaction_hash);
  if (txR5.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }
  const bal3 = await strkContract.balanceOf(account0.address);
  console.log("Final balance account0 =", formatBalance(bal3, 18));
  const info7: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
  if (info7.isSome()) {
    const info7b = info7.unwrap();
    if (!!info7b) {
      console.log("unclaimed_rewards =", info7b.unclaimed_rewards_own,formatBalance(BigInt(info7b.unclaimed_rewards_own), 18), "STRK");
    }
  }
  if (info7.isNone()) { console.log("No staker"); process.exit()}


  console.log("🔜 Unstake...")
  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  console.log("wait 1'...");
  await wait(60 * 1000);
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall);
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }

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
  else { console.log("No staker");process.exit() }
  
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
  if (info5.isNone()) { console.log("No staker"); }
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


