/// Test the heavy calculation proof contract on Sepolia testnet, with an existing account and a pre-deployed contract (deployed in the previous script 1.declareCalculationProofContract.ts)
// launch with npx src/scripts/starknet142/starknet142-Sepolia/2.testCalculationProof.ts
// Coded with Starknet.js v10.0.0-B6 + experimental

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256 } from "starknet-proof";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { requestProof, type ProveResult } from "./RequestProof";
import { l1l2MessageAbi } from "./calculationL1l2MessageAbi";

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
  const textToHash = `De pecuniae valore
Pecunia, res vilis et cara simul, mortalium animos vehementer movet. Non enim ipsa per se bonum est, sed instrumentum quoddam virtutis aut vitii. Qui eam moderate utitur, libertatem sibi parat, otium honestum, beneficentiam erga amicos et patriam. Qui vero illam serviliter colit, is non possidet pecuniam, sed ab ea possidetur. Aurum enim et argentum, quae homines divites beatosque putant, saepe catenas aureas fiunt, quibus animus alligatur.
Videamus avarum: noctes atque dies numerat nummos, timet, sollicitus est, amicis diffidit, deos ipsos suspectos habet. Quanto melius est parvo contentum vivere, quam immensis opibus circumdatum semper timere ne perdas! Socrates ille sapientissimus nihil possidens, tamen omnibus divitibus felicior fuit, quia cupiditatem omnem ex animo eiecerat.
Neque tamen pecuniam omnino contemnere debemus. Sine ea neque domus aedificari, neque templa deorum ornari, neque civitas bene administrari potest. Milites non sine stipendio pugnant, medici non sine mercede aegrotos curant. Pecunia igitur, si ancilla rationis est, utilis est; si domina, perniciosa.
Summum igitur bonum non in divitiis, sed in virtute positum est. Divitiae enim venire et abire possunt, ut fluctus maris; virtus autem, semel parta, manet aeterna. Qui ergo pecuniam magni aestimat, sed maiorem virtutem, is vere sapiens est. Qui vero omnia propter pecuniam facit, is pauper est, etiamsi Croesi opes possideat.
Quapropter, o mortales, pecuniam nec nimis ametis nec nimis spernatis. Utamur ea tamquam bono servo, non tamquam domino crudeli. Sic enim et vitam commodam agemus, et animam liberam servabimus, quae sola vera divitiae sunt.`;

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/heavy_calculation_PrivateVoteVerifierMultiRound.contract_class.json").toString("ascii")) as CompiledSierra;


  // Connect the new contract instance :
  const address = "0x65a0840657be286d31a1984cf28c238d58bf72caba4d719d27b2696bd0a1c3f";
  const myTestContract = new Contract({ abi: compiledSierra.abi, address, providerOrAccount: account0 });

  console.log("Test Contract connected at =", myTestContract.address);

  // proof contract 
  const testCallData = new CallData(compiledSierra.abi);
  type PublicInputsForProof = {
    text: string // some text to be hashed
  }
  const pubData: PublicInputsForProof = {
    text: textToHash
  }
  const myCalldata = myTestContract.populate("create_calculation_proof",
    {
      public_input: pubData,
    });
  const tx = await account0.getSignedTransaction(myCalldata);
  console.log(tx);
  const currentBlock: number = await myProvider.getBlockNumber();
  // =====================================================
  // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
  // A proof server shall be running locally using port 3030.
  // See here: https://github.com/PhilippeR26/secure-voty/tree/main/proofServer
  // Needs 15Gb free RAM 
  // =====================================================

  const proofRes: ProveResult = await requestProof(currentBlock, tx);
  console.log("proof size =", proofRes.proof.length, ", start =", proofRes.proof.slice(0, 8), ", end =", proofRes.proof.slice(-8));

  const messageCallData = new CallData(l1l2MessageAbi);
  const messageContent = messageCallData.decodeParameters("l1l2message", (proofRes.l2ToL1Messages![0].payload) as string[]);
  type L1L2message = {
    text: string, // some text to be hashed
    hash: BigNumberish // hash of the text
  }
  const messageFromProof = messageContent as L1L2message;
  console.log({ messageFromProof });
  console.log("✅ Proof calculated.");

  const myCalldata2 = myTestContract.populate("verify_calculation",
    {
      public_message: messageFromProof,
    }
  );
  console.log("Calling verify_calculation with the proof...");
  // The hash is not calculated on-line (no fees to pay for the heavy calculation), but provided by the proof server, so we can directly call verify_calculation with the proof, without needing to call create_calculation_proof first.
  // The result of the calculation is stored on-chain, and can be read with read_calculation_result.
  const tx2 = await account0.execute(myCalldata2, { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
  const txR2 = await account0.provider.waitForTransaction(tx2.transaction_hash);
  console.log("success =", txR2.isSuccess());
  const res = await myTestContract.read_calculation_result();
  console.log("calculation result read from contract =", res);

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
