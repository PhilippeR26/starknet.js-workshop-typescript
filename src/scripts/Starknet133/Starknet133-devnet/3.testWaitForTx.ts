// Mint token in an ArgentX account in a devnet-rs (forked from mainnet)
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-devnet/3.testWaitForTx.ts
// Coded with Starknet.js v6.20.3 & devnet-rs v0.2.3 & starknet-devnet.js v0.2.3

import { RpcProvider, Account, shortString, json, Contract, type InvokeFunctionResponse, TransactionFinalityStatus } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import * as dotenv from "dotenv";
import fs from "fs";
import { strkAddress } from "../../utils/constants";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --fork-network https://free-rpc.nethermind.io/sepolia-juno/v0_7' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  console.log("Accounts connected.\n");

  const strkSierra = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20.sierra.json").toString("ascii"));
  const strkContract = new Contract(strkSierra.abi, strkAddress, account0);
  console.log("Tx...");
  const resp = await strkContract.transfer(account1.address, 100n) as InvokeFunctionResponse;
  const txR = await myProvider.waitForTransaction(resp.transaction_hash, { successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2] });
  console.log(txR);
  txR.match({
    success: () => {
      console.log('➡️Success');
    },
    _: () => {
      console.log('➡️Unsuccess');
    },
  });

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
