// Create a dummy proof that works in Testnet.
// launch with npx ts-node src/scripts/Starknet142/Starknet142-Sepolia/29.createDummyProof.ts
// Coded with Starknet.js v10.4.0

import { constants, json, shortString, RPC, num, hash, CairoBytes31, type CairoAssembly, config, type CompiledSierra, CallData, cairo, type BigNumberish, type Uint256, type ResourceBoundsBN, encode, RpcProvider, Account, Contract } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { displayBalances } from "../../utils/displayBalances";
import { account1ReadyMainnetAddress, account1ReadyMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";

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
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // mainnet

  // Check that communication with provider is OK
  const latestBlock = await myProvider.getBlock("latest")
  const blockData = await myProvider.getBlock(latestBlock.block_number - 10);
  console.log(
    "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", blockData.starknet_version);
  console.log("Provider connected to Starknet.");

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

  // *** initialize existing mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  // const accountAddress0 = account1ReadyMainnetAddress
  // const privateKey0 = account1ReadyMainnetPrivateKey;


  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  console.log('existing account connected.\n');


  // ********** main code
  console.log("Account address=", account0.address);
  console.log(await displayBalances(account0.address, myProvider));

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2170/proof_of_secret_SuperSecret.contract_class.json").toString("ascii")) as CompiledSierra;

  // Connect the new contract instance (deployed in Testnet) :
  const contractAddress = "0x2529eb0dd994b6012b4bd496aea13c3714c13ea8db86d09aeecc5f3164181a6";
  const myTestContract = new Contract({ abi: compiledSierra.abi, address: contractAddress, providerOrAccount: account0 });

  // totally random proof, just to test the call with a proof that will not be valid, and see that the contract call is working and returns false as expected
  const alteredProof0 = Buffer.alloc(300_000);
  for (let i = 0; i < 300_000; i++) {
    alteredProof0[i] = i % 256;
  }
  const alteredProof = alteredProof0.toString('base64');

  // Valid proofFacts
  type ProofFacts = {
    PROOF0_marker: string,
    VIRTUAL_SNOS_marker: string,
    virtual_OS_program_hash: string,
    VIRTUAL_SNOS0_marker: string,
    block_number: string,
    block_hash: string,
    OS_config_hash: string,
  };
  type ProofMessage = {
    from_address: string,
    payload: string[],
    to_address: string,
  };
  const message: ProofMessage = {
    from_address: myTestContract.address,
    payload: CallData.compile({
      user_id: 1234,
      is_whitelisted: true
    }),
    to_address: "0x0",
  };
  const messageHash = hash.computePoseidonHashOnElements([message.from_address, message.to_address, message.payload.length, ...message.payload]);
  console.log("messageH =", messageHash);
  const l1l2messages = [messageHash];
  const proofFactsObject: ProofFacts = {
    PROOF0_marker: "0x50524f4f4631", // PROOF1
    VIRTUAL_SNOS_marker: "0x5649525455414c5f534e4f53",
    virtual_OS_program_hash: "0x53f6c9fcfd31d27279ff7d7e422b44623550a732b59fe193354a7316a96daa1",
    VIRTUAL_SNOS0_marker: "0x5649525455414c5f534e4f5330",
    block_number: num.toHex(blockData.block_number),
    block_hash: num.toHex(blockData.block_hash!),
    OS_config_hash: num.toHex(155353494348665658624236724160728902643094265960890343456308270214333914199n),
  };
  const proofFacts: string[] = [...Object.values(proofFactsObject), num.toHex(l1l2messages.length), ...l1l2messages];
  console.log(
    'proof size =',
    alteredProof.length,
    ', start =',
    alteredProof.slice(0, 15),
    ', end =',
    alteredProof.slice(-15)
  );
  console.log("proofFacts =", proofFacts);

  console.log("✅ Proof calculated.");

  // valid L1L2 message
  const myCalldata2 = myTestContract.populate("verify_proof_of_secret",
    {
      public_message: {
        "user_id": 1234,
        "is_whitelisted": true
      },
    }
  );
  // process.exit(5);
  console.log("Calling verify_proof_of_secret with the proof...");
  const tx2 = await account0.execute(myCalldata2, { proof: alteredProof, proofFacts: proofFacts });
  const txR2 = await account0.provider.waitForTransaction(tx2.transaction_hash);
  console.log("Tx result =", txR2);
  console.log("Tx success =", txR2.isSuccess());
  const res = await myTestContract.read_result();
  console.log("is whitelisted, read from contract =", res);

  console.log("✅ Test completed.");


}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
