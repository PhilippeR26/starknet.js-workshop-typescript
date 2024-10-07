use core::hash::HashStateTrait;
use core::poseidon::{PoseidonTrait, poseidon_hash_span};

use super::structure::IStructHash;

#[derive(Drop, Copy, Hash, Serde)]
pub struct StarknetDomain {
    pub name: felt252,
    pub chain_id: felt252,
    pub version: felt252,
}

pub const STARKNET_DOMAIN_TYPE_HASH: felt252 =
    selector!(
        "\"StarknetDomain\"(\"name\":\"shortstring\",\"chainId\":\"shortstring\",\"version\":\"shortstring\")"
    );

pub impl StructHashStarknetDomain of IStructHash<StarknetDomain> {
    fn hash_struct(self: @StarknetDomain) -> felt252 {
        poseidon_hash_span(
            array![STARKNET_DOMAIN_TYPE_HASH, *self.name, *self.chain_id, *self.version].span()
        )
    }
}

