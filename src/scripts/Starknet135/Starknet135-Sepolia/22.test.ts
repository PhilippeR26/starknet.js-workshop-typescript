import {
    events,
    CallData,
    RpcProvider,
    num,
    hash,
    Contract,
    ReceiptTx,
    type GetTxReceiptResponseWithoutHelper,
    createTransactionReceipt,
    createAbiParser,
    type RPC,
    type EmittedEvent,
    CairoByteArray,
    cairo,
} from "starknet";

async function main() {
    const RPC_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9";
    const STRK_CONTRACT_ADDRESS =
        "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

    // const abi0 = [
    //     {
    //         "type": "impl",
    //         "name": "LockingContract",
    //         "interface_name": "src::mintable_lock_interface::ILockingContract"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::mintable_lock_interface::ILockingContract",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "set_locking_contract",
    //                 "inputs": [
    //                     {
    //                         "name": "locking_contract",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "get_locking_contract",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "LockAndDelegate",
    //         "interface_name": "src::mintable_lock_interface::ILockAndDelegate"
    //     },
    //     {
    //         "type": "struct",
    //         "name": "core::integer::u256",
    //         "members": [
    //             {
    //                 "name": "low",
    //                 "type": "core::integer::u128"
    //             },
    //             {
    //                 "name": "high",
    //                 "type": "core::integer::u128"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::mintable_lock_interface::ILockAndDelegate",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "lock_and_delegate",
    //                 "inputs": [
    //                     {
    //                         "name": "delegatee",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "lock_and_delegate_by_sig",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "delegatee",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     },
    //                     {
    //                         "name": "nonce",
    //                         "type": "core::felt252"
    //                     },
    //                     {
    //                         "name": "expiry",
    //                         "type": "core::integer::u64"
    //                     },
    //                     {
    //                         "name": "signature",
    //                         "type": "core::array::Array::<core::felt252>"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "MintableToken",
    //         "interface_name": "src::mintable_token_interface::IMintableToken"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::mintable_token_interface::IMintableToken",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "permissioned_mint",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "permissioned_burn",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "MintableTokenCamelImpl",
    //         "interface_name": "src::mintable_token_interface::IMintableTokenCamel"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::mintable_token_interface::IMintableTokenCamel",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "permissionedMint",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "permissionedBurn",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "Replaceable",
    //         "interface_name": "src::replaceability_interface::IReplaceable"
    //     },
    //     {
    //         "type": "struct",
    //         "name": "core::array::Span::<core::felt252>",
    //         "members": [
    //             {
    //                 "name": "snapshot",
    //                 "type": "@core::array::Array::<core::felt252>"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "struct",
    //         "name": "src::replaceability_interface::EICData",
    //         "members": [
    //             {
    //                 "name": "eic_hash",
    //                 "type": "core::starknet::class_hash::ClassHash"
    //             },
    //             {
    //                 "name": "eic_init_data",
    //                 "type": "core::array::Span::<core::felt252>"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "enum",
    //         "name": "core::option::Option::<src::replaceability_interface::EICData>",
    //         "variants": [
    //             {
    //                 "name": "Some",
    //                 "type": "src::replaceability_interface::EICData"
    //             },
    //             {
    //                 "name": "None",
    //                 "type": "()"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "enum",
    //         "name": "core::bool",
    //         "variants": [
    //             {
    //                 "name": "False",
    //                 "type": "()"
    //             },
    //             {
    //                 "name": "True",
    //                 "type": "()"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "struct",
    //         "name": "src::replaceability_interface::ImplementationData",
    //         "members": [
    //             {
    //                 "name": "impl_hash",
    //                 "type": "core::starknet::class_hash::ClassHash"
    //             },
    //             {
    //                 "name": "eic_data",
    //                 "type": "core::option::Option::<src::replaceability_interface::EICData>"
    //             },
    //             {
    //                 "name": "final",
    //                 "type": "core::bool"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::replaceability_interface::IReplaceable",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "get_upgrade_delay",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u64"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "get_impl_activation_time",
    //                 "inputs": [
    //                     {
    //                         "name": "implementation_data",
    //                         "type": "src::replaceability_interface::ImplementationData"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u64"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "add_new_implementation",
    //                 "inputs": [
    //                     {
    //                         "name": "implementation_data",
    //                         "type": "src::replaceability_interface::ImplementationData"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "remove_implementation",
    //                 "inputs": [
    //                     {
    //                         "name": "implementation_data",
    //                         "type": "src::replaceability_interface::ImplementationData"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "replace_to",
    //                 "inputs": [
    //                     {
    //                         "name": "implementation_data",
    //                         "type": "src::replaceability_interface::ImplementationData"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "AccessControlImplExternal",
    //         "interface_name": "src::access_control_interface::IAccessControl"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::access_control_interface::IAccessControl",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "has_role",
    //                 "inputs": [
    //                     {
    //                         "name": "role",
    //                         "type": "core::felt252"
    //                     },
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "get_role_admin",
    //                 "inputs": [
    //                     {
    //                         "name": "role",
    //                         "type": "core::felt252"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::felt252"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "RolesImpl",
    //         "interface_name": "src::roles_interface::IMinimalRoles"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "src::roles_interface::IMinimalRoles",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "is_governance_admin",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "is_upgrade_governor",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "register_governance_admin",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "remove_governance_admin",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "register_upgrade_governor",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "remove_upgrade_governor",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "renounce",
    //                 "inputs": [
    //                     {
    //                         "name": "role",
    //                         "type": "core::felt252"
    //                     }
    //                 ],
    //                 "outputs": [],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "ERC20Impl",
    //         "interface_name": "openzeppelin::token::erc20::interface::IERC20"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "openzeppelin::token::erc20::interface::IERC20",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "name",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::felt252"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "symbol",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::felt252"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "decimals",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u8"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "total_supply",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "balance_of",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "allowance",
    //                 "inputs": [
    //                     {
    //                         "name": "owner",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "spender",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "transfer",
    //                 "inputs": [
    //                     {
    //                         "name": "recipient",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "transfer_from",
    //                 "inputs": [
    //                     {
    //                         "name": "sender",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "recipient",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "external"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "approve",
    //                 "inputs": [
    //                     {
    //                         "name": "spender",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "impl",
    //         "name": "ERC20CamelOnlyImpl",
    //         "interface_name": "openzeppelin::token::erc20::interface::IERC20CamelOnly"
    //     },
    //     {
    //         "type": "interface",
    //         "name": "openzeppelin::token::erc20::interface::IERC20CamelOnly",
    //         "items": [
    //             {
    //                 "type": "function",
    //                 "name": "totalSupply",
    //                 "inputs": [],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "balanceOf",
    //                 "inputs": [
    //                     {
    //                         "name": "account",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "state_mutability": "view"
    //             },
    //             {
    //                 "type": "function",
    //                 "name": "transferFrom",
    //                 "inputs": [
    //                     {
    //                         "name": "sender",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "recipient",
    //                         "type": "core::starknet::contract_address::ContractAddress"
    //                     },
    //                     {
    //                         "name": "amount",
    //                         "type": "core::integer::u256"
    //                     }
    //                 ],
    //                 "outputs": [
    //                     {
    //                         "type": "core::bool"
    //                     }
    //                 ],
    //                 "state_mutability": "external"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "constructor",
    //         "name": "constructor",
    //         "inputs": [
    //             {
    //                 "name": "name",
    //                 "type": "core::felt252"
    //             },
    //             {
    //                 "name": "symbol",
    //                 "type": "core::felt252"
    //             },
    //             {
    //                 "name": "decimals",
    //                 "type": "core::integer::u8"
    //             },
    //             {
    //                 "name": "initial_supply",
    //                 "type": "core::integer::u256"
    //             },
    //             {
    //                 "name": "recipient",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "permitted_minter",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "provisional_governance_admin",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "upgrade_delay",
    //                 "type": "core::integer::u64"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "function",
    //         "name": "increase_allowance",
    //         "inputs": [
    //             {
    //                 "name": "spender",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "added_value",
    //                 "type": "core::integer::u256"
    //             }
    //         ],
    //         "outputs": [
    //             {
    //                 "type": "core::bool"
    //             }
    //         ],
    //         "state_mutability": "external"
    //     },
    //     {
    //         "type": "function",
    //         "name": "decrease_allowance",
    //         "inputs": [
    //             {
    //                 "name": "spender",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "subtracted_value",
    //                 "type": "core::integer::u256"
    //             }
    //         ],
    //         "outputs": [
    //             {
    //                 "type": "core::bool"
    //             }
    //         ],
    //         "state_mutability": "external"
    //     },
    //     {
    //         "type": "function",
    //         "name": "increaseAllowance",
    //         "inputs": [
    //             {
    //                 "name": "spender",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "addedValue",
    //                 "type": "core::integer::u256"
    //             }
    //         ],
    //         "outputs": [
    //             {
    //                 "type": "core::bool"
    //             }
    //         ],
    //         "state_mutability": "external"
    //     },
    //     {
    //         "type": "function",
    //         "name": "decreaseAllowance",
    //         "inputs": [
    //             {
    //                 "name": "spender",
    //                 "type": "core::starknet::contract_address::ContractAddress"
    //             },
    //             {
    //                 "name": "subtractedValue",
    //                 "type": "core::integer::u256"
    //             }
    //         ],
    //         "outputs": [
    //             {
    //                 "type": "core::bool"
    //             }
    //         ],
    //         "state_mutability": "external"
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::strk::erc20_lockable::ERC20Lockable::Transfer",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "from",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "to",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "value",
    //                 "type": "core::integer::u256",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::strk::erc20_lockable::ERC20Lockable::Approval",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "owner",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "spender",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "value",
    //                 "type": "core::integer::u256",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::replaceability_interface::ImplementationAdded",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "implementation_data",
    //                 "type": "src::replaceability_interface::ImplementationData",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::replaceability_interface::ImplementationRemoved",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "implementation_data",
    //                 "type": "src::replaceability_interface::ImplementationData",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::replaceability_interface::ImplementationReplaced",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "implementation_data",
    //                 "type": "src::replaceability_interface::ImplementationData",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::replaceability_interface::ImplementationFinalized",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "impl_hash",
    //                 "type": "core::starknet::class_hash::ClassHash",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::access_control_interface::RoleGranted",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "role",
    //                 "type": "core::felt252",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "sender",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::access_control_interface::RoleRevoked",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "role",
    //                 "type": "core::felt252",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "sender",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::access_control_interface::RoleAdminChanged",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "role",
    //                 "type": "core::felt252",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "previous_admin_role",
    //                 "type": "core::felt252",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "new_admin_role",
    //                 "type": "core::felt252",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::roles_interface::GovernanceAdminAdded",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "added_account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "added_by",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::roles_interface::GovernanceAdminRemoved",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "removed_account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "removed_by",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::roles_interface::UpgradeGovernorAdded",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "added_account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "added_by",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::roles_interface::UpgradeGovernorRemoved",
    //         "kind": "struct",
    //         "members": [
    //             {
    //                 "name": "removed_account",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             },
    //             {
    //                 "name": "removed_by",
    //                 "type": "core::starknet::contract_address::ContractAddress",
    //                 "kind": "data"
    //             }
    //         ]
    //     },
    //     {
    //         "type": "event",
    //         "name": "src::strk::erc20_lockable::ERC20Lockable::Event",
    //         "kind": "enum",
    //         "variants": [
    //             {
    //                 "name": "Transfer",
    //                 "type": "src::strk::erc20_lockable::ERC20Lockable::Transfer",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "Approval",
    //                 "type": "src::strk::erc20_lockable::ERC20Lockable::Approval",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "ImplementationAdded",
    //                 "type": "src::replaceability_interface::ImplementationAdded",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "ImplementationRemoved",
    //                 "type": "src::replaceability_interface::ImplementationRemoved",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "ImplementationReplaced",
    //                 "type": "src::replaceability_interface::ImplementationReplaced",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "ImplementationFinalized",
    //                 "type": "src::replaceability_interface::ImplementationFinalized",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "RoleGranted",
    //                 "type": "src::access_control_interface::RoleGranted",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "RoleRevoked",
    //                 "type": "src::access_control_interface::RoleRevoked",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "RoleAdminChanged",
    //                 "type": "src::access_control_interface::RoleAdminChanged",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "GovernanceAdminAdded",
    //                 "type": "src::roles_interface::GovernanceAdminAdded",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "GovernanceAdminRemoved",
    //                 "type": "src::roles_interface::GovernanceAdminRemoved",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "UpgradeGovernorAdded",
    //                 "type": "src::roles_interface::UpgradeGovernorAdded",
    //                 "kind": "nested"
    //             },
    //             {
    //                 "name": "UpgradeGovernorRemoved",
    //                 "type": "src::roles_interface::UpgradeGovernorRemoved",
    //                 "kind": "nested"
    //             }
    //         ]
    //     }
    // ];

    const abi = [
        {
            "type": "impl",
            "name": "ERC20Impl",
            "interface_name": "openzeppelin::token::erc20::interface::IERC20"
        },
        {
            type: 'interface',
            name: 'openzeppelin::token::erc20::interface::IERC20',
            items: [
            ],
        },
        {
            type: 'event',
            name: 'src::strk::erc20_lockable::ERC20Lockable::Transfer',
            kind: 'struct',
            members: [
                {
                    name: 'from',
                    type: 'core::starknet::contract_address::ContractAddress',
                    kind: 'data',
                },
                {
                    name: 'to',
                    type: 'core::starknet::contract_address::ContractAddress',
                    kind: 'data',
                },
                {
                    name: 'value',
                    type: 'core::integer::u256',
                    kind: 'data',
                },
            ],
        },
        {
            type: 'struct',
            name: 'core::integer::u256',
            members: [
                {
                    name: 'low',
                    type: 'core::integer::u128',
                },
                {
                    name: 'high',
                    type: 'core::integer::u128',
                },
            ],
        },
        {
            "type": "event",
            "name": "src::strk::erc20_lockable::ERC20Lockable::Event",
            "kind": "enum",
            "variants": [
                {
                    "name": "Transfer",
                    "type": "src::strk::erc20_lockable::ERC20Lockable::Transfer",
                    "kind": "nested"
                }
            ]
        }
    ];

    const myEvent: EmittedEvent = {
        data: [
            '0x395a96a5b6343fc0f543692fd36e7034b54c2a276cd1a021e8c0b02aee1f43',
            '0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8',
            '0x5615d4fedf6800',
            '0x0',
        ],
        from_address: '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        keys: ['0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9'],
        block_hash: '0x1234',
        block_number: 567,
        transaction_hash: '0x789',
    };

    
    const parser = createAbiParser(abi);
    const abiStruct = CallData.getAbiStruct(abi);
    const abiEnum = CallData.getAbiEnum(abi);
    const abiEvents = events.getAbiEvents(abi);
    console.log("abiStruct=", abiStruct);
    console.log("abiEnum=", abiEnum);
    console.log("abiEvents=", abiEvents);
    const parsedEvents = events.parseEvents(
        [myEvent],
        abiEvents,
        abiStruct,
        abiEnum,
        parser
    );
    console.log(parsedEvents);

    console.log(new CairoByteArray('Token').toApiRequest())
    console.log(new CairoByteArray('Token').toObject())

    const myCalldata=CallData.compile({
        name: new CairoByteArray('Token').toObject(),
        symbol: new CairoByteArray('ERC20').toObject(),
        amount: cairo.uint256('1000000000'),
        recipient: "0x123",
        owner: '0x823d5a0c0eefdc9a6a1cb0e064079a6284f3b26566b677a32c71bbe7bf9f8c',
      });
    console.log({myCalldata});

    const message = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ12345AAADEFGHIJKLMNOPQRSTUVWXYZ12345A';
      const callD = CallData.compile([new CairoByteArray(message).toObject()]);
      console.log({callD});
      const expectedResult = [
        '2',
        num.hexToDecimalString('0x4142434445464748494a4b4c4d4e4f505152535455565758595a3132333435'),
        num.hexToDecimalString('0x4141414445464748494a4b4c4d4e4f505152535455565758595a3132333435'),
        num.hexToDecimalString('0x41'),
        '1',
      ];
      console.log({expectedResult});
    process.exit(6);
    const myProvider = new RpcProvider({ nodeUrl: RPC_URL });
    const contractSierra = await myProvider.getClassAt(STRK_CONTRACT_ADDRESS);
    const strkContract = new Contract({
        abi: abi, address: STRK_CONTRACT_ADDRESS, providerOrAccount: myProvider
    });
    const block = await myProvider.getBlockWithReceipts("latest");
    console.log("txs number =", block.transactions.length);
    if (block.transactions.length > 0) {
        const res0 = block.transactions.flatMap((transaction) => {
            const rawReceipt = transaction.receipt as GetTxReceiptResponseWithoutHelper;
            // console.log("rawReceipt.events=", rawReceipt.events);
            return rawReceipt.events;
        });
        console.log(res0);
        const res = block.transactions.flatMap((transaction) => {
            const rawReceipt = transaction.receipt as GetTxReceiptResponseWithoutHelper;
            const txReceipt = createTransactionReceipt(rawReceipt);
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

