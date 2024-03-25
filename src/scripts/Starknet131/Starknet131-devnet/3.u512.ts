// test u512 Cairo type.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/3.u512.ts
// Coded with Starknet.js v6.4.3, Starknet-devnet-rs v0.3.0

import { Account, cairo, CairoUint256, CallData, Contract, json, num, RpcProvider, type BigNumberish, type Uint512 } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { CairoUint512 } from "starknet";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // Declare & deploy Test contract in devnet
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/u512.sierra.json").toString("ascii"));
    const testCasm = json.parse(fs.readFileSync("./compiledContracts/cairo260/u512.casm.json").toString("ascii"));

    const deployResponse = await account0.declareAndDeploy({
        contract: testSierra,
        casm: testCasm,
    });
    // Connect the new contract instance :
    const myTestContract = new Contract(testSierra.abi, deployResponse.deploy.contract_address, provider);
    console.log('Test Contract connected at =', myTestContract.address);
    const my_u512 = "0x33333333333333333333333333333333222222222222222222222222222222221111111111111111111111111111111100000000000000000000000000000000";
    // https://github.com/starkware-libs/cairo/blob/07484c52791b76abcc18fd86265756904557d0d2/corelib/src/test/integer_test.cairo#L767

    const u512_1: Uint512=cairo.uint512(my_u512);
    console.log("u512_1 =",u512_1);
    const myCalldata1=CallData.compile([u512_1]);
    console.log("CallData.compile =",myCalldata1);
    const myCallData=new CallData(myTestContract.abi);
    const serializedU512 = new CairoUint512({
        limb0: "0x00000000000000000000000000000000",
        limb1: "0x11111111111111111111111111111111",
        limb2: "0x22222222222222222222222222222222",
        limb3: "0x33333333333333333333333333333333",
    });
    const myCalldata=myCallData.compile("div_u512",{
        my_u512: serializedU512,
        divisor: new CairoUint256("0x55544444433233223222222122112111111011001")
    });
    console.log("myCallData.compile =",myCalldata);
    const myCall=myTestContract.populate("return_u512",{my_u512: serializedU512});
    console.log("myContract.populate =",myCall);

    const resp0 = await myTestContract.call("get_u512") as bigint;
    console.log("get_u512 =", num.toHex(resp0));
    const resp1 = await myTestContract.call("return_u512", [serializedU512]) as bigint;
    console.log("return_u512 =", num.toHex(resp1));
    const largeNum: Uint512 = {
        limb0: "0x33233223222222122112111111011001",
        limb1: "0x54455445544554454444443443343333",
        limb2: "0x21222222322332333333433443444444",
        limb3: "0x1001101111112112"
    };
    const divisor = cairo.uint256("0x55544444433233223222222122112111111011001");
    type ResDiv={
        0: bigint,
        1: bigint
    }
    const resp2 = await myTestContract.call("div_u512", [largeNum, divisor]) as ResDiv;
    const quotient=resp2[0];
    const remain=resp2[1];
    console.log("div_u512 =", resp2,"\n",num.toHex(quotient),"\n",num.toHex(remain));


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
