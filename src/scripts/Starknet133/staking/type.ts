import type { BigNumberish, CairoOption } from "starknet";

export type TimeStamp = { seconds: BigNumberish };

export type StakerPoolInfo = {
    pool_contract: BigNumberish,
    amount: BigNumberish,
    unclaimed_rewards: BigNumberish,
    commission: BigNumberish,
};

export type StakerInfo = {
    reward_address: BigNumberish,
    operational_address: BigNumberish,
    unstake_time: CairoOption<TimeStamp>,
    amount_own: BigNumberish,
    index: BigNumberish,
    unclaimed_rewards_own: BigNumberish,
    pool_info: CairoOption<StakerPoolInfo>,
};

export type PoolMemberInfo = {
    reward_address: BigNumberish,
    amount: BigNumberish,
    index: BigNumberish,
    unclaimed_rewards: BigNumberish,
    commission: BigNumberish,
    unpool_amount: BigNumberish,
    unpool_time: CairoOption<TimeStamp>,
  };

  export type NewStakerEvent={
    staker_address: BigNumberish,
    reward_address: BigNumberish,
    operational_address: BigNumberish,
    self_stake: BigNumberish,
  }