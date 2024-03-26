// create a new ETH account in Goerli Testnet
// launch with npx ts-node src/scripts/Starknet13/Starknet13-goerli/4.createNewETHaccount.ts
// Coded with Starknet.js v6.0.0


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants, Contract, shortString } from "starknet";
import { secp256k1 } from '@noble/curves/secp256k1';
import { account1TestnetAddress, account1TestnetPrivateKey, account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
dotenv.config();

async function main() {
    const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/goerli-juno/v0_6" });
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
    console.log("Provider connected.");

    const accountAddress0 = account1TestnetAddress;
    const privateKey0 = account1TestnetPrivateKey;
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    const privateKeyETH = eth.ethRandomPrivateKey();
    //const privateKeyETH = "0x45397ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9";
    console.log('New account :\nprivateKey=', privateKeyETH);
    const ethSigner = new EthSigner(privateKeyETH);
    const ethFullPublicKey = await ethSigner.getPubKey();
    console.log("eth pub =", ethFullPublicKey);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethFullPublicKey.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethFullPublicKey.slice(4, -64))));
    const salt = pubKeyETHx.low;
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log("salt    =", num.toHex(salt));
    // process.exit(5);

    //declare ETH account contract
    const compiledEthAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.sierra.json").toString("ascii")
    );
    const casmEthAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledEthAccount, casm: casmEthAccount });
    console.log('ETH account class hash =', decClassHash);
    // class Hash = 0x23e416842ca96b1f7067693892ed00881d97a4b0d9a4c793b75cb887944d98d
    if (declTH) { await provider.waitForTransaction(declTH) } else { console.log("Already declared.") };

    // process.exit(5);
    // Calculate future address of the account
    const myCallData = new CallData(compiledEthAccount.abi);
      const accountETHconstructorCalldata = myCallData.compile('constructor', {
        public_key: ethFullPublicKey,
      });
    const contractETHaddress = hash.calculateContractAddressFromHash(salt, decClassHash, accountETHconstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractETHaddress);

    // pre-fund the account address
    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract(compiledERC20Contract.abi, ethAddress, account0);
    const strkContract = new Contract(compiledERC20Contract.abi, strkAddress, account0);
    const respTransfer = await strkContract.transfer(contractETHaddress, 1 * 10 ** 15);
    await provider.waitForTransaction(respTransfer.transaction_hash);

    // deploy account
    const ETHaccount = new Account(provider, contractETHaddress, ethSigner, undefined, constants.TRANSACTION_VERSION.V3);
    const feeEstimation = await ETHaccount.estimateAccountDeployFee({ classHash: decClassHash, addressSalt: salt, constructorCalldata: accountETHconstructorCalldata });
    console.log("Fee estim =", feeEstimation);

    // ********* transaction V3
    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCalldata,
        addressSalt: salt
    }, {
        skipValidate: true,
        resourceBounds: {
            l2_gas: { max_amount: '0x0', max_price_per_unit: '0x0' },
            l1_gas: { max_amount: num.toHex(BigInt(feeEstimation.resourceBounds.l1_gas.max_amount) * 3n), max_price_per_unit: num.toHex(BigInt(feeEstimation.resourceBounds.l1_gas.max_price_per_unit) * 3n) }
        }
    }
    );

    console.log("Real txH =", transaction_hash);
    const txR = await provider.waitForTransaction(transaction_hash);
    console.log({ txR });
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);


    const balETH = await ethContract.call("balanceOf", [ETHaccount.address]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [ETHaccount.address]) as bigint;
    console.log("ETH account has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("ETH account has a balance of :", formatBalance(balSTRK, 18), "STRK");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
