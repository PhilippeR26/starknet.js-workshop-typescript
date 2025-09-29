// Test a custom signer with snjs v8
// launch with npx src/scripts/Starknet140/Starknet140-devnet/13.specialSigner.ts
// Coded with Starknet.js v8.5.4 & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, hdParsingStrategy, CairoOptionVariant, BigNumberish, CairoResult, CairoResultVariant, typedData, CairoBytes31, Signer, type CompiledSierra, type InvokeFunctionResponse, ETransactionVersion3, type Call, type InvocationsSignerDetails, type Signature, type V3InvocationsSignerDetails, transaction, stark } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();


class customSigner extends Signer {
  public async signTransaction(
    transactions: Call[],
    details: InvocationsSignerDetails
  ): Promise<Signature> {
    const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
    let msgHash;
    if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3InvocationsSignerDetails;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {

      throw Error('unsupported signTransaction version');
    }
    const signed = await this.signRaw(msgHash as string);
    const callArray=transaction.getExecuteCalldata(transactions,"1").map(item => num.toHex(item));
    const apiTransaction = {
      type: 'INVOKE',
      sender_address: details.walletAddress,
      calldata: callArray,
      signature: stark.signatureToHexArray(signed),
      nonce: num.toHex(details.nonce),
      resource_bounds: stark.resourceBoundsToHexString(details.resourceBounds),
      tip: num.toHex(details.tip),
      paymaster_data: [],
      nonce_data_availability_mode: 'L1',
      fee_data_availability_mode: 'L1',
      account_deployment_data: [],
      version: '0x3'
    }
    console.log("Transaction built =", apiTransaction);
    return signed;
  }

}


async function main() {
  // initialize Provider 
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

  // Check that communication with provider is OK
  console.log(
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
  const accountAddress1 = accData[1].address;
  const privateKey1 = accData[1].private_key;
  // *** initialize existing Sepolia Testnet account
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const mySigner = new customSigner(privateKey0);
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: mySigner });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  const account1 = new Account({ provider: myProvider, address: accountAddress1, signer: privateKey1 });
  console.log('existing account connected.\n');

  // ********** main code
  const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/erc20OZ070decimals.sierra.json").toString("ascii")) as CompiledSierra;
  const strkContract = new Contract({
    abi: erc20Sierra.abi,
    address: strkAddress,
    providerOrAccount: account0,
  });
  const transferCall = strkContract.populate("transfer", {
    recipient: account1.address,
    amount: 2n * 10n ** 16n,
  });
  console.log("Deploy of account in progress...");
  // *** with account.execute()
  const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute(transferCall, {tip: 200n});
  console.log("TxH =", txHDepl);
  const txR = await myProvider.waitForTransaction(txHDepl);



  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
