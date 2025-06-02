// Collection of functions for Braavos account v1.2.0 creation, using snip-29 paymaster.
// Coded with Starknet.js v7.4.0
// Handle Rpc0.8V3

import { ec, hash, num, constants, CallData, stark, BigNumberish, type RpcProvider, type DeployAccountSignerDetails, type V3DeployAccountSignerDetails, type V3InvocationsSignerDetails, type UniversalDetails, type V3TransactionDetails, type EstimateFeeResponse } from "starknet";
import { type DeployContractResponse, type Calldata, type DeployAccountContractPayload, type EstimateFeeDetails, type CairoVersion, type DeployAccountContractTransaction, } from "starknet";
import { EDAMode, EDataAvailabilityMode, ETransactionVersion, ETransactionVersion3, type ResourceBounds } from "@starknet-io/types-js";


export const BraavosBaseClassHash = "0x3d16c7a9a60b0593bd202f660a28c5d76e0403601d9ccc7e4fa253b6a70c201";
export const BraavosAccountClassHash = "0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a"; // v1.2.0


export function getBraavosSignatureData(
    privateKeyBraavos: BigNumberish,
    chainId: constants.StarknetChainId,
): string[] {

    // braavos v1.0.0 specific deployment signature :
    // sig[0: 1] - r,s from stark sign on txn_hash (not used here)
    // sig[2] - actual impl hash - the impl hash we will replace class into
    // sig[3: n - 2] -  auxiliary data - hws public key, multisig, daily withdrawal limit etc
    // sig[n - 2] -  chain_id - guarantees aux sig is not replayed from other chain ids
    // sig[n - 1: n] -  r,s from stark sign on poseidon_hash(sig[2: n-2])

    const parsedOtherSigner = Array(9).fill(0);
    const txnHashPoseidon = hash.computePoseidonHashOnElements([
        BraavosAccountClassHash,
        ...parsedOtherSigner,
        chainId
    ]);
    const { r: rPoseidon, s: sPoseidon } = ec.starkCurve.sign(txnHashPoseidon, num.toHex(privateKeyBraavos));
    const signatureData = [
        BigInt(BraavosAccountClassHash).toString(),
        ...parsedOtherSigner.map(e => e.toString()),
        BigInt(chainId).toString(),
        rPoseidon.toString(),
        sPoseidon.toString()
    ];
    return signatureData
}

export const getBraavosConstructor = (starkKeyPubBraavos: string) => CallData.compile({ public_key: starkKeyPubBraavos });

export function calculateAddressBraavos(
    starkKeyPubBraavos: BigNumberish,
): string {
    const BraavosProxyConstructorCallData = getBraavosConstructor(num.toHex(starkKeyPubBraavos));
    return hash.calculateContractAddressFromHash(
        starkKeyPubBraavos,
        BraavosBaseClassHash,
        BraavosProxyConstructorCallData,
        0);
}

