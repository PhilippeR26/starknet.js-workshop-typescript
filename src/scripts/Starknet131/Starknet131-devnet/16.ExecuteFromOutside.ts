// SNIP-9 execute transactions from outside.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-devnet/16.ExecuteFromOutside.ts
// Coded with Starknet.js v6.11.0 + experimental & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant, validateAndParseAddress } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
import { outsideExecution, OutsideExecutionOptions } from 'starknet';
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

async function balances(accounts: Account[], provider: RpcProvider) {
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
  const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, provider);
  const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, provider);
  console.log("devnet account0=", formatBalance(await ethContract.call("balanceOf", [accounts[0].address]) as bigint, 18));
  console.log("devnet account1=", formatBalance(await ethContract.call("balanceOf", [accounts[1].address]) as bigint, 18));
  console.log("devnet account2=", formatBalance(await ethContract.call("balanceOf", [accounts[2].address]) as bigint, 18));
  console.log("       ArgentX4=", formatBalance(await ethContract.call("balanceOf", [accounts[3].address]) as bigint, 18));
  console.log("       ArgentX3=", formatBalance(await ethContract.call("balanceOf", [accounts[4].address]) as bigint, 18));
  console.log("       Braavos1=", formatBalance(await ethContract.call("balanceOf", [accounts[5].address]) as bigint, 18));
  console.log("           OZ14=", formatBalance(await ethContract.call("balanceOf", [accounts[6].address]) as bigint, 18));
  console.log("       noErc165=", formatBalance(await ethContract.call("balanceOf", [accounts[7].address]) as bigint, 18));
}

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
  // *********** Deploy accounts if needed *************
  //

  const accountsSave = "./src/scripts/Starknet131/Starknet131-devnet/16.ExecuteFromOutside.json";
  let accountAX4: Account;
  let accountAX3: Account;
  let accountBraavos: Account;
  let accountOZ14: Account;
  let accountNoERC165: Account;
  let accountsData: any;
  let accountsDeployed: boolean;
  if (fs.existsSync(accountsSave)) {
    accountsData = json.parse(fs.readFileSync(accountsSave).toString("ascii"));
    console.log({ accountsData });
    try {
      await myProvider.getClassAt(accountsData.accountNoERC165.address); //account no ERC165
      accountsDeployed = true;
    } catch { accountsDeployed = false }
  } else { accountsDeployed = false }
  if (accountsDeployed) {
    accountAX4 = new Account(myProvider, accountsData.accountAX4.address, accountsData.accountAX4.privateK);
    accountAX3 = new Account(myProvider, accountsData.accountAX3.address, accountsData.accountAX3.privateK);
    accountBraavos = new Account(myProvider, accountsData.accountBraavos.address, accountsData.accountBraavos.privateK);
    accountOZ14 = new Account(myProvider, accountsData.accountOZ14.address, accountsData.accountOZ14.privateK);
    accountNoERC165 = new Account(myProvider, accountsData.accountNoERC165.address, accountsData.accountNoERC165.privateK);
  } else {
    const accountAX4definition = await deployAccountArgentX4(myProvider, account0);
    accountAX4 = accountAX4definition.account;
    const accountAX3definition = await deployAccountArgentX3(myProvider, account0);
    accountAX3 = accountAX3definition.account;
    const accountBraavosDefinition = await deployAccountBraavos(myProvider, account0);
    accountBraavos = accountBraavosDefinition.account;
    const accountOZDefinition = await deployAccountOpenzeppelin14(myProvider, account0);
    accountOZ14 = accountOZDefinition.account;
    const accountNoERC165Definition = await deployAccountNoERC165(myProvider, account0);
    accountNoERC165 = accountNoERC165Definition.account;
    accountsData = {
      accountAX4: {
        address: accountAX4definition.address,
        privateK: accountAX4definition.privateK,
      },
      accountAX3: {
        address: accountAX3definition.address,
        privateK: accountAX3definition.privateK,
      },
      accountBraavos: {
        address: accountBraavosDefinition.address,
        privateK: accountBraavosDefinition.privateK,
      },
      accountOZ14: {
        address: accountOZDefinition.address,
        privateK: accountOZDefinition.privateK,
      },
      accountNoERC165: {
        address: accountNoERC165Definition.address,
        privateK: accountNoERC165Definition.privateK,
      },
    }
    fs.writeFileSync(accountsSave, json.stringify(accountsData, undefined, 2));
  }
  console.log({ accountsData });
  const accounts: Account[] = [account0, account1, account2, accountAX4, accountAX3, accountBraavos, accountOZ14, accountNoERC165];


  // 
  // ******************** Create outside executions
  //
  console.log("account0 version =", await account0.getSnip9Version());
  console.log("account1 version =", await account1.getSnip9Version());
  console.log("account2 version =", await account2.getSnip9Version());
  console.log("ArgentX4 version =", await accountAX4.getSnip9Version());
  console.log("ArgentX3 version =", await accountAX3.getSnip9Version());
  console.log("Braavos1 version =", await accountBraavos.getSnip9Version());
  console.log("    OZ14 version =", await accountOZ14.getSnip9Version());
  // console.log("noERC165 version =",await accountNoERC165.getSnip9Version()); // fails!!!
  console.log("noERC165 version = crash"); // fails!!!

  const s9version = await accountAX3.getSnip9Version();
  const calls = [
    {
      contractAddress: ethAddress,
      entrypoint: 'transfer',
      calldata: {
        recipient: account1.address,
        amount: cairo.uint256(10n ** 15n),
      },
    },
  ];

  const options: OutsideExecutionOptions = {
    // const options = {
    // caller: "ANY_CALLER",
    caller: outsideExecution.OutsideExecutionCallerAny,

    nonce: await accountAX3.getSnip9Nonce(accountAX3),
    execute_after: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    execute_before: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const myOutsideExecution = new outsideExecution.OutsideExecution(calls, options);

  const chainId = await accountAX3.getChainId();
  const data = myOutsideExecution.getTypedData(chainId, s9version);
  console.log("data=", data, "\ndata Calls =", data.message.Calls);
  const signature = await accountAX3.signMessage(data);

  await balances(accounts, myProvider);

  const res = await account0.executeFromOutside(
    myOutsideExecution,
    signature,
    accountAX3.address,
    {},
    s9version
  );
  console.log("Account0 outsideExecution on behalf of ArgentX3 (v1).");
  await myProvider.waitForTransaction(res.transaction_hash);
  await balances(accounts, myProvider);

  const freeOutNonceAX3 = await accountAX3.isValidSnip9Nonce(options.nonce);
  console.log({ freeOutNonceAX3 })


  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });