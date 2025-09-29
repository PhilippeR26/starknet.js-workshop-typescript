// Test Cairo Result with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/10a.testResult.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoTypeResult } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import type { ResourceBounds } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();




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
        // "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Devnet.");

    //process.exit(5);
    // *** Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account1OZSepoliaAddress;
    // const privateKey0 = account1OZSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // ********** main code


    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.compiled_contract_class.json").toString("ascii"));
    console.log("Deploy of contract in progress...");
    // const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm }, { tip: 2000000 });
    // const contractAddress = deployResponse.deploy.address;
    // console.log("Contract deployed at =", contractAddress);
    const contractAddress = "0x703cd4e9816f09e44a07e170fdf37b993f036994468683dd90ea7a1ec803086";

    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const myTestContract = new Contract({
        abi: compiledSierra.abi,
        address: contractAddress,
        providerOrAccount: account0,
    });
    const strategies = myTestContract.callData.parser.parsingStrategies;

    console.log("A0=", JSON.stringify(hdParsingStrategy))
    console.log("A1 =",CallData.getAbiEnum(compiledSierra.abi));
    console.log("A2 =",CallData.getAbiStruct(compiledSierra.abi));
    console.log("strat1 =",myTestCallData.parser.parsingStrategies);
    console.log("strat2 =",myTestContract.callData.parser.parsingStrategies);

    // BN
    const myCairoResult0 = new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Ok, 18);
    const result0Ok = new CairoTypeResult(18, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy, CairoResultVariant.Ok);
    const result0Er = new CairoTypeResult(5, "core::result::Result::<core::integer::u8, core::integer::u16>", hdParsingStrategy, CairoOptionVariant.None);
    const res0ok = (await myTestContract.call("result_bn",[result0Ok])) as CairoResult<bigint, bigint>;
    const res0err = (await myTestContract.call("result_bn",[result0Er])) as CairoResult<bigint, bigint>;
    const res0 = (await myTestContract.result_bn(result0Er)) as CairoResult<bigint, bigint>;
    console.log("res0Ok =", res0ok.isOk(), res0ok.unwrap());
    console.log("res0N =", res0err.isOk(), res0err.unwrap());
    console.log("res0 =", res0.isOk(), res0.unwrap());
    const comp0 = myTestCallData.compile("result_bn", [result0Ok]);
    console.log("comp0 compile() =", comp0);
   const comp0bis = myTestCallData.compile("result_bn", {x: result0Er});
    console.log("comp0bis compile() =", comp0bis);

    // Array
    const result1ok = new CairoTypeResult([67, 68n, "0x34", "70"], "core::result::Result::<core::array::Array::<core::integer::u8>, core::array::Array::<core::integer::u16>>", hdParsingStrategy, CairoResultVariant.Ok);
    const result1err = new CairoTypeResult([1,2,3], "core::result::Result::<core::array::Array::<core::integer::u8>, core::array::Array::<core::integer::u16>>", hdParsingStrategy, CairoOptionVariant.None);
    const res1ok = (await myTestContract.call("result_array", [result1ok])) as CairoResult<Array<bigint>, Array<bigint>>;
    const res1err = (await myTestContract.call("result_array", [result1err])) as CairoResult<Array<bigint>, Array<bigint>>;
    const res1 = (await myTestContract.result_array(result1err)) as CairoResult<Array<bigint>, Array<bigint>>;
    console.log("Result1ok =", res1ok.isOk(), res1ok.unwrap());
    console.log("Result1err =", res1err.isOk(), res1err.unwrap());
    console.log("Result1 meta-function =", res1.isOk(), res1.unwrap());
    const comp1 = myTestCallData.compile("result_array", [result1ok]);
    console.log("comp1 compile() =", comp1);
   const comp1bis = myTestCallData.compile("result_array", {x: result1err});
    console.log("comp1bis compile() =", comp1bis);

    // fixedArray
    const result2ok = new CairoTypeResult([17, 18, 19], "core::result::Result::<[core::integer::u32; 3], [core::integer::u16; 2]>", hdParsingStrategy, CairoResultVariant.Ok);
    const result2err = new CairoTypeResult([8, 9], "core::result::Result::<[core::integer::u32; 3], [core::integer::u16; 2]>", hdParsingStrategy, CairoResultVariant.Err);
    const res2ok = (await myTestContract.call("result_fixed_array", [result2ok])) as CairoResult<Array<bigint>, bigint>;
    const res2err = (await myTestContract.call("result_fixed_array", [result2err])) as CairoResult<Array<bigint>, bigint>
    const res2 = (await myTestContract.result_fixed_array( result2err)) as CairoResult<Array<bigint>, bigint>
    console.log("res2 meta-function =", res2.isOk(), res2.unwrap());

    // Tuple
    const cArray = new CairoArray([50, 51], "core::array::Array::<core::integer::u32>", hdParsingStrategy);
    const cTuple = new CairoTuple([40, cArray], "(core::integer::u32, core::array::Array::<core::integer::u32>)", hdParsingStrategy);
    console.log("cTuple=", cTuple.toApiRequest());
    const myTup = cairo.tuple(40, [50, 51]);
    console.log({ myTup });
    const cairoResult3ok = new CairoResult<Object, Object>(CairoResultVariant.Ok, myTup);
    console.log("cairoResult3ok CallData.compile() array =", CallData.compile([cairoResult3ok]));
    console.log("cairoResult3ok CallData.compile() object =", CallData.compile({ x: cairoResult3ok }));
    console.log("cairoResult3ok myTestCallData.compile() array =", myTestCallData.compile("result_tuple", [cairoResult3ok]));
    console.log("cairoResult3ok myTestCallData.compile() object =", myTestCallData.compile("result_tuple", { x: cairoResult3ok }));
    const resCO3Sbis = (await myTestContract.result_tuple(cairoResult3ok)) as CairoResult<Object, Object>;
    console.log("resCO3Sbis meta-function", resCO3Sbis.isOk(), resCO3Sbis.unwrap());
    const result3S = new CairoTypeResult(cTuple, "core::result::Result::<(core::integer::u32, core::array::Array::<core::integer::u32>), (core::integer::u16, core::array::Array::<core::integer::u16>)>", hdParsingStrategy, CairoResultVariant.Ok);
    console.log("result3S encoded =", result3S.toApiRequest());
    console.log("result3S CallData.compile() array =", CallData.compile([result3S]));
    console.log("result3S CallData.compile() object =", CallData.compile({ x: result3S }));
    console.log("result3S myTestCallData.compile() array =", myTestCallData.compile("result_tuple", [result3S]));
    console.log("option3S myTestCallData.compile() object =", myTestCallData.compile("result_tuple", { x: result3S }));
    console.log("result3S myTestContract.populate array=", myTestContract.populate("result_tuple", [result3S]));
    console.log("result3S myTestContract.populate object=", myTestContract.populate("result_tuple", { x: result3S }));
    const res3S = (await myTestContract.call("result_tuple", [result3S])) as CairoResult<any,any>;
    console.log("res3S call", res3S.isOk(), res3S.unwrap());
    const res3Sbis = (await myTestContract.result_tuple(result3S)) as CairoResult<any, any>;
    console.log("res3S meta-function", res3Sbis.isOk(), res3Sbis.unwrap());

    // result of result
    const o1 = new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Err, 200);
    const o2 = new CairoResult<BigNumberish, CairoResult<BigNumberish, BigNumberish>>(CairoResultVariant.Ok, o1);
    const comp4 = myTestCallData.compile("result_result_bn", [o2]);
    console.log("result_result myCallData compile() array =", comp4);
    const res4S = (await myTestContract.result_result_bn(o2)) as CairoResult<CairoResult<BigNumberish, BigNumberish>, BigNumberish>;
    console.log("res4S meta-function", res4S.isOk(), res4S.unwrap());
    const res4Sbis = (await myTestContract.call("result_result_bn", [o2])) as CairoResult<CairoResult<BigNumberish, BigNumberish>, BigNumberish>;
    console.log("res4Sbis call", res4Sbis.isOk(), res4Sbis.unwrap());

    // Struct Point
    type Point = { x: BigNumberish, y: BigNumberish };
    const myPoint: Point = { x: 3, y: 4 };
    const myResultPoint = new CairoResult<BigNumberish, Point>(CairoResultVariant.Err, myPoint);
    const calldata8=myTestCallData.compile("result_struct", [myResultPoint]);
    console.log("result_struct myCallData compile() array =", calldata8);
    const res8S = (await myTestContract.call("result_struct", [myResultPoint])) as CairoResult<BigNumberish,Point>;
    const res8 = (await myTestContract.result_struct(myResultPoint)) as CairoResult<BigNumberish,Point>;
    console.log("Result8S =", res8S.isOk(), res8S.unwrap());
    console.log("Result8 meta-function =", res8.isOk(), res8.unwrap());

    // execute
    const resu5 = new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Ok, 100);
    const resu5a=new CairoTypeResult(resu5, "core::result::Result::<core::integer::u8, core::integer::u16>", strategies);
    const myCall5 = myTestContract.populate("write_result_bn", { x: resu5 });
    const myCall5a = myTestContract.populate("write_result_bn", [ resu5] );
    const myCall53 = myTestContract.populate("write_result_bn", [ resu5a] );
    console.log("Invoke in progress...");
    const res5 = await account0.execute(myCall5, { tip: 200n });
    const txR5 = await myProvider.waitForTransaction(res5.transaction_hash);
    console.log("write =", txR5.isSuccess());

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });