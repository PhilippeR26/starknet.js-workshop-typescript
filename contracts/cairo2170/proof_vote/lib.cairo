// Handle vote
// Coded with Cairo 2.17.0-rc.4
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
    vote: u8, // choice number
    round: u32 // vote ID
}

// private data provided to the proof
#[derive(Drop, Serde)]
struct PrivateInputsForProof {
    member_leaf: felt252, // hash of the member
    merkle_proof: Array<
        felt252,
    >, // merkle proof to validate that the member is in the list of voters.
    secret: felt252 // A fix member secret defined in the backend.
}

// payload of L2->L1 message (payload of ProofMessage struct).
// these data are used in the verification function.
#[derive(Drop, Serde)]
struct L1L2message {
    round: u32,
    nullifier: felt252,
    vote: u8,
}

#[starknet::interface]
pub trait IMerkleVerify<TContractState> {
    fn create_proof(
        self: @TContractState,
        public_input: PublicInputsForProof,
        private_input: PrivateInputsForProof,
    );
    fn verify_vote(ref self: TContractState, public_message: L1L2message);

    fn get_tally(self: @TContractState, round: u32) -> Array<u256>;
    fn get_merkle_root(self: @TContractState) -> felt252;
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn is_nullifier_used(self: @TContractState, round: u32, nullifier: felt252) -> bool;
    fn update_merkle_root(ref self: TContractState, new_root: felt252);

    fn open_round(ref self: TContractState, round: u32, vote_size: u8);
    fn close_round(ref self: TContractState, round: u32);
    fn is_round_open(self: @TContractState, round: u32) -> bool;
}

#[starknet::contract]
mod PrivateVoteVerifierMultiRound {
    use core::array::ArrayTrait;
    use core::poseidon::poseidon_hash_span;
    use core::traits::Into;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, SyscallResultTrait, get_caller_address, get_contract_address, get_tx_info,
        syscalls,
    };
    use crate::{L1L2message, PrivateInputsForProof, ProofMessage, PublicInputsForProof};

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
        merkle_root: felt252,
        used_nullifiers: Map<(u32, felt252), bool>,
        tally: Map<(u32, u8), u256>,
        vote_is_open: Map<u32, bool>,
        vote_size: Map<u32, u8>,
        owner: ContractAddress,
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VoteAdded: VoteAdded,
        RoundOpened: RoundOpened,
        RoundClosed: RoundClosed,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteAdded {
        #[key]
        round: u32,
        #[key]
        vote: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct RoundOpened {
        #[key]
        round: u32,
        vote_size: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct RoundClosed {
        #[key]
        round: u32,
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────
    #[constructor]
    fn constructor(ref self: ContractState, merkle_root: felt252) {
        self.merkle_root.write(merkle_root);
        self.owner.write(get_tx_info().unbox().account_contract_address);
    }

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

    // MERKLE VERIFY
    // Is the member in the voters whitelist?
    fn _merkle_verify(leaf: felt252, mut proof: Array<felt252>, root: felt252) -> bool {
        let mut hash = leaf;
        let mut i = 0_u32;
        while i < proof.len() {
            let hash_uint256: u256 = hash.into();
            let proof_item: u256 = (*proof[i]).into();
            if hash_uint256 < proof_item {
                hash = poseidon_hash_span(array![hash, *proof[i]].into());
            } else {
                hash = poseidon_hash_span(array![*proof[i], hash].into());
            }
            i += 1;
        }
        hash == root
    }


    // ──────────────────────────────────────────────
    // external abi functions
    // ──────────────────────────────────────────────
    #[abi(embed_v0)]
    impl ProofVerifyContract of super::IMerkleVerify<ContractState> {
        fn create_proof(
            self: @ContractState,
            public_input: PublicInputsForProof,
            private_input: PrivateInputsForProof,
        ) {
            assert(self.vote_is_open.read(public_input.round), 'Vote is not open');
            assert(
                public_input.vote >= 0_u8
                    && public_input.vote < self.vote_size.read(public_input.round),
                'Invalid vote value',
            );
            let computed_nullifier = poseidon_hash_span(
                array![
                    'hash_of_member_V1', private_input.member_leaf, public_input.round.into(),
                    private_input.secret,
                ]
                    .span(),
            );
            let nullifier_key = (public_input.round, computed_nullifier);
            assert(!self.used_nullifiers.read(nullifier_key), 'Nullifier used');
            let is_member = _merkle_verify(
                private_input.member_leaf, private_input.merkle_proof, self.merkle_root.read(),
            );
            assert(is_member, 'Not an authorized member');

            let message = L1L2message {
                round: public_input.round, nullifier: computed_nullifier, vote: public_input.vote,
            };
            let mut ser: Array<felt252> = ArrayTrait::new();
            message.serialize(ref ser);
            syscalls::send_message_to_l1_syscall(0x00, ser.span()).unwrap_syscall();
        }

        fn verify_vote(ref self: ContractState, public_message: L1L2message) {
            assert(
                public_message.vote < self.vote_size.read(public_message.round),
                'Invalid vote value',
            );

            let nullifier_key = (public_message.round, public_message.nullifier);
            assert(!self.used_nullifiers.read(nullifier_key), 'Nullifier used');

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
            // ******** Verifications made ; record the vote
            self.used_nullifiers.write(nullifier_key, true);
            let tally_key = (public_message.round, public_message.vote);
            let current = self.tally.read(tally_key);
            self.tally.write(tally_key, current + 1);
            self.emit(VoteAdded { round: public_message.round, vote: public_message.vote });
        }


        fn get_tally(self: @ContractState, round: u32) -> Array<u256> {
            let mut res = array![];
            for i in 0..(self.vote_size.read(round)) {
                res.append(self.tally.read((round, i)))
            }
            res
        }

        fn get_merkle_root(self: @ContractState) -> felt252 {
            self.merkle_root.read()
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn update_merkle_root(ref self: ContractState, new_root: felt252) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.merkle_root.write(new_root);
        }

        fn is_nullifier_used(self: @ContractState, round: u32, nullifier: felt252) -> bool {
            let key = (round, nullifier);
            self.used_nullifiers.read(key)
        }

        fn open_round(ref self: ContractState, round: u32, vote_size: u8) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.vote_size.write(round, vote_size);
            self.vote_is_open.write(round, true);
            self.emit(RoundOpened { round, vote_size });
        }

        fn close_round(ref self: ContractState, round: u32) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.emit(RoundClosed { round });
        }

        fn is_round_open(self: @ContractState, round: u32) -> bool {
            self.vote_is_open.read(round)
        }
    }
}
