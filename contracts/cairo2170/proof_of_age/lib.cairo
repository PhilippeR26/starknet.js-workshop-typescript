// Attest that a people is at least 18 years old.
// Coded with Cairo 2.17.0
// contract not audited ; use at your own risks.

// Architecture: The frontend is requesting the scan of the ID document of the person. It
// establishes the validity of the document, and use a "faceId" to ensure that this person is
// related to the document. If all is valid, the birth date is returned.
// Each person is identified in the backend by a secret value.

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
    nonce: felt252 // a random nonce provided to avoid replay attacks
}

// private data provided to the proof
#[derive(Drop, Serde)]
struct PrivateInputsForProof {
    birth_date_timestamp: u64, // birth date of the user in timestamp format (secondes), generated for example from the scan of an ID document. This data is private and is not shared with the contract or included in the proof_facts.
    secret: felt252 // A secret for each user.
}


// payload of L2->L1 message (payload of ProofMessage struct).
// these data are used in the verification function.
#[derive(Drop, Serde)]
struct L1L2message {
    current_date: u64, // current date in timestamp format (secondes)
    nullifier: felt252, // a nullifier to avoid replay attacks
    has_18_years: bool // result of the proof (true if the user is at least 18 years old)
}

#[starknet::interface]
pub trait ICalculation<TContractState> {
    fn create_proof_of_age(
        self: @TContractState,
        public_input: PublicInputsForProof,
        private_input: PrivateInputsForProof,
    );
    fn verify_proof_of_age(ref self: TContractState, public_message: L1L2message);
    fn read_result(self: @TContractState) -> felt252;
}

const SECONDS18YEARS: u64 = 18 * 365 * 24 * 3600; // f..k bissextile years


#[starknet::contract]
mod PrivateVoteVerifierMultiRound {
    use core::array::ArrayTrait;
    use core::poseidon::poseidon_hash_span;
    use core::serde::Serde;
    use core::traits::Into;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{
        SyscallResultTrait, get_block_number, get_block_timestamp, get_contract_address, syscalls,
    };
    use crate::{
        L1L2message, PrivateInputsForProof, ProofMessage, PublicInputsForProof, SECONDS18YEARS,
    };

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
        nullifier: Map<felt252, bool>, // mapping used nullifiers (to prevent replay attacks)
        result: bool // just to
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
        let info = starknet::syscalls::get_execution_info_v3_syscall().unwrap_syscall().unbox();
        let mut arr = info.tx_info.unbox().proof_facts;
        let pr_facts = Serde::<ProofFacts>::deserialize(ref arr).expect('ProofFacts deser failed');
        pr_facts.l1l2messages
    }

    // compute the hash of the public data of the proof (L1L2message struct) ; this hash is expected
    // to be in the proof_facts if the proof is valid.
    fn _compute_message_hash_for_proof_facts(pf: @ProofMessage) -> felt252 {
        let mut data: Array<felt252> = array![
            (*pf.from_address).into(), (*pf.to_address).into(), pf.payload.len().into(),
        ];
        for i in (pf.payload) {
            data.append(*i);
        }
        poseidon_hash_span(data.span())
    }

    // Randomness
    fn _get_pseudo_random_number(self: @ContractState) -> felt252 {
        // Retrieve entropy from the block context
        let timestamp = get_block_timestamp();
        let block_num = get_block_number();
        let mut data = ArrayTrait::new();
        data.append(timestamp.into());
        data.append(block_num.into());
        poseidon_hash_span(data.span())
    }


    // ──────────────────────────────────────────────
    // external abi functions
    // ──────────────────────────────────────────────
    #[abi(embed_v0)]
    impl HeavyCalculationContract of super::ICalculation<ContractState> {
        fn create_proof_of_age(
            self: @ContractState,
            public_input: PublicInputsForProof,
            private_input: PrivateInputsForProof,
        ) {
            let current_date = get_block_timestamp();
            let nullifier = poseidon_hash_span(
                array![private_input.secret, public_input.nonce].span(),
            );
            let has_18_years = private_input.birth_date_timestamp + SECONDS18YEARS <= current_date;
            assert(has_18_years, 'Not major');
            let message = L1L2message { current_date, nullifier, has_18_years };
            let mut ser: Array<felt252> = ArrayTrait::new();
            message.serialize(ref ser);
            syscalls::send_message_to_l1_syscall(0x00, ser.span()).unwrap_syscall();
        }


        fn verify_proof_of_age(ref self: ContractState, public_message: L1L2message) {
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
            // ******** Verifications made.
            assert(!self.nullifier.read(public_message.nullifier), 'Nullifier already used');
            self.nullifier.write(public_message.nullifier, true);
            self.result.write(public_message.has_18_years);
        }


        fn read_result(self: @ContractState) -> felt252 {
            self.result.read().into()
        }
    }
}
