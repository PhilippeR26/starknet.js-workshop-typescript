// Test modified waitForTransaction with  deploy Contract
// Launch with npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/2.testWaitForTx-deployC.ts
// Coded with Starknet.js PR#1632

import { constants, json, shortString, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode, RpcProvider, Account, Contract } from "starknet";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, equilibriumPathfinderTestnetUrl } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }

   const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia node
  // const myProvider = new RpcProvider({ nodeUrl: equilibriumPathfinderTestnetUrl }); // Sepolia Testnet v0.10.0

  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node

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
   const accountAddress0 = account1OZSepoliaAddress;
   const privateKey0 = account1OZSepoliaPrivateKey;

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

  const compiledSierra = json.parse(fs.readFileSync("./src/scripts/Starknet143/Starknet143-Sepolia/counter_test_counter.contract_class.json").toString("ascii")) as CompiledSierra;
  const classH = "0x273bf0754b201f1683fa4ffecfaeba8a0d320436d6619a4e6e3b37153817886"
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii")) as CompiledSierra;
  const ethContract = new Contract({ abi: compiledERC20Contract.abi, address: ethAddress, providerOrAccount: account0 });
  const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });

  const myCallData=new CallData(compiledSierra.abi);
  const constructorCalldata=myCallData.compile("constructor",{init:1});
  console.time("deploy contract");
  const resDeploy = await account0.deployContract({ classHash:classH,constructorCalldata}); // includes waitForTx()
  // addr = 0x379aa39fd27aeb5204d9c58ff99eb2a7e775f00c680da601c45fab454917795 // Testnet
  console.log("Deployed with address:", resDeploy.address);
  const testContract=new Contract({abi:compiledSierra.abi,address:resDeploy.address,providerOrAccount:account0});
  console.timeEnd("deploy contract");
  const count = await testContract.getCounter();
  console.log("counter:", count);
  // verify no nonce pbs.
  console.log("transfer...");
  const trCall = strkContract.populate("transfer", {
    recipient: account0.address,
    amount: 1n * 10n ** 3n
  });
  const res1 = await account0.execute(trCall);
  const txR1 = await account0.provider.waitForTransaction(res1.transaction_hash);

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
