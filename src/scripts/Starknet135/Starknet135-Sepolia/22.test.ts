import {
    events,
    CallData,
    RpcProvider,
    num,
    hash,
    Contract,
    ReceiptTx,
    type GetTxReceiptResponseWithoutHelper,
} from "starknet";

async function main() {
    const RPC_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_8";
    const STRK_CONTRACT_ADDRESS =
        "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

    const abi = [
        {
            type: "impl",
            name: "ERC20Impl",
            interface_name: "openzeppelin::token::erc20::interface::IERC20",
        },
        {
            name: "openzeppelin::token::erc20::interface::IERC20",
            type: "interface",
            items: [
                {
                    name: "name",
                    type: "function",
                    inputs: [],
                    outputs: [
                        {
                            type: "core::felt252",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "symbol",
                    type: "function",
                    inputs: [],
                    outputs: [
                        {
                            type: "core::felt252",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "decimals",
                    type: "function",
                    inputs: [],
                    outputs: [
                        {
                            type: "core::integer::u8",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "total_supply",
                    type: "function",
                    inputs: [],
                    outputs: [
                        {
                            type: "core::integer::u256",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "balance_of",
                    type: "function",
                    inputs: [
                        {
                            name: "account",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::integer::u256",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "allowance",
                    type: "function",
                    inputs: [
                        {
                            name: "owner",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "spender",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::integer::u256",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "transfer",
                    type: "function",
                    inputs: [
                        {
                            name: "recipient",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "amount",
                            type: "core::integer::u256",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::bool",
                        },
                    ],
                    state_mutability: "external",
                },
                {
                    name: "transfer_from",
                    type: "function",
                    inputs: [
                        {
                            name: "sender",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "recipient",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "amount",
                            type: "core::integer::u256",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::bool",
                        },
                    ],
                    state_mutability: "external",
                },
                {
                    name: "approve",
                    type: "function",
                    inputs: [
                        {
                            name: "spender",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "amount",
                            type: "core::integer::u256",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::bool",
                        },
                    ],
                    state_mutability: "external",
                },
            ],
        },
        {
            name: "ERC20CamelOnlyImpl",
            type: "impl",
            interface_name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
        },
        {
            type: "interface",
            name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
            items: [
                {
                    name: "totalSupply",
                    type: "function",
                    inputs: [],
                    outputs: [
                        {
                            type: "core::integer::u256",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "balanceOf",
                    type: "function",
                    inputs: [
                        {
                            name: "account",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::integer::u256",
                        },
                    ],
                    state_mutability: "view",
                },
                {
                    name: "transferFrom",
                    type: "function",
                    inputs: [
                        {
                            name: "sender",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "recipient",
                            type: "core::starknet::contract_address::ContractAddress",
                        },
                        {
                            name: "amount",
                            type: "core::integer::u256",
                        },
                    ],
                    outputs: [
                        {
                            type: "core::bool",
                        },
                    ],
                    state_mutability: "external",
                },
            ],
        },
        {
            kind: "struct",
            name: "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer",
            type: "event",
            members: [
                {
                    kind: "key",
                    name: "from",
                    type: "core::starknet::contract_address::ContractAddress",
                },
                {
                    kind: "key",
                    name: "to",
                    type: "core::starknet::contract_address::ContractAddress",
                },
                {
                    kind: "data",
                    name: "value",
                    type: "core::integer::u256",
                },
            ],
        },
        {
            kind: "enum",
            name: "openzeppelin::token::erc20_v070::erc20::ERC20::Event",
            type: "event",
            variants: [
                {
                    kind: "nested",
                    name: "Transfer",
                    type: "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer",
                },
            ],
        },
    ];

    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    const strkContract = new Contract(abi, STRK_CONTRACT_ADDRESS, provider);
    const block = await provider.getBlockWithReceipts("latest");
    console.log("txs number =", block.transactions.length);
    if (block.transactions.length > 0) {
        const res = block.transactions.flatMap((transaction) => {
            const rawReceipt = transaction.receipt as GetTxReceiptResponseWithoutHelper;
            const txReceipt = new ReceiptTx(rawReceipt);
            return strkContract.parseEvents(txReceipt);
        });
        console.log(res);
    }
    console.log("✅ Test performed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

