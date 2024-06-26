// Deploy a new arcade account contract
// launch with : npx ts-node 
// Coded with Starknet.js v5.19.5

import { Provider, RpcProvider, SequencerProvider, constants, Account, ec, json, stark, hash, CallData, Contract, cairo } from "starknet";
import { infuraKey } from "../../../A-MainPriv/mainPriv";
import { account7TestnetPrivateKey, junoNMtestnet, account5TestnetAddress, account5TestnetPrivateKey } from "../../../A1priv/A1priv";
import { addrETH } from "../../../A2priv/A2priv";

import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { resetDevnetNow } from "../../utils/resetDevnetFunc";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {

    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    //const provider = new RpcProvider({ nodeUrl: junoNMtestnet });
    //const provider = new SequencerProvider({ network: constants.NetworkName.SN_GOERLI });
    resetDevnetNow();
    // initialize existing predeployed account 0 of Devnet
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Predeployed account 0 connected.\n");

    const accountSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/arcade_account.sierra.json").toString("ascii"));
    const accountCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/arcade_account.casm.json").toString("ascii"));
    const ch = hash.computeContractClassHash(accountSierra);
    console.log("Class Hash of contract =", ch);

    // Calculate future address of the  account
    const privateKey = "0x1234567890abcdef987654321";
    console.log('account Private Key =', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('account Public Key  =', starkKeyPub);

    // declare
    const respDecl = await account0.declare({ contract: accountSierra, casm: accountCasm });
    //const contractClassHash = "0x00bf5a9e6533e70a811a622eaa402724d290898c59fe7627f523893f2b2a0644";
    const contractClassHash = respDecl.class_hash;
    await provider.waitForTransaction(respDecl.transaction_hash);
    console.log("ArgentX Cairo 1 contract declared")

    const calldata = new CallData(accountSierra.abi);
    const constructorCallData = calldata.compile("constructor", {
        _public_key: starkKeyPub,
        _master_account: account0.address,
    });
    console.log("constructor =", constructorCallData);
    const accountAddress = hash.calculateContractAddressFromHash(starkKeyPub, contractClassHash, constructorCallData, 0);
    console.log('Precalculated account address=', accountAddress);

    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": accountAddress, "amount": 10_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer); // 10 ETH
    // const ethSierra = json.parse(fs.readFileSync("./compiledContracts/cairo060/erc20ETH.json").toString("ascii"));
    // const ethContract=new Contract(ethSierra.abi,addrETH,provider);
    // const call1=ethContract.populate("transfer",{
    //     recipient: accountAddress,
    //     amount: cairo.uint256(5*10**15)
    // })
    // console.log("call1 =",call1);
    // //process.exit(2);
    // const res=await account0.execute(call1);
    // await provider.waitForTransaction(res.transaction_hash);
    // console.log('mint =', .005); 


    // deploy account
    const account = new Account(provider, accountAddress, privateKey); 
    const deployAccountPayload = {
        classHash: contractClassHash,
        constructorCalldata: constructorCallData,
        contractAddress: accountAddress,
        addressSalt: starkKeyPub
    };
    const { transaction_hash: th, contract_address: accountAXFinalAdress } = await account.deployAccount(deployAccountPayload);
    console.log("Final address =", accountAXFinalAdress);
    await provider.waitForTransaction(th);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });