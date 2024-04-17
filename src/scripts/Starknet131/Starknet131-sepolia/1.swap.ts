// Invoke Swap
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/1.swap.ts
// Coded with Starknet.js v6.7.0

import { Account, json, RpcProvider, Contract, cairo, Uint256, num, uint256, shortString, Abi, type BigNumberish, CallData, type Provider } from "starknet";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { DAIaddress, DAIaddressGoerli, ethAddress } from "../../utils/constants";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import fs from "fs";

async function getContract(address: BigNumberish, path: string, provider: RpcProvider): Promise<Contract> {
    let abi: Abi;
    if (!fs.existsSync(path)) {
        const compiledContract = await provider.getClassAt(address);
        abi = compiledContract.abi;
        fs.writeFileSync(path, json.stringify(abi, undefined, 2));
    }
    else {
        abi = json.parse(fs.readFileSync(path).toString("ascii"));
    }
    return new Contract(abi, num.toHex(address), provider);
}

async function main() {
    // *** local network Pathfinder on Sepolia Testnet 
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0.7" });
    // *** Sepolia testnet
    // const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    //const provider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_6" });

    // *** starknet-devnet-rs, forked from my local Pathfinder Sepolia Node (https: not working) :
    // cargo run --release -- --seed 0 --fork-network http://192.168.1.11:9545/rpc/v0_7
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    // to be sure to be connected :
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());
     process.exit(5);
    // testnet
    const account0Address = account1OZSepoliaAddress;
    const privateKey0 = account1OZSepoliaPrivateKey;
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('Account connected.\n');

    //read abi 
    const swapContractAddress = "0x040803f756f48576117f0b5b1d93b17c8b9787973d0d7635ff53ebb4999ecc56";
    const classSwap=provider.getClassAt(swapContractAddress);
    const swapAbiFilePath = "./src/scripts/Starknet131/Starknet131-sepolia/1a.swap.abi.json";
    const swapContract = await getContract(swapContractAddress, swapAbiFilePath, provider);
    console.log("swap =", swapContract.functions);
    
    // process.exit (5);
    const mySwapContractAddress = "0x02354515660599bf97a21a2de195785ef8f407399ad910b98f8d15683cde193c";
    const mySwapAbiFilePath = "./src/scripts/Starknet131/Starknet131-sepolia/1b.mySwap.abi.json";
    const mySwapContract = await getContract(mySwapContractAddress, mySwapAbiFilePath, provider);
    console.log("swap =", mySwapContract.functions);

    // perform the swap

    // abi  of the function :
    // {
    //     "name": "nft_amm::router::router_interface::PairSwapAny",
    //     "type": "struct",
    //     "members": [
    //       {
    //         "name": "pair",
    //         "type": "core::starknet::contract_address::ContractAddress"
    //       },
    //       {
    //         "name": "num_items",
    //         "type": "core::integer::u256"
    //       }
    //     ]
    //   }

    // {
    //     "name": "swap",
    //     "type": "function",
    //     "inputs": [
    //       {
    //         "name": "swap_list",
    //         "type": "core::array::Array::<nft_amm::router::router_interface::PairSwapAny>"
    //       },
    //       {
    //         "name": "input_amount",
    //         "type": "core::integer::u256"
    //       },
    //       {
    //         "name": "deadline",
    //         "type": "core::integer::u64"
    //       }
    //     ],
    //     "outputs": [
    //       {
    //         "type": "core::integer::u256"
    //       }
    //     ],
    //     "state_mutability": "external"
    //   }

    console.log("mySwap owner =", mySwapContract.call("owner"));

    type PairSwapAny = {
        pair: BigNumberish,
        num_items: BigNumberish
    }
    const pair1: PairSwapAny = {
        pair: "0x123abc",
        num_items: 123456n
    };
    const pair2: PairSwapAny = {
        pair: "0x123abc789",
        num_items: 123456789n
    };
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    console.log("deadline =", deadline);

    const myCall = swapContract.populate("swap",
        {
            swap_list: [pair1, pair2],
            input_amount: 34563464356345n,
            deadline
        })
    console.log("swap call=", myCall, "\nSwap in progress...");

    const resp = await account0.execute(myCall);
    console.log("Tx hash =", resp.transaction_hash);
    const txReceipt = await provider.waitForTransaction(resp.transaction_hash);
    // console.log("Receipt success=", txReceipt.isSuccess());

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
