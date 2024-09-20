// call a Cairov2.1.0 contract, with enum answer.
// use Starknet.js v5.17.0, starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/cairo13-devnet/2.callTestOptionResult.ts

import { Provider, Account, Contract, json, Result, BigNumberish, Calldata, CallData, constants, Call, RawArgsObject, cairo, CairoEnum, CairoOption, CairoResult, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { CairoCustomEnum } from "starknet";
import { CairoOptionVariant, CairoResultVariant } from "starknet";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --cairo-compiler-manifest /D/Cairo1-dev/cairo/Cargo.toml' before using this script.
// launch script 1 before this script.
//          👆👆👆

// type CairoEnumRaw={
//     [key:string]:any,
// }
type Order = {
    p1: BigNumberish,
    p2: BigNumberish,
}

// const DeserializeOrder = (input: bigint[]): Order => { return { p1: input[0], p2: input[1] } };
// const DeserializeBigint = (input: bigint[]): bigint => { return input[0] };

// class CairoCustomEnum {
//     readonly customEnum:CairoEnumRaw;
//     constructor(enumContent:CairoEnumRaw){
//         this.customEnum=enumContent;
//     }
//     public unwrap():any{
//         const variants=Object.entries(this.customEnum);
//         const activeVariant=variants.find((item)=>typeof(item[1])!=="undefined");
//         if (typeof(activeVariant)==="undefined"){return undefined};
//         return activeVariant[1];
//     }
// }

// enum CairoResultContent {
//     Ok = 0,
//     Err = 1,
// }


// class CairoResult<T, U> {
//     readonly Ok?: T;
//     readonly Err?: U;

//     constructor(option: CairoResultContent, input: BigNumberish[], DeserealizeOk: Function, DeserializeErr: Function) {
//         const input3: bigint[] = input.map(val => BigInt(val));
//         switch (option) {
//             case CairoResultContent.Ok:
//                 this.Ok = DeserealizeOk(input3) as T;
//                 break;
//             case CairoResultContent.Err:
//                 this.Err = DeserializeErr(input3) as U;
//                 break;
//             default:
//                 throw new Error("option is out of range.")
//                 break;
//         }
//     }
//     public isOk(): boolean {
//         return !((typeof this.Ok) === "undefined")
//     }
//     public isErr(): boolean {
//         return !((typeof this.Err) === "undefined")
//     }
//     public unwrap(): T | undefined { return this.Ok }
// }

// enum CairoOptionContent {
//     Some = 0,
//     None = 1,
// }
// class CairoOption<T> {
//     readonly Some?: T;
//     readonly None?: boolean;

//     constructor(option: CairoOptionContent, input: BigNumberish[], DeserealizeSome: Function) {
//         const input3: bigint[] = input.map(val => BigInt(val));
//         switch (option) {
//             case CairoOptionContent.Some:
//                 this.Some = DeserealizeSome(input3) as T;
//                 break;
//             case CairoOptionContent.None:
//                 this.None = true;
//                 break;
//             default:
//                 throw new Error("option is out of range.")
//                 break;
//         }
//     }
//     public isSome(): boolean {
//         return !((typeof this.Some) === "undefined")
//     }
//     public isNone(): boolean {
//         return this.None === true
//     }
//     public unwrap(): T | undefined { return this.Some }
// }

async function main() {
    // const resultEnum:CairoEnumRaw={
    //     Response:undefined,
    //     Warning:200,
    //     Error:undefined,
    // }
    // const resEnum=new CairoCustomEnum(resultEnum);
    // const content=resEnum.unwrap();
    // console.log("CustomEnum =",content);

    // const re1: Order = { p1: 21, p2: 110 };
    // const myResult1 = new CairoResult<Order, bigint>(CairoResultContent.Ok, CallData.compile([re1]), DeserializeOrder, DeserializeBigint);
    // console.log("resul1  =", myResult1);
    // const re2: bigint = 2n;
    // const myResult2 = new CairoResult<Order, bigint>(CairoResultContent.Err, CallData.compile([re2]), DeserializeOrder, DeserializeBigint);
    // console.log("result2  =", myResult2);

    // const op1: Order = { p1: 11, p2: 12 };
    // const myOption1 = new CairoOption<Order>(CairoOptionContent.Some, CallData.compile(op1), DeserializeOrder);
    // console.log("option1  =", myOption1);
    // // const op2: bigint[] = [1n];
    // const myOption2 = new CairoOption<Order>(CairoOptionContent.None, [], DeserializeOrder);
    // console.log("option2  =", myOption2);

    //initialize Provider 
    const provider = new RpcProvider({nodeUrl: "http://127.0.0.1:5050"  });
    // const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });

    console.log('✅ Connected to devnet.');

    // initialize existing predeployed account 0 of Devnet
    const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


    // Connect the  contract instance :
    //          👇👇👇 update address in accordance with result of script 1
    const address = "0x76532889836d2c971d942c602e0cf6d5d969be30e6767533606526fe2f48ce";
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo210/PhilTest2.sierra.json").toString("ascii"));
    const myTestContract = new Contract(compiledTest.abi, address, provider);
    myTestContract.connect(account0);
    console.log('✅ Test Contract connected at =', myTestContract.address);


    // return a Cairo custom Enum, including felt252, array, tuple or struct.
    const res1a: CairoCustomEnum = await myTestContract.test2(10);
    console.log("Result1a =", res1a, res1a.unwrap(), res1a.activeVariant(), res1a.variant["Error"]);
    const res2 = await myTestContract.call("test2", [200]) as CairoCustomEnum;
    console.log("Result2 =", res2);
    const res3 = await myTestContract.call("test2", [120]) as CairoCustomEnum;
    console.log("Result3 =", res3, res3.variant.Critical);
    const res3a = await myTestContract.call("test2", [100]) as CairoCustomEnum;
    console.log("Result3a =", res3a);
    const res3b = await myTestContract.call("test2", [160]) as CairoCustomEnum;;
    console.log("Result3b =", res3b, res3b.unwrap());


    // return an option<litteral>
    const res4 = await myTestContract.call("test3", [50]) as CairoOption<bigint>;
    console.log("Result4 =", res4);
    const res5 = await myTestContract.call("test3", [128]) as CairoOption<bigint>;
    console.log("Result5 =", res5, res5.unwrap(), res5.isSome(), res5.isNone());

    // return an option<struct>
    const res6: CairoOption<Order> = await myTestContract.test4(50);
    console.log("Result6 =", res6);
    const res7a = (await myTestContract.call("test4", [128])) as CairoOption<Order>;
    console.log("Result7a =", res7a);

    // option<struct> as input
    const res8 = await myTestContract.call("test5", [new CairoOption<Order>(CairoOptionVariant.Some, { p1: 20, p2: 40 })]) as bigint;
    console.log("Result8 =", res8);
    const comp8a=await CallData.compile([new CairoOption<Order>(CairoOptionVariant.Some, { p1: 20, p2: 40 })]);
    const res8a = await myTestContract.call("test5", comp8a) as bigint;
    console.log("Result8a =", res8a);
    const res9 = await myTestContract.call("test5", [new CairoOption<Order>(CairoOptionVariant.None)]) as bigint;
    console.log("Result9 =", res9);
    const comp9a=await CallData.compile([new CairoOption<Order>(CairoOptionVariant.None)]);
    const res9a = await myTestContract.call("test5", comp9a) as bigint;
    console.log("Result9a =", res9a);

    // return  a Result<litteral> . do not work on cairo v2.0.0 ; needs v2.1.0
    const res10: CairoResult<BigNumberish, BigNumberish> = await myTestContract.test6(90);
    console.log("Result10 =", res10);
    const res11: CairoResult<BigNumberish, BigNumberish> = await myTestContract.test6(150);
    console.log("Result11 =", res11, res11.unwrap(), res11.isOk(), res11.isErr());

    // return  a Result<Order>
    const res12 = await myTestContract.test7(91) as CairoResult<Order, BigNumberish>;
    console.log("Result12 =", res12);
    const res13 = await myTestContract.call("test7", [111]) as CairoResult<Order, BigNumberish>;
    console.log("Result13 =", res13);

    // use a custom Enum as input
    const orderToSend: Order = { p1: 8, p2: 10 };
    const myCustomEnum = new CairoCustomEnum({
        Response: orderToSend
    });
    console.log("enum for 14 =", myCustomEnum.activeVariant(), myCustomEnum.unwrap());
    const res14 = await myTestContract.call("test2a", [myCustomEnum]) as bigint;
    console.log("Result14 =", res14);
    const res14a: bigint = await myTestContract.test2a(myCustomEnum);
    console.log("Result14a =", res14a);
    const custEnum1 = new CairoCustomEnum({ Warning: 100 });
    const res14b = await myTestContract.call("test2a", [custEnum1]) as bigint;
    console.log("Result14b =", res14b);
    const res14c = await myTestContract.call("test2a", [new CairoCustomEnum({ Error: cairo.tuple(100, 110) })]) as bigint;
    console.log("Result14c =", res14c);
    const res14d = await myTestContract.call("test2a", [new CairoCustomEnum({ Critical: ["0x10", "0x11"] })]) as bigint;
    console.log("Result14d =", res14d);
    const CDcompiled14d2=CallData.compile({p1: new CairoCustomEnum({ 
        Response: undefined,
        Warning: undefined,
        Error: undefined,
        Critical: ["0x10", "0x11"] 
    })});
    console.log("calldata14d2 =",CDcompiled14d2);
    const res14d2 = await myTestContract.call("test2a", CDcompiled14d2) as bigint;
    console.log("Result14d2 =", res14d2);
    const res14d3 = await myTestContract.test2a(new CairoCustomEnum({ Critical: ["0x10", "0x11"] })) as bigint;
    console.log("Result14d3 =", res14d3);
    const res14e = await myTestContract.call("test2a", [new CairoCustomEnum({ Empty: {} })]) as bigint;
    console.log("Result14e =", res14e);
    const CDcompiled14e2=CallData.compile([new CairoCustomEnum({ 
        Response: undefined,
        Warning: undefined,
        Error: undefined,
        Critical: undefined,
        Empty: {}
    })]);
    const res14e2 = await myTestContract.test2a(CDcompiled14e2) as bigint;
    console.log("Result14e2 =", res14e2);

    // use a Result Enum as input
    const res15a = await myTestContract.call("test8", [new CairoResult<Order, BigNumberish>(CairoResultVariant.Ok, { p1: 50, p2: 60 })]) as bigint;
    console.log("Result15a =", res15a);
    const comp15a2=CallData.compile([new CairoResult<Order, BigNumberish>(CairoResultVariant.Ok, { p1: 50, p2: 60 })]);
    const res15a2 = await myTestContract.call("test8", comp15a2) as bigint;
    console.log("Result15a2 =", res15a2);
    const res15b = await myTestContract.call("test8", [new CairoResult<Order, BigNumberish>(CairoResultVariant.Err, 50)]) as bigint;
    console.log("Result15b =", res15b);
    const comp15b2=CallData.compile([new CairoResult<Order, BigNumberish>(CairoResultVariant.Err, 50)]);
    const res15b2 = await myTestContract.call("test8", comp15b2) as bigint;
    console.log("Result15b2 =", res15b2);
    // return a u256
    const res16 = await myTestContract.call("test9", [1, 15, 0], { parseRequest: false, parseResponse: false });
    console.log("Result16 =", res16);




    // Do not work on Starknet.js v5.16.0. Solved by PR#685
    // test all possibilities to compile arguments.
    const functionParameters: RawArgsObject = {
        val1: 1,
        amount: cairo.uint256(15),
    }
    const myCall0: Call = myTestContract.populate("test9", functionParameters);
    if (myCall0.calldata) {
        console.log("calldata =", myCall0.calldata, "__compiled__" in myCall0.calldata);
    }
    const res17 = await myTestContract.test9(myCall0.calldata);
    console.log("Result17 =", res17);

    const res18 = await myTestContract.test9(1, 15);
    console.log("Result18 =", res18);

    const contractCallData: CallData = new CallData(compiledTest.abi);
    const myCalldata: Calldata = contractCallData.compile("test9", functionParameters);
    const res19 = await myTestContract.test9(myCalldata);
    console.log("Result19 =", res19);
    // test Enums as input via myCalldata.compile
    const myCalldata0: Calldata = contractCallData.compile("test8", {
        inp: new CairoResult<Order, BigNumberish>(CairoResultVariant.Ok, { p1: 50, p2: 60 })
    });
    const res19a = await myTestContract.test8(myCalldata0);
    console.log("Result19a =", res19a);
    const myCalldata1: Calldata = contractCallData.compile("test8", {
        inp: new CairoResult<Order, BigNumberish>(CairoResultVariant.Err, 50)
    });
    const res19b = await myTestContract.test2a(myCalldata1);
    console.log("Result19b =", res19b);

    const myCalldata2: Calldata = contractCallData.compile("test2a", {
        customEnum: new CairoCustomEnum({ Empty: {} })
    });
    const res19c = await myTestContract.test2a(myCalldata2);
    console.log("Result19c =", res19c);

    const myCalldata3: Calldata = contractCallData.compile("test2a", {
        customEnum: new CairoCustomEnum({ Critical: ["0x10", "0x11"] })
    });
    console.log("myCalldata3 =",myCalldata3, "__compiled__" in myCalldata3);
    const res19d = await myTestContract.test2a(myCalldata3);
    console.log("Result19d =", res19d);

    const contractCallData2: Calldata = CallData.compile(functionParameters);
    const res20 = await myTestContract.test9(contractCallData2);
    console.log("Result20 =", res20);

    // // should not work
    // // const res21 = await myTestContract.test9(...contractCallData2);


}



main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });