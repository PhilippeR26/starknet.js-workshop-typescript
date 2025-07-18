export const ReadyAccountAbi={
    "abi": [
        {
            "type": "impl",
            "name": "AccountImpl",
            "interface_name": "argent::account::interface::IAccount"
        },
        {
            "type": "struct",
            "name": "core::array::Span::<core::felt252>",
            "members": [
                {
                    "name": "snapshot",
                    "type": "@core::array::Array::<core::felt252>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::starknet::account::Call",
            "members": [
                {
                    "name": "to",
                    "type": "core::starknet::contract_address::ContractAddress"
                },
                {
                    "name": "selector",
                    "type": "core::felt252"
                },
                {
                    "name": "calldata",
                    "type": "core::array::Span::<core::felt252>"
                }
            ]
        },
        {
            "type": "interface",
            "name": "argent::account::interface::IAccount",
            "items": [
                {
                    "type": "function",
                    "name": "__validate__",
                    "inputs": [
                        {
                            "name": "calls",
                            "type": "core::array::Array::<core::starknet::account::Call>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "__execute__",
                    "inputs": [
                        {
                            "name": "calls",
                            "type": "core::array::Array::<core::starknet::account::Call>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::array::Array::<core::array::Span::<core::felt252>>"
                        }
                    ],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "is_valid_signature",
                    "inputs": [
                        {
                            "name": "hash",
                            "type": "core::felt252"
                        },
                        {
                            "name": "signature",
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "UpgradeableCallbackOldImpl",
            "interface_name": "argent::upgrade::interface::IUpgradableCallbackOld"
        },
        {
            "type": "interface",
            "name": "argent::upgrade::interface::IUpgradableCallbackOld",
            "items": [
                {
                    "type": "function",
                    "name": "execute_after_upgrade",
                    "inputs": [
                        {
                            "name": "data",
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "state_mutability": "external"
                }
            ]
        },
        {
            "type": "impl",
            "name": "UpgradeableCallbackImpl",
            "interface_name": "argent::upgrade::interface::IUpgradableCallback"
        },
        {
            "type": "interface",
            "name": "argent::upgrade::interface::IUpgradableCallback",
            "items": [
                {
                    "type": "function",
                    "name": "perform_upgrade",
                    "inputs": [
                        {
                            "name": "new_implementation",
                            "type": "core::starknet::class_hash::ClassHash"
                        },
                        {
                            "name": "data",
                            "type": "core::array::Span::<core::felt252>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                }
            ]
        },
        {
            "type": "impl",
            "name": "ArgentUserAccountImpl",
            "interface_name": "argent::account::interface::IArgentUserAccount"
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::StarknetSigner",
            "members": [
                {
                    "name": "pubkey",
                    "type": "core::zeroable::NonZero::<core::felt252>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::starknet::eth_address::EthAddress",
            "members": [
                {
                    "name": "address",
                    "type": "core::felt252"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::Secp256k1Signer",
            "members": [
                {
                    "name": "pubkey_hash",
                    "type": "core::starknet::eth_address::EthAddress"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::integer::u256",
            "members": [
                {
                    "name": "low",
                    "type": "core::integer::u128"
                },
                {
                    "name": "high",
                    "type": "core::integer::u128"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::Secp256r1Signer",
            "members": [
                {
                    "name": "pubkey",
                    "type": "core::zeroable::NonZero::<core::integer::u256>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::Eip191Signer",
            "members": [
                {
                    "name": "eth_address",
                    "type": "core::starknet::eth_address::EthAddress"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::array::Span::<core::integer::u8>",
            "members": [
                {
                    "name": "snapshot",
                    "type": "@core::array::Array::<core::integer::u8>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::WebauthnSigner",
            "members": [
                {
                    "name": "origin",
                    "type": "core::array::Span::<core::integer::u8>"
                },
                {
                    "name": "rp_id_hash",
                    "type": "core::zeroable::NonZero::<core::integer::u256>"
                },
                {
                    "name": "pubkey",
                    "type": "core::zeroable::NonZero::<core::integer::u256>"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::signer::signer_signature::Signer",
            "variants": [
                {
                    "name": "Starknet",
                    "type": "argent::signer::signer_signature::StarknetSigner"
                },
                {
                    "name": "Secp256k1",
                    "type": "argent::signer::signer_signature::Secp256k1Signer"
                },
                {
                    "name": "Secp256r1",
                    "type": "argent::signer::signer_signature::Secp256r1Signer"
                },
                {
                    "name": "Eip191",
                    "type": "argent::signer::signer_signature::Eip191Signer"
                },
                {
                    "name": "Webauthn",
                    "type": "argent::signer::signer_signature::WebauthnSigner"
                }
            ]
        },
        {
            "type": "enum",
            "name": "core::option::Option::<argent::signer::signer_signature::Signer>",
            "variants": [
                {
                    "name": "Some",
                    "type": "argent::signer::signer_signature::Signer"
                },
                {
                    "name": "None",
                    "type": "()"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::StarknetSignature",
            "members": [
                {
                    "name": "r",
                    "type": "core::felt252"
                },
                {
                    "name": "s",
                    "type": "core::felt252"
                }
            ]
        },
        {
            "type": "enum",
            "name": "core::bool",
            "variants": [
                {
                    "name": "False",
                    "type": "()"
                },
                {
                    "name": "True",
                    "type": "()"
                }
            ]
        },
        {
            "type": "struct",
            "name": "core::starknet::secp256_trait::Signature",
            "members": [
                {
                    "name": "r",
                    "type": "core::integer::u256"
                },
                {
                    "name": "s",
                    "type": "core::integer::u256"
                },
                {
                    "name": "y_parity",
                    "type": "core::bool"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::signer::webauthn::Sha256Implementation",
            "variants": [
                {
                    "name": "Cairo0",
                    "type": "()"
                },
                {
                    "name": "Cairo1",
                    "type": "()"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::webauthn::WebauthnSignature",
            "members": [
                {
                    "name": "cross_origin",
                    "type": "core::bool"
                },
                {
                    "name": "client_data_json_outro",
                    "type": "core::array::Span::<core::integer::u8>"
                },
                {
                    "name": "flags",
                    "type": "core::integer::u8"
                },
                {
                    "name": "sign_count",
                    "type": "core::integer::u32"
                },
                {
                    "name": "ec_signature",
                    "type": "core::starknet::secp256_trait::Signature"
                },
                {
                    "name": "sha256_implementation",
                    "type": "argent::signer::webauthn::Sha256Implementation"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::signer::signer_signature::SignerSignature",
            "variants": [
                {
                    "name": "Starknet",
                    "type": "(argent::signer::signer_signature::StarknetSigner, argent::signer::signer_signature::StarknetSignature)"
                },
                {
                    "name": "Secp256k1",
                    "type": "(argent::signer::signer_signature::Secp256k1Signer, core::starknet::secp256_trait::Signature)"
                },
                {
                    "name": "Secp256r1",
                    "type": "(argent::signer::signer_signature::Secp256r1Signer, core::starknet::secp256_trait::Signature)"
                },
                {
                    "name": "Eip191",
                    "type": "(argent::signer::signer_signature::Eip191Signer, core::starknet::secp256_trait::Signature)"
                },
                {
                    "name": "Webauthn",
                    "type": "(argent::signer::signer_signature::WebauthnSigner, argent::signer::webauthn::WebauthnSignature)"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::signer::signer_signature::SignerType",
            "variants": [
                {
                    "name": "Starknet",
                    "type": "()"
                },
                {
                    "name": "Secp256k1",
                    "type": "()"
                },
                {
                    "name": "Secp256r1",
                    "type": "()"
                },
                {
                    "name": "Eip191",
                    "type": "()"
                },
                {
                    "name": "Webauthn",
                    "type": "()"
                }
            ]
        },
        {
            "type": "enum",
            "name": "core::option::Option::<core::felt252>",
            "variants": [
                {
                    "name": "Some",
                    "type": "core::felt252"
                },
                {
                    "name": "None",
                    "type": "()"
                }
            ]
        },
        {
            "type": "enum",
            "name": "core::option::Option::<argent::signer::signer_signature::SignerType>",
            "variants": [
                {
                    "name": "Some",
                    "type": "argent::signer::signer_signature::SignerType"
                },
                {
                    "name": "None",
                    "type": "()"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::recovery::interface::LegacyEscapeType",
            "variants": [
                {
                    "name": "None",
                    "type": "()"
                },
                {
                    "name": "Guardian",
                    "type": "()"
                },
                {
                    "name": "Owner",
                    "type": "()"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::signer::signer_signature::SignerStorageValue",
            "members": [
                {
                    "name": "stored_value",
                    "type": "core::felt252"
                },
                {
                    "name": "signer_type",
                    "type": "argent::signer::signer_signature::SignerType"
                }
            ]
        },
        {
            "type": "enum",
            "name": "core::option::Option::<argent::signer::signer_signature::SignerStorageValue>",
            "variants": [
                {
                    "name": "Some",
                    "type": "argent::signer::signer_signature::SignerStorageValue"
                },
                {
                    "name": "None",
                    "type": "()"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::recovery::interface::LegacyEscape",
            "members": [
                {
                    "name": "ready_at",
                    "type": "core::integer::u64"
                },
                {
                    "name": "escape_type",
                    "type": "argent::recovery::interface::LegacyEscapeType"
                },
                {
                    "name": "new_signer",
                    "type": "core::option::Option::<argent::signer::signer_signature::SignerStorageValue>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::account::interface::Version",
            "members": [
                {
                    "name": "major",
                    "type": "core::integer::u8"
                },
                {
                    "name": "minor",
                    "type": "core::integer::u8"
                },
                {
                    "name": "patch",
                    "type": "core::integer::u8"
                }
            ]
        },
        {
            "type": "enum",
            "name": "argent::recovery::interface::EscapeStatus",
            "variants": [
                {
                    "name": "None",
                    "type": "()"
                },
                {
                    "name": "NotReady",
                    "type": "()"
                },
                {
                    "name": "Ready",
                    "type": "()"
                },
                {
                    "name": "Expired",
                    "type": "()"
                }
            ]
        },
        {
            "type": "interface",
            "name": "argent::account::interface::IArgentUserAccount",
            "items": [
                {
                    "type": "function",
                    "name": "__validate_declare__",
                    "inputs": [
                        {
                            "name": "class_hash",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "__validate_deploy__",
                    "inputs": [
                        {
                            "name": "class_hash",
                            "type": "core::felt252"
                        },
                        {
                            "name": "contract_address_salt",
                            "type": "core::felt252"
                        },
                        {
                            "name": "owner",
                            "type": "argent::signer::signer_signature::Signer"
                        },
                        {
                            "name": "guardian",
                            "type": "core::option::Option::<argent::signer::signer_signature::Signer>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "set_escape_security_period",
                    "inputs": [
                        {
                            "name": "new_security_period",
                            "type": "core::integer::u64"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "change_owner",
                    "inputs": [
                        {
                            "name": "signer_signature",
                            "type": "argent::signer::signer_signature::SignerSignature"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "change_guardian",
                    "inputs": [
                        {
                            "name": "new_guardian",
                            "type": "core::option::Option::<argent::signer::signer_signature::Signer>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "change_guardian_backup",
                    "inputs": [
                        {
                            "name": "new_guardian_backup",
                            "type": "core::option::Option::<argent::signer::signer_signature::Signer>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "trigger_escape_owner",
                    "inputs": [
                        {
                            "name": "new_owner",
                            "type": "argent::signer::signer_signature::Signer"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "trigger_escape_guardian",
                    "inputs": [
                        {
                            "name": "new_guardian",
                            "type": "core::option::Option::<argent::signer::signer_signature::Signer>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "escape_owner",
                    "inputs": [],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "escape_guardian",
                    "inputs": [],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "cancel_escape",
                    "inputs": [],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "get_owner",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_owner_guid",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_owner_type",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "argent::signer::signer_signature::SignerType"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "is_guardian",
                    "inputs": [
                        {
                            "name": "guardian",
                            "type": "argent::signer::signer_signature::Signer"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::bool"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian_guid",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::option::Option::<core::felt252>"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian_type",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::option::Option::<argent::signer::signer_signature::SignerType>"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian_backup",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian_backup_guid",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::option::Option::<core::felt252>"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_guardian_backup_type",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::option::Option::<argent::signer::signer_signature::SignerType>"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_escape",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "argent::recovery::interface::LegacyEscape"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_name",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_version",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "argent::account::interface::Version"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_last_owner_trigger_escape_attempt",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u64"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_last_guardian_trigger_escape_attempt",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u64"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_last_owner_escape_attempt",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u64"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_last_guardian_escape_attempt",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u64"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_escape_and_status",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "(argent::recovery::interface::LegacyEscape, argent::recovery::interface::EscapeStatus)"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_escape_security_period",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::integer::u64"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "DeprecatedArgentAccountImpl",
            "interface_name": "argent::account::interface::IDeprecatedArgentAccount"
        },
        {
            "type": "interface",
            "name": "argent::account::interface::IDeprecatedArgentAccount",
            "items": [
                {
                    "type": "function",
                    "name": "getVersion",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "getName",
                    "inputs": [],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "isValidSignature",
                    "inputs": [
                        {
                            "name": "hash",
                            "type": "core::felt252"
                        },
                        {
                            "name": "signatures",
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "Sessionable",
            "interface_name": "argent::session::interface::ISessionable"
        },
        {
            "type": "interface",
            "name": "argent::session::interface::ISessionable",
            "items": [
                {
                    "type": "function",
                    "name": "revoke_session",
                    "inputs": [
                        {
                            "name": "session_hash",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "is_session_revoked",
                    "inputs": [
                        {
                            "name": "session_hash",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::bool"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "is_session_authorization_cached",
                    "inputs": [
                        {
                            "name": "session_hash",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::bool"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "ExecuteFromOutside",
            "interface_name": "argent::outside_execution::interface::IOutsideExecution"
        },
        {
            "type": "struct",
            "name": "core::array::Span::<core::starknet::account::Call>",
            "members": [
                {
                    "name": "snapshot",
                    "type": "@core::array::Array::<core::starknet::account::Call>"
                }
            ]
        },
        {
            "type": "struct",
            "name": "argent::outside_execution::interface::OutsideExecution",
            "members": [
                {
                    "name": "caller",
                    "type": "core::starknet::contract_address::ContractAddress"
                },
                {
                    "name": "nonce",
                    "type": "core::felt252"
                },
                {
                    "name": "execute_after",
                    "type": "core::integer::u64"
                },
                {
                    "name": "execute_before",
                    "type": "core::integer::u64"
                },
                {
                    "name": "calls",
                    "type": "core::array::Span::<core::starknet::account::Call>"
                }
            ]
        },
        {
            "type": "interface",
            "name": "argent::outside_execution::interface::IOutsideExecution",
            "items": [
                {
                    "type": "function",
                    "name": "execute_from_outside",
                    "inputs": [
                        {
                            "name": "outside_execution",
                            "type": "argent::outside_execution::interface::OutsideExecution"
                        },
                        {
                            "name": "signature",
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::array::Array::<core::array::Span::<core::felt252>>"
                        }
                    ],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "execute_from_outside_v2",
                    "inputs": [
                        {
                            "name": "outside_execution",
                            "type": "argent::outside_execution::interface::OutsideExecution"
                        },
                        {
                            "name": "signature",
                            "type": "core::array::Span::<core::felt252>"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::array::Array::<core::array::Span::<core::felt252>>"
                        }
                    ],
                    "state_mutability": "external"
                },
                {
                    "type": "function",
                    "name": "is_valid_outside_execution_nonce",
                    "inputs": [
                        {
                            "name": "nonce",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::bool"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_outside_execution_message_hash_rev_0",
                    "inputs": [
                        {
                            "name": "outside_execution",
                            "type": "argent::outside_execution::interface::OutsideExecution"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                },
                {
                    "type": "function",
                    "name": "get_outside_execution_message_hash_rev_1",
                    "inputs": [
                        {
                            "name": "outside_execution",
                            "type": "argent::outside_execution::interface::OutsideExecution"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "SRC5",
            "interface_name": "argent::introspection::interface::ISRC5"
        },
        {
            "type": "interface",
            "name": "argent::introspection::interface::ISRC5",
            "items": [
                {
                    "type": "function",
                    "name": "supports_interface",
                    "inputs": [
                        {
                            "name": "interface_id",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::bool"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "SRC5Legacy",
            "interface_name": "argent::introspection::interface::ISRC5Legacy"
        },
        {
            "type": "interface",
            "name": "argent::introspection::interface::ISRC5Legacy",
            "items": [
                {
                    "type": "function",
                    "name": "supportsInterface",
                    "inputs": [
                        {
                            "name": "interfaceId",
                            "type": "core::felt252"
                        }
                    ],
                    "outputs": [
                        {
                            "type": "core::felt252"
                        }
                    ],
                    "state_mutability": "view"
                }
            ]
        },
        {
            "type": "impl",
            "name": "Upgradable",
            "interface_name": "argent::upgrade::interface::IUpgradeable"
        },
        {
            "type": "interface",
            "name": "argent::upgrade::interface::IUpgradeable",
            "items": [
                {
                    "type": "function",
                    "name": "upgrade",
                    "inputs": [
                        {
                            "name": "new_implementation",
                            "type": "core::starknet::class_hash::ClassHash"
                        },
                        {
                            "name": "data",
                            "type": "core::array::Array::<core::felt252>"
                        }
                    ],
                    "outputs": [],
                    "state_mutability": "external"
                }
            ]
        },
        {
            "type": "constructor",
            "name": "constructor",
            "inputs": [
                {
                    "name": "owner",
                    "type": "argent::signer::signer_signature::Signer"
                },
                {
                    "name": "guardian",
                    "type": "core::option::Option::<argent::signer::signer_signature::Signer>"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::outside_execution::outside_execution::outside_execution_component::Event",
            "kind": "enum",
            "variants": []
        },
        {
            "type": "event",
            "name": "argent::introspection::src5::src5_component::Event",
            "kind": "enum",
            "variants": []
        },
        {
            "type": "event",
            "name": "argent::upgrade::upgrade::upgrade_component::AccountUpgraded",
            "kind": "struct",
            "members": [
                {
                    "name": "new_implementation",
                    "type": "core::starknet::class_hash::ClassHash",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::upgrade::upgrade::upgrade_component::Event",
            "kind": "enum",
            "variants": [
                {
                    "name": "AccountUpgraded",
                    "type": "argent::upgrade::upgrade::upgrade_component::AccountUpgraded",
                    "kind": "nested"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::session::session::session_component::SessionRevoked",
            "kind": "struct",
            "members": [
                {
                    "name": "session_hash",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::session::session::session_component::Event",
            "kind": "enum",
            "variants": [
                {
                    "name": "SessionRevoked",
                    "type": "argent::session::session::session_component::SessionRevoked",
                    "kind": "nested"
                }
            ]
        },
        {
            "type": "event",
            "name": "openzeppelin::security::reentrancyguard::ReentrancyGuardComponent::Event",
            "kind": "enum",
            "variants": []
        },
        {
            "type": "struct",
            "name": "core::array::Span::<core::array::Span::<core::felt252>>",
            "members": [
                {
                    "name": "snapshot",
                    "type": "@core::array::Array::<core::array::Span::<core::felt252>>"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::TransactionExecuted",
            "kind": "struct",
            "members": [
                {
                    "name": "hash",
                    "type": "core::felt252",
                    "kind": "key"
                },
                {
                    "name": "response",
                    "type": "core::array::Span::<core::array::Span::<core::felt252>>",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::AccountCreated",
            "kind": "struct",
            "members": [
                {
                    "name": "owner",
                    "type": "core::felt252",
                    "kind": "key"
                },
                {
                    "name": "guardian",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::AccountCreatedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "owner_guid",
                    "type": "core::felt252",
                    "kind": "key"
                },
                {
                    "name": "guardian_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::EscapeOwnerTriggeredGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "ready_at",
                    "type": "core::integer::u64",
                    "kind": "data"
                },
                {
                    "name": "new_owner_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::EscapeGuardianTriggeredGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "ready_at",
                    "type": "core::integer::u64",
                    "kind": "data"
                },
                {
                    "name": "new_guardian_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::OwnerEscapedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "new_owner_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::GuardianEscapedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "new_guardian_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::EscapeCanceled",
            "kind": "struct",
            "members": []
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::OwnerChanged",
            "kind": "struct",
            "members": [
                {
                    "name": "new_owner",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::OwnerChangedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "new_owner_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::GuardianChanged",
            "kind": "struct",
            "members": [
                {
                    "name": "new_guardian",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::GuardianChangedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "new_guardian_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::GuardianBackupChanged",
            "kind": "struct",
            "members": [
                {
                    "name": "new_guardian_backup",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::GuardianBackupChangedGuid",
            "kind": "struct",
            "members": [
                {
                    "name": "new_guardian_backup_guid",
                    "type": "core::felt252",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::SignerLinked",
            "kind": "struct",
            "members": [
                {
                    "name": "signer_guid",
                    "type": "core::felt252",
                    "kind": "key"
                },
                {
                    "name": "signer",
                    "type": "argent::signer::signer_signature::Signer",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::EscapeSecurityPeriodChanged",
            "kind": "struct",
            "members": [
                {
                    "name": "escape_security_period",
                    "type": "core::integer::u64",
                    "kind": "data"
                }
            ]
        },
        {
            "type": "event",
            "name": "argent::presets::argent_account::ArgentAccount::Event",
            "kind": "enum",
            "variants": [
                {
                    "name": "ExecuteFromOutsideEvents",
                    "type": "argent::outside_execution::outside_execution::outside_execution_component::Event",
                    "kind": "flat"
                },
                {
                    "name": "SRC5Events",
                    "type": "argent::introspection::src5::src5_component::Event",
                    "kind": "flat"
                },
                {
                    "name": "UpgradeEvents",
                    "type": "argent::upgrade::upgrade::upgrade_component::Event",
                    "kind": "flat"
                },
                {
                    "name": "SessionableEvents",
                    "type": "argent::session::session::session_component::Event",
                    "kind": "flat"
                },
                {
                    "name": "ReentrancyGuardEvent",
                    "type": "openzeppelin::security::reentrancyguard::ReentrancyGuardComponent::Event",
                    "kind": "flat"
                },
                {
                    "name": "TransactionExecuted",
                    "type": "argent::presets::argent_account::ArgentAccount::TransactionExecuted",
                    "kind": "nested"
                },
                {
                    "name": "AccountCreated",
                    "type": "argent::presets::argent_account::ArgentAccount::AccountCreated",
                    "kind": "nested"
                },
                {
                    "name": "AccountCreatedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::AccountCreatedGuid",
                    "kind": "nested"
                },
                {
                    "name": "EscapeOwnerTriggeredGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::EscapeOwnerTriggeredGuid",
                    "kind": "nested"
                },
                {
                    "name": "EscapeGuardianTriggeredGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::EscapeGuardianTriggeredGuid",
                    "kind": "nested"
                },
                {
                    "name": "OwnerEscapedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::OwnerEscapedGuid",
                    "kind": "nested"
                },
                {
                    "name": "GuardianEscapedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::GuardianEscapedGuid",
                    "kind": "nested"
                },
                {
                    "name": "EscapeCanceled",
                    "type": "argent::presets::argent_account::ArgentAccount::EscapeCanceled",
                    "kind": "nested"
                },
                {
                    "name": "OwnerChanged",
                    "type": "argent::presets::argent_account::ArgentAccount::OwnerChanged",
                    "kind": "nested"
                },
                {
                    "name": "OwnerChangedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::OwnerChangedGuid",
                    "kind": "nested"
                },
                {
                    "name": "GuardianChanged",
                    "type": "argent::presets::argent_account::ArgentAccount::GuardianChanged",
                    "kind": "nested"
                },
                {
                    "name": "GuardianChangedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::GuardianChangedGuid",
                    "kind": "nested"
                },
                {
                    "name": "GuardianBackupChanged",
                    "type": "argent::presets::argent_account::ArgentAccount::GuardianBackupChanged",
                    "kind": "nested"
                },
                {
                    "name": "GuardianBackupChangedGuid",
                    "type": "argent::presets::argent_account::ArgentAccount::GuardianBackupChangedGuid",
                    "kind": "nested"
                },
                {
                    "name": "SignerLinked",
                    "type": "argent::presets::argent_account::ArgentAccount::SignerLinked",
                    "kind": "nested"
                },
                {
                    "name": "EscapeSecurityPeriodChanged",
                    "type": "argent::presets::argent_account::ArgentAccount::EscapeSecurityPeriodChanged",
                    "kind": "nested"
                }
            ]
        }
    ]
}
