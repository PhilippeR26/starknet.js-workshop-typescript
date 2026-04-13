// Calculate heavy hash
// Coded with Cairo 2.17.0
// contract not audited ; use at your own risks.

use starknet::{ContractAddress, EthAddress};

// a L2->L1 message (for communication between proof & verification)
#[derive(Drop, Serde)]
struct ProofMessage {
    from_address: ContractAddress,
    payload: Span<felt252>,
    to_address: EthAddress,
}

// public data provided to the proof
#[derive(Drop, Serde)]
struct PublicInputsForProof {
    text: ByteArray // some text to be hashed
}


// payload of L2->L1 message (payload of ProofMessage struct).
// these data are used in the verification function.
#[derive(Drop, Serde)]
struct L1L2message {
    text: ByteArray, // some text to be hashed
    hash: felt252 // hash of the text
}

#[starknet::interface]
pub trait ICalculation<TContractState> {
    fn create_calculation_proof(self: @TContractState, public_input: PublicInputsForProof);
    fn calculate_online(self: @TContractState, public_input: PublicInputsForProof) -> felt252;
    fn verify_calculation(ref self: TContractState, public_message: L1L2message);
    fn read_calculation_result(self: @TContractState) -> felt252;
}

#[starknet::contract]
mod PrivateVoteVerifierMultiRound {
    use core::array::ArrayTrait;
    use core::hash::HashStateTrait;
    use core::pedersen::PedersenTrait;
    use core::poseidon::poseidon_hash_span;
    use core::serde::Serde;
    use core::traits::Into;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{SyscallResultTrait, get_contract_address, syscalls};
    use crate::{L1L2message, ProofMessage, PublicInputsForProof};

    // recovered data from proof_facts of the transaction
    #[derive(Drop, Serde)]
    struct ProofFacts {
        PROOF0_marker: bytes31,
        VIRTUAL_SNOS_marker: bytes31,
        virtual_OS_program_hash: felt252,
        VIRTUAL_SNOS0_marker: bytes31,
        block_number: felt252,
        block_hash: felt252,
        OS_config_hash: felt252,
        l1l2messages: Span<felt252> // hashes of ProofMessages 
    }

    // ──────────────────────────────────────────────
    // Storage
    // ──────────────────────────────────────────────
    #[storage]
    struct Storage {
        result: felt252,
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────
    #[constructor]
    fn constructor(ref self: ContractState) {}

    // ──────────────────────────────────────────────
    // Internal functions
    // ──────────────────────────────────────────────

    // get the hashes of the public data of all L2->L1 messages
    fn _get_proof_messages_hashes() -> Span<felt252> {
        // Testnet
        let info = starknet::syscalls::get_execution_info_v3_syscall().unwrap_syscall().unbox();
        let mut arr = info.tx_info.unbox().proof_facts;
        let pr_facts = Serde::<ProofFacts>::deserialize(ref arr).expect('ProofFacts deser failed');
        pr_facts.l1l2messages
    }

    fn _compute_message_hash_for_proof_facts(pf: @ProofMessage) -> felt252 {
        let mut data: Array<felt252> = array![
            (*pf.from_address).into(), (*pf.to_address).into(), pf.payload.len().into(),
        ];
        for i in (pf.payload) {
            data.append(*i);
        }
        poseidon_hash_span(data.span())
    }

    // Keccak hash of a ByteArray
    fn _get_text_hash(input: @ByteArray) -> felt252 {
        let mut serialized_data = array![];
        input.serialize(ref serialized_data);
        let mut state = PedersenTrait::new(0);
        let mut span = serialized_data.span();
        while let Option::Some(value) = span.pop_front() {
            state = state.update(*value);
        }
        state.finalize()
    }


    // ──────────────────────────────────────────────
    // external abi functions
    // ──────────────────────────────────────────────
    #[abi(embed_v0)]
    impl HeavyCalculationContract of super::ICalculation<ContractState> {
        fn create_calculation_proof(self: @ContractState, public_input: PublicInputsForProof) {
            let hash = _get_text_hash(@public_input.text);
            let message = L1L2message { text: public_input.text, hash };
            let mut ser: Array<felt252> = ArrayTrait::new();
            message.serialize(ref ser);
            syscalls::send_message_to_l1_syscall(0x00, ser.span()).unwrap_syscall();
        }

        fn calculate_online(self: @ContractState, public_input: PublicInputsForProof) -> felt252 {
            _get_text_hash(@public_input.text)
        }

        fn verify_calculation(ref self: ContractState, public_message: L1L2message) {
            // ******** SNIP-36 verification of public message
            let proof_facts = _get_proof_messages_hashes();
            let mut ser: Array<felt252> = ArrayTrait::new();
            public_message.serialize(ref ser);
            let message = ProofMessage {
                from_address: get_contract_address(), // ensure that the proof has been created by this contract
                payload: ser.span(),
                to_address: 0x00_felt252.try_into().unwrap(),
            };
            let calculated_message_H = _compute_message_hash_for_proof_facts(@message);
            assert(calculated_message_H == *proof_facts.at(0), 'pub message not related to hash');
            // ******** Verifications made ; result of calculation can be used safely
            self.result.write(public_message.hash);
        }

        fn read_calculation_result(self: @ContractState) -> felt252 {
            self.result.read()
        }
    }
}
