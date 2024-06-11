// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.9.0
// launch with npx src/scripts/merkleTree/airdropSJS6Sepolia/5.testAirdropPoseidonSepolia.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256, shortString } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function main() {
    // initialize Provider. Adapt to your needs
    // **** Starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // **** Sepolia Testnet :
    const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());

    // initialize account. Adapt to your case
    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

    // *** initialize existing Sepolia Testnet account
    const privateKey0 = account0OZSepoliaPrivateKey;
    const accountAddress0 = account0OZSepoliaAddress;

    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // Connect the Airdrop deployed contract in devnet
    //    👇👇👇
    // modify with the Airdrop address resulting of 2 & 4 :
    const ERC20_ADDRESS = "0x998bec0c912e4257bf87719bf6af2575ccebcd00fd284b8044d1e14fc30ce9";
    const AIRDROP_ADDRESS = "0x57ba0443c28b38ee4be0ae1e6f5e0a63a6e8b6cc6e352c997b6d0d24fe0b22d";
    //    👆👆👆
    const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const erc20Contract = new Contract(compiledSierraERC20.abi, ERC20_ADDRESS, account0);
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/airdrop.sierra.json").toString("ascii"));
    const airdropContract = new Contract(compiledTest.abi, AIRDROP_ADDRESS, account0);
    console.log(airdropContract.functions);
    console.log('Contract connected at =', airdropContract.address, "\n");

    // Interactions with the contract with call 
    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Sepolia/treeListAddressSepolia.json', 'ascii'))
    );
    const leaf = tree.getInputData(1380);
    // proof recovered from the server :
    // const leaf = ['0x57ba0443c28b38ee4be0ae1e6f5e0a63a6e8b6cc6e352c997b6d0d24fe0b22d','1000','0x0];
    const proof = tree.getProof(1380);
    // const proof = [
    //   '2721175627415433399276941958312334774979269315219667424659917910353163734623',
    //   '3063577485784822066050523518435959645589352480667650265133551166321218756704',
    //   '2883668053066775022683969162964801710217315762000888620804624547864050198341',
    //   '786416401685953646052093078572428026289918645696195108110931747840438406898',
    //   '3411580296542240005760599239475282249444892298355180877115566426422724416938',
    //   '1605434812332113904564961753049506664059165507867619790415237655009957556672',
    //   '614155497669631776979760574287452448584404240994596993276168583350754151847',
    //   '1049043272126815256317918985206096778017817884058339396530526348206896062043',
    //   '1443373478445595917780720117780372630499707082417091712728257689149283904802',
    //   '758333339364031966784085726308219116289732521867229287842323349152168391195'
    // ];
    const result0 = await airdropContract.is_address_airdropped(leaf[0]);
    console.log("Is address already airdropped =", result0);
    console.log("leaf0 (address) =", leaf[0]);
    const amount: Uint256 = { low: leaf[1], high: leaf[2] };
    const myCall = airdropContract.populate("request_airdrop", {
        address: '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
        amount,
        proof
    })
    console.log(myCall);
    const bal = await erc20Contract.balanceOf(leaf[0]);
    console.log("New balance of", leaf[0], "=", bal);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });