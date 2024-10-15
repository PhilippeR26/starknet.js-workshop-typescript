// test u96 Cairo type.
// launch with npx ts-node src/scripts/Starknet132/Starknet132-devnet/4.u96.ts
// Coded with Starknet.js v6.14.1+experimental, Starknet-devnet-rs v0.2.0

import { Account, cairo, CairoUint256, CallData, Contract, json, num, RpcProvider, shortString, type BigNumberish, type Uint512 } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { CairoUint512 } from "starknet";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(myProvider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // Declare & deploy Test contract in devnet
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo282/u96.sierra.json").toString("ascii"));
    const testCasm = json.parse(fs.readFileSync("./compiledContracts/cairo282/u96.casm.json").toString("ascii"));

    const deployResponse = await account0.declareAndDeploy({
        contract: testSierra,
        casm: testCasm,
    });
    // Connect the new contract instance :
    const myTestContract = new Contract(testSierra.abi, deployResponse.deploy.contract_address, myProvider);
    console.log('Test Contract connected at =', myTestContract.address);
    const myU96:bigint = 2n ** 90n;
    const myCalldata1=CallData.compile([myU96]);
    console.log("CallData.compile =",myCalldata1);
    const myCallData=new CallData(myTestContract.abi);
    const myCalldata=myCallData.compile("test_u96",{
        inp: myU96
    });
    console.log("myCallData.compile =",myCalldata);
    const myCall=myTestContract.populate("test_u96",{inp: myU96});
    console.log("myContract.populate =",myCall);

    const resp1 = await myTestContract.call("test_u96", [myU96]) as bigint;
    console.log("test_u96 =", resp1, num.toHex(resp1));
    


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
