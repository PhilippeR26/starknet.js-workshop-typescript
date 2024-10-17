// test encoding/decoding of Buffer to send a binary ByteArray
// launch with npx ts-node src/scripts/Starknet132/Starknet132-Sepolia/5.sendBytes.ts
// Coded with Starknet.js v6.14.1

import { BigNumberish, shortString, num, byteArray, RpcProvider, Account, json, Contract, CallData, parseCalldataField, type ByteArray, encode } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config();


function byteArrayFromBuffer(buf: Buffer): ByteArray {
  let stack: string[] = [];
  const chunkSize = 31;
  let remainderSize: number = chunkSize;
  let remainderHex: string = "";
  const maxChunk = Math.ceil(buf.length / chunkSize);
  for (let i = 0; i < maxChunk; i++) {
    const partial = buf.subarray(i * chunkSize, (i + 1) * chunkSize).toString("hex");
    stack.push(encode.addHexPrefix(partial));
    if (i === maxChunk - 1) {
      remainderSize = partial.length / 2;
      remainderHex = stack[i];
    }
  }
  const [pendingWord, pendingWordLength] =
    remainderHex === undefined || remainderSize === chunkSize
      ? ['0x00', 0]
      : [stack.pop()!, remainderSize];
  return {
    data: stack.length === 0 ? [] : stack,
    pending_word: pendingWord,
    pending_word_len: pendingWordLength,
  } as ByteArray;
}

function bufferFromByteArray(myByteArray: ByteArray): Buffer {
  const pending_word =
    BigInt(myByteArray.pending_word) === 0n
      ? Buffer.from([])
      : Buffer.from(num.hexToBytes(encode.addHexPrefix(encode.removeHexPrefix(num.toHex(myByteArray.pending_word)).padStart(Number(myByteArray.pending_word_len) * 2, "0"))));
  return (
    Buffer.concat([
      myByteArray.data.reduce<Buffer>((cumuledBuffer, encodedString: BigNumberish) => {
        const add: Buffer =
          BigInt(encodedString) === 0n ? Buffer.from([]) : Buffer.from(num.hexToBytes(encode.addHexPrefix(encode.removeHexPrefix(num.toHex(encodedString)).padStart(62, "0"))));
        return Buffer.concat([cumuledBuffer, add]);
      }, Buffer.from([])), pending_word])
  );
}

function encodeByteArray(inp: ByteArray): string[] {
  let stack: string[] = [num.toBigInt(inp.data.length).toString(10)];
  inp.data.reduce((stack, data) => {
    stack.push(num.toBigInt(data).toString(10));
    return stack
  }, stack);
  stack.push(num.toBigInt(inp.pending_word).toString(10));
  stack.push(num.toBigInt(inp.pending_word_len).toString(10));
  return stack;
}

function decodeToByteArray(inp: string[]): ByteArray {
  const dataSize = Number(inp[0]);
  let dataArray: string[] = [];
  for (let i = 0; i < dataSize; i++) {
    dataArray.push(inp[i + 1]);
  }
  const pending_word = inp[inp.length - 2];
  const pending_word_len = inp[inp.length - 1];
  return { data: dataArray, pending_word, pending_word_len } as ByteArray
}

async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
  // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  //const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = account1BraavosSepoliaAddress;
  const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);

  // **** unitary tests
  const myBuf0 = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const resEnc0: ByteArray = byteArrayFromBuffer(myBuf0);
  console.log(resEnc0);
  const returnBuf0 = bufferFromByteArray(resEnc0);
  console.log(returnBuf0, returnBuf0.length);

  const myBuf1 = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
  const resEnc1: ByteArray = byteArrayFromBuffer(myBuf1);
  console.log(resEnc1);
  const returnBuf1 = bufferFromByteArray(resEnc1);
  console.log(returnBuf1, returnBuf1.length);

  const myBuf2 = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 0, 33]);
  const resEnc2: ByteArray = byteArrayFromBuffer(myBuf2);
  console.log(resEnc2);
  const returnBuf = bufferFromByteArray(resEnc2);
  console.log(returnBuf, returnBuf.length);

  const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/string.sierra.json").toString("ascii"));
  // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo260/string.casm.json").toString("ascii"));
  // ****** if not deployed
  // const { deploy } = await account0.declareAndDeploy({
  //     contract: compiledSierra,
  //     casm: compiledCasm,
  // });
  // console.log("deployed at =",deploy.contract_address);
  // const address=deploy.contract_address;
  // const address="0x2bb9735fe677e726cc96d2acf81aab25cca4d8d8ab23dc3faa532556fc681ab";
  // **** if deployed in Sepolia :
  const address = "0x660edd51a76b970cc8b843e5e0560e48afa2bb73e2530ab9a7425b17c1366b2";
  const stringContract = new Contract(compiledSierra.abi, address, account0);

  const myBuf = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 0, 33]);
  const resBA: ByteArray = byteArrayFromBuffer(myBuf);
  console.log("\n\n", resBA);
  const encodedByteArray: string[] = encodeByteArray(resBA);
  console.log({ encodedByteArray });
  // this function adds a small string to the input and returns it.
  const resp7 = await stringContract.call("proceed_string", encodedByteArray, { parseRequest: false, parseResponse: false }) as string[];
  console.log("resp7 = >" + resp7 + "<", resp7[0]);
  const decoded: ByteArray = decodeToByteArray(resp7);
  console.log(decoded);
  const responseBuf: Buffer = bufferFromByteArray(decoded);
  console.log(responseBuf);

  console.log("✅ end of script.");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


