use core::poseidon::poseidon_hash_span;
use super::structure::IStructHash;
use crate::utils::convert::convert_b31_to_f252;

#[derive(Drop, Serde)]
pub struct LongString {
    pub to_store: Array<bytes31>,
}

pub const LONG_STRING_TYPE_HASH: felt252 = selector!("\"Message\"(\"to_store\":\"shortstring*\")");

pub impl StructHashLongString of IStructHash<LongString> {
    fn hash_struct(self: LongString) -> felt252 {
        let mut to_hash: Array<felt252> = array![LONG_STRING_TYPE_HASH];
        let arr: Span<felt252> = convert_b31_to_f252(self.to_store);
        let array_f252: felt252 = poseidon_hash_span(arr);
        to_hash.append(array_f252);
        poseidon_hash_span(to_hash.span())
    }
}
