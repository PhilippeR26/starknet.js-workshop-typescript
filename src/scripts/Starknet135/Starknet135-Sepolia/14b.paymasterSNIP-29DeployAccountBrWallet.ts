// Deploy a Braavos account (created in the wallet, but not deployed) with SNIP-29 paymaster.
// Needs some USDC in the account.
// Needs also to know the private key of the account.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/14b.paymasterSNIP-29DeployAccountBrWallet.ts
// Coded with Starknet.js v7.4.0 + experimental

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, RPC, RPC07, OutsideExecutionVersion, num, type TokenData, type PaymasterFeeEstimate, hash, ec, stark, CallData, type DeployTransaction, type ExecutableDeployTransaction, type PreparedTransaction, type ExecutableUserTransaction, type DeployAccountContractTransaction, ETransactionVersion, type CairoVersion, type V3InvocationsSignerDetails, type UniversalDetails, type Signature, type ArraySignatureType, type EstimateFeeDetails } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address, newAccountPrivateKey } from "../../../A1priv/A1priv";
import { ethAddress, strkAddress, USDCaddressTestnet } from "../../utils/constants";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "./10.getBalance"
import type { AccountDeploymentData } from "@starknet-io/types-js";
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
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8", specVersion: "0.8.1" });
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: "0.8.1" });
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

  const paymasterRpc = new PaymasterRpc({ default: true });

  const account0 = new Account(myProvider, accountAddress0, privateKey0, "1", constants.TRANSACTION_VERSION.V3, paymasterRpc);
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');
  const versionSNIP9 = await account0.getSnip9Version();
  console.log("Account SNIP-9 compatibility :", versionSNIP9 === OutsideExecutionVersion.UNSUPPORTED ? "UNSUPPORTED" : versionSNIP9);

  await displayBalances(account0.address, myProvider);
  const res = await account0.paymaster.isAvailable()
  console.log("url:", account0.paymaster.nodeUrl, ", isAvailable=", res);

  const supported: TokenData[] = await account0.paymaster.getSupportedTokens();
  // console.log("supported =", supported);
  const isETHsupported = supported.some((token: TokenData) =>
    num.toHex64(token.token_address) === ethAddress);
  console.log("isETHsupported =", isETHsupported);
  const isUSDCsupported = supported.some(token =>
    num.toHex64(token.token_address) === USDCaddressTestnet);
  console.log("isUSDCsupported =", isUSDCsupported);

  // const gasToken = "0x30058f19ed447208015f6430f0102e8ab82d6c291566d7e73fe8e613c3d2ed"  // SWAY
  // const gasToken = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";  // ETH
  // const gasToken = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"  // STRK
  const gasToken = "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080"  // USDC

  // *** response of the Braavos wallet: 
  // result of frontend wallet.deploymentData(StarknetWalletObject);
  const deploymentData = {
    address: "0x1c1560e3e43972f9f87a2245a3c9e8fd73d4868017103a57d62547366eb7f18",
    calldata: ["0x1f9d4d9bff5f7fb46ecbc44d806af3f8e1b36771c1bcc38cb484a3425d53ba"],
    salt: "0x1f9d4d9bff5f7fb46ecbc44d806af3f8e1b36771c1bcc38cb484a3425d53ba",
    class_hash: "0x03d16c7a9a60b0593bd202f660a28c5d76e0403601d9ccc7e4fa253b6a70c201",
    sigdata: ["0x03957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a", "0x0", "0", "0", "0", "0", "0x0", "0x0", "0x0", "0x0", "0x534e5f5345504f4c4941", "0x35be8fa01889389d8a94821b2cc8e0f38467f2cbec5f88d85fbeda2a6d39e87", "0x7d6a85a276c5493dc5fa5c9f29152dfbd9b301afb8458ada5923652ff777d61"].map(num.toHex),
    version: 1 as 1
  };

  const BRcontractAddress = deploymentData.address;
  console.log("parameters in estimate=", deploymentData);
  // Problem to deploy a Braavos account in the backend : the server needs to have the private key of this account. So it needs user manual work in the Wallet... 
  const newAccount = new Account(myProvider, BRcontractAddress, newAccountPrivateKey, undefined, undefined, paymasterRpc);
  const estimatedFees: PaymasterFeeEstimate = await newAccount.estimatePaymasterTransactionFee([], {
    deploymentData,
    feeMode: { mode: 'default', gasToken },
  });

  const resp = await newAccount.executePaymasterTransaction([], {
    deploymentData,
    feeMode: { mode: 'default', gasToken },
  }, estimatedFees.suggested_max_fee_in_gas_token);
  const txR2 = await newAccount.waitForTransaction(resp.transaction_hash);
  console.log("txR2", txR2);
  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

