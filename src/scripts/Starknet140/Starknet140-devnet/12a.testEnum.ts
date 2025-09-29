// Test Cairo Struct with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/11a.testStruct.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, CairoTypeResult, type AbiStruct, CairoStruct, CairoCustomEnum, type AbiEnum, CairoTypeCustomEnum } from "starknet";
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

    // console.log("A0=", JSON.stringify(hdParsingStrategy))
    console.log("A1 =", CallData.getAbiEnum(compiledSierra.abi));
    console.log("A2 =", CallData.getAbiStruct(compiledSierra.abi));
    console.log("strat1 =", myTestCallData.parser.parsingStrategies);
    const strategies = myTestContract.callData.parser.parsingStrategies;
    console.log("strategies =", strategies);
     type Point = { x: BigNumberish, y: BigNumberish };

    // custom_enum
    // const myPoint: Point = { x: 3, y: 4 };
    const abiMyEnum: AbiEnum = myTestCallData.abi.find(
         (item) => item.name === 'enums::MyEnum'
     );
    // console.log("abiMyEnum =", abiMyEnum);
    // const myTypeEnum0 = new CairoTypeCustomEnum(myPoint, abiMyEnum, strategies,1);
    // console.log("MyTypeEnum =",myTypeEnum0);
    // const myEnum0= new CairoCustomEnum({LocationError: myPoint});
    // const comp0 = myTestCallData.compile("custom_enum", [myTypeEnum0]);
    // const comp0a = myTestCallData.compile("custom_enum", { x: myTypeEnum0 });
    // const comp0b = myTestCallData.compile("custom_enum", [myEnum0]);
    // const comp0c = myTestCallData.compile("custom_enum", { x: myEnum0 });
    // console.log("custom_enum comp0 compile() =", comp0);
    // console.log("custom_enum comp0a compile() =", comp0a);
    // console.log("custom_enum comp0b compile() =", comp0b);
    // console.log("custom_enum comp0c compile() =", comp0c);
    // const res0a = (await myTestContract.call("custom_enum", [myEnum0])) as Point;
    // const res0b = (await myTestContract.call("custom_enum", [myTypeEnum0])) as Point;
    // const res0 = (await myTestContract.custom_enum(myEnum0)) as CairoCustomEnum;
    // const res0c = (await myTestContract.custom_enum(myTypeEnum0)) as CairoCustomEnum;
    // console.log("res0 =", res0);
    // console.log("res0a =", res0a);
    // console.log("res0b =", res0b);
    // console.log("res0c =", res0c);
    // const res0d = CallData.compile([myEnum0]);
    // const res0e = CallData.compile({ x: myEnum0 });
    // const res0f = CallData.compile([myTypeEnum0]);
    // const res0g = CallData.compile({ x: myTypeEnum0 });
    // console.log("res0d =", res0d);
    // console.log("res0e =", res0e);
    // console.log("res0f =", res0f);
    // console.log("res0g =", res0g);


    // struct_point
    // type Point2 = { thickness: BigNumberish, location: Point };
    // const myPoint2: Point2 = { thickness: 1, location: myPoint };
    // const abiPoint2: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Point2'
    // );
    // console.log("abiPoint2 =", abiPoint2);
    // const myTypePoint2 = new CairoStruct(myPoint2, abiPoint2, strategies);
    // const comp1 = myTestCallData.compile("struct_point2", [myPoint2]);
    // const comp1a = myTestCallData.compile("struct_point2", { x: myPoint2 });
    // const comp1b = myTestCallData.compile("struct_point2", [myTypePoint2]);
    // const comp1c = myTestCallData.compile("struct_point2", { x: myTypePoint2 });
    // console.log("struct_point2 comp1 compile() =", comp1);
    // console.log("struct_point2 comp1a compile() =", comp1a);
    // console.log("struct_point2 comp1b compile() =", comp1b);
    // console.log("struct_point2 comp1c compile() =", comp1c);
    // const res1a = (await myTestContract.call("struct_point2", [myPoint2])) as Point2;
    // const res1b = (await myTestContract.call("struct_point2", [myTypePoint2])) as Point2;
    // const res1 = (await myTestContract.struct_point2(myPoint2)) as Point2;
    // const res1c = (await myTestContract.struct_point2(myTypePoint2)) as Point2;
    // console.log("res1 =", res1);
    // console.log("res1 =", res1a);
    // console.log("res1b =", res1b);
    // console.log("res1c =", res1c);
    // const res1d = CallData.compile([myPoint2]);
    // const res1e = CallData.compile({ x: myPoint2 });
    // const res1f = CallData.compile([myTypePoint2]);
    // const res1g = CallData.compile({ x: myTypePoint2 });
    // console.log("res1d =", res1d);
    // console.log("res1e =", res1e);
    // console.log("res1f =", res1f);
    // console.log("res1g =", res1g);

    // struct_Empty
    // type Empty = {};
    // const myEmpty: Empty = {};
    // const abiEmpty: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Empty'
    // );
    // console.log("abiEmpty =", abiEmpty);
    // const myTypeEmpty = new CairoStruct(myEmpty, abiEmpty, strategies);
    // const comp2 = myTestCallData.compile("struct_Empty", [myEmpty]);
    // const comp2a = myTestCallData.compile("struct_Empty", { x: myEmpty });
    // const comp2b = myTestCallData.compile("struct_Empty", [myTypeEmpty]);
    // const comp2c = myTestCallData.compile("struct_Empty", { x: myTypeEmpty });
    // console.log("struct_Empty comp2 compile() =", comp2);
    // console.log("struct_Empty comp2a compile() =", comp2a);
    // console.log("struct_Empty comp2b compile() =", comp2b);
    // console.log("struct_Empty comp2c compile() =", comp2c);
    // const res2a = (await myTestContract.call("struct_Empty", [myEmpty])) as Object;
    // const res2b = (await myTestContract.call("struct_Empty", [myEmpty])) as Object;
    // const res2 = (await myTestContract.struct_Empty(myEmpty)) as Object;
    // const res2c = (await myTestContract.struct_Empty(myTypeEmpty)) as Object;
    // console.log("res2 =", res2);
    // console.log("res2a =", res2a);
    // console.log("res2b =", res2b);
    // console.log("res2c =", res2c);
    // const res2d = CallData.compile([myEmpty]);
    // const res2e = CallData.compile({ x: myEmpty });
    // const res2f = CallData.compile([myTypeEmpty]);
    // const res2g = CallData.compile({ x: myTypeEmpty });
    // console.log("res2d =", res2d);
    // console.log("res2e =", res2e);
    // console.log("res2f =", res2f);
    // console.log("res2g =", res2g);

    // struct_Cat
    // type Cat = { age: BigNumberish, legs: Record<number, BigNumberish | object | boolean> }

    // const myCat: Cat = { age: 5, legs: cairo.tuple(1, 2, 3, 4) };
    // const abiCat: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Cat'
    // );
    // console.log("abiCat =", abiCat);
    // const myTypeCat = new CairoStruct(myCat, abiCat, strategies);
    // const comp3 = myTestCallData.compile("struct_Cat", [myCat]);
    // const comp3a = myTestCallData.compile("struct_Cat", { x: myCat });
    // const comp3b = myTestCallData.compile("struct_Cat", [myTypeCat]);
    // const comp3c = myTestCallData.compile("struct_Cat", { x: myTypeCat });
    // console.log("struct_Cat comp3 compile() =", comp3);
    // console.log("struct_Cat comp3a compile() =", comp3a);
    // console.log("struct_Cat comp3b compile() =", comp3b);
    // console.log("struct_Cat comp3c compile() =", comp3c);
    // const res3a = (await myTestContract.call("struct_Cat", [myCat])) as Cat;
    // const res3b = (await myTestContract.call("struct_Cat", [myTypeCat])) as Cat;
    // const res3 = (await myTestContract.struct_Cat(myCat)) as Cat;
    // const res3c = (await myTestContract.struct_Cat(myTypeCat)) as Cat;
    // console.log("res3 =", res3);
    // console.log("res3a =", res3a);
    // console.log("res3b =", res3b);
    // console.log("res3c =", res3c);
    // const res3d = CallData.compile([myCat]);
    // const res3e = CallData.compile({ x: myCat });
    // const res3f = CallData.compile([myTypeCat]);
    // const res3g = CallData.compile({ x: myTypeCat });
    // console.log("res3d =", res3d);
    // console.log("res3e =", res3e);
    // console.log("res3f =", res3f);
    // console.log("res3g =", res3g);

    // struct_Dog
    // type Dog = { age: BigNumberish, colors: Array<BigNumberish> }
    // const myDog: Dog = { age: 5, colors: [8, 9] };
    // const abiDog: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Dog'
    // );
    // console.log("abiDog =", abiDog);
    // const myTypeDog = new CairoStruct(myDog, abiDog, strategies);
    // const comp4 = myTestCallData.compile("struct_Dog", [myDog]);
    // const comp4a = myTestCallData.compile("struct_Dog", { x: myDog });
    // const comp4b = myTestCallData.compile("struct_Dog", [myTypeDog]);
    // const comp4c = myTestCallData.compile("struct_Dog", { x: myTypeDog });
    // console.log("struct_Dog comp4 compile() =", comp4);
    // console.log("struct_Dog comp4a compile() =", comp4a);
    // console.log("struct_Dog comp4b compile() =", comp4b);
    // console.log("struct_Dog comp4c compile() =", comp4c);
    // const res4a = (await myTestContract.call("struct_Dog", [myDog])) as Dog;
    // const res4b = (await myTestContract.call("struct_Dog", [myTypeDog])) as Dog;
    // const res4 = (await myTestContract.struct_Dog(myDog)) as Dog;
    // const res4c = (await myTestContract.struct_Dog(myTypeDog)) as Dog;
    // console.log("res4 =", res4);
    // console.log("res4a =", res4a);
    // console.log("res4b =", res4b);
    // console.log("res4c =", res4c);
    // const res4d = CallData.compile([myDog]);
    // const res4e = CallData.compile({ x: myDog });
    // const res4f = CallData.compile([myTypeDog]);
    // const res4g = CallData.compile({ x: myTypeDog });
    // console.log("res4d =", res4d);
    // console.log("res4e =", res4e);
    // console.log("res4f =", res4f);
    // console.log("res4g =", res4g);

    // struct_Horse
    // type Horse = { age: BigNumberish, legs_color: Array<BigNumberish> }
    // const myHorse: Horse = { age: 5, legs_color: [8, 9, 10, 11] };
    // const abiHorse: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Horse'
    // );
    // console.log("abiHorse =", abiHorse);
    // const myTypeHorse = new CairoStruct(myHorse, abiHorse, strategies);
    // const comp5 = myTestCallData.compile("struct_Horse", [myHorse]);
    // const comp5a = myTestCallData.compile("struct_Horse", { x: myHorse });
    // const comp5b = myTestCallData.compile("struct_Horse", [myTypeHorse]);
    // const comp5c = myTestCallData.compile("struct_Horse", { x: myTypeHorse });
    // console.log("struct_Horse comp5 compile() =", comp5);
    // console.log("struct_Horse comp5a compile() =", comp5a);
    // console.log("struct_Horse comp5b compile() =", comp5b);
    // console.log("struct_Horse comp5c compile() =", comp5c);
    // const res5a = (await myTestContract.call("struct_Horse", [myHorse])) as Horse;
    // const res5b = (await myTestContract.call("struct_Horse", [myTypeHorse])) as Horse;
    // const res5 = (await myTestContract.struct_Horse(myHorse)) as Horse;
    // const res5c = (await myTestContract.struct_Horse(myTypeHorse)) as Horse;
    // console.log("res5 =", res5);
    // console.log("res5a =", res5a);
    // console.log("res5b =", res5b);
    // console.log("res5c =", res5c);
    // type Horse2 = { age: BigNumberish, legs_color: Object }
    // const myHorse2: Horse2 = { age: 5, legs_color: CairoFixedArray.compile([8, 9, 10, 11]) };
    // const myTypeHorse2 = new CairoStruct(myHorse2, abiHorse, strategies);
    // const res5d = CallData.compile([myHorse2]);
    // const res5e = CallData.compile({ x: myHorse2 });
    // const res5f = CallData.compile([myTypeHorse2]);
    // const res5g = CallData.compile({ x: myTypeHorse2 });
    // console.log("res5d =", res5d);
    // console.log("res5e =", res5e);
    // console.log("res5f =", res5f);
    // console.log("res5g =", res5g);

    // struct_Truck
    // type Truck = { power: BigNumberish, turbo: CairoOption<BigNumberish> }
    // const myTruck: Truck = { power: 512, turbo: new CairoOption(CairoOptionVariant.Some, 2) };
    // const abiTruck: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Truck'
    // );
    // console.log("abiTruck =", abiTruck);
    // const myTypeTruck = new CairoStruct(myTruck, abiTruck, strategies);
    // const comp6 = myTestCallData.compile("struct_Truck", [myTruck]);
    // const comp6a = myTestCallData.compile("struct_Truck", { x: myTruck });
    // const comp6b = myTestCallData.compile("struct_Truck", [myTypeTruck]);
    // const comp6c = myTestCallData.compile("struct_Truck", { x: myTypeTruck });
    // console.log("struct_Truck comp6 compile() =", comp6);
    // console.log("struct_Truck comp6a compile() =", comp6a);
    // console.log("struct_Truck comp6b compile() =", comp6b);
    // console.log("struct_Truck comp6c compile() =", comp6c);
    // const res6a = (await myTestContract.call("struct_Truck", [myTruck])) as Truck;
    // const res6b = (await myTestContract.call("struct_Truck", [myTypeTruck])) as Truck;
    // const res6 = (await myTestContract.struct_Truck(myTruck)) as Truck;
    // const res6c = (await myTestContract.struct_Truck(myTypeTruck)) as Truck;
    // console.log("res6 =", res6);
    // console.log("res6a =", res6a);
    // console.log("res6b =", res6b);
    // console.log("res6c =", res6c);
    // const res6d = CallData.compile([myTruck]);
    // const res6e = CallData.compile({ x: myTruck });
    // const res6f = CallData.compile([myTypeTruck]);
    // const res6g = CallData.compile({ x: myTypeTruck });
    // console.log("res6d =", res6d);
    // console.log("res6e =", res6e);
    // console.log("res6f =", res6f);
    // console.log("res6g =", res6g);

    // struct_Destruction
    // type Destruction = { area: BigNumberish, res: CairoResult<BigNumberish, BigNumberish> }
    // const myDestruction: Destruction = { area: 512, res: new CairoResult(CairoResultVariant.Ok, 100) };
    // const abiDestruction: AbiStruct = myTestCallData.abi.find(
    //     (item) => item.name === 'enums::Destruction'
    // );
    // console.log("abiDestruction =", abiDestruction);
    // const myTypeDestruction = new CairoStruct(myDestruction, abiDestruction, strategies);
    // const comp7 = myTestCallData.compile("struct_Destruction", [myDestruction]);
    // const comp7a = myTestCallData.compile("struct_Destruction", { x: myDestruction });
    // const comp7b = myTestCallData.compile("struct_Destruction", [myTypeDestruction]);
    // const comp7c = myTestCallData.compile("struct_Destruction", { x: myTypeDestruction });
    // console.log("struct_Destruction comp7 compile() =", comp7);
    // console.log("struct_Destruction comp7a compile() =", comp7a);
    // console.log("struct_Destruction comp7b compile() =", comp7b);
    // console.log("struct_Destruction comp7c compile() =", comp7c);
    // const res7a = (await myTestContract.call("struct_Destruction", [myDestruction])) as Destruction;
    // const res7b = (await myTestContract.call("struct_Destruction", [myTypeDestruction])) as Destruction;
    // const res7 = (await myTestContract.struct_Destruction(myDestruction)) as Destruction;
    // const res7c = (await myTestContract.struct_Destruction(myTypeDestruction)) as Destruction;
    // console.log("res7 =", res7);
    // console.log("res7a =", res7a);
    // console.log("res7b =", res7b);
    // console.log("res7c =", res7c);
    // const res7d = CallData.compile([myDestruction]);
    // const res7e = CallData.compile({ x: myDestruction });
    // const res7f = CallData.compile([myTypeDestruction]);
    // const res7g = CallData.compile({ x: myTypeDestruction });
    // console.log("res7d =", res7d);
    // console.log("res7e =", res7e);
    // console.log("res7f =", res7f);
    // console.log("res7g =", res7g);

    // execute
    const op8: Point = { x: 3, y: 4 };
    const myEnum8=new CairoCustomEnum({LocationError: op8});
    //const myEnum8=new CairoCustomEnum({Success: 10});
    const myTypeEnum8 = new CairoTypeCustomEnum(op8, abiMyEnum, strategies,1);
    
    const myCall8 = myTestContract.populate("write_custom_enum", { x: myEnum8 });
    console.log("myCall8 =",myCall8);
    const myCall8a = myTestContract.populate("write_custom_enum", [myEnum8]);
    const myCall8b = myTestContract.populate("write_custom_enum", { x: myTypeEnum8 });
    const myCall8c = myTestContract.populate("write_custom_enum", [myTypeEnum8]);
    
    console.log("Invoke in progress...");
    const res8 = await account0.execute(myCall8, { tip: 200n });
    const txR8 = await myProvider.waitForTransaction(res8.transaction_hash);
    console.log("write8 =", txR8.isSuccess());

    

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });