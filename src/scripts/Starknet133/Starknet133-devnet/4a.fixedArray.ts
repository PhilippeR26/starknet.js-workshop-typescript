// Test Cairo fixed array type
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-devnet/4.fixedArray.ts
// Coded with Starknet.js v6.23.0 + custom

import { RpcProvider, Account, shortString, json, Contract, type InvokeFunctionResponse, TransactionFinalityStatus, Call, CairoCustomEnum, CallData, cairo, CairoFixedArray } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // **** local Sepolia Testnet node
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
    // ****  Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    //  **** Mainnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet");

    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;
    // **** Sepolia
    // const accountAddress0 = account1BraavosSepoliaAddress;
    // const privateKey0 = account1BraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(myProvider, accountAddress0, privateKey0, undefined, "0x3");
    console.log("Account connected.\n");

    const type = "[core::integer::u32;8]";
    console.log(/^\[.*;\s.*\]$/.test(type)
        && /(?<=; )\d+(?=\])/.test(type));
    console.log(/(?<=\[).+(?=;)/.test(type));
    console.log("zzz", CairoFixedArray.isTypeFixedArray('[core::integer::u32;8]'));
    const a = new CairoFixedArray([2, 4, 6], type);
    console.log(a);
    const contractSierra = json.parse(fs.readFileSync("./compiledContracts/cairo292/fixed_array_testfixed_array.contract_class.json").toString("ascii"));
    const contractCasm = json.parse(fs.readFileSync("./compiledContracts/cairo292/fixed_array_testfixed_array.compiled_contract_class.json").toString("ascii"));
    const resDeploy = await account0.declareAndDeploy({ contract: contractSierra, casm: contractCasm });
    console.log(resDeploy);


    //const contractAddress = "0x28f7d0d746d07683e0a14be4690c462f6e537357af838e729ce03e2003b3648";
    const contractAddress = resDeploy.deploy.address;
    const testContract = new Contract(contractSierra.abi, contractAddress, myProvider);
    console.log("Contract deployed at :", testContract.address);
    const myCallData = new CallData(testContract.abi);
    const fixedArray = [1, 2, 3, 4, 5, 6, 7, 8];

    console.log("isFixedArrayTyp1=", CairoFixedArray.isTypeFixedArray("[core::integer::u32; 8]"));
    console.log("isFixedArrayTyp2=", CairoFixedArray.isTypeFixedArray("[core::integer::u32]"));
    console.log("isFixedArrayTyp3=", CairoFixedArray.isTypeFixedArray("[core::integer::u32; zorg]"));
    console.log("isFixedArrayTyp4=", CairoFixedArray.isTypeFixedArray("core::integer::u32; 12"));

    const complexArray = [{ a: 1, b: 2 }, { c: 3, d: 4 }];
    console.log(new CairoFixedArray(complexArray, "[else; 2]").compile());
    console.log("CallData.compile complex array =", CallData.compile([new CairoFixedArray(complexArray, "[else; 2]").compile(), 234n]));

    console.log("CallData.compile array (wrong result) =", CallData.compile([fixedArray]));
    console.log("CallData.compile2 array =", CallData.compile([new CairoFixedArray(fixedArray, "[else; 8]").compile(), 234n]));
    console.log("CallData.compile object =", CallData.compile({ x: new CairoFixedArray(fixedArray, "[else; 8]").compile(), y: 345n }));

    console.log("myCallData.compile array =", myCallData.compile("fixed_array", [fixedArray]));
    console.log("myCallData.compile array with cairo.fixedArray =", myCallData.compile("fixed_array", [new CairoFixedArray(fixedArray, "[else; 8]").compile()]));
    console.log("myCallData.compile object =", myCallData.compile("fixed_array", { x: fixedArray }));
    console.log("myCallData.compile object with cairo.fixedArray  =", myCallData.compile("fixed_array", { x: new CairoFixedArray(fixedArray, "[else; 8]").compile() }));

    console.log("testContract.populate array =", testContract.populate("fixed_array", [fixedArray]));
    console.log("testContract.populate object =", testContract.populate("fixed_array", { x: fixedArray }));


    const res0 = (await testContract.call("fixed_array", [fixedArray])) as bigint[];
    console.log("res0 =", res0);
    const res1 = await testContract.fixed_array(fixedArray);
    console.log("res1 =", res1);
    const callData2 = CallData.compile([new CairoFixedArray(fixedArray, "[else; 8]").compile()]);
    const res2 = (await testContract.call("fixed_array", callData2)) as bigint[];
    console.log("res2 =", res2);

    console.log("✅ Test performed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

CairoFixedArray.getFixedArrayType('[; 8]')
