// Deploy an instance of a Braavos account
// You have first created the account in Braavos DAPP (and not yet 'Setup your account on-chain' by click on 'setup now'), and recover private and public addresses and account address
// launch with npx ts-node src/scriptsTestnet2/4.deployBraavos.ts
// Coded using Starknet.js v5.5.0

import { Provider, Account, Contract, ec, json, constants, CallData, hash, uint256 } from "starknet";
import fs from "fs";
import { accountTestnet2Braavos1Address, accountTestnet2Braavos1privateKey, accountTestnet2Braavos1publicKey } from "../A2priv/A2priv"
import { accountTestnet2Braavos3Address, accountTestnet2Braavos3privateKey, accountTestnet2Braavos3publicKey } from "../A2priv/A2priv"
import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey } from "../A2priv/A2priv"

async function main() {
    //initialize Provider with testnet-2
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI2 } });
    console.log("Connected to Testnet-2.");

    // connect existing predeployed account 0 of Devnet
    console.log('ACCOUNT_ADDRESS=', accountTestnet2ArgentX1Address);
    const privateKey0 = accountTestnet2ArgentX1privateKey;
    const account0Address: string = accountTestnet2ArgentX1Address;
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing ArgentX account 1 connected.\n');

    // Deploy instance of the proxy in Testnet2
    // classHash of proxy is identical in the 3 networks
    const classHashProxyBraavos = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
    // classHash of contract is identical in the 3 networks, and is currently :
    const classHashContractBraavos = "0x02c2b8f559e1221468140ad7b2352b1a5be32660d0bf1a3ae3a054a4ec5254e4";
    const newAccountAddress = accountTestnet2Braavos3Address;
    const newAccountPubKey = accountTestnet2Braavos3publicKey;
    const newAccountPrivKey = accountTestnet2Braavos3privateKey;

    const initializerImplementation=CallData.compile({
        public_key:newAccountPubKey
    })
    const constructorProxy = CallData.compile({
        implementation_address: classHashContractBraavos,
        initializer_selector: hash.getSelectorFromName("initializer"),
        calldata: initializerImplementation, // constructor contract
    });
    console.log("constructor =", constructorProxy);
    const calculatedAccountAddress = hash.calculateContractAddressFromHash(newAccountPubKey, classHashProxyBraavos, constructorProxy, 0);
    console.log("calculated address =", calculatedAccountAddress);
    console.log("expected   address =", newAccountAddress);

    // transfer ETH to the new address
    // const addrETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    // const compiledEthContract = json.parse(fs.readFileSync("./compiledContracts/ERC20MintableOZ_0_6_1.json").toString("ascii"));
    // const ethContract = new Contract(compiledEthContract.abi, addrETH, provider);
    // ethContract.connect(account0);
    // const amountEth: bigint = BigInt(0.005 * 1E18); // 0.005 ETH
    // console.log("amount ETH =", amountEth, Number(amountEth) / 1E18);
    // const transferData = CallData.compile({
    //     recipient: calculatedAccountAddress,
    //     amount: uint256.bnToUint256(amountEth)
    // });
    // console.log("Transfer message =", transferData);
    // const { transaction_hash: transferTxHash } = await account0.execute({ contractAddress: addrETH, entrypoint: "transfer", calldata: transferData, });
    // console.log(`Waiting for Tx to be Accepted on Starknet - Transfer...`);
    // await provider.waitForTransaction(transferTxHash);
    // console.log("ETH transfered to new address");

    //estimate fee
    // const { suggestedMaxFee: estimatedFee1 } = await account0.estimateDeployFee({
    //      classHash: classHashProxyBraavos ,
    //      constructorCalldata:constructorProxy,
    //      salt:newAccountPubKey
    //     });

    const newAccount3 = new Account(provider, calculatedAccountAddress, newAccountPrivKey);
    const deployResponse = await newAccount3.deployAccount({
        classHash: classHashProxyBraavos,
        addressSalt: newAccountPubKey,
        constructorCalldata: initializerImplementation
    });
    console.log("Universal Deployer answer =", deployResponse);
    console.log("Universal Deployer : contract_address =", deployResponse.contract_address);
    console.log("Universal Deployer : transaction_hash =", deployResponse.transaction_hash);

    // Connect the new contract :
    // const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test.json").toString("ascii"));
    // const myTestContract = new Contract(compiledTest.abi, deployResponse.contract_address, provider);
    //console.log('✅ Test Contract connected at =', myTestContract.address);
    console.log('✅ Braavos account deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// ABI of proxy
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

// ABI of contract
// [
//     {
//       "name": "DeferredRemoveSignerRequest",
//       "size": 2,
//       "type": "struct",
//       "members": [
//         {
//           "name": "expire_at",
//           "type": "felt",
//           "offset": 0
//         },
//         {
//           "name": "signer_id",
//           "type": "felt",
//           "offset": 1
//         }
//       ]
//     },
//     {
//       "name": "SignerModel",
//       "size": 7,
//       "type": "struct",
//       "members": [
//         {
//           "name": "signer_0",
//           "type": "felt",
//           "offset": 0
//         },
//         {
//           "name": "signer_1",
//           "type": "felt",
//           "offset": 1
//         },
//         {
//           "name": "signer_2",
//           "type": "felt",
//           "offset": 2
//         },
//         {
//           "name": "signer_3",
//           "type": "felt",
//           "offset": 3
//         },
//         {
//           "name": "type",
//           "type": "felt",
//           "offset": 4
//         },
//         {
//           "name": "reserved_0",
//           "type": "felt",
//           "offset": 5
//         },
//         {
//           "name": "reserved_1",
//           "type": "felt",
//           "offset": 6
//         }
//       ]
//     },
//     {
//       "name": "DeferredMultisigDisableRequest",
//       "size": 1,
//       "type": "struct",
//       "members": [
//         {
//           "name": "expire_at",
//           "type": "felt",
//           "offset": 0
//         }
//       ]
//     },
//     {
//       "name": "IndexedSignerModel",
//       "size": 8,
//       "type": "struct",
//       "members": [
//         {
//           "name": "index",
//           "type": "felt",
//           "offset": 0
//         },
//         {
//           "name": "signer",
//           "type": "SignerModel",
//           "offset": 1
//         }
//       ]
//     },
//     {
//       "name": "PendingMultisigTransaction",
//       "size": 5,
//       "type": "struct",
//       "members": [
//         {
//           "name": "transaction_hash",
//           "type": "felt",
//           "offset": 0
//         },
//         {
//           "name": "expire_at_sec",
//           "type": "felt",
//           "offset": 1
//         },
//         {
//           "name": "expire_at_block_num",
//           "type": "felt",
//           "offset": 2
//         },
//         {
//           "name": "signer_1_id",
//           "type": "felt",
//           "offset": 3
//         },
//         {
//           "name": "is_disable_multisig_transaction",
//           "type": "felt",
//           "offset": 4
//         }
//       ]
//     },
//     {
//       "name": "AccountCallArray",
//       "size": 4,
//       "type": "struct",
//       "members": [
//         {
//           "name": "to",
//           "type": "felt",
//           "offset": 0
//         },
//         {
//           "name": "selector",
//           "type": "felt",
//           "offset": 1
//         },
//         {
//           "name": "data_offset",
//           "type": "felt",
//           "offset": 2
//         },
//         {
//           "name": "data_len",
//           "type": "felt",
//           "offset": 3
//         }
//       ]
//     },
//     {
//       "data": [
//         {
//           "name": "implementation",
//           "type": "felt"
//         }
//       ],
//       "keys": [],
//       "name": "Upgraded",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "request",
//           "type": "DeferredRemoveSignerRequest"
//         }
//       ],
//       "keys": [],
//       "name": "SignerRemoveRequest",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "signer_id",
//           "type": "felt"
//         },
//         {
//           "name": "signer",
//           "type": "SignerModel"
//         }
//       ],
//       "keys": [],
//       "name": "SignerAdded",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "signer_id",
//           "type": "felt"
//         }
//       ],
//       "keys": [],
//       "name": "SignerRemoved",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "request",
//           "type": "DeferredRemoveSignerRequest"
//         }
//       ],
//       "keys": [],
//       "name": "SignerRemoveRequestCancelled",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "public_key",
//           "type": "felt"
//         }
//       ],
//       "keys": [],
//       "name": "AccountInitialized",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "request",
//           "type": "DeferredMultisigDisableRequest"
//         }
//       ],
//       "keys": [],
//       "name": "MultisigDisableRequest",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "request",
//           "type": "DeferredMultisigDisableRequest"
//         }
//       ],
//       "keys": [],
//       "name": "MultisigDisableRequestCancelled",
//       "type": "event"
//     },
//     {
//       "data": [
//         {
//           "name": "num_signers",
//           "type": "felt"
//         }
//       ],
//       "keys": [],
//       "name": "MultisigSet",
//       "type": "event"
//     },
//     {
//       "data": [],
//       "keys": [],
//       "name": "MultisigDisabled",
//       "type": "event"
//     },
//     {
//       "name": "supportsInterface",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "interfaceId",
//           "type": "felt"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "success",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_impl_version",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "res",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "initializer",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "public_key",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "upgrade",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "new_implementation",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "migrate_storage",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "from_version",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "add_signer",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "signer",
//           "type": "SignerModel"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "signer_id",
//           "type": "felt"
//         }
//       ]
//     },
//     {
//       "name": "swap_signers",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "remove_index",
//           "type": "felt"
//         },
//         {
//           "name": "added_signer",
//           "type": "SignerModel"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "signer_id",
//           "type": "felt"
//         }
//       ]
//     },
//     {
//       "name": "setPublicKey",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "newPublicKey",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "remove_signer",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "index",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "remove_signer_with_etd",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "index",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "cancel_deferred_remove_signer_req",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "removed_signer_id",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "getPublicKey",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "publicKey",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_public_key",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "res",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_signers",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "signers_len",
//           "type": "felt"
//         },
//         {
//           "name": "signers",
//           "type": "IndexedSignerModel*"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_signer",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "index",
//           "type": "felt"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "signer",
//           "type": "SignerModel"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_deferred_remove_signer_req",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "deferred_request",
//           "type": "DeferredRemoveSignerRequest"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_execution_time_delay",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "etd_sec",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "is_valid_signature",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "hash",
//           "type": "felt"
//         },
//         {
//           "name": "signature_len",
//           "type": "felt"
//         },
//         {
//           "name": "signature",
//           "type": "felt*"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "is_valid",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "isValidSignature",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "hash",
//           "type": "felt"
//         },
//         {
//           "name": "signature_len",
//           "type": "felt"
//         },
//         {
//           "name": "signature",
//           "type": "felt*"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "isValid",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "get_multisig",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "multisig_num_signers",
//           "type": "felt"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "set_multisig",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "num_signers",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "get_pending_multisig_transaction",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "pending_multisig_transaction",
//           "type": "PendingMultisigTransaction"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "sign_pending_multisig_transaction",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "pending_calldata_len",
//           "type": "felt"
//         },
//         {
//           "name": "pending_calldata",
//           "type": "felt*"
//         },
//         {
//           "name": "pending_nonce",
//           "type": "felt"
//         },
//         {
//           "name": "pending_max_fee",
//           "type": "felt"
//         },
//         {
//           "name": "pending_transaction_version",
//           "type": "felt"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "response_len",
//           "type": "felt"
//         },
//         {
//           "name": "response",
//           "type": "felt*"
//         }
//       ]
//     },
//     {
//       "name": "disable_multisig",
//       "type": "function",
//       "inputs": [],
//       "outputs": []
//     },
//     {
//       "name": "disable_multisig_with_etd",
//       "type": "function",
//       "inputs": [],
//       "outputs": []
//     },
//     {
//       "name": "get_deferred_disable_multisig_req",
//       "type": "function",
//       "inputs": [],
//       "outputs": [
//         {
//           "name": "deferred_request",
//           "type": "DeferredMultisigDisableRequest"
//         }
//       ],
//       "stateMutability": "view"
//     },
//     {
//       "name": "cancel_deferred_disable_multisig_req",
//       "type": "function",
//       "inputs": [],
//       "outputs": []
//     },
//     {
//       "name": "__validate__",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "call_array_len",
//           "type": "felt"
//         },
//         {
//           "name": "call_array",
//           "type": "AccountCallArray*"
//         },
//         {
//           "name": "calldata_len",
//           "type": "felt"
//         },
//         {
//           "name": "calldata",
//           "type": "felt*"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "__validate_deploy__",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "class_hash",
//           "type": "felt"
//         },
//         {
//           "name": "contract_address_salt",
//           "type": "felt"
//         },
//         {
//           "name": "implementation_address",
//           "type": "felt"
//         },
//         {
//           "name": "initializer_selector",
//           "type": "felt"
//         },
//         {
//           "name": "calldata_len",
//           "type": "felt"
//         },
//         {
//           "name": "calldata",
//           "type": "felt*"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "__validate_declare__",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "class_hash",
//           "type": "felt"
//         }
//       ],
//       "outputs": []
//     },
//     {
//       "name": "__execute__",
//       "type": "function",
//       "inputs": [
//         {
//           "name": "call_array_len",
//           "type": "felt"
//         },
//         {
//           "name": "call_array",
//           "type": "AccountCallArray*"
//         },
//         {
//           "name": "calldata_len",
//           "type": "felt"
//         },
//         {
//           "name": "calldata",
//           "type": "felt*"
//         }
//       ],
//       "outputs": [
//         {
//           "name": "response_len",
//           "type": "felt"
//         },
//         {
//           "name": "response",
//           "type": "felt*"
//         }
//       ]
//     }
//   ]