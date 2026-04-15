// Test conversion of proof
// launch with npx src/scripts/starknet142/starknet142-integrationSepolia/1.txWithProof.ts
// Coded with Starknet.js v9.4.1

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { base64ToHexU32Array, hexU32ArrayToBase64 } from "../../utils/encode";
import { displayBalances } from "../../utils/displayBalances";

dotenv.config({ quiet: true });




async function main() {
  // initialize Provider 
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  // }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
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
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  // *** initialize existing Sepolia Integration account
  // const accountAddress0 = account1IntegrationOZaddress;
  //  const privateKey0 = account1IntegrationOZprivateKey;
  const accountAddress0 = account3IntegrationOZ17address;
  const privateKey0 = account3IntegrationOZ17privateKey;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));
  // Declare & deploy Test contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2160/proof_voty_PrivateVoteVerifierMultiRound.contract_class.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2160/proof_voty_PrivateVoteVerifierMultiRound.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
  const dummyContract = new Contract({ abi: compiledSierra.abi, address: "0x123" });
  console.log("functions =", dummyContract.functions);

  // const resDecl = await account0.declareIfNot({
  //   contract: compiledSierra,
  //   casm: compiledCasm,
  // });
  // if (resDecl.transaction_hash) {
  //   console.log("new class hash =", resDecl.class_hash);
  //   await myProvider.waitForTransaction(resDecl.transaction_hash);
  // } else {
  //   console.log("Already declared");
  // };
  // const classHash = resDecl.class_hash;
  // console.log({ classHash, txH: resDecl.transaction_hash });

  // const deployResponse = await account0.deployContract({
  //   classHash: classHash,
  //   constructorCalldata: undefined,
  // });
  // console.log(deployResponse);

  // // Connect the new contract instance :
  // const myTestContract = new Contract({ abi: compiledSierra.abi, address: deployResponse.contract_address });
  // myTestContract.providerOrAccount = account0;

  // console.log('✅ Test Contract connected at =', myTestContract.address);



  const proof_facts: string[] = json.parse(fs.readFileSync("./src/scripts/starknet142/starknet142-integrationSepolia/e2e_1.proof_facts").toString("ascii")) as string[]; // json of an array of hex felts
  console.log({ proof_facts });
  // const proofB64 = hexU32ArrayToBase64(proofH32);
  const proofBase64:string = fs.readFileSync("./src/scripts/starknet142/starknet142-integrationSepolia/e2e_1.proof", { encoding: "ascii" });
  const hex32 = base64ToHexU32Array(proofBase64);
  console.log(json.stringify(hex32, undefined, 2).slice(0, 200));

  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
  const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
  const transfCall = strkContract.populate("transfer", {
    recipient: "0x70a5da4f557b77a9c54546e4bcc900806e28793d8e3eaaa207428d2387249b7",
    amount: 1n * 10n ** 2n
  });
  const res = await account0.execute(transfCall, {
    proof: proofBase64,
    proofFacts:proof_facts,
   });
  const txR = await account0.provider.waitForTransaction(res.transaction_hash);
  console.log(txR);


  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

