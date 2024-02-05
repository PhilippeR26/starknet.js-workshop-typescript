// Test decodeParameters.
// launch with npx ts-node src/scripts/calldata/1.decodeParameters.ts
// Coded with Starknet.js v6.0.0 B11

import { constants, Contract, Account, json, shortString, RpcProvider, types, RPC, num, ec, CallData, hash, cairo, AbiEntry, Result } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import axios from "axios";
import LogC from "../utils/logColors";
dotenv.config();

async function main() {
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/hello.sierra.json").toString("ascii"));
    const compiledSierra2 = json.parse(fs.readFileSync("./compiledContracts/cairo210/hello_res_events_newTypes.sierra.json").toString("ascii"));
    const compiledCairo0 = json.parse(fs.readFileSync("./compiledContracts/cairo060/testData.json").toString("ascii"));
    const compiledCairo0Hello = json.parse(fs.readFileSync("./compiledContracts/cairo060/ERC20-echo.json").toString("ascii"));
    
    const helloCallData = new CallData(compiledSierra.abi);
    const helloCallData2 = new CallData(compiledSierra2.abi);
    const cairo0CallData = new CallData(compiledCairo0.abi);
    const hello0CallData = new CallData(compiledCairo0Hello.abi);
    const res = helloCallData.parse("get_user1", ["0x123456", "0x1"]);
    console.log("res =", res);
    console.log(LogC.fg.cyan + LogC.bright + "Cairo 1 :", LogC.reset);
    const res2 = helloCallData.decodeParameters("hello::hello::UserData", ["0x123456", "0x1"]);
    console.log("res2 =", res2);
    const res3 = helloCallData.decodeParameters(["hello::hello::UserData", "hello::hello::UserData"], ["0x123456", "0x1", "0x98765", "0x0"]);
    console.log("res3 =", res3);
    const res4 = helloCallData.decodeParameters("core::integer::u8", ["0x123456"]);
    console.log("res4 =", res4);
    const res5 = helloCallData.decodeParameters("core::bool", ["0x1"]);
    console.log("res5 =", res5);
    const res6 = helloCallData.decodeParameters("core::felt252", ["0x123456"]);
    console.log("res6 =", res6);
    const res7 = helloCallData.decodeParameters("core::integer::u256", ["0x123456", "0x789"]);
    console.log("res7 =", num.toHex(res7.toString()));
    const res8 = helloCallData.decodeParameters("core::array::Array::<core::integer::u16>", ["2", "0x123456", "0x789"]);
    console.log("res8 =", res8);
    const res9 = helloCallData.decodeParameters("core::array::Span::<core::integer::u16>", ["2", "0x123456", "0x789"]);
    console.log("res9 =", res9);
    const res10 = helloCallData.decodeParameters("(core::felt252, core::integer::u16)", ["0x123456", "0x789"]);
    console.log("res10 =", res10);
    const res11 = helloCallData.decodeParameters("core::starknet::eth_address::EthAddress", ["0x123456"]);
    console.log("res11 =", res11);
    const res12 = helloCallData.decodeParameters("core::starknet::contract_address::ContractAddress", ["0x123456"]);
    console.log("res12 =", res12);
    const res13 = helloCallData.decodeParameters("core::starknet::class_hash::ClassHash", ["0x123456"]);
    console.log("res13 =", res13);
    const res14 = helloCallData.decodeParameters("core::option::Option::<core::integer::u8>", ["0", "0x12"]);
    console.log("res14 =", res14);
    const res15 = helloCallData2.decodeParameters("core::result::Result::<hello_res_events_newTypes::hello_res_events_newTypes::Order, core::integer::u16>", ["0", "0x12","0x345"]);
    console.log("res15 =", res15);
    const res16 = helloCallData.decodeParameters("hello::hello::MyEnum", ["0", "0x12", "0x5678"]);
    console.log("res16 =", res16);
    
    
    console.log(LogC.fg.cyan + LogC.bright + "Cairo 0 :", LogC.reset);
    const cai0 = cairo0CallData.decodeParameters('c3D', ['474107', '353463', '456']);
    console.log("cai0 =", cai0);
    const cai1 = cairo0CallData.decodeParameters('Uint256', ['47410765', '35346645']);
    console.log("cai1 =", cai1);
    const cai2 = hello0CallData.decodeParameters('Struct32', ['47410765', '35346645', '1', "2", "3"]);
    console.log("cai2 =", cai2);
    const cai3 = hello0CallData.decodeParameters('(felt, felt, felt, felt)', ['47410765', '35346645', '1', "2"]);
    console.log("cai3 =", cai3);
    const cai4 = hello0CallData.decodeParameters('Struct2', ['47410765', '35346645', '1', "2", "3"]);
    console.log("cai4 =", cai4);
    const cai5 = hello0CallData.decodeParameters('Struct3', ['47410765', '35346645', '1', "2", "3", "4"]);
    console.log("cai5 =", cai5);
    const cai7 = hello0CallData.decodeParameters('(t1: felt, t2: StructX, t3: felt)', ['47410765', '35346645', '1', "2", "3", "4", "5", "6", "7", "8", "9"])  ;
    console.log("cai7 =", cai7);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });