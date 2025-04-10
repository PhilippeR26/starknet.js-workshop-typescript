// Get the L2 transaction corresponding of a Starkgate L1 deposit
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/2.getStarkgateDepositL2Tx.ts
// Coded with Starknet.js v7.0.1

import { logger, num, hash, constants, uint256 } from "starknet";
import fs from "fs";
import * as ethers from "ethers"; //ethers v6
import * as dotenv from "dotenv";
dotenv.config();

const ZERO = '0x0';
const L2_MSG_TOPIC = '0xdb80dd488acf86d17c747445b0eabb5d57c541d3bd7b6b87af987858e5066b2b';

function validateLogs(logs: readonly ethers.Log[]): ethers.Log {
  const logL2msg = logs.find(log => num.toHex64(log.topics[0]) === L2_MSG_TOPIC);
  if (!logL2msg) {
    throw new Error('Invalid msg');
  }
  const { topics } = logL2msg;
  if ([topics[1], topics[2], topics[3]].some(value => value === undefined)) {
    throw new Error('Invalid logs');
  }
  return logL2msg;
}


async function main() {
  logger.setLogLevel('INFO');

  // result of the deposit of 0.7 STRK from Sepolia network to Starknet Testnet
  const l1Network = "sepolia";
  const depositL1txHash = "0x1eb878ff2cfd614042fb4d9848f82072bba0d3101da9cf13185f4990d0ae5709";

  // L1 Sepolia
  const l1Provider = ethers.getDefaultProvider(l1Network);
  console.log("l1 provider connected.");

  const l1Receipt = await l1Provider.getTransactionReceipt(depositL1txHash);
  if (l1Receipt) {
    const { data, topics } = validateLogs(l1Receipt.logs);
    const [l2Calldata, l1Nonce] = ethers.AbiCoder.defaultAbiCoder().decode(
      ['uint256[]', 'uint256', 'uint256'],
      ethers.dataSlice(data)
    );
    const l1FromAddress = topics[1];
    const l2ToAddress = topics[2];
    const l2Selector = topics[3];
    const result = num.toHex64(hash.calculateL2MessageTxHash(
      l1FromAddress,
      l2ToAddress,
      l2Selector,
      l2Calldata,
      constants.StarknetChainId["SN_SEPOLIA"],
      l1Nonce
    ));
    const l1Token = num.toHex(l2Calldata[0]);
    const l1Depositor = num.toHex(l2Calldata[1]);
    const l2To = num.toHex64(l2Calldata[2]);
    const amount = uint256.uint256ToBN({ low: l2Calldata[3], high: l2Calldata[4] })
    console.log("Starkgate deposit in", l1Network, ":");
    console.log("From L1 transaction hash:", depositL1txHash);
    console.log("Corresponding L2 transaction hash:", result);
    console.log("L1 account depositor:", l1Depositor);
    console.log("L1 token address:", l1Token);
    console.log("L2 recipient account:", l2To);
    console.log("Qty:", amount);
  }
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




