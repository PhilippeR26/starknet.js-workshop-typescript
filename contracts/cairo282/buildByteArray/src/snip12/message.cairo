use core::poseidon::poseidon_hash_span;
use starknet::{get_tx_info};
use starknet::ContractAddress;

use super::struct_long_string::LongString;
use super::sn_domain::{StarknetDomain, StructHashStarknetDomain};

pub trait IOffchainMessageHash<T> {
    fn get_message_hash(self: T, account_address: ContractAddress) -> felt252;
}

pub impl OffchainMessageHashLongString of IOffchainMessageHash<LongString> {
    fn get_message_hash(self: LongString, account_address: ContractAddress) -> felt252 {
        let domain = StarknetDomain {
            name: 'ByteArrayTest', chain_id: get_tx_info().unbox().chain_id, version: 1
        };
        poseidon_hash_span(
            array![
                'StarkNet Message', domain.hash_struct(), account_address.into(), self.hash_struct()
            ]
                .span()
        )
    }
}

