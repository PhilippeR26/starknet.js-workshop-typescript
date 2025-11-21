// tests for webAuthn.
// launch with npx ts-node src/scripts/Starknet135/Starknet135-devnet/7.webAuthn.ts
// Coded with Starknet.js v8.6.0 & devnet v0.6.1

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type TransactionReceiptValue, type SuccessfulTransactionReceiptResponse, config, cairo, logger, type CairoAssembly, type CompiledSierra, type BigNumberish, CairoOption, CairoOptionVariant, CairoCustomEnum, encode, type Call, type InvokeFunctionResponse } from "starknet";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey, junoNMtestnet } from "../../../A1priv/A1priv";
import { account1BraavosMainnetAddress, account1BraavosMainnetPrivateKey, alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";
import { DevnetProvider } from "starknet-devnet";
import { utils as utilsScure } from '@scure/starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { ReadyAccountAbi } from "./7a.ReadyAbi";
dotenv.config();

type WebauthnSigner = {
  origin: BigNumberish[],
  rp_id_hash: BigNumberish,
  pubkey: BigNumberish
};

//          👇👇👇
// 🚨🚨🚨   Launch Devnet before using this script.
//          👆👆👆
async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.9.0" });
  const devnet = new DevnetProvider({ timeout: 40_000 });
  if (!(await devnet.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7", specVersion: "0.7.1" }); // local Sepolia Testnet node
  // ***** Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8", specVersion: "0.8.1" });
  // ***** Mainnet
  // const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7", specVersion: "0.7.1" }); 

  // config.set('legacyMode', true);
  logger.setLogLevel("FATAL");

  console.log(
    "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet");

  // initialize existing predeployed account 0 of Devnet
  const devnetAccounts = await devnet.getPredeployedAccounts();
  const accountAddress0 = devnetAccounts[0].address;
  const privateKey0 = devnetAccounts[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 }
  );
  console.log("Account connected.\n");


  // Declare & deploy Test contract in devnet
  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.sierra.json").toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo263/ArgentXAccount040.casm.json").toString("ascii")) as CairoAssembly;
  console.log("declare...");
  const resDec = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm });
  console.log(resDec);
  console.log("declared!");

  const randomKeyPair = utilsScure.randomPrivateKey();
  const random = stark.randomAddress();
  console.log({ randomKeyPair }, "\n", random);
  const value = "http://localhost:3000";
  const res = CallData.compile(value.split("").map(shortString.encodeShortString));
  console.log({ res });

  const ReadyAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f"; // ArgentX v0.4.0
  function calculateAddress0(ReadySigner: WebauthnSigner): string {
    const calldataReady = new CallData(ReadyAccountAbi.abi);
    const ReadyWebAuthn = new CairoCustomEnum({ Webauthn: ReadySigner })
    const ReadyGuardian = new CairoOption(CairoOptionVariant.None);
    const constructorReadyCallData = calldataReady.compile("constructor", {
      owner: ReadyWebAuthn,
      guardian: ReadyGuardian
    });
    console.log("constructor =", constructorReadyCallData);
    const accountReadyAddress = hash.calculateContractAddressFromHash(ReadySigner.pubkey, ReadyAccountClassHash, constructorReadyCallData, 0);
    console.log('Precalculated account address=', accountReadyAddress);

    const testConstructor = CallData.compile(['4', '21', '104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '51', '48', '48', '48', '191266990927768818505269035571842226019', '97812770077760695459826172618884931675', '169227519131155018435100452866610186430', '196209845325200580728090120837735696622', '1']);
    const salt = BigInt("0x939ca44324ea3add1e2ec0349ef8c8ee7f5008dee1ba049183bf50e9a02448be") & constants.MASK_250;
    const accountReadyAddress2 = hash.calculateContractAddressFromHash(salt, ReadyAccountClassHash, testConstructor, 0);
    console.log('Precalculated account address2=', accountReadyAddress2);

    return accountReadyAddress;
  }

  const ReadySigner: WebauthnSigner = {
    origin: ["1", "2"],
    rp_id_hash: "1234567",
    pubkey: "200",
  };
  // const accountReadyAddress = calculateAddress(ReadySigner);


  const hex2buf = (hex: string) =>
    Uint8Array.from(
      hex
        .replace(/^0x/, "")
        .match(/.{1,2}/g)!
        .map((byte) => parseInt(byte, 16)),
    );
  const hexToBuf = (hex: string) =>
    new Uint8Array(
      hex
        .match(/.{1,2}/g)!
        .map((byte) => parseInt(byte, 16)),
    );
  const messageHash = "0x123456"
  const normalizeTransactionHash = (transactionHash: string) => transactionHash.replace(/^0x/, "").padStart(64, "0");
  const res0 = hex2buf(`${normalizeTransactionHash(messageHash)}00`);
  console.log({ res0 });

  const res1 = hexToBuf(`${encode.removeHexPrefix(num.toHex64(messageHash))}00`);
  console.log({ res1 });

  type WebAuthNUser = {
    email: string,
    origin: BigNumberish[],
    rpId: string,
    rp_id_hash: BigNumberish,
    credentialId: Uint8Array,
    pubKey: BigNumberish
  };

  function calculateSalt(pubK: BigNumberish): bigint {
    return BigInt(pubK) & constants.MASK_250
  }

  function defineConstructor(readyWebAuthConstructor: WebAuthNUser): Calldata {
    const calldataReady = new CallData(ReadyAccountAbi.abi);
    const ReadyWebAuthn = new CairoCustomEnum({
      Webauthn: {
        origin: readyWebAuthConstructor.origin,
        rp_id_hash: readyWebAuthConstructor.rp_id_hash,
        pubkey: readyWebAuthConstructor.pubKey
      }
    });

    const ReadyGuardian = new CairoOption(CairoOptionVariant.None);
    const constructorReadyCallData = calldataReady.compile("constructor", {
      owner: ReadyWebAuthn,
      guardian: ReadyGuardian
    });
    console.log("constructor =", constructorReadyCallData);
    return constructorReadyCallData;
  }

  function calculateAddress(ReadySigner: WebAuthNUser): string {
    const constructorReadyCallData = defineConstructor(ReadySigner);
    const salt = calculateSalt(ReadySigner.pubKey);
    const accountReadyAddress = hash.calculateContractAddressFromHash(salt, ReadyAccountClassHash, constructorReadyCallData, 0);
    console.log('Precalculated account address=', accountReadyAddress);
    return accountReadyAddress;
  }
  const credentialId = new Uint8Array([208, 136, 234, 38, 247, 131, 198, 154, 207, 227, 233, 143, 37, 108, 165, 32]);
  const origin = ['104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '51', '48', '48', '48'];
  const webAuthnAttestation: WebAuthNUser = {
    credentialId,
    email: "myUser@gmail.com",
    origin,
    pubKey: "0xd527372c0b66c232a52ec6db2c46fb88968a9e3e3cdf2c8ddc44dbbefef9fe94",
    rpId: "localhost",
    rp_id_hash: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763"
  }

  const myCall: Call = {
    contractAddress: constants.UDC.ADDRESS,
    entrypoint: constants.UDC.ENTRYPOINT,
    calldata: CallData.compile({
      classHash: ReadyAccountClassHash,
      salt: calculateSalt(webAuthnAttestation.pubKey),
      unique: "0",
      calldata: defineConstructor(webAuthnAttestation),
    }),
  };
  const calcAddr = calculateAddress(webAuthnAttestation);

  const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]);
  console.log("account deployed with txH =", txHDepl);
  const txR = await myProvider.waitForTransaction(txHDepl);
  if (txR.isSuccess()) {
    console.log("Deployed at", txR.events[0].from_address);
  }
  else { console.log("Failed!") }


  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });