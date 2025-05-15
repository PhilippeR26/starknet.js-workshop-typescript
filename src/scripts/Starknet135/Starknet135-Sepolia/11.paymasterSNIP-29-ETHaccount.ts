// Use SNIP-29 paymaster with ETH signature account
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/11.paymasterSNIP-29-ETHaccount.ts
// Coded with Starknet.js v7.1.0 + experimental

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, RPC, RPC07, OutsideExecutionVersion, num, type TokenData, type PaymasterFeeEstimate, EthSigner } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address, accountETHoz17snip9PrivateKey } from "../../../A1priv/A1priv";
import { ethAddress, strkAddress, USDCaddressTestnet } from "../../utils/constants";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "./10.getBalance"
dotenv.config();

function displayFees(
  fees: PaymasterFeeEstimate,
  tokenName: string,
  decimals: number) {
  const priceTokenInSTRK = formatBalance(BigInt(fees.gas_token_price_in_strk), 18);
  console.log("Price of 1", tokenName, "=", priceTokenInSTRK, "STRK");
  console.log("Price of 1 STRK =", 1 / Number(priceTokenInSTRK), tokenName);
  console.log("estimated fees (in STRK)", formatBalance(BigInt(fees.estimated_fee_in_strk), 18));
  console.log("estimated fees (in", tokenName, ")", formatBalance(BigInt(fees.estimated_fee_in_gas_token), decimals));
  console.log("suggested max fees (estim x5 in STRK)", formatBalance(BigInt(fees.suggested_max_fee_in_strk), 18));
  console.log("suggested max fees (estim x5 in", tokenName, ")", formatBalance(BigInt(fees.suggested_max_fee_in_gas_token), decimals));
}

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
  // non SNIP-9 account:
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // SNIP-9 compatible accounts:
  // const accountAddress0 = account3ArgentXSepoliaAddress;
  // const privateKey0 = account3ArgentXSepoliaPrivateKey;
  const accountAddress0 = account2BraavosSepoliaAddress;
  const privateKey0 = account2BraavosSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const ethSigner = new EthSigner(accountETHoz17snip9PrivateKey);
  //const accountEthOZ17 = new Account(myProvider, accountETHoz17snip9Address, ethSigner);
  const paymasterRpc = new PaymasterRpc({ default: true });

  const accountEthOZ17 = new Account(myProvider, accountETHoz17snip9Address, ethSigner, "1", constants.TRANSACTION_VERSION.V3, paymasterRpc);
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');
  const versionSNIP9 = await accountEthOZ17.getSnip9Version();
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
  await displayBalances(accountEthOZ17.address, myProvider);
  const res = await accountEthOZ17.paymaster.isAvailable()
  console.log("url:", accountEthOZ17.paymaster.nodeUrl, ", isAvailable=", res);

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
  const supported: TokenData[] = await accountEthOZ17.paymaster.getSupportedTokens();
  console.log("supported =", supported);
  const isETHsupported = supported.some((token: TokenData) =>
    num.toHex64(token.address) === ethAddress);
  console.log("isETHsupported =", isETHsupported);
  const isUSDCsupported = supported.some(token =>
    num.toHex64(token.address) === USDCaddressTestnet);
  console.log("isUSDCsupported =", isUSDCsupported);

  const strkSierra = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20mintableDecimalsOZ081.sierra.json").toString("ascii"));
  const strkContract = new Contract(strkSierra.abi, strkAddress, accountEthOZ17);
  const myCall = strkContract.populate("transfer",
    {
      recipient: accountETHoz17snip9Address,
      amount: 1n * 10n ** 3n,
    });
  // const typed = await account0.paymaster.buildTypedData(account0.address, [myCall]);
  // console.log("typedData", typed);

  // const gasToken = "0x30058f19ed447208015f6430f0102e8ab82d6c291566d7e73fe8e613c3d2ed"  // SWAY
  // const gasToken = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";  // ETH
  // const gasToken = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"  // STRK
  const gasToken = "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080"  // USDC
  const built = await accountEthOZ17.paymaster.buildTransaction({
    type: 'invoke',
    invoke: {
      userAddress: accountEthOZ17.address,
      calls: [myCall],
    }
  }, {
    version: '0x1',
    feeMode: { mode: 'default', gasToken: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" }, // ETH
    // timeBounds?: PaymasterTimeBounds;
  });
  const builtUSDC = await accountEthOZ17.paymaster.buildTransaction({
    type: 'invoke',
    invoke: {
      userAddress: accountEthOZ17.address,
      calls: [myCall],
    }
  }, {
    version: '0x1',
    feeMode: { mode: 'default', gasToken: "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080" }, // USDC
    // timeBounds?: PaymasterTimeBounds;
  });

  console.log("builtTransactionETH", built.fee);
  console.log("builtTransactionUSDC", builtUSDC.fee);
  console.log("\nETH:");
  displayFees(built.fee, "ETH", 18);
  console.log("\nUSDC:");
  displayFees(builtUSDC.fee, "USDC", 6);

  // process.exit(5);
  const multiplyFees = 100n;
  const maxFee = BigInt(builtUSDC.fee.suggested_max_fee_in_gas_token) * multiplyFees;
  console.log("maxFee =", formatBalance(maxFee, 6), "USDC");
  console.log(("Processing with USDC..."));
  const res2 = await accountEthOZ17.execute(
    myCall,
    {
      paymaster: {
        feeMode: { mode: "default", gasToken },
        // feeMode:{mode:"sponsored"},
        maxEstimatedFeeInGasToken: BigInt(builtUSDC.fee.suggested_max_fee_in_gas_token) * multiplyFees,
      }
    }
  );
  const txR2 = await myProvider.waitForTransaction(res2.transaction_hash);
  // console.log("Transaction hash :", res2.transaction_hash);
  console.log("Transaction receipt :", txR2);
  await displayBalances(accountEthOZ17.address, myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

