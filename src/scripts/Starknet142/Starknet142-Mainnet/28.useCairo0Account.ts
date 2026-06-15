// Transfer ERC20 owned by an old Cairo0 account.
// Launch with npx ts-node src/scripts/Starknet142/Starknet142-Mainnet/28.useCairo0Account.ts
// Coded with Starknet.js v10.0.2

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { hexU32ArrayToBase64 } from "../../utils/encode";
import { displayBalances } from "../../utils/displayBalances";
import { account1ReadyMainnetAddress, account1ReadyMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import { assert } from "../../utils/assert";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }

  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node

  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // mainnet

  // Check that communication with provider is OK
  console.log(
    "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Devnet.");

  //process.exit(5);
  // *** Devnet
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;

  // *** initialize existing Sepolia Testnet account
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account3IntegrationOZ17address;
  // const privateKey0 = account3IntegrationOZ17privateKey;

  // *** initialize existing Argent X mainnet  account
  const accountAddress0 = account1ReadyMainnetAddress
  const privateKey0 = account1ReadyMainnetPrivateKey;

  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));
  // Declare & deploy Test contract in devnet

  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract({ abi: compiledERC20Contract.abi, address: ethAddress, providerOrAccount: account0 });
  const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });

  // max fee defined by Starknet :
  const maxTipForSpecialTx = BigInt("0x746a5288000");
  // Cairo 0 account classes handled by Starknet :
  const authorizedAccountClass = [
    "0x06d706cfbac9b8262d601c38251c5fbe0497c3a96cc91a92b08d91b61d9e70c4",
    "0x0309c042d3729173c7f2f91a34f04d8c509c1b292d334679ef1aabf8da0899cc",
    "0x01a7820094feaf82d53f53f214b81292d717e7bb9a92bb2488092cd306f3993f",
    "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2",
    "0x041cb0280ebadaa75f996d8d92c6f265f6d040bb3ba442e5f86a554f1765244e",
    "0x03530cc4759d78042f1b543bf797f5f3d647cde0388c33734cf91b7f7b9314a9"
  ];
  const accountClassH = num.toHex64(await myProvider.getClassHashAt(account0.address));
  assert(authorizedAccountClass.includes(accountClassH), "Account class not supported!");
  const tipEstimated = (await myProvider.getEstimateTip()).recommendedTip;
  let tip: bigint;
  if (tipEstimated > maxTipForSpecialTx) {
    console.log("Tips are currently too high. Let's try with max authorized...");
    tip = maxTipForSpecialTx;
  }
  else {
    tip = tipEstimated;
  }
  const myCall = ethContract.populate("transfer", {
    recipient: "0x123",
    amount: 1n * 10n ** 16n, // FRI
  });
  // `version: 1` means that the Tx v3 will include a tx V1 signature.
  // Normally, it should fail, but for these specific account classes, Starknet is able to handle it.
  const res0 = await account0.execute(myCall, { version: 1, tip });
  const txR0 = await account0.provider.waitForTransaction(res0.transaction_hash);
  console.log("Tx Report =", txR0);

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

