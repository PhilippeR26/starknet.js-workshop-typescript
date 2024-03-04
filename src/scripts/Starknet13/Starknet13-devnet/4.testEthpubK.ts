// Interact with 'core::starknet::secp256k1::Secp256k1Point' type
// used for Ethereum full public key.
// launch with npx src/scripts/Starknet13/Starknet13-devnet/4.testEthpubK.ts
// Coded with Starknet.js v6.1.2 + experimental, Starknet-devnet-rs v0.1.0


import { Account, ec, json, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants, Contract } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//        👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // ******** Devnet-rs
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");


    const privateKeyETHraw = "0x97ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"; // 3 missing leading zeros to have 32 bytes
    console.log('privateKey=', privateKeyETHraw);
    const ethSigner = new EthSigner(privateKeyETHraw);
    const pubKeyETH = await ethSigner.getPubKey();
    console.log("eth pub =", pubKeyETH);
    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -64))));
    const salt = pubKeyETHx.low;
    // process.exit(5);

    // declare/deploy ETH contract
    const ethPubKSierra = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/testEthPubKey.sierra.json").toString("ascii")
    );
    const ethPubKCasm = json.parse(
        fs.readFileSync("./compiledContracts/cairo253/testEthPubKey.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: ethPubKSierra, casm: ethPubKCasm });
    console.log('ETH pubK class hash =', decClassHash);
    if (declTH) { await provider.waitForTransaction(declTH) } else { console.log("Already declared.") };
    const resultDeploy = await account0.deployContract({ classHash: decClassHash });
    const contractAddress = resultDeploy.address;
    await provider.waitForTransaction(resultDeploy.transaction_hash);

    // test ETH public key
    const testContract = new Contract(ethPubKSierra.abi, contractAddress, account0);
    const call1 = testContract.populate("set_public_key", { new_public_key: pubKeyETH });
    console.log("Call =", call1);
    const resultSet = await account0.execute(call1);
    await provider.waitForTransaction(resultSet.transaction_hash);
    const pubKResult = await testContract.get_public_key();
    console.log("Result read =", num.toHex(pubKResult));
    console.log("Is conform to original =", BigInt(pubKeyETH) == pubKResult);
    const call2 = testContract.populate("test_public_key", { my_pub_key: pubKeyETH });
    const result = await testContract.test_public_key(call2.calldata);
    console.log("result function =",result, num.toHex(result));

    console.log('✅ Tests performed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
