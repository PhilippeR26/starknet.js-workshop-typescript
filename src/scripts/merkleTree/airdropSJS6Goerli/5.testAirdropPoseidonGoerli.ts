// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.0.0-beta.11 
// launch with npx src/scripts/merkleTree/airdropSJS6Goerli/5.testAirdropPoseidonGoerli.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256, shortString } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import { account5TestnetAddress, account5TestnetPrivateKey } from "../../../A1priv/A1priv";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../../A-MainPriv/mainPriv";

import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function main() {
    // initialize Provider. Adapt to your needs
    // Starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // Goerli Testnet
    const provider = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0_5" }); 
    // local Pathfinder Sepolia Testnet node :
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); 
    // local Pathfinder Sepolia Integration node :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_6" }); 
    // local Juno mainnet :
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_6" }); //v0.6.0

    // Check that communication with provider is OK
    const ch = await provider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await provider.getSpecVersion());
    
    // initialize account. Adapt to your case
    // *** Devnet-rs 
    // const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    // const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    // *** initialize existing Argent X Goerli Testnet  account
     const privateKey0 = account5TestnetPrivateKey;
     const accountAddress0 = account5TestnetAddress
    
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account1MainnetPrivateKey;
    // const accountAddress0 = account1MainnetAddress

    // *** initialize existing Sepolia Testnet account
    // const privateKey0 = account0OZSepoliaPrivateKey;
    // const accountAddress0 = account0OZSepoliaAddress;

    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;

    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');

    // Connect the Airdrop deployed contract in devnet
    //    👇👇👇
    // modify with the Airdrop address resulting of 2 & 4 :
    const ERC20_ADDRESS = "0x61376175ba2ddc307b30813312d8f09796f777b8c24dd327a5cdd65c3539fba";
    const AIRDROP_ADDRESS = "0x6f67b776c1f365a24b30f3b891be894bc84e2add676f939ae2f35f1b1c66858";
    //    👆👆👆
    const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
    const erc20Contract = new Contract(compiledSierraERC20.abi, ERC20_ADDRESS, account0);
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/airdrop.sierra.json").toString("ascii"));
    const airdropContract = new Contract(compiledTest.abi, AIRDROP_ADDRESS, account0);
    console.log(airdropContract.functions);
    console.log('Contract connected at =', airdropContract.address, "\n");

    // Interactions with the contract with call 
    const tree = Merkle.StarknetMerkleTree.load(
        JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Goerli/treeListAddressGoerli.json', 'ascii'))
    );
    const leaf=tree.getInputData(1380);
    // proof recovered from the server :
    // const leaf = ['0x065A822fBeE1Ae79e898688b5A4282Dc79E0042cbEd12F6169937FdDb4c26641','0x2','0x0];
    const proof=tree.getProof(1380);
    // const proof = [
//   '0x132b578345b1affbcee42a096897e6532994542720369014cc9a892a8cc0de4',
//   '0x3281591106fd32835459d00f83cc8a2280d06628f87496011227a4a25d92503',
//   '0x3207707f315ed4877a18aacbf37eb7d50ef6257d98c990ec3bd4d13be997ecf',
//   '0x3eb177430818395c2b14b8efd238224af951d2f47c8889c983edf11dd9bd56f',
//   '0x163cd32f3ca3f32b3e0312c3aa93b5d3331e91c7835b85e2792c3db15f5136a',
//   '0x4322941f3bf56b87cb78b48ce4dc9d54fed24adbc875ce3ca580d1166497c72',
//   '0x39dcda21666be2a84a495a19eaf3ee86052ca617079ccd8abc8a9c58ce56e6b',
//   '0x1c9d8b4200c6c177b4bb9f35275ec82787391cbe6b43a82c55ae92c1e92ef9c',
//   '0x43e67c4c91b9e49e5af87aa53d780b40a93e97f4ad0152798ff86574ef8c45a',
//   '0x7c4dde272d7def41423af8f30d5cc6ba92e15a8650b832b8c5758e1747099e0',
//   '0x18c3e60d7227f0d221ab6621559651afd056350449d7bd1809ab794cf010831'
// ];
    const result0 = await airdropContract.is_address_airdropped(leaf[0]);
    console.log("Is address already airdropped =", result0);
        console.log("leaf0 (address) =",leaf[0]);
    const amount: Uint256 = { low: leaf[1], high: leaf[2] };
    const myCall = airdropContract.populate("request_airdrop", {
        address: '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
        amount,
        proof
    })
    console.log(myCall);
    // ****** code  hereunder as been commented, to not perform the airdrop outside of the DAPP ************
    // const txResp = await account0.execute(myCall);
    // console.log("executed...");
    // const txR=await provider.waitForTransaction(txResp.transaction_hash);
    // console.log("event =",txR.events);
    // const result1 = await airdropContract.is_address_airdropped(leaf[0]);
    // console.log("result from airdrop request =", result1);
    const bal=await erc20Contract.balanceOf(leaf[0]);
    console.log("New balance of",leaf[0],"=",bal);

    console.log("✅ test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });