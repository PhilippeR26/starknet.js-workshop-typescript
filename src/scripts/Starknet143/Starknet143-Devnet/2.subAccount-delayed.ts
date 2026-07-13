// Test sub account - account with delayed transfer
// Launch with npx ts-node src/scripts/Starknet143/Starknet143-Devnet/2.subAccount-delayed.ts
// Coded with Starknet.js v10.4.0

import { constants, json, shortString, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode, RpcProvider, Account, Contract, type Calldata } from "starknet";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, equilibriumPathfinderTestnetUrl } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { wait } from "../../utils/utils";

dotenv.config({ quiet: true });




async function main() {
  let tip: bigint | undefined;
  // initialize Provider 
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  tip = 0n;
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

  // tip = undefined;
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
  // const myProvider = new RpcProvider({ nodeUrl: equilibriumPathfinderTestnetUrl }); // Sepolia Testnet v0.10.0

  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node

  // Check that communication with provider is OK
  console.log(
    "provider :", myProvider.channel.nodeUrl, "\n" +
  "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Devnet.");

  //process.exit(5);
  // *** Devnet
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;

  // *** initialize existing Sepolia Testnet account
  //  const accountAddress0 = account1OZSepoliaAddress;
  //  const privateKey0 = account1OZSepoliaPrivateKey;

  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account3IntegrationOZ17address;
  // const privateKey0 = account3IntegrationOZ17privateKey;

  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  await displayBalances(account0.address, myProvider);

  console.log()
  const compiledSierraSubAccount = json.parse(fs.readFileSync("./compiledContracts/cairo2190/sub_account_SubAccount.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasmSubAccount = json.parse(fs.readFileSync("./compiledContracts/cairo2190/sub_account_SubAccount.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  // classH sub account = 0x652dd57255b52cbe2e64328692ac3b6d89598584e5fae4d0fc655c1cc1bda23
  const resDec = await account0.declareIfNot({ contract: compiledSierraSubAccount, casm: compiledCasmSubAccount });
  console.log("Sub Account declared with Class Hash:", resDec.class_hash);

  const compiledSierraTransferAdapter = json.parse(fs.readFileSync("./compiledContracts/cairo2190/sub_account_TimelockTransferAdapter.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasmTransferAdapter = json.parse(fs.readFileSync("./compiledContracts/cairo2190/sub_account_TimelockTransferAdapter.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  // classH transfer adapter = 0x1b64cd0bed340a9d674a1dd2ed3659c0bf4df1acfe859bdfea4a0be8dd3e989
  const resDec1 = await account0.declareIfNot({ contract: compiledSierraTransferAdapter, casm: compiledCasmTransferAdapter });
  console.log("Transfer adapter declared with Class Hash:", resDec1.class_hash);

  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii")) as CompiledSierra;
  const compiledCasmERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.casm.json").toString("ascii")) as CairoAssembly;
  // classH erc20 = 0x2718db92cfa9342bd19306fb1d10cb5c61385293b4bdaac23c36577dd7ed882
  const resDec2 = await account0.declareIfNot({ contract: compiledERC20Contract, casm: compiledCasmERC20Contract });
  console.log("ERC20 declared with Class Hash:", resDec2.class_hash);

  const ethContract = new Contract({ abi: compiledERC20Contract.abi, address: ethAddress, providerOrAccount: account0 });
  const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });

  const myCallDataSubAccount = new CallData(compiledSierraSubAccount.abi);
  const constructorCalldataSubAccount = myCallDataSubAccount.compile("constructor", { owner: account0.address });
  const resDeploySubAccount = await account0.deployContract({ classHash: resDec.class_hash, constructorCalldata: constructorCalldataSubAccount });
  // addr =  
  console.log("Sub account deployed with address :", resDeploySubAccount.address);
  const subAccountContract = new Contract({ abi: compiledSierraSubAccount.abi, address: resDeploySubAccount.address });

  const myCallDataERC20 = new CallData(compiledERC20Contract.abi);
  const constructorCalldataERC20 = myCallDataERC20.compile("constructor", {
    name: "testERC20",
    symbol: "T20",
    fixed_supply: 100n * 10n ** 18n,
    recipient: subAccountContract.address,
    owner: account0.address,
  });
  const resDeployERC20 = await account0.deployContract({ classHash: resDec2.class_hash, constructorCalldata: constructorCalldataERC20 });
  // addr =  
  console.log("test ERC20 deployed with address :", resDeployERC20.address);
  const testERC20Contract = new Contract({ abi: compiledERC20Contract.abi, address: resDeployERC20.address });


  const myCallDataTransferAdapter = new CallData(compiledSierraTransferAdapter.abi);
  // This adapter allow to transfer only after delay.
  const constructorCalldataTransferAdapter = myCallDataTransferAdapter.compile("constructor", {
    owner: account0.address,
    delay: 30,
    window: 60,
  });

  const resDeployTransferAdapter = await account0.deployContract({ classHash: resDec1.class_hash, constructorCalldata: constructorCalldataTransferAdapter });
  // addr =  
  console.log("Transfer adapter deployed with address :", resDeployTransferAdapter.address);
  const transferAdapterContract = new Contract({
    abi: compiledSierraTransferAdapter.abi,
    address: resDeployTransferAdapter.address,
    providerOrAccount: myProvider
  });

  // account0 authorize the sub-account to use the TransferAdapter adapter.
  const call0 = subAccountContract.populate("set_adapter", {
    adapter: transferAdapterContract.address,
    allowed: true,
  });
  const res0 = await account0.execute(call0, { tip });
  const txR0 = await myProvider.waitForTransaction(res0.transaction_hash);
  if (txR0.isSuccess()) { console.log("set adapter OK") } else { throw new Error("set adapter") };

  const amountToTransfer = 5n * 10n ** 16n; // 0.05 T20 token
  const call1 = subAccountContract.populate("approve_token", {
    token: testERC20Contract.address,
    spender: transferAdapterContract.address,
    amount: amountToTransfer * 2n,
  });
  const res1 = await account0.execute(call1, { tip });
  const txR1 = await myProvider.waitForTransaction(res1.transaction_hash);
  if (txR1.isSuccess()) { console.log("approve_token OK") } else { throw new Error("approve_token") };


  console.log("transfer request...");
  const transferCall = transferAdapterContract.populate("request_transfer", {
    token: testERC20Contract.address,
    recipient: account0.address,
    amount: amountToTransfer
  });
  const trCall = subAccountContract.populate("execute", {
    call: {
      to: transferCall.contractAddress,
      selector: hash.getSelectorFromName(transferCall.entrypoint),
      calldata: transferCall.calldata,
    },
  });
  const res2 = await account0.execute(trCall, { tip });
  const txR2 = await account0.provider.waitForTransaction(res2.transaction_hash);
  if (txR2.isSuccess()) { console.log("transfer request OK") } else { throw new Error("transfer request") };
  const pendingCallData = transferAdapterContract.populate("pending", {
    caller: subAccountContract.address,
    token: testERC20Contract.address,
    recipient: account0.address,
    amount: amountToTransfer,
  });
  console.log("stored:", await transferAdapterContract.call("pending", pendingCallData.calldata as Calldata));
  try {
    const res3 = await account0.execute(trCall, { tip });
    console.log("transfer too early, but has not failed!!!");
  } catch (err: any) {
    const msg = JSON.stringify(err);
    if (msg.includes("TOO_EARLY")) {
      console.log("Has failed as expected for early transfer with TOO_EARLY")
    } else {
      throw new Error("unexpected error : " + err)
    }
  };
  console.log("wait 35s...");
  await wait(35 * 1000);
  // dummy tx, just to be sure that Devnet clock is increased.
  const res5 = await strkContract.withOptions({ tip }).transfer(account0.address, 100);
  await account0.provider.waitForTransaction(res5.transaction_hash);
  console.log("retry...");
  const res4 = await account0.execute(trCall, { tip });
  console.log("transfer in progress...");
  const txR4 = await account0.provider.waitForTransaction(res4.transaction_hash);
  if (txR4.isSuccess()) { console.log("transfer Done") } else { throw new Error("transfer failed.") };
  const mem2 = (await transferAdapterContract.call("pending", pendingCallData.calldata as Calldata)) as { executable_at: bigint, expires_at: bigint }

  console.log("stored2:", mem2);
  if (mem2.executable_at == 0n) {
    console.log("Transfer executed (as expected).")
  } else {
    console.log("transfer is till pending!!!")
  }
  console.log("Create a transfer, and wait the closure of the window (should be executed as new request of transfer):");
  console.log("ask transfer...");
  const res6 = await account0.execute(trCall, { tip });
  const txR6 = await account0.provider.waitForTransaction(res6.transaction_hash);
  const mem0 = (await transferAdapterContract.call("pending", pendingCallData.calldata as Calldata)) as { executable_at: bigint, expires_at: bigint }
  const start0 = mem0.executable_at;

  console.log("stored0:", mem0);
  console.log("wait 95s...");
  await wait(95 * 1000); // 30s delay + 60 window + 5s margin
  // dummy tx, just to be sure that Devnet clock is increased.
  const res7 = await strkContract.withOptions({ tip }).transfer(account0.address, 100);
  await account0.provider.waitForTransaction(res7.transaction_hash);
  console.log("Try to finalize transfer...");
  // as time window is closed, the request is in fact canceled. This finalization request becomes in reality a new request
  const res8 = await account0.execute(trCall, { tip });
  const txR8 = await account0.provider.waitForTransaction(res8.transaction_hash);
  const mem1 = (await transferAdapterContract.call("pending", pendingCallData.calldata as Calldata)) as { executable_at: bigint, expires_at: bigint }

  console.log("stored:1", mem1);
  if (mem1.executable_at > 0) {
    console.log("Pending request exists (as expected).");
    if (start0 !== mem1.executable_at) { console.log("A new transfer request is stored (as expected).") } else {
      console.log("Initial pending transfer!!!!")
    }
  } else {
    console.log("no pending transfer!!!")
  }



  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
