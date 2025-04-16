// Close a running staking
// Launch with npx src/scripts/Starknet133/staking/3.justUnStake.ts
// Coded with Starknet.js v7.1.0
import { BigNumberish, shortString, RpcProvider, Account, json, hash, Contract, CairoOption, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import { wait } from "../../utils/utils";
import { abiCompiledSierraStakeV2, STAKING_ADDRESS, strkSierra } from "./constants";
import type { StakerInfo } from "./type";
dotenv.config();


async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" });
  // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet.");

  //const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = account2TestBraavosSepoliaAddress;
  const privateKey0 = account2TestBraavosSepoliaPrivateKey;
  const accountAddress1 = account2BraavosSepoliaAddress;
  const privateKey1 = account2BraavosSepoliaPrivateKey;
  const accountAddress2 = account3ArgentXSepoliaAddress;
  const privateKey2 = account3ArgentXSepoliaPrivateKey;

  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  // const account0 = new Account(myProvider, accountAddress1, privateKey1);
  // const account0 = new Account(myProvider, accountAddress2, privateKey2);

  const stakingContract = new Contract(abiCompiledSierraStakeV2, STAKING_ADDRESS, myProvider);
  const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);


  console.log("🔜 Unstake...")
  const bal0 = await strkContract.balanceOf(account0.address);
  console.log("Initial balance account0 =", formatBalance(bal0, 18));
  const info6: CairoOption<StakerInfo> = await stakingContract.get_staker_info_v1(BigInt(account0.address));
  if (info6.isSome()) {
    const info = info6.unwrap() as StakerInfo;
    console.log(info); 
    console.log("unclaimed rewards =", formatBalance(BigInt(info.unclaimed_rewards_own), 18), "STRK"); 
  }
  if (info6.isNone()) { console.log("No staker.");process.exit(); }

  console.log("Init...");
  const unstakeInitCall = stakingContract.populate("unstake_intent", {});
  const resp3 = await account0.execute(unstakeInitCall, { skipValidate: false });
  const txR3 = await account0.waitForTransaction(resp3.transaction_hash);
  if (txR3.isSuccess()) { console.log("Success.") } else { console.log("Error", txR3); process.exit() }

  const info4: CairoOption<StakerInfo> = await stakingContract.get_staker_info_v1(BigInt(account0.address));
  if (info4.isSome()) {
    const info4b = info4.unwrap();
    if (!!info4b) {
      console.log("get_staker_info =", info4b);
      const unstake_time = info4b.unstake_time.unwrap()?.seconds as BigNumberish;
      console.log({ unstake_time });
      const durationSec = Number(BigInt(unstake_time)) - new Date().getTime() / 1000 + 60;
      console.log("wait", durationSec + "s (", durationSec / 60 + "')");
      await wait(durationSec * 1000);
    }
  }
  else { console.log("No staker"); process.exit() }
  console.log("Action...");
  const unstakeActionCall = stakingContract.populate("unstake_action", {
    staker_address: account0.address
  });
  const resp4 = await account0.execute(unstakeActionCall);
  const txR4 = await account0.waitForTransaction(resp4.transaction_hash);
  if (txR4.isSuccess()) { console.log("Success.") } else { console.log("Error") }
  const info5: CairoOption<StakerInfo> = await stakingContract.get_staker_info_v1(BigInt(account0.address));
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


