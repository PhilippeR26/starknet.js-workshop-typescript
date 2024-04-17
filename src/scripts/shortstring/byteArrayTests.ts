import { BigNumberish, shortString, num, byteArray, RpcProvider, Account, json, Contract, CallData } from "starknet";

import fs from "fs";
import * as dotenv from "dotenv";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../A1priv/A1priv";
dotenv.config();


async function main() {
     const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local pathfinder testnet node
    // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
//process.exit(5);
    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // ***** Sepolia
    // const accountAddress0=account1BraavosSepoliaAddress;
    // const privateKey0=account1BraavosSepoliaPrivateKey;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo260/string.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo260/string.casm.json").toString("ascii"));
    // ****** if not deployed
    const { deploy } = await account0.declareAndDeploy({
        contract: compiledSierra,
        casm: compiledCasm,
    });
    console.log("deployed at =",deploy.contract_address);
    const address=deploy.contract_address;
    // const address="0x2bb9735fe677e726cc96d2acf81aab25cca4d8d8ab23dc3faa532556fc681ab";
    // **** if deployed in Sepolia :
    //const address = "0x660edd51a76b970cc8b843e5e0560e48afa2bb73e2530ab9a7425b17c1366b2";

    const stringContract = new Contract(compiledSierra.abi, address, account0);
    const resp0=await  stringContract.proceed_bytes31("Whao!");
    console.log("resp0 = >" + resp0 + "<");

    const resp = await stringContract.get_string();
    console.log("resp = >" + resp + "<");
    const resp2= await stringContract.call("get_string",undefined,{parseResponse:false});
    console.log("resp2 = >" + resp2 + "<");

    const resp3=await stringContract.proceed_string("Take care.");
    console.log("resp3 = >" + resp3 + "<");
    const resp4= await stringContract.call("proceed_string",["Take care sdfgsdfgsdgfdsfg."],{parseResponse:true});
    console.log("resp4 = >" + resp4 + "<");

    const resp6= await stringContract.call("proceed_string",["Take care ."],{parseResponse:true});
    console.log("resp6 = >" + resp6 + "<");

    const resp7= await stringContract.call("proceed_string",["Take care ."],{parseResponse:false});
    console.log("resp7 = >" + resp7 + "<");

    const resp8= await stringContract.call("get_string_empty",undefined,{parseResponse:false});
    console.log("resp8 = >" + resp8 + "<");

    const resp9= await stringContract.call("get_string_small",undefined,{parseResponse:false});
    console.log("resp9 = >" + resp9 + "<");

    const calldata2=CallData.compile(["Take care."]);
    console.log("calldata2 = >" + calldata2 + "<");
    const calldata3=CallData.compile(["sdfgjhsfklhjuqsdfghmqskjqhsdkbmqjdhsmqksdbdfhdsfgh"]);
    console.log("calldata3 = >" + calldata3 + "<");
    const calldata4=CallData.compile({mess:"Take care."});
    console.log("calldata4 = >" + calldata4 + "<");
    const calldata5=CallData.compile({mess:"sdfgjhsfklhjuqsdfghmqskjqhsdkbmqjdhsmqksdbdfhdsfgh"});
    console.log("calldata5 = >" + calldata5 + "<");
    const calldata7=CallData.compile({mess:byteArray.byteArrayFromString("Take care.")});
    console.log("calldata7 = >" + calldata7 + "<");

    const myCallData = new CallData(stringContract.abi);
    const calldata1=myCallData.compile("proceed_string",["Take care."]);
    console.log("calldata1 = >" + calldata1 + "<");
    const resp5= await stringContract.call("proceed_string",calldata1);
    console.log("resp5 = >" + resp5 + "<");
    const calldata6=myCallData.compile("proceed_string",{mess:"Take care."});
    console.log("calldata6 = >" + calldata6 + "<");
    const call1=stringContract.populate("proceed_string",[""]);
    console.log("call1 = >" + call1.calldata + "<");
    const call2=stringContract.populate("proceed_string",{mess:"Take care."});
    console.log("call2 = >" + call2.calldata + "<");

    console.log("✅ end of script.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


