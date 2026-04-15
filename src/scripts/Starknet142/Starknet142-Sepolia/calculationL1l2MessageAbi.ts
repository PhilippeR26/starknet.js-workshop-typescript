import type { Abi } from "starknet";

export const l1l2MessageAbi: Abi = [
    {
        "type": "struct",
        "name": "l1l2message",
        "members": [
            {
                "name": "text",
                "type": "core::byte_array::ByteArray"
            },
            {
                "name": "hash",
                "type": "core::felt252"
            }
        ]
    },
    {
        "type": "interface",
        "name": "secure_voty::Null",
        "items": []
    }
]

