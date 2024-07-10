// SNIP-9 execute transactions from outside.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/16.ExecuteFromOutside.ts
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import { deployAccountArgentX4 } from "./12.deployArgentX4";
import { deployAccountArgentX3 } from "./13.deployArgentX3";
import { deployAccountBraavos } from "./11.deployBraavos";
import { deployAccountOpenzeppelin14 } from "./14.deployOZ14";
import { deployAccountNoERC165 } from "./15.deployNoIntrospection";
dotenv.config();

async function main() {
  const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // **** local Sepolia Testnet node
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // ****  Sepolia Testnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  //  **** Mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  // *** initialize existing predeployed account 0 of Devnet
  console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
  console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
  const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
  const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  console.log("Accounts connected.\n");
  //
  // *********** Deploy accounts *************
  //
  const accountAX4definition=await deployAccountArgentX4(myProvider,account0);
  const accountAX4=accountAX4definition.account;
  const accountAX3definition=await deployAccountArgentX3(myProvider,account0);
  const accountAX3=accountAX3definition.account;
  const accountBraavosDefinition=await deployAccountBraavos(myProvider,account0);
  const accountBraavos=accountBraavosDefinition.account;
  const accountOZDefinition=await deployAccountOpenzeppelin14(myProvider,account0);
  const accountOZ=accountOZDefinition.account;
  const accountNoERC165Definition=await deployAccountNoERC165(myProvider,account0);
  const accountNoERC165=accountNoERC165Definition.account;


  // 
  // ******************** Create outside executions
  //
  const account=new Account(myProvider, account0.address, privateKey0);
  const s9version = await account.getSnip9Version();
  console.log({ s9version });
  const calls = [
    {
      contractAddress: ethAddress,
      entrypoint: 'transfer',
      calldata: {
        recipient: account0.address,
        amount: cairo.uint256(100),
      },
    },
  ];

  //const options: OutsideExecutionOptions = {
  const options = {
    caller: "ANY_CALLER",
    nonce: await account.getNonce(), // est-ce utile?
    execute_after: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    execute_before: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const outsideExecution = new OutsideExecution(calls, options);

  const chainId = await account.getChainId();
  const data = outsideExecution.getTypedData(chainId, version);
  const signature = await account.signMessage(data);





  // const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  //   const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
  //   const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, account0);
  // const balETH = await ethContract.call("balanceOf", [accountBraavosAddress]) as bigint;
  // const balSTRK = await strkContract.call("balanceOf", [accountBraavosAddress]) as bigint;
  // console.log("OZ account has a balance of :", formatBalance(balETH, 18), "ETH");
  // console.log("OZ account has a balance of :", formatBalance(balSTRK, 18), "STRK");

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });