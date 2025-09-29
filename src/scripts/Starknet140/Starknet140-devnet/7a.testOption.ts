// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/6.testFixedArray.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant } from "starknet";
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
    // *** Option from a CairoType
    // const myU8 = new CairoUint8(200);
    const myU8 = 8;
    const myOption0 = new CairoTypeOption(myU8, "core::option::Option::<core::integer::u8>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption0 =", myOption0.isVariantSome, myOption0.content);
    console.log("myOption0.decompose =", myOption0.decompose(hdParsingStrategy));
    const encoded00 = CallData.compile({ option: myOption0 });
    console.log("encoded00 =", encoded00);
    const encoded01 = CallData.compile([myOption0]);
    console.log("encoded01 =", encoded01);
    const myCairoOption: CairoOption<BigNumberish> = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 200);
    console.log("myCairoOption compiled =", CallData.compile([myCairoOption]));
    // *** Option from raw data
    const myOption1 = new CairoTypeOption(123, "core::option::Option::<core::integer::u8>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption1 =", myOption1.isVariantSome, myOption1.content);
    console.log("myOption1.toApiRequest =", myOption1.toApiRequest());
    console.log("myOption1.decompose.unwrap =", myOption1.decompose(hdParsingStrategy).unwrap());

    // *** Option from an iterator
    const iter = ["0", "100"][Symbol.iterator]();
    const myOption2 = new CairoTypeOption(iter, "core::option::Option::<core::integer::u8>", hdParsingStrategy);
    console.log("myOption2 =", myOption2.isVariantSome, myOption2.content);
    // *** Option with None variant
    const myOption3 = new CairoTypeOption(undefined, "core::option::Option::<core::integer::u8>", hdParsingStrategy, CairoOptionVariant.None);
    console.log("myOption3.decompose =", myOption3.decompose(hdParsingStrategy));

    console.log("myOption3 =", myOption3.isVariantSome, myOption3.content);
    // *** Option of an option
    const myOption4 = new CairoTypeOption(myOption0, "core::option::Option::<core::option::Option::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption4 =", myOption4.isVariantSome, ".unwrap().unwrap()", myOption4.content);
    // *** Option of an array
    const myOption5 = new CairoTypeOption([1, 2, 3], "core::option::Option::<core::array::Array::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption5 =", myOption5.isVariantSome, myOption5.content);
    const encoded50 = CallData.compile({ option: myOption5 });
    console.log("encoded50 =", encoded50);
    const encoded51 = CallData.compile([myOption5]);
    console.log("encoded51 =", encoded51);
    const decoded5: CairoOption<any> = myOption5.decompose(hdParsingStrategy);
    console.log("decoded5.unwrap() =", decoded5.unwrap());
    // *** Option of a tuple
    const myTuple0 = new CairoTuple([234, [1, 2, 3]], "(core::integer::u8, core::array::Array::<core::integer::u8>)", hdParsingStrategy);
    console.log("myTuple0 toApiRequest =", myTuple0.toApiRequest());
    console.log("myTuple0 compiled =", CallData.compile([myTuple0]));
    const myOption6 = new CairoTypeOption(myTuple0, "core::option::Option::<(core::integer::u8, core::array::Array::<core::integer::u8>)>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption6 =", myOption6.isVariantSome, myOption6.content);
    console.log("myOption6.toApiRequest =", myOption6.toApiRequest());
    console.log("myOption6.decompose.unwrap =", myOption6.decompose(hdParsingStrategy).unwrap());
    const encoded6 = CallData.compile([myOption6]);
    console.log("encoded6 =", encoded6);
    const myOption7 = new CairoTypeOption({ "0": 234, "1": [1, 2, 3] }, "core::option::Option::<(core::integer::u8, core::array::Array::<core::integer::u8>)>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption7 =", myOption7.isVariantSome, myOption7.content);
    const encoded7 = CallData.compile({ option: myOption7 });
    console.log("encoded7 =", encoded7);
    const myOption8 = new CairoTypeOption([234, [1, 2, 3]], "core::option::Option::<(core::integer::u8, core::array::Array::<core::integer::u8>)>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("myOption8 =", myOption8.isVariantSome, myOption8.content);
    const encoded8 = CallData.compile({ option: myOption8 });
    console.log("encoded8 =", encoded8);


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
        providerOrAccount: account0
    });
    const strategies = myTestContract.callData.parser.parsingStrategies;

    // BN
    const myCairoOption0 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 18);
    const option0S = new CairoTypeOption(18, "core::option::Option::<core::integer::u16>", hdParsingStrategy, CairoOptionVariant.Some);
    const option0N = new CairoTypeOption(undefined, "core::option::Option::<core::integer::u16>", hdParsingStrategy, CairoOptionVariant.None);
    const res0S = (await myTestContract.option_bn(option0S)) as CairoOption<bigint>;
    const res0N = (await myTestContract.option_bn(option0N)) as CairoOption<bigint>;
    console.log("Option0S meta-function =", res0S.isSome(), res0S.unwrap());
    CairoTypeOption.validate(200, "core::option::Option::<core::integer::u16>", CairoOptionVariant.Some);
    console.log("is =", CairoTypeOption.is(200, "core::option::Option::<core::integer::u16>", CairoOptionVariant.Some));
    // Array
    const option1S = new CairoTypeOption([67, 68n, "0x34", "70"], "core::option::Option::<core::array::Array::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.Some);
    const option1N = new CairoTypeOption(undefined, "core::option::Option::<core::array::Array::<core::integer::u8>>", hdParsingStrategy, CairoOptionVariant.None);
    const res1S = (await myTestContract.call("option_array", [option1S])) as CairoOption<Array<bigint>>;
    const res1N = (await myTestContract.call("option_array", [option1N])) as CairoOption<Array<bigint>>;
    console.log("Option1S meta-function =", res1S.isSome(), res1S.unwrap());

    // fixedArray
    const option2S = new CairoTypeOption([17, 18, 19], "core::option::Option::<[core::integer::u32; 3]>", hdParsingStrategy, CairoOptionVariant.Some);
    const option2N = new CairoTypeOption(undefined, "core::option::Option::<[core::integer::u32; 3]>", hdParsingStrategy, CairoOptionVariant.None);
    const res2S = (await myTestContract.call("option_fixed_array", [option2S])) as CairoOption<Array<bigint>>;
    const res2N = (await myTestContract.call("option_fixed_array", [option2N])) as CairoOption<Array<bigint>>;
    console.log("Option2S meta-function =", res2S.isSome(), res2S.unwrap());

    // Tuple
    const cArray = new CairoArray([50, 51], "core::array::Array::<core::integer::u32>", hdParsingStrategy);
    const cTuple = new CairoTuple([40, cArray], "(core::integer::u32, core::array::Array::<core::integer::u32>)", hdParsingStrategy);
    console.log("cTuple=", cTuple.toApiRequest());
    const myTup = cairo.tuple(40, [50, 51]);
    console.log({ myTup });
    const cairoOption3S = new CairoOption<any>(CairoOptionVariant.Some, myTup);
    console.log("cairoOption3S CallData.compile() array =", CallData.compile([cairoOption3S]));
    console.log("cairoOption3S CallData.compile() object =", CallData.compile({ x: cairoOption3S }));
    console.log("cairoOption3S myTestCallData.compile() array =", myTestCallData.compile("option_tuple", [cairoOption3S]));
    console.log("cairoOption3S myTestCallData.compile() object =", myTestCallData.compile("option_tuple", { x: cairoOption3S }));
    const resCO3S = (await myTestContract.call("option_tuple", [cairoOption3S])) as CairoOption<any>;
    console.log("resCO3S call", resCO3S.isSome(), resCO3S.unwrap());
    const resCO3Sbis = (await myTestContract.option_tuple(cairoOption3S)) as CairoOption<any>;
    console.log("resCO3Sbis meta-function", resCO3Sbis.isSome(), resCO3Sbis.unwrap());
    const option3S = new CairoTypeOption(cTuple, "core::option::Option::<(core::integer::u32, core::array::Array::<core::integer::u32>)>", hdParsingStrategy, CairoOptionVariant.Some);
    console.log("option3S encoded =", option3S.toApiRequest());
    const option3N = new CairoTypeOption(undefined, "core::option::Option::<(core::integer::u32, core::array::Array::<core::integer::u32>)>", hdParsingStrategy, CairoOptionVariant.None);
    console.log("option3S CallData.compile() array =", CallData.compile([option3S]));
    console.log("option3S CallData.compile() object =", CallData.compile({ x: option3S }));
    console.log("option3S myTestCallData.compile() array =", myTestCallData.compile("option_tuple", [option3S]));
    console.log("option3S myTestCallData.compile() object =", myTestCallData.compile("option_tuple", { x: option3S }));
    console.log("option3S myTestContract.populate array=", myTestContract.populate("option_tuple", [option3S]));
    console.log("option3S myTestContract.populate object=", myTestContract.populate("option_tuple", { x: option3S }));
    const res3S = (await myTestContract.call("option_tuple", [option3S])) as CairoOption<any>;
    console.log("res3S call", res3S.isSome(), res3S.unwrap());
    const res3Sbis = (await myTestContract.option_tuple(option3S)) as CairoOption<any>;
    console.log("res3S meta-function", res3Sbis.isSome(), res3Sbis.unwrap());
    const res3N = (await myTestContract.call("option_tuple", [option3N])) as CairoOption<any>;
    console.log("res3N call", res3N.isSome(), res3N.unwrap());

    // Result
    const myResult7 = new CairoResult<BigNumberish, BigNumberish>(CairoResultVariant.Ok, 7);
    const option7S = new CairoTypeOption(myResult7, "core::option::Option::<core::result::Result::<core::integer::u8, core::integer::u16>>", hdParsingStrategy, CairoOptionVariant.Some);
    const option7N = new CairoTypeOption(undefined, "core::option::Option::<core::result::Result::<core::integer::u8, core::integer::u16>>", hdParsingStrategy, CairoOptionVariant.None);
    const res7S = (await myTestContract.call("option_result", [option7S])) as CairoOption<CairoResult<bigint, bigint>>;
    const res7N = (await myTestContract.call("option_result", [option7N])) as CairoOption<CairoResult<bigint, bigint>>;
    const res7 = (await myTestContract.option_result(option7S)) as CairoOption<CairoResult<bigint, bigint>>;
    console.log("Option7S =", res7S.isSome(), res7S.unwrap(), res7S.unwrap()!.unwrap());
    console.log("Option7N =", res7N.isSome(), res7N.unwrap());
    console.log("Option7 meta-function =", res7.isSome(), res7.unwrap());

    // Struct Point
    type Point = { x: BigNumberish, y: BigNumberish };
    const myPoint: Point = { x: 3, y: 4 };
    const myOptionPoint = new CairoOption<Point>(CairoOptionVariant.Some, myPoint);
    const calldata8=myTestCallData.compile("option_struct", [myOptionPoint]);
    console.log("option_struct myCallData compile() array =", calldata8);
    const res8S = (await myTestContract.call("option_struct", [myOptionPoint])) as CairoOption<Point>;
    const res8 = (await myTestContract.option_struct(myOptionPoint)) as CairoOption<Point>;
    console.log("Option8S =", res8S.isSome(), res8S.unwrap());
    console.log("Option8 meta-function =", res8.isSome(), res8.unwrap());

    // option of option
    const o1 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 200);
    const o2 = new CairoOption<CairoOption<BigNumberish>>(CairoOptionVariant.Some, o1);
    const comp4 = myTestCallData.compile("option_option_bn", [o2]);
    console.log("option_option myCallData compile() array =", comp4);
    const res4S = (await myTestContract.option_option_bn(o2)) as CairoOption<CairoOption<BigNumberish>>;
    console.log("res4S meta-function", res4S.isSome(), res4S.unwrap()!.unwrap());
    const res4Sbis = (await myTestContract.call("option_option_bn", [o2])) as CairoOption<CairoOption<BigNumberish>>;
    console.log("res4Sbis call", res4Sbis.isSome(), res4Sbis.unwrap()!.unwrap());

    // execute
    const op5 = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 100);
    const op5a=new CairoTypeOption(op5,"core::option::Option::<core::integer::u16>",strategies);
    const myCall5 = myTestContract.populate("write_option_bn", { x: op5 });
    const myCall5a = myTestContract.populate("write_option_bn", { x: op5a });
    console.log("invoke in progress...");
    const res5 = await account0.execute(myCall5, { tip: 200n });
    const txR5 = await myProvider.waitForTransaction(res5.transaction_hash);
    console.log("write =", txR5.isSuccess());

    // array of option
    const o = new CairoOption<BigNumberish>(CairoOptionVariant.Some, 200);
    const arrOption = [o, o];
    console.log("arr of options CallData.compile array =", CallData.compile([arrOption]));
    console.log("arr of options CallData.compile object =", CallData.compile({ x: arrOption }));
    console.log("arr of options myCallData.compile array =", myTestCallData.compile("array_option_bn", [arrOption]));
    console.log("arr of options myCallData.compile object =", myTestCallData.compile("array_option_bn", { x: arrOption }));
    console.log("arr of options myContract.populate array =", myTestContract.populate("array_option_bn", [arrOption]));
    console.log("arr of options myContract.populate object =", myTestContract.populate("array_option_bn", { x: arrOption }));
    const res6 = (await myTestContract.call("array_option_bn", [arrOption])) as Array<CairoOption<any>>;
    console.log("arr of options myContract.call =", res6);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });