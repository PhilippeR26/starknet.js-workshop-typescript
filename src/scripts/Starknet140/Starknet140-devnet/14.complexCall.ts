// Test Cairo Option with snjs v8
// launch with npx ts-node src/scripts/Starknet140/Starknet140-devnet/14.complexCall.ts
// Coded with Starknet.js v8.5.0 + experimental & starknet-devnet.js v0.5.0

import { CairoCustomEnum, constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, stark, type FeeEstimate, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, type Call, BlockTag, CairoFixedArray, hdParsingStrategy, CairoOption, CairoUint8, CairoOptionVariant, CairoTuple, CairoArray, CairoTypeOption, BigNumberish, CairoResult, CairoResultVariant, type AbiEnum, CairoTypeCustomEnum, type CompiledSierra, type CairoAssembly, CairoNonZero, type RawArgsArray, type RawArgsObject, type Calldata } from "starknet";
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

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2114/echo_Echo.contract_class.json").toString("ascii")) as CompiledSierra;
    // const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2114/echo_Echo.compiled_contract_class.json").toString("ascii")) as CairoAssembly;
    // console.log("Deploy of contract in progress...");
    // const deployResponse = await account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm }, { tip: 2000000 });
    // const contractAddress = deployResponse.deploy.address;
    //  console.log("Contract deployed at =", contractAddress);
     const contractAddress = "0x378acecb501a5be64a83c5dff8ea66517cf07ae6434c493359aa7269845bdf9";

    const myTestCallData = new CallData(compiledSierra.abi, hdParsingStrategy);
    const myTestContract = new Contract({
        abi: compiledSierra.abi,
        address: contractAddress,
        providerOrAccount: account0
    });
    const strategies = myTestContract.callData.parser.parsingStrategies;
    // const abiMethods = myTestContract.abi.filter((abiFunction) => abiFunction. )

    const request = {
        t1: 'demo text1',
        n1: 123,
        tl2: shortString.splitLongString(
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
        ),
        k1: [{ a: 1, b: { b: 2, c: cairo.tuple(3, 4, 5, 6) } }],
        k2: cairo.tuple(
            1,
            {
                x1: 2,
                x2: { y1: 3, y2: 4 },
                x3: cairo.tuple(cairo.tuple(5, 6), cairo.tuple(cairo.tuple(7, 8), cairo.tuple(9, 10))),
            },
            11
        ),

        u1: cairo.uint256('5000'),
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
            data2: cairo.tuple(1, 2),
        },
        af1: [1, 2, 3, 4, 5, 6],
        au1: [cairo.uint256(1000), cairo.uint256(2000), cairo.uint256(3000), cairo.uint256(4000)],
        as1: [
            { discount_fix_bps: 10, discount_transfer_bps: 11 },
            { discount_fix_bps: 20, discount_transfer_bps: 22 },
        ],
        atmk: [
            cairo.tuple(
                cairo.tuple(
                    {
                        x1: 1,
                        x2: { y1: 1, y2: 2 },
                        x3: cairo.tuple(
                            cairo.tuple(10, 11),
                            cairo.tuple(cairo.tuple(100, 101), cairo.tuple(1000, 1001))
                        ),
                    },
                    3
                ),
                4
            ),
            cairo.tuple(
                cairo.tuple(
                    {
                        x1: 1,
                        x2: { y1: 1, y2: 2 },
                        x3: cairo.tuple(
                            cairo.tuple(10, 11),
                            cairo.tuple(cairo.tuple(100, 101), cairo.tuple(1000, 1001))
                        ),
                    },
                    3
                ),
                4
            ),
        ],
        atmku: [
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
            cairo.tuple(cairo.tuple({ y1: 1, y2: 2 }, 3), 4),
        ],
    };
    const args = Object.values(request);
    const calldata = CallData.compile(request);
    const res= myTestContract.populate("echo", request);
    console.log("res =",res);
    const result0 = await myTestContract
        .withOptions({
            parseRequest: true,
            parseResponse: true,
        })
        .echo(calldata);
    console.log("result0",result0);

    const result1 = await myTestContract
        .withOptions({
        })
        .echo(...args);

    const res0 = CallData.compile([new CairoNonZero(3, "core::zeroable::NonZero::<core::integer::u8>", hdParsingStrategy)]);
    console.log({res0});

    // ************
    const arr0 = new CairoArray(
        'Bug is back, for ever, here and everywhere',
        'core::array::Array::<core::felt252>',
        hdParsingStrategy
      );


    // other
    const myFalseUint256 = { high: 1, low: 23456 }; // wrong order
      type Order2 = {
        p1: BigNumberish;
        p2: BigNumberish[];
      };

      const myOrder2bis: Order2 = {
        // wrong order
        p2: [234, 467456745457n, '0x56ec'],
        p1: '17',
      };
      const myRawArgsObject: RawArgsObject = {
        // wrong order
        active: true,
        symbol: 'NIT',
        initial_supply: myFalseUint256,
        recipient: '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
        decimals: 18,
        tupoftup: cairo.tuple(cairo.tuple(34, '0x5e'), myFalseUint256),
        card: myOrder2bis,
        longText: 'Bug is back, for ever, here and everywhere',
        array1: [100, 101, 102],
        array2: [
          [200, 201],
          [202, 203],
          [204, 205],
        ],
        array3: [myOrder2bis, myOrder2bis],
        array4: [myFalseUint256, myFalseUint256],
        tuple1: cairo.tuple(40000n, myOrder2bis, [54, 55n, '0xae'], 'texte'),
        name: 'niceToken',
        array5: [cairo.tuple(251, 40000n), cairo.tuple(252, 40001n)],
      };
      const myRawArgsArray: RawArgsArray = [
        'niceToken',
        'NIT',
        18,
        { low: 23456, high: 1 },
        { p1: '17', p2: [234, 467456745457n, '0x56ec'] },
        '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
        true,
        { '0': { '0': 34, '1': '0x5e' }, '1': { low: 23456, high: 1 } },
        'Bug is back, for ever, here and everywhere',
        [100, 101, 102],
        [
          [200, 201],
          [202, 203],
          [204, 205],
        ],
        [
          { p1: '17', p2: [234, 467456745457n, '0x56ec'] },
          { p1: '17', p2: [234, 467456745457n, '0x56ec'] },
        ],
        [
          { low: 23456, high: 1 },
          { low: 23456, high: 1 },
        ],
        {
          '0': 40000n,
          '1': { p1: '17', p2: [234, 467456745457n, '0x56ec'] },
          '2': [54, 55n, '0xae'],
          '3': 'texte',
        },
        [
          { '0': 251, '1': 40000n },
          { '0': 252, '1': 40001n },
        ],
      ];
       const contractSierra = json.parse(
                  fs.readFileSync("./compiledContracts/cairo200/complexInput2.json").toString("ascii")
              ) as CompiledSierra;
      const contractCallData: CallData = new CallData(contractSierra.abi);
      const callDataFromArray: Calldata = contractCallData.compile('constructor', myRawArgsArray);
      const callDataFromObject: Calldata = contractCallData.compile('constructor', myRawArgsObject);



    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });