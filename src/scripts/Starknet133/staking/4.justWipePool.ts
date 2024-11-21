// remove stake in a pool.
// Launch with npx src/scripts/Starknet133/staking/4.justWipePool.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import type { PoolMemberInfo, StakerInfo } from "./type";
import { compiledSierraPool, compiledSierraStake, STAKING_ADDRESS, strkSierra } from "./constants";
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


  // *********** 👇👇👇 adapt this address to your case :
  const poolAddress = "0x15400220e6f5949c67c3fdae95c6dece4e9a657d37917eec24bbce8a9045121";
// *****************
  const poolContract = new Contract(compiledSierraPool.abi, poolAddress, myProvider);


  console.log("🔜 Total withdraw...");
  const info: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(account2.address);
  if (info.isSome()) {
    const info0 = info.unwrap() as PoolMemberInfo;
    console.log("get_pool_member_info =", info0);
    const remain = BigInt(info0.amount);
    const in_progress = BigInt(info0.unpool_amount);
    console.log("To unstake from account2 =", formatBalance(remain + in_progress, 18), "STRK");

    console.log("Init...");
    const totalWithdrawInitCall = poolContract.populate("exit_delegation_pool_intent", {
      amount: remain + in_progress,
    });
    const resp = await account2.execute(totalWithdrawInitCall);
    const txR = await account2.waitForTransaction(resp.transaction_hash);
    if (txR.isSuccess()) { console.log("Success.") } else { console.log("Error"); process.exit() }

    const info2: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
    if (info2.isSome()) {
      const info = info2.unwrap();
      if (!!info) {
        console.log("get_staker_info =", info);
      }
    }
    else { console.log("No staker"); }

    const info1: CairoOption<PoolMemberInfo> = await poolContract.get_pool_member_info(BigInt(account2.address));
    if (info1.isSome()) {
      const info = info1.unwrap()
      if (!!info) {
        console.log("get_pool_member_info =", info);
        const pool_time = info.unpool_time.unwrap()?.seconds as BigNumberish;
        console.log({ pool_time });
        const durationSec = Number(BigInt(pool_time)) - new Date().getTime() / 1000 + 60;
        console.log("wait", durationSec + "s (", durationSec / 60 + "')");
        await wait(durationSec * 1000);
      }
    }
    else { console.log("No pool 1"); process.exit() }

    console.log("Action...");
    const undelegateActionCall = poolContract.populate("exit_delegation_pool_action", {
      pool_member: account2.address
    });
    const resp8 = await account2.execute(undelegateActionCall);
    const txR8 = await account2.waitForTransaction(resp8.transaction_hash);
    if (txR8.isSuccess()) { console.log("Success.") } else { console.log("Error") }
    const info11: CairoOption<StakerInfo> = await stakingContract.get_staker_info(BigInt(account0.address));
    if (info11.isSome()) {
      const info = info11.unwrap();
      if (!!info) {
        console.log("get_staker_info =", info);
      }
    }
    else { console.log("No staker"); }



  }
  else { console.log("No pool 2"); process.exit() }

  const bal4 = await strkContract.balanceOf(account2.address);
  console.log("Final balance account2 =", formatBalance(bal4, 18));


  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


