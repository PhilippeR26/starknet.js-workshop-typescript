import { Abi } from "starknet";

export const abi060=[
    {
        "inputs": [
            {
                "name": "merkle_root",
                "type": "felt"
            }
        ],
        "name": "constructor",
        "outputs": [],
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "get_root",
        "outputs": [
            {
                "name": "root",
                "type": "felt"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "value1",
                "type": "felt"
            },
            {
                "name": "value2",
                "type": "felt"
            }
        ],
        "name": "get_hash_pedersen",
        "outputs": [
            {
                "name": "hash",
                "type": "felt"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "leaf",
                "type": "felt"
            },
            {
                "name": "proof_len",
                "type": "felt"
            },
            {
                "name": "proof",
                "type": "felt*"
            }
        ],
        "name": "verify_proof",
        "outputs": [
            {
                "name": "res",
                "type": "felt"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "address",
                "type": "felt"
            },
            {
                "name": "amount",
                "type": "felt"
            },
            {
                "name": "proof_len",
                "type": "felt"
            },
            {
                "name": "proof",
                "type": "felt*"
            }
        ],
        "name": "request_airdrop",
        "outputs": [],
        "type": "function"
    }
] as const;
