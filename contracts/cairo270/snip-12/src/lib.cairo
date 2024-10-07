pub mod snip12;
use snip12::sn_domain::StarknetDomain;
use snip12::struct_gift_authorize::GiftAuthorize;
use starknet::ContractAddress;


#[starknet::interface]
trait IGiftMessage<TContractState> {
    fn get_hash_domain(self: @TContractState, name: felt252) -> felt252;
    fn get_hash_message(
        self: @TContractState, message: GiftAuthorize, account_addr: ContractAddress
    ) -> felt252;
    fn test_poseidon(self: @TContractState, val1: felt252, val2: felt252, val3: felt252) -> felt252;
    fn process_message(ref self: TContractState, message: GiftAuthorize, signature: Array<felt252>);
    fn get_current_gift(self:@TContractState)->u128;
}


#[starknet::contract]
mod checkMessageGift {
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::ContractAddress;
    use core::poseidon::PoseidonTrait;

    use core::hash::{HashStateTrait, HashStateExTrait};

    use starknet::{
        contract_address_const, get_tx_info, get_caller_address, testing::set_caller_address,syscalls, SyscallResultTrait
    };

    use super::snip12::structure::IStructHash;
    use super::snip12::sn_domain::StarknetDomain;
    use super::snip12::struct_gift_authorize::GiftAuthorize;
    use super::snip12::message::OffchainMessageHashGiftAuthorize;

    #[storage]
    struct Storage {
        gift_id: u128,
    }

    #[abi(embed_v0)]
    impl GiftImpl of super::IGiftMessage<ContractState> {
        fn get_hash_domain(self: @ContractState, name: felt252) -> felt252 {
            let my_domain = StarknetDomain { 
                name: name, chain_id: get_tx_info().unbox().chain_id, version: 1 };
           // name: name, version: 1, chain_id: chain };
            my_domain.hash_struct()
        }

        fn get_hash_message(
            self: @ContractState, message: GiftAuthorize, account_addr: ContractAddress
        ) -> felt252 {
            message.get_message_hash(account_addr)
        }
        fn test_poseidon(
            self: @ContractState, val1: felt252, val2: felt252, val3: felt252
        ) -> felt252 {
            let mut hash = PoseidonTrait::new();
            hash = hash.update(val1);
            hash = hash.update(val2);
            hash = hash.update(val3);
            // hash = hash.update(3);
            let result = hash.finalize();
            return result;
        }

        fn process_message(ref self: ContractState, message: GiftAuthorize, signature: Array<felt252>) {
            let msg_hash=self.get_hash_message(message, get_caller_address());
            let mut call_data: Array<felt252> = array![];
            Serde::serialize(@msg_hash, ref call_data);
            Serde::serialize(@signature, ref call_data);

            let mut res = syscalls::call_contract_syscall(
                get_caller_address(), selector!("is_valid_signature"), call_data.span()
            )
                .unwrap_syscall();

            let result=Serde::<felt252>::deserialize(ref res).unwrap();
            if result==starknet::VALIDATED {
                self.gift_id.write(message.gift_id);
            }else {
                self.gift_id.write(0_u128);
            }
        }

        fn get_current_gift(self:@ContractState)->u128 {
            self.gift_id.read()
        }
    }
}
// use starknet::{
//     contract_address_const, get_tx_info, get_caller_address, testing::set_caller_address
// };
// use snip12::message::OffchainMessageHashGiftAuthorize;
//     #[test]
// #[available_gas(2000000)]
// fn test_valid_hash() {
//     // This value was computed using StarknetJS
//     let gift_struct = GiftAuthorize { date_start: 712, gift_id: 42 };
//     let message_hash = 0x1e739b39f83b38f182edaed69f730f18eff802d3ef44be91c3733cdcab6de2f;
//     set_caller_address(contract_address_const::<420>());
//     assert(gift_struct.get_message_hash() == message_hash, 'Hash should be valid');
//}


