use core::poseidon::{PoseidonTrait, poseidon_hash_span};
use core::hash::HashStateTrait;

use super::structure::IStructHash;

#[derive(Drop, Copy, Hash, Serde)]
pub struct GiftAuthorize {
    pub date_start: felt252,
    pub gift_id: u128,
}

pub const GIFT_AUTHORIZE_TYPE_HASH: felt252 =
    selector!("\"Message\"(\"date_start\":\"felt\",\"gift_id\":\"u128\")");

pub impl StructHashGiftAuthorize of IStructHash<GiftAuthorize> {
    fn hash_struct(self: @GiftAuthorize) -> felt252 {
        poseidon_hash_span(
            array![GIFT_AUTHORIZE_TYPE_HASH, *self.date_start, (*self.gift_id).into()].span()
        )
    }
}
