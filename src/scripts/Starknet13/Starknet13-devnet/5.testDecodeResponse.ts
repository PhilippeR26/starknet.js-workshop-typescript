// tests for myCalldata.decodeResponse()
// launch with npx src/scripts/Starknet13/Starknet13-devnet/5.testDecodeResponse.ts
// Coded with Starknet.js v6.1.5, Starknet-devnet-rs v0.2.0


import { Account, ec, json, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants, Contract, shortString, type BigNumberish, type CairoResult } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆

function posClosure(input: string, open: string, close: string): number {
  let posEnd: number = 0;
  let i = 0;
  while (i < input.length) {
    if (input[i] === open) {
      let counter = 1;
      i++;
      while (counter) {
        if (input[i] === close) counter--;
        if (input[i] === open) counter++;
        i++;
      }
      posEnd = i
      break;
    }
    i++;
  }
  return posEnd;
}

async function main() {
  const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
  console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
  console.log("Provider connected to Starknet-devnet-rs");

  const abi = "(core::result::Result::<core::integer::u64, core::integer::u8>, core::integer::u16,core::result::Result::<core::integer::u64, core::integer::u256>)";
  const split = abi.slice(1, -1).split(",");
  console.log("split=", split);
  let corrected: string[] = [];
  let idx: number = 0;
  while (idx < split.length) {
    if (split[idx].slice(0, 23) === 'core::result::Result::<') {
      corrected.push(split[idx] + ',' + split[idx + 1]);
      idx = idx + 2;
    } else {
      corrected.push(split[idx]);
      idx++;
    }
  }
  console.log("corrected=", corrected);

  const type = "(core::integer::u256,(core::integer::u16,core::result::Result::<core::integer::u64, core::integer::u8>)),core::integer::u8";
  const respPos = posClosure(type, "(", ")");
  console.log({ respPos }, type.slice(0, respPos));
  const type2 = "core::result::Result::<core::integer::u64, core::integer::u8>";
  const respPos2 = posClosure(type2, "<", ">");
  console.log({ respPos2 }, type2.slice(0, respPos2));




  //process.exit(5);

  // ******** Devnet-rs
  console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
  const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
  const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
  const account0 = new Account(provider, accountAddress0, privateKey0);
  console.log("Account 0 connected.\n");

  // test
  const newTypesSierra = json.parse(
    fs.readFileSync("./compiledContracts/cairo210/hello_res_events_newTypes.sierra.json").toString("ascii")
  );
  const newTypesCasm = json.parse(
    fs.readFileSync("./compiledContracts/cairo210/hello_res_events_newTypes.casm.json").toString("ascii")
  );
  const resDecl0 = await account0.declareAndDeploy({ contract: newTypesSierra, casm: newTypesCasm });
  const newTypeContract = new Contract(newTypesSierra.abi, resDecl0.deploy.address, provider);
  const c1v2CallData = new CallData(newTypesSierra.abi);
  const res15 = c1v2CallData.decodeParameters(
    'core::result::Result::<hello_res_events_newTypes::hello_res_events_newTypes::Order, core::integer::u16>',
    ['0', '0x12', '0x345']
  );
  console.log("res15=", res15);
  type Order = {
    p1: BigNumberish;
    p2: BigNumberish;
  };
  const myCairoResult: CairoResult<Order, BigNumberish> = await newTypeContract.enum_result_output(50);
  console.log({ myCairoResult });
  const rest = myCairoResult.unwrap();
  console.log({ rest });
  const arrRes = await newTypeContract.array_new_types(
    cairo.tuple(256, 1234567889, 3455),
    cairo.tuple(
      [1234567890, 3456], // ContractAddress
      [1234567891, 3457], // EthAddress
      [1234567892, 3458] // ClassHash
    ),
  );
  console.log({ arrRes });


  //process.exit(5);

  // deploy test contract
  const testSierra = json.parse(
    fs.readFileSync("./compiledContracts/cairo253/tupleResponse.sierra.json").toString("ascii")
  );
  const testCasm = json.parse(
    fs.readFileSync("./compiledContracts/cairo253/tupleResponse.casm.json").toString("ascii")
  );
  const respDec = await account0.declareAndDeploy({ contract: testSierra, casm: testCasm });
  const addr = respDec.deploy.address;
  const tupleContract = new Contract(testSierra.abi, addr, provider);
  const myCallData = new CallData(testSierra.abi);

  const res0 = await tupleContract.call("simple", [], { parseResponse: false }) as string[];
  console.log("res0 =", res0, "\n-> u8");
  const decode0 = myCallData.parse("simple", res0);
  console.log("Decoded 0 =", decode0);

  const res1 = await tupleContract.call("get_tuple1", [], { parseResponse: false }) as string[];
  console.log("res1 =", res1, "\n-> (u8, Array<u16>, bool)");
  const decode1 = myCallData.parse("get_tuple1", res1);
  console.log("Decoded 1 =", decode1);

  const res2 = await tupleContract.call("get_tuple2", [], { parseResponse: false }) as string[];
  console.log("\nres2 =", res2, "\n-> (bytes31, ByteArray)");
  const decode2 = myCallData.parse("get_tuple2", res2);
  console.log("Decoded 2 =", decode2);

  const res3 = await tupleContract.call("get_tuple3", [], { parseResponse: false }) as string[];
  console.log("\nres3 =", res3, "\n-> (u256, Order2)");
  const decode3 = myCallData.parse("get_tuple3", res3);
  console.log("Decoded 3 =", decode3);

  const res4 = await tupleContract.call("get_tuple4", [], { parseResponse: false }) as string[];
  console.log("\nres4 =", res4, "\n-> (EthAddress, u256)");
  const decode4 = myCallData.parse("get_tuple4", res4);
  console.log("Decoded 4 =", decode4);

  const res5 = await tupleContract.call("get_tuple5", [], { parseResponse: false }) as string[];
  console.log("\nres5 =", res5, "\n-> (Result<u64, u8>, u8)");
  const decode5 = myCallData.parse("get_tuple5", res5);
  console.log("Decoded 5 =", decode5);

  const res6 = await tupleContract.call("get_tuple6", [], { parseResponse: false }) as string[];
  console.log("\nres6 =", res6, "\n-> (Option<u64>, u8)");
  const decode6 = myCallData.parse("get_tuple6", res6);
  console.log("Decoded 6 =", decode6);

  const res7 = await tupleContract.call("get_tuple7", [], { parseResponse: false }) as string[];
  console.log("\nres7 =", res7, "\n-> (Direction.North, u8)");
  const decode7 = myCallData.parse("get_tuple7", res7);
  console.log("Decoded 7 =", decode7);

  const res8 = await tupleContract.call("get_tuple8", [], { parseResponse: false }) as string[];
  console.log("\nres8 =", res8, "\n-> ((u256, Array<u16>), u8)");
  const decode8 = myCallData.parse("get_tuple8", res8);
  console.log("Decoded 8 =", decode8);

  type Order2 = {
    p1: num.BigNumberish,
    p2: num.BigNumberish[]
}
  const myOrder2:Order2={p1:100,p2:[5,6,7]};
  const calldata9= myCallData.compile("get_tuple9",{
    l0: cairo.tuple(cairo.tuple(cairo.uint256(5000n),cairo.tuple(250,myOrder2)),240),
  });
  // ((core::integer::u256, (core::integer::u16, tupleResponse::tupleResponse::Order2)), core::integer::u8)
  const res9 = await tupleContract.call("get_tuple9", calldata9, { parseResponse: false }) as string[];
  console.log("\nres9 =", res9, "\n-> ((u256,(u16,Order2)), u8)");
  const decode9 = myCallData.parse("get_tuple9", res9) as any;
  console.log("Decoded 9 =", decode9);
  console.log("Decoded 9 .0.1 =", decode9["0"]["1"]);
  const res9a = await tupleContract.call("get_tuple9", calldata9) as string[];
  console.log("res 9a =", res9a);

  const res10= await tupleContract.call("get_tuple10", [], { parseResponse: false }) as string[];
  console.log("\nres10 =", res10, "\n-> Array<Result<u256, u8>>");
  const decode10 = myCallData.parse("get_tuple10", res10);
  console.log("Decoded 10 =", decode10);

  const res11= await tupleContract.call("get_tuple11", [], { parseResponse: false }) as string[];
  console.log("\nres11 =", res11, "\n-> Option<Result<u16, felt252>>");
  const decode11 = myCallData.parse("get_tuple11", res11);
  console.log("Decoded 11 =", decode11);

  const res12= await tupleContract.call("get_tuple12", [], { parseResponse: false }) as string[];
  console.log("\nres12 =", res12, "\n-> (Direction.East, u8)");
  const decode12 = myCallData.parse("get_tuple12", res12) as any;
  console.log("Decoded 12 =", decode12);
  console.log("Decoded 12 =", decode12["0"]);

  

  console.log('✅ Tests performed.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
