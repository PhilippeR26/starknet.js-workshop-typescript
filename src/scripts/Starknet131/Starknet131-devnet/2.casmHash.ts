// Test declare of Cairo 2.6.0 contract
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/2.casmHash.ts
// Coded with Starknet.js v6.2.0

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, ec, CallData, hash, cairo, type CompiledSierraCasm, type ByteCode, type EntryPointsByType, type PythonicHints, type ContractEntryPointFields, type Builtins } from "starknet";
import fs from "fs";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account2TestnetAddress, account2TestnetPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZaddress, account1IntegrationOZprivateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import { poseidonHashMany } from "micro-starknet";
dotenv.config();

type BytecodeSegment = {
    len: number;
    segment: bigint[]
}

function hashBuiltins(builtins: Builtins) {
    return poseidonHashMany(
      builtins.flatMap((it: any) => {
        return BigInt(shortString.encodeShortString(it));
      })
    );
  }

function hashEntryPoint(data: ContractEntryPointFields[]) {
    const base = data.flatMap((it: any) => {
      return [BigInt(it.selector), BigInt(it.offset), hashBuiltins(it.builtins)];
    });
    return poseidonHashMany(base);
  }
  

async function main() {
    // initialize Provider 
    //const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    const provider = new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_7" }); //  Blast Pathfinder Goerli Testnet
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/goerli-juno/v0_7" }); //  Nethermind Goerli Testnet
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    //process.exit(5);
    // *** Devnet-rs 
    // initialize existing predeployed account 0 of Devnet
    // console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    // console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // *** initialize existing Argent X Goerli Testnet  account
    const accountAddress0 = account2TestnetAddress
    const privateKey0 = account2TestnetPrivateKey;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    // *** initialize existing Sepolia Testnet account
    //  const privateKey0 = account0OZSepoliaPrivateKey;
    //  const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(provider, accountAddress0, privateKey0, undefined, constants.TRANSACTION_VERSION.V2);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    const compiled260Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.sierra.json").toString("ascii"));
    type CompiledSierraCasm260 = {
        prime: string;
        compiler_version: string;
        bytecode: ByteCode;
        hints: any[];
        pythonic_hints?: PythonicHints | undefined;
        bytecode_segment_lengths?: number[]; // added
        entry_points_by_type: EntryPointsByType;
    }
    const compiled260Casm: CompiledSierraCasm260 = json.parse(fs.readFileSync("./compiledContracts/cairo260/hello.casm.json").toString("ascii"));
    console.log("bytecode_segment_lengths", compiled260Casm.bytecode_segment_lengths,"\nCairo version :",compiled260Casm.compiler_version);
   // process.exit(5);
    const byteCode: bigint[] = compiled260Casm.bytecode.map(n => BigInt(n));
    const bytecode_segment_lengths: number[] = compiled260Casm.bytecode_segment_lengths ? compiled260Casm.bytecode_segment_lengths : [];

    const byteCodeIterator = byteCode[Symbol.iterator]();
    const leafs: BytecodeSegment[] = bytecode_segment_lengths.map((len: number) => {
        let segment: bigint[] = [];
        for (let i = 0; i < len; i++) {
            segment.push(byteCodeIterator.next().value);
        }
        const res: BytecodeSegment = { len, segment };
        return res;
    });
    console.log({ leafs }, leafs[0].segment.length, leafs[1].segment.length, leafs[0].segment.length + leafs[1].segment.length, byteCode.length);
    const hashLeafs: bigint[] = leafs.flatMap(leaf => [BigInt(leaf.len), poseidonHashMany(leaf.segment)]);
    console.log({ hashLeafs });
    const hashByteCode = poseidonHashMany(hashLeafs) + 1n;
    console.log(num.toHex(hashByteCode));
    const COMPILED_CLASS_VERSION = 'COMPILED_CLASS_V1';
  // Hash compiled class version
  const compiledClassVersion = BigInt(shortString.encodeShortString(COMPILED_CLASS_VERSION));
  // Hash external entry points.
  const externalEntryPointsHash = hashEntryPoint(compiled260Casm.entry_points_by_type.EXTERNAL);
  // Hash L1 handler entry points.
  const l1Handlers = hashEntryPoint(compiled260Casm.entry_points_by_type.L1_HANDLER);
  // Hash constructor entry points.
  const constructor = hashEntryPoint(compiled260Casm.entry_points_by_type.CONSTRUCTOR);

  const compiled260ClassHash =num.toHex(
    poseidonHashMany([
      compiledClassVersion,
      externalEntryPointsHash,
      l1Handlers,
      constructor,
      hashByteCode,
    ])
  );
  console.log({compiled260ClassHash});
    // process.exit(5);
    const deploy260Response = await account0.declare({ contract: compiled260Sierra, casm: compiled260Casm});
    console.log({ deploy260Response });
    // process.exit(5);

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });