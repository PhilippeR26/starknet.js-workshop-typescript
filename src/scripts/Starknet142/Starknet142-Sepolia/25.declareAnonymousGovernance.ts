// declare in Devnet the proof contract
// launch with npx ts-node src/scripts/Starknet142/Starknet142-Sepolia/25.declareAnonymousGovernance.ts
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
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

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
  console.log(await displayBalances(account0.address, myProvider));
  // Declare & deploy erc20 contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_GovToken.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_GovToken.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  const dummyContract = new Contract({ abi: compiledSierra.abi, address: "0x123" });
  console.log("functions =", dummyContract.functions);

  const resDecl = await account0.declareIfNot({
    contract: compiledSierra,
    casm: compiledCasm,
  });
  if (resDecl.transaction_hash) {
    console.log("new class hash =", resDecl.class_hash);
    await myProvider.waitForTransaction(resDecl.transaction_hash);
  } else {
    console.log("Already declared");
  };
  const classHash = resDecl.class_hash;
  console.log({ classHash, txH: resDecl.transaction_hash });

  const erc20CallData = new CallData(compiledSierra.abi);
  const INITIAL_SUPPLY = 1_000_000_000_000_000_000_000_000n; // 1_000_000 * 1e18
  const VOTING_DELAY = 1; // 1 block. Immediate launch
  const VOTING_PERIOD = 50; // 50 blocks. more than 1 minute
  const PROPOSAL_THRESHOLD = 1_000_000_000_000_000_000n; // 1 * 1e18
  const QUORUM = 100_000_000_000_000_000_000_000n; // 100_000 * 1e18

  const NULLIFIER_DOMAIN = 'anon_governor_nullifier_v1';

  const constructor1 = erc20CallData.compile("constructor", {
    name: "testToken",
    symbol: "TTKN",
    initial_supply: INITIAL_SUPPLY,
    recipient: account0.address,
    owner: account0.address,
  });
  const deployResponse = await account0.deployContract({
    classHash: classHash,
    constructorCalldata: constructor1,
  });
  console.log(deployResponse);

  // Connect the new contract instance :
  const myTestContract = new Contract({ abi: compiledSierra.abi, address: deployResponse.contract_address });
  myTestContract.providerOrAccount = account0;

  console.log('✅ Test Contract connected at =', myTestContract.address);

  // erc20
  // classH = 0x1f7a5b0ee31ba88038f26c6eccab5f1c18bdc7b5adbd5a51b51f1e0cb74d1e
  // address = 0x7e3b05750d37c5cbf3d17182fa1ebafb2663e893735c3b11969ac65239118a6

  // Declare & deploy governance contract in devnet
  const compiledSierra2 = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_AnonGovernor.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm2 = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_AnonGovernor.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  const dummyContract2 = new Contract({ abi: compiledSierra2.abi, address: "0x123" });
  console.log("functions =", dummyContract2.functions);

  const resDecl2 = await account0.declareIfNot({
    contract: compiledSierra2,
    casm: compiledCasm2,
  });
  if (resDecl2.transaction_hash) {
    console.log("new class hash =", resDecl2.class_hash);
    await myProvider.waitForTransaction(resDecl2.transaction_hash);
  } else {
    console.log("Already declared");
  };
  const classHash2 = resDecl2.class_hash;
  console.log({ classHash2, txH: resDecl2.transaction_hash });

  const governorCallData = new CallData(compiledSierra2.abi);
const constructor2 = governorCallData.compile("constructor", {
    votes_token: myTestContract.address,
        owner: account0.address,
        voting_delay: VOTING_DELAY,
        voting_period: VOTING_PERIOD,
        proposal_threshold: PROPOSAL_THRESHOLD,
        quorum: QUORUM,
  });
  const deployResponse2 = await account0.deployContract({
    classHash: classHash2,
    constructorCalldata: constructor2,
  });
  console.log(deployResponse2);

  // Connect the new contract instance :
  const myTestContract2 = new Contract({ abi: compiledSierra2.abi, address: deployResponse2.contract_address });
  myTestContract2.providerOrAccount = account0;

  console.log('✅ Test Contract connected at =', myTestContract2.address);

  // governance
  // classH = 0x9af5f4983a7ae83fe06bc92051d1be0251b9da0c09a2fcd52c6755adb5c667
  // addr = 0x122e8e6815a8a6167c55d4e7d5f5b4da074f9a6e9a5bdfbff625779e4d71aaf

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

