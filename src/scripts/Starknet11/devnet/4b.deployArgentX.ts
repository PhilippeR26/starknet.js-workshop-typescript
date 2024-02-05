// Deploy an instance of a ArgentX account
// You have first created the account in Braavos DAPP (and not yet 'Setup your account on-chain' by click on 'setup now'), and recover private and public addresses and account address
// launch with npx ts-node src/scriptsTestnet2/4.deployBraavos.ts
// Coded using Starknet.js v5.5.0

import { Provider, Account, Contract, ec, json, constants, CallData, hash } from "starknet";
import fs from "fs";
import { accountTestnet2Braavos1Address, accountTestnet2Braavos3privateKey, accountTestnet2Braavos1publicKey } from "../../A2priv/A2priv"
import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey } from "../../A2priv/A2priv"

async function main() {
    //initialize Provider with DEVNET, reading .env file
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI2 } });
    console.log("Connected to Testnet-2.");

    // connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_ADDRESS=', accountTestnet2ArgentX1Address);
    // console.log('OZ_ACCOUNT0_PRIVATE_KEY=', accountTestnet2ArgentX1privateKey );
    const privateKey0 = accountTestnet2ArgentX1privateKey;
    const account0Address: string = accountTestnet2ArgentX1Address;
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing ArgentX account 1 connected.\n');

    // Deploy instance of the proxy in Testnet2
    // classHash of proxy is identical in the 3 networks
    const classHashProxyBraavos = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
    // classHash of contract is identical in the 3 networks, and is currently :
    const classHashContractBraavos = "0x02c2b8f559e1221468140ad7b2352b1a5be32660d0bf1a3ae3a054a4ec5254e4";
    const newAccountAddress=accountTestnet2Braavos1Address;
    const newAccountPubKey=accountTestnet2Braavos1publicKey;
    const constructor = CallData.compile(
        {
            implementation_address: classHashContractBraavos,
            initializer_selector: hash.getSelectorFromName("initializer"),
            calldata: [newAccountPubKey],
        }
    );
    console.log("constructor =", constructor);
    const calculatedAccountAddress = hash.calculateContractAddressFromHash(newAccountPubKey, classHashProxyBraavos, constructor, 0);
    console.log("calculated address =", calculatedAccountAddress);
    console.log("expected   address =", newAccountAddress);

    //estimate fee
    // const { suggestedMaxFee: estimatedFee1 } = await account0.estimateDeployFee({
    //      classHash: classHashProxyBraavos ,
    //      constructorCalldata:constructor,
    //      salt:accountTestnet2Braavos3publicKey
    //     });
    // const deployResponse = await account0.deployContract({ classHash: classHashProxyBraavos }, { maxFee: estimatedFee1 * 11n / 10n });

    // // Connect the new contract :
    // const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test.json").toString("ascii"));
    // const myTestContract = new Contract(compiledTest.abi, deployResponse.contract_address, provider);
    // console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// {
//     "name": "constructor",
//         "type": "constructor",
//             "inputs": [
//                 {
//                     "name": "implementation_address",
//                     "type": "felt"
//                 },
//                 {
//                     "name": "initializer_selector",
//                     selector: hash.getSelectorFromName("initializer")
//             0x2dd76e7ad84dbed81c314ffe5e7a7cacfb8f4836f01af4e913f275f89a3de1a
//        1295919550572838631247819983596733806859788957403169325509326258146877103642
//             "type": "felt"
//           },
//                 {
//                     "name": "calldata_len", 1
//             "type": "felt"
//           },
//                 {
//                     "name": "calldata", publickey
//             "type": "felt*"
//                 }
//             ],
//                 "outputs": []
// },