// create a new OpenZeppelin 0.14.0 upgradable account in Sepolia Testnet
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/2.createOZaccount.ts
// Coded with Starknet.js v6.10.0


import { Account, ec, json,  hash, CallData, RpcProvider,  stark,  Contract, shortString,  type CompiledSierra, validateAndParseAddress } from "starknet";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import fs from "fs";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

async function main() {
     const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local Sepolia Testnet node
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" }); // Sepolia Testnet 
    // const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); // Mainnet

    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    console.log("Provider connected.");

    // **** initialize existing pre-deployed devnet-rs account 
    //     console.log("Account 0 connected.\n");
    // console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    // console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    // const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    // const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    // **** Sepolia
    const accountAddress0 = account1BraavosSepoliaAddress;
    const privateKey0 = account1BraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account connected.\n");

    // new Open Zeppelin account v0.14.0 (Cairo 1) :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);
    // Declare
    const compiledOZaccount = (json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_AccountUpgradeable.sierra.json").toString("ascii"))) as CompiledSierra;
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZaccount, classHash: "0x00e2eb8f5672af4e6a4e8a8f1b44989685e668489b0a25437733756c5a34a1d6", compiledClassHash: "0x1385cda212e385430236a4099ef392a1c4731c055f7180d4dda1bdb4588b6a8" });
    console.log('OZ14 account class hash =', decClassHash);
    if (declTH) { await provider.waitForTransaction(declTH) } else { console.log("Already declared.") };

    // process.exit(5);
    // Calculate future address of the account
    const myCallData = new CallData(compiledOZaccount.abi);
    const accountOzConstructorCalldata = myCallData.compile('constructor', {
        public_key: starkKeyPub,
    });
    const contractOzAddress = hash.calculateContractAddressFromHash(starkKeyPub, decClassHash, accountOzConstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractOzAddress);

    // pre-fund the account address
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
    const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, account0);
    const respTransfer = await ethContract.transfer(contractOzAddress, 2 * 10 ** 15);
    await provider.waitForTransaction(respTransfer.transaction_hash);

    // deploy account
    const ozAccount = new Account(provider, contractOzAddress, privateKey);
    
    const { transaction_hash, contract_address } = await ozAccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountOzConstructorCalldata,
        addressSalt: starkKeyPub
    });
    console.log("Real txH =", transaction_hash);
    const txR = await provider.waitForTransaction(transaction_hash);
    console.log(txR);

    console.log('✅ New OZ14 account created.\n   final address =', validateAndParseAddress(contract_address));


    const balETH = await ethContract.call("balanceOf", [ozAccount.address]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [ozAccount.address]) as bigint;
    console.log("OZ account has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("OZ account has a balance of :", formatBalance(balSTRK, 18), "STRK");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
