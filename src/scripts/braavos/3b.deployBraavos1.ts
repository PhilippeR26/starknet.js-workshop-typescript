// Collection of functions for Braavos account (Cairo 1) creation
// coded with Starknet.js v6.1.4

import { ec, hash, num, constants, Provider, CallData, stark, BigNumberish, type RpcProvider, RPC, type V2InvocationsSignerDetails, } from "starknet";
import { type RawCalldata, type DeployContractResponse, type Calldata, type DeployAccountContractPayload, type EstimateFeeDetails, type CairoVersion, type InvocationsSignerDetails, type DeployAccountContractTransaction, } from "starknet";
import { ETransactionVersion2 } from "@starknet-io/types-js";


const BraavosBaseClassHash: BigNumberish = "0x013bfe114fb1cf405bfc3a7f8dbe2d91db146c17521d40dcf57e16d6b59fa8e6";
const BraavosAccountClassHash = "0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253";

export function getBraavosSignature(
    BraavosAddress: num.BigNumberish,
    BraavosConstructorCallData: Calldata,
    starkKeyPubBraavos: BigNumberish,
    version: ETransactionVersion2,
    max_fee: BigNumberish,
    chainId: constants.StarknetChainId,
    nonce: bigint,
    privateKeyBraavos: num.BigNumberish,
): string[] {
    const txnHash = hash.calculateDeployAccountTransactionHash(
        {
            contractAddress: BraavosAddress,
            classHash: BraavosBaseClassHash,
            constructorCalldata: BraavosConstructorCallData,
            salt: starkKeyPubBraavos,
            version: RPC.ETransactionVersion2.V1,
            maxFee: max_fee,
            chainId,
            nonce
        }
    );

    // braavos v1.0.0 specific deployment signature :
    // sig[0: 1] - r,s from stark sign on txn_hash
    // sig[2] - actual impl hash - the impl hash we will replace class into
    // sig[3: n - 2] -  auxiliary data - hws public key, multisig, daily withdrawal limit etc
    // sig[n - 2] -  chain_id - guarantees aux sig is not replayed from other chain ids
    // sig[n - 1: n] -  r,s from stark sign on poseidon_hash(sig[2: n-2])

    const parsedOtherSigner = Array(9).fill(0);
    const { r, s } = ec.starkCurve.sign(txnHash, num.toHex(privateKeyBraavos));
    const txnHashPoseidon = hash.computePoseidonHashOnElements([
        BraavosAccountClassHash, 
        ...parsedOtherSigner,
        chainId
    ]);
    const { r: rPoseidon, s: sPoseidon } = ec.starkCurve.sign(txnHashPoseidon, num.toHex(privateKeyBraavos));
    const signature = [
        r.toString(),
        s.toString(),
        BraavosAccountClassHash.toString(),
        ...parsedOtherSigner.map(e => e.toString()),
        chainId.toString(),
        rPoseidon.toString(),
        sPoseidon.toString()
    ];
    console.log("Braavos special signature =", signature);
    return signature
}

const BraavosConstructor = (starkKeyPubBraavos: string) => CallData.compile({ public_key: starkKeyPubBraavos });

export function calculateAddressBraavos(
    privateKeyBraavos: num.BigNumberish,
): string {
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosProxyConstructorCallData = BraavosConstructor(starkKeyPubBraavos);

    return hash.calculateContractAddressFromHash(
        starkKeyPubBraavos,
        BraavosBaseClassHash,
        BraavosProxyConstructorCallData,
        0);

}

async function buildBraavosAccountDeployPayload(
    privateKeyBraavos: num.BigNumberish,
    {
        classHash,
        addressSalt,
        constructorCalldata,
        contractAddress: providedContractAddress,
    }: DeployAccountContractPayload,
    { nonce, chainId, version, maxFee }: V2InvocationsSignerDetails
): Promise<DeployAccountContractTransaction> {
    const compiledCalldata = CallData.compile(constructorCalldata ?? []);
    const contractAddress =
        providedContractAddress ??
        calculateAddressBraavos(privateKeyBraavos);
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const signature = getBraavosSignature(
        contractAddress,
        compiledCalldata,
        starkKeyPubBraavos,
        version,
        maxFee,
        chainId,
        BigInt(nonce),
        privateKeyBraavos,
    );
    return {
        classHash,
        addressSalt,
        constructorCalldata: compiledCalldata,
        signature,
    };
}

export async function estimateBraavosAccountDeployFee(
    privateKeyBraavos: num.BigNumberish,
    provider: RpcProvider,
    { blockIdentifier, skipValidate }: EstimateFeeDetails = {}
): Promise<bigint> {
    
    const version = RPC.ETransactionVersion2.F1;
    const nonce = constants.ZERO;
    const chainId = await provider.getChainId();
    const cairoVersion: CairoVersion = "1"; // dummy value, not used but mandatory
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosAccountAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);

    const payload = await buildBraavosAccountDeployPayload(
        privateKeyBraavos,
        {
            classHash: BraavosBaseClassHash.toString(),
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosConstructorCallData,
            contractAddress: BraavosAccountAddress
        },
        {
            nonce,
            chainId,
            version,
            walletAddress: BraavosAccountAddress,
            maxFee: constants.ZERO,
            cairoVersion: cairoVersion,
        }
    );
    console.log("estimate payload =",payload);

    const response = await provider.getDeployAccountEstimateFee(
        { ...payload },
        { version, nonce },
        blockIdentifier, 
        skipValidate
    );
    console.log("response estimate fee =",response);
    const suggestedMaxFee = stark.estimatedFeeToMaxFee(response.overall_fee);

    return suggestedMaxFee;

}

export async function deployBraavosAccount(
    privateKeyBraavos: num.BigNumberish,
    provider: RpcProvider,
    max_fee?: num.BigNumberish,
): Promise<DeployContractResponse> {
    const nonce = constants.ZERO;
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    console.log("pubkey =", starkKeyPubBraavos.toString())
    const BraavosAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);
    // console.log("constructor =", BraavosConstructorCallData);
    max_fee ??= await estimateBraavosAccountDeployFee(privateKeyBraavos, provider);
    const version = ETransactionVersion2.V1;
    const signatureBraavos = getBraavosSignature(
        BraavosAddress,
        BraavosConstructorCallData,
        starkKeyPubBraavos,
        version,
        max_fee,
        await provider.getChainId(),
        nonce,
        privateKeyBraavos,
    );

    return provider.deployAccountContract(
        {
            classHash: BraavosBaseClassHash.toString(),
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosConstructorCallData,
            signature: signatureBraavos
        },
        {
            nonce,
            maxFee: max_fee,
            version,
        }
    );
}
