// Get Sierra and Casm files from a contract class, in Sepolia  network
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/8.getSierraCasmFromClass.ts
// Coded with Starknet.js v7.1.0

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, RPC, RPC07, OutsideExecutionVersion, num } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { ethAddress, strkAddress, USDCaddressTestnet } from "../../utils/constants";
import axios from "axios";
dotenv.config();


async function main() {
  // ********* Mainnet **************
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_8" });
  // ********* Sepolia Testnet **************
  // local pathfinder Sepolia Testnet node
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: "0.8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); 
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:9545/rpc/v0_7" });
  // local Juno Sepolia Testnet node
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://192.168.1.78:6070/rpc/v0_8" });
  // const myProvider = await RpcProvider.create({ nodeUrl: "http://localhost:6070/rpc/v0_8" });
  // ******** Sepolia Integration **************
  // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:6095/rpc/v0_8" }); // local Juno Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_8" }); // local pathfinder Sepolia Integration node


  // logger.setLogLevel("ERROR");
  // config.set("legacyMode",true);
  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Sepolia testnet");

  // *** Devnet
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;


  // *** initialize existing Sepolia Testnet account
  //const accountAddress0 = account3ArgentXSepoliaAddress;
  //const privateKey0 = account3ArgentXSepoliaPrivateKey;
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  const accountAddress0 = account2BraavosSepoliaAddress;
  const privateKey0 = account2BraavosSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress

  const paymasterRpc = new PaymasterRpc({ default: true });

  const account0 = new Account(myProvider, accountAddress0, privateKey0, "1", constants.TRANSACTION_VERSION.V3, paymasterRpc);
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');
  const versionSNIP9 = await account0.getSnip9Version();
  console.log("Account SNIP-9 compatibility :", versionSNIP9 === OutsideExecutionVersion.UNSUPPORTED ? "UNSUPPORTED" : versionSNIP9);

  // const { data: answer } = await axios.post(
  //   "https://sepolia.paymaster.avnu.fi",
  //   {
  //     id: 7,
  //     jsonrpc: "2.0",
  //     method: "paymaster_isAvailable",
  //     params: {},
  //   },
  //   { headers: { "Content-Type": "application/json" } }
  // );
  // console.log('Answer axios paymaster_isAvailable =', answer);
  const res = await account0.paymaster.isAvailable()
  console.log("url:", account0.paymaster.nodeUrl, ", isAvailable=", res);

  // const { data: respSupported } = await axios.post(
  //   "https://sepolia.paymaster.avnu.fi",
  //   {
  //     id: 7,
  //     jsonrpc: "2.0",
  //     method: "paymaster_getSupportedTokens",
  //     params: {},
  //   },
  //   { headers: { "Content-Type": "application/json" } }
  // );
  // console.log('Answer axios paymaster_getSupportedTokens =', respSupported);
  const supported = await account0.paymaster.getSupportedTokens();
  console.log("supported =", supported);
  const isETHsupported = supported.some(token =>
    num.toHex64(token.address) === ethAddress);
  console.log("isETHsupported =", isETHsupported);
  const isUSDCsupported = supported.some(token =>
    num.toHex64(token.address) === USDCaddressTestnet);
  console.log("isUSDCsupported =", isUSDCsupported);

  const strkSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
  const strkContract = new Contract(strkSierra.abi, strkAddress, account0);
  const myCall = strkContract.populate("transfer",
    {
      recipient: account2BraavosSepoliaAddress,
      amount: 1n * 10n ** 12n,
    });
  // const typed = await account0.paymaster.buildTypedData(account0.address, [myCall]);
  // console.log("typedData", typed);


  const res2 = await account0.execute(
    myCall,
    {
      paymaster: {
        feeMode: { mode: 'default', gasToken: supported[2].address }
      }
    }
  );
  const txR2 = await myProvider.waitForTransaction(res2.transaction_hash);
  console.log("Transaction hash:", res2.transaction_hash);
  console.log("Transaction status:", txR2);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
