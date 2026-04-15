import type { Abi } from "starknet";

export const l1l2MessageAbi: Abi = [
    {
            "type": "struct",
            "name": "proof_of_age::L1L2message",
            "members": [
                {
                    "name": "current_date",
                    "type": "core::integer::u64"
                },
                {
                    "name": "nullifier",
                    "type": "core::felt252"
                },
                {
                    "name": "has_18_years",
                    "type": "core::bool"
                }
            ]
        },
    {
        "type": "interface",
        "name": "secure_voty::Null",
        "items": []
    }
]

