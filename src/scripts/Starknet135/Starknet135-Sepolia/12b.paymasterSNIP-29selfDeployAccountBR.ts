// Self deploy a Braavos account with SNIP-29 paymaster.
// Needs some USDC in account0.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/12b.paymasterSNIP-29selfDeployAccountBR.ts
// Coded with Starknet.js v7.4.0 + experimental

import { RpcProvider, shortString, json, logger, Account, PaymasterRpc, Contract, cairo, constants, RPC, RPC07, OutsideExecutionVersion, num, type TokenData, type PaymasterFeeEstimate, hash, ec, stark, CallData, type DeployTransaction, type ExecutableDeployTransaction, type PreparedTransaction, type Call } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2BraavosSepoliaAddress, account2BraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress, account3ArgentXSepoliaPrivateKey, accountETHoz17snip9Address } from "../../../A1priv/A1priv";
import { ethAddress, strkAddress, USDCaddressTestnet } from "../../utils/constants";
import axios from "axios";
import { formatBalance } from "../../utils/formatBalance";
import { displayBalances } from "./10.getBalance"
import { calculateAddressBraavos, getBraavosConstructor, getBraavosSignatureData } from "../../braavos/3h.deployBraavos120rpc08SNIP29";
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


  const newAccountPrivateKey = stark.randomAddress();
  console.log('New Braavos account:\nprivateKey=', newAccountPrivateKey);
  const starkKeyPub = ec.starkCurve.getStarkKey(newAccountPrivateKey);
  console.log('publicKey=', starkKeyPub);


  // const gasToken = "0x30058f19ed447208015f6430f0102e8ab82d6c291566d7e73fe8e613c3d2ed"  // SWAY
  // const gasToken = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";  // ETH
  // const gasToken = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"  // STRK
  const gasToken = "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080"  // USDC

  const BRaccountConstructorCallData = getBraavosConstructor(starkKeyPub);
  const BRcontractAddress = calculateAddressBraavos(starkKeyPub);
  console.log("BRcontractAddress =", BRcontractAddress);
  const sigData = getBraavosSignatureData(newAccountPrivateKey, await myProvider.getChainId());

  // Transfer of 0.1 USDC from account 0 to newAccount.
  const resp0 = await account0.execute({ contractAddress: gasToken, entrypoint: "transfer", calldata: [BRcontractAddress, 1n * 10n ** 5n, 0n] });
  const txR0 = await account0.waitForTransaction(resp0.transaction_hash);
  console.log("txR fund account", txR0);


  const newAccount = new Account(myProvider, BRcontractAddress, newAccountPrivateKey, undefined, undefined, paymasterRpc);

  const deploymentData = {
    address: BRcontractAddress,
    calldata: BRaccountConstructorCallData.map(num.toHex),
    salt: starkKeyPub,
    class_hash: "0x03d16c7a9a60b0593bd202f660a28c5d76e0403601d9ccc7e4fa253b6a70c201",
    sigdata: sigData.map(num.toHex),
    version: 1 as 1
  };
  console.log("deploymentData=", deploymentData);

  const estimatedFees: PaymasterFeeEstimate = await newAccount.estimatePaymasterTransactionFee([], {
    deploymentData,
    feeMode: { mode: 'default', gasToken },
  });
  console.log(estimatedFees);
  //process.exit(5);

  const respO = await newAccount.executePaymasterTransaction([], {
    deploymentData,
    feeMode: { mode: "default", gasToken }
  },
    estimatedFees.suggested_max_fee_in_gas_token
  );
  const txR = await newAccount.waitForTransaction(respO.transaction_hash);
  console.log("txR =", txR);

  await displayBalances(account0.address, myProvider);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// txH= 0x3899703b88a0e4155711392dde5ac7824a7181023761d152d6abc97c2be5978
// txH= 0x2634191493cbccfc4ab905d100aba1293ac8b221d04512ee19fa07db25e566b
