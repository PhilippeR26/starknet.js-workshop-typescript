// Test compile of Calldata with Cairo 0.
// use Starknet.js v5.10.0
// launch with npx ts-node src/scripts/devnet/11.testCompileObject.ts

import { CallData, Provider, Contract, Account, json, uint256, num, Calldata, cairo, RawArgsObject, RawCalldata, RawArgsArray } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆
async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
    console.log('✅ Connected to devnet.');

    // initialize existing predeployed account 0 of Devnet
    const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


    // contract for struct test
    const compiledContractCairo0 = json.parse(fs.readFileSync("./compiledContracts/ERC20-echo.json").toString("ascii"));

    // // test calldata.compile

    const contractCallData: CallData = new CallData(compiledContractCairo0.abi);
    const contractConstructor: RawArgsObject = {
        name: 'Token',
        symbol: 'ERC20',
        decimals: '18',
        initial_supply: { high: 0, low: 5000 },
        recipient: accountAddress,
        signers: ['0x823d5a0c0eefdc9a6a1cb0e064079a6284f3b26566b677a32c71bbe7bf9f8c'],
        threshold: 1,
    }
    const myCalldata: Calldata = contractCallData.compile("constructor", contractConstructor);
    console.log("constructor =", myCalldata);

    const request = {
        t1: 'demo text1',
        n1: 123,
        k1: [{ a: 1, b: { b: 2, c: cairo.tuple(3, 4, 5, 6) } }], // not ordered
        tl2: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        k2: {
            // named tuple
            t1: 1,
            t2: {
                x2: { y1: 3, y2: 4 }, // not ordered
                x1: 2,
                x3: { tx1: cairo.tuple(5, 6), tx2: { tx21: { tx211: 7, tx212: 8 }, tx22: cairo.tuple(9, 10) } },
            },
            t3: 11,
        },
        u1: { high: 0, low: 5000 }, //not ordered
        s1: {
            discount_fix_bps: 1,
            discount_transfer_bps: 2,
        },
        s2: {
            info: {
                discount_fix_bps: 1,
                discount_transfer_bps: 2,
            },
            data: 200,
            data2: { min: 1, max: 2 },
        },
        af1: [1, 2, 3, 4, 5, 6],
        au1: [cairo.uint256(1000), cairo.uint256(2000), cairo.uint256(3000), cairo.uint256(4000)],
        as1: [
            { discount_fix_bps: 10, discount_transfer_bps: 11 },
            { discount_fix_bps: 20, discount_transfer_bps: 22 },
        ],
        atmk: [
            { p1: { p1: { y1: 1, y2: 2 }, p2: 3 }, p2: 4 },
            { p1: { p1: { y1: 1, y2: 2 }, p2: 3 }, p2: 4 },
        ],
        atmku: [
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
        ],
    };
    const myCalldata2: Calldata = contractCallData.compile("echo", request);
    console.log("request =", myCalldata2);



}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });