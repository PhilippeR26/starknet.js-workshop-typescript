// Create a new OZ ETHEREUM account in Devnet
// Launch with npx ts-node src/scripts/15.createNewETHaccount.ts
// Coded with Starknet.js v8.5.0 & Devnet 0.5.0


import { Account, json, hash, CallData, RpcProvider, EthSigner, num, stark, addAddressPadding, encode, cairo, constants, Contract, shortString, config, CairoBytes31 } from "starknet";
import { ethAddress, strkAddress } from "./utils/constants";
import { formatBalance } from "./utils/formatBalance";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";


async function main() {
    // launch Devnet with a new console window
    const outputStream = fs.createWriteStream("./src/scripts/devnet-out.txt");
    await events.once(outputStream, "open");
    // the following line is working in Linux. To adapt or remove for other OS
    cp.spawn("gnome-terminal", ["--", "bash", "-c", "pwd; tail -f ./src/scripts/devnet-out.txt; read"]);
    const devnet = await Devnet.spawnVersion(DEVNET_VERSION, {
        stdout: outputStream,
        stderr: outputStream,
        keepAlive: false,
        args: ["--seed", "0", "--port", DEVNET_PORT]
    });
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url });
    config.set("logLevel", "FATAL");
    console.log("Devnet : url =", devnet.provider.url);
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-Devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account({
        provider: myProvider,
        address: devnetAccounts[0].address,
        signer: devnetAccounts[0].private_key
    });
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // new Open Zeppelin ETHEREUM account v0.9.0 (Cairo 1) :

    //const privateKeyETH = eth.ethRandomPrivateKey();
    const privateKeyETH = encode.sanitizeHex(num.toHex("0x45397ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"));
    console.log('New account :\neth privateKey=', privateKeyETH);
    const ethSigner = new EthSigner(privateKeyETH);
    const ethFullPublicKey = await ethSigner.getPubKey();
    console.log("eth pub key =", ethFullPublicKey);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethFullPublicKey.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(ethFullPublicKey.slice(4, -64))));
    const salt = pubKeyETHx.low;
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log("salt    =", num.toHex(salt));

    //declare ETH account contract
    const compiledEthAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.sierra.json").toString("ascii")
    );
    const casmETHaccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/openzeppelin_EthAccountUpgradeable090.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledEthAccount, casm: casmETHaccount });
    console.log('ETH account class hash =', decClassHash);
    if (declTH) { await myProvider.waitForTransaction(declTH) } else { console.log("Already declared.") };
    console.log("✅ Declare of class made.");

    // Calculate future address of the account
    const myCallData = new CallData(compiledEthAccount.abi);
    const accountETHconstructorCalldata = myCallData.compile('constructor', {
        public_key: ethFullPublicKey,
    });
    const contractETHaddress = hash.calculateContractAddressFromHash(salt, decClassHash, accountETHconstructorCalldata, 0);
    console.log('Pre-calculated account address=', contractETHaddress);

    // ******** Devnet- fund account address before account creation
    await devnet.provider.mint(contractETHaddress, 10n * 10n ** 18n, "WEI"); // 10 ETH
    await devnet.provider.mint(contractETHaddress, 100n * 10n ** 18n, "FRI"); // 100 STRK


    // deploy account
    const ETHaccount = new Account({ provider: myProvider, address: contractETHaddress, signer: ethSigner });
    const feeEstimation = await ETHaccount.estimateAccountDeployFee({ classHash: decClassHash, addressSalt: salt, constructorCalldata: accountETHconstructorCalldata }, { skipValidate: false });
    console.log("Fee estimation =", feeEstimation);

    const { transaction_hash, contract_address } = await ETHaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: accountETHconstructorCalldata,
        addressSalt: salt
    }, {
        resourceBounds: feeEstimation.resourceBounds
    }
    );
    console.log("Real txH =", transaction_hash);
    const txR = await myProvider.waitForTransaction(transaction_hash);
    console.log({ txR });
    console.log('✅ New Ethereum account created.\n   final address =', contract_address);

    const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo241/erc20basicOZ081.sierra.json").toString("ascii"));
    const ethContract = new Contract({ abi: compiledERC20Contract.abi, address: ethAddress, providerOrAccount: account0 });
    const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
    const balETH = await ethContract.call("balanceOf", [ETHaccount.address]) as bigint;
    const balSTRK = await strkContract.call("balanceOf", [ETHaccount.address]) as bigint;
    console.log("ETH account has a balance of :", formatBalance(balETH, 18), "ETH");
    console.log("ETH account has a balance of :", formatBalance(balSTRK, 18), "STRK");

    console.log('✅ Test performed.');

    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
