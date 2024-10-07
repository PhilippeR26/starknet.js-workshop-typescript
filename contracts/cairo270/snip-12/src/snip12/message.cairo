use core::poseidon::{PoseidonTrait, poseidon_hash_span};
use core::hash::HashStateTrait;
use starknet::{get_tx_info, get_caller_address, testing::set_caller_address};
use starknet::ContractAddress;

use super::struct_gift_authorize::GiftAuthorize;
use super::sn_domain::{StarknetDomain, StructHashStarknetDomain};

pub trait IOffchainMessageHash<T> {
    fn get_message_hash(self: @T, account_address: ContractAddress) -> felt252;
}

pub impl OffchainMessageHashGiftAuthorize of IOffchainMessageHash<GiftAuthorize> {
    fn get_message_hash(self: @GiftAuthorize, account_address: ContractAddress) -> felt252 {
        let domain = StarknetDomain {
            name: 'Gift', chain_id: get_tx_info().unbox().chain_id, version: 1
        };
        // let mut hash = PoseidonTrait::new();
        // hash = hash.update('StarkNet Message');
        // hash = hash.update(domain.hash_struct());
        // hash = hash.update(account_address.into());
        // hash = hash.update(self.hash_struct());
        // let result = hash.finalize();
        // result
        poseidon_hash_span(
            array![
                'StarkNet Message', domain.hash_struct(), account_address.into(), self.hash_struct()
            ]
                .span()
        )
    }
}

