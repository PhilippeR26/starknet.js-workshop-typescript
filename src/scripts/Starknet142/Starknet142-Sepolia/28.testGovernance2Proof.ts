/// Test the heavy calculation proof contract on Sepolia testnet, with an existing account and a pre-deployed contract (deployed in the previous script 1.declareCalculationProofContract.ts)
// launch with npx ts-node src/scripts/Starknet142/Starknet142-Sepolia/28.testGovernance2Proof.ts 
// ⚠️ Uses contracts deployed in script 27.
// Coded with Starknet.js v10.0.2

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, CairoBytes31, type CompiledSierra, CallData, type BigNumberish, type TypedData } from "starknet-proof";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { requestProof, type ProveResult } from "./RequestProof";
import { num, stark, type ResourceBoundsBN } from "starknet";
import { hashByteArray } from "./26a.CairoBytesArray-hash";
import { hashProposal } from "./26b.hashProposal";

dotenv.config({ quiet: true });

function buildVoteTypedData(
  proposalId: bigint,
  support: number,
  chainId: string,
): TypedData {
  return {
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      AnonVoteIntent: [
        { name: "proposal_id", type: "felt" },
        { name: "support", type: "felt" },
      ],
    },
    primaryType: "AnonVoteIntent",
    domain: {
      name: "AnonGovernor",
      version: shortString.encodeShortString("1"),  // 0x31 — shortstring, not an integer
      chainId,
      revision: "1",
    },
    message: {
      proposal_id: proposalId.toString(),
      support: support.toString(),
    },
  };
}

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
  
  // Check that communication with provider is OK
  const chainId = await myProvider.getChainId();
  console.log(
    "chain Id =", new CairoBytes31(chainId).decodeUtf8(),
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

  const account1 = new Account({ provider: myProvider, address: accountSTRKoz20snip9Address, signer: accountSTRKoz20snip9PrivateKey });


  // ********** main code
  console.log("Account address=", account0.address);

  const governanceSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_AnonGovernor2.contract_class.json").toString("ascii")) as CompiledSierra;
  const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo2180/erc20_anon_gov_GovToken.contract_class.json").toString("ascii")) as CompiledSierra;


  // Connect the new contract instance :
  const addressGovernance2 = "0x64834acb5abf44bc0173291722679c41bad701517033bb6c64b0bb9a2342a89";
  const addressErc20 = "0x7e3b05750d37c5cbf3d17182fa1ebafb2663e893735c3b11969ac65239118a6";
  const governanceContract = new Contract({ abi: governanceSierra.abi, address: addressGovernance2, providerOrAccount: account0 });

  console.log("Test Contract connected at =", governanceContract.address);
  // console.log(governanceContract.functions);

  // console.log("hashString=",num.toBigInt(hashByteArray(new CairoByteArray("Test proposal"))));
  // const data=[
  //   ...transaction.getExecuteCalldata([], "1"),
  //   hashByteArray(new CairoByteArray("Test proposal"))
  // ];
  // console.log({data});
  // const proposalId0 =  hashProposal([],"Test proposal")
  // console.log(num.toBigInt (proposalId0 ));
  //  process.exit(3);

  // new governance vote
  const erc20Contract = new Contract({ abi: erc20Sierra.abi, address: addressErc20, providerOrAccount: account0 });

  // Do not forget to delegate before propose
  console.log("delegate...");

  const delegateCall = erc20Contract.populate("delegate", {
    delegatee: account1.address,
  });
  const resDel = await account0.execute(delegateCall);
  await myProvider.waitForTransaction(resDel.transaction_hash);
  console.log("Delegation to account1 OK, voting power activated.");


  const description = "Proposal to send 100 token to protocol"; /// ⚠️ to change at each execution. A proposal can be used only once
  type CairoCall = {
    to: BigNumberish,
    selector: BigNumberish,
    calldata: Array<BigNumberish>
  };
  // *** example of Call to execute if the vote succeed.
  // const transferCall0: Call = erc20Contract.populate("transfer", {
  //   recipient: account1.address,
  //   amount: 100
  // });
  // console.log({ transferCall0 });
  // const cairoTransferCall0: CairoCall = {
  //   to: transferCall0.contractAddress,
  //   selector: selector.getSelectorFromName(transferCall0.entrypoint),
  //   calldata: transferCall0.calldata === undefined ? [] : (transferCall0.calldata) as Calldata,
  // }
  // const calls: CairoCall[] = [cairoTransferCall0];
  // console.log({ calls });
  const mode = await governanceContract.COUNTING_MODE();
  console.log({ mode });
  const proposeCall = governanceContract.populate("propose", {
    calls: [],
    description,
  })
  console.log("propose a vote...\n", { proposeCall });
  const res0 = await account1.execute(proposeCall);
  const txR0 = await myProvider.waitForTransaction(res0.transaction_hash);
  console.log("propose execution is", txR0.isSuccess());

  const proposalId: string = hashProposal([], description);
  console.log({ proposalId });
  console.log(await governanceContract.state(proposalId));
  // process.exit(6);

  // ******** proof contract
  const support = 1 // yes
  const message = buildVoteTypedData(BigInt(proposalId), support, chainId);
  console.log("A");
  const signatureVoter: BigNumberish[] = stark.signatureToHexArray(await account1.signMessage(message));
  console.log("B", { signatureVoter });

  // create proof
  type PrivateInputsForProof = {
    signature: Array<BigNumberish>,
  }
  const anonVotePrivateInput: PrivateInputsForProof = {
    signature: signatureVoter
  }
  const myCall = governanceContract.populate("create_proof",
    {
      proposal_id: proposalId,
      support,
      voter: account1.address,
      private_input: anonVotePrivateInput,
    });

  // Manual estimation of fees, to not expose (to the node) the private data in the Call during estimation of fees.
  const gasPrices = await myProvider.getGasPrices();
  const PRICE_MULT = 2n; // 2× buffer for price spikes
  const AMOUNT_MULT = 2n;
  const resourceBounds: ResourceBoundsBN = {
    l2_gas: {
      max_amount: 0x279fc0n * AMOUNT_MULT,
      max_price_per_unit: gasPrices.l2GasPrice * PRICE_MULT,
    },
    l1_gas: {
      max_amount: 0xbd2an * AMOUNT_MULT,
      max_price_per_unit: gasPrices.l1GasPrice * PRICE_MULT,
    },
    l1_data_gas: {
      max_amount: 0xc0n * AMOUNT_MULT,
      max_price_per_unit: gasPrices.l1DataGasPrice * PRICE_MULT,
    },
  };
  const tx = await account0.getSignedTransaction(myCall, { resourceBounds });
  console.log(tx);
  const currentBlock: number = await myProvider.getBlockNumber();
  // =====================================================
  // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
  // A proof server shall be running locally using port 3030.
  // See here: https://github.com/PhilippeR26/secure-voty/tree/main/proofServer
  // Needs 18Gb free RAM 
  // =====================================================

  const proofRes: ProveResult = await requestProof(currentBlock, tx);
  console.log("proof size =", proofRes.proof.length, ", start =", proofRes.proof.slice(0, 8), ", end =", proofRes.proof.slice(-8));
  // process.exit(7);
  const testCallData = new CallData(governanceContract.abi);
  const messageContent = testCallData.decodeParameters("openzeppelin_governance::governor::extensions::governor_counting_anonymous::GovernorCountingAnonymousComponent::AnonVoteMessage", (proofRes.l2ToL1Messages![0].payload) as string[]);
  type L1L2message = {
    proposal_id: BigNumberish,
    nullifier: BigNumberish,
    support: number,
    weight: BigNumberish,
  }

  const messageFromProof = messageContent as L1L2message;
  console.log({ messageFromProof });
  console.log("✅ Proof calculated.");


  const myCalldata2 = governanceContract.populate("cast_anonymous_vote",
    {
      public_message: messageFromProof,
    }
  );
  console.log("Calling cast_anonymous_vote with the proof...");

  const tx2 = await account0.execute(myCalldata2, { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
  const txR2 = await account0.provider.waitForTransaction(tx2.transaction_hash);
  console.log("success =", txR2.isSuccess());
  const quorum_reached = await governanceContract.quorum_reached(proposalId);
  console.log({ quorum_reached });
  const vote_succeeded = await governanceContract.vote_succeeded(proposalId);
  console.log({ vote_succeeded });

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
