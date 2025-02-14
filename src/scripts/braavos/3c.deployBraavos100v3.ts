// Collection of functions for Braavos account (Cairo 1) creation
// coded with Starknet.js v6.1.4

import { ec, hash, num, constants, CallData, stark, BigNumberish, type RpcProvider, RPC, type V2InvocationsSignerDetails, type DeployAccountSignerDetails, type V2DeployAccountSignerDetails, type V3DeployAccountSignerDetails, type V3InvocationsSignerDetails, type UniversalDetails, type EstimateFeeResponse } from "starknet";
import { type DeployContractResponse, type Calldata, type DeployAccountContractPayload, type EstimateFeeDetails, type CairoVersion, type DeployAccountContractTransaction, } from "starknet";
import { EDAMode, ETransactionVersion, ETransactionVersion2, ETransactionVersion3, type ResourceBounds } from "@starknet-io/types-js";


const BraavosBaseClassHash = "0x013bfe114fb1cf405bfc3a7f8dbe2d91db146c17521d40dcf57e16d6b59fa8e6";
const BraavosAccountClassHash = "0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253";

type CalcV2DeployAccountTxHashArgs = {
    contractAddress: BigNumberish;
    classHash: BigNumberish;
    constructorCalldata: Calldata;
    salt: BigNumberish;
    version: `${ETransactionVersion2}`;
    maxFee: BigNumberish;
    chainId: constants.StarknetChainId;
    nonce: BigNumberish;
};

type CalcV3DeployAccountTxHashArgs = {
    contractAddress: BigNumberish;
    classHash: BigNumberish;
    compiledConstructorCalldata: Calldata;
    salt: BigNumberish;
    version: `${ETransactionVersion3}`;
    chainId: constants.StarknetChainId;
    nonce: BigNumberish;
    nonceDataAvailabilityMode: EDAMode;
    feeDataAvailabilityMode: EDAMode;
    resourceBounds: ResourceBounds;
    tip: BigNumberish;
    paymasterData: BigNumberish[];
};

export function getBraavosSignature(
    details: DeployAccountSignerDetails,
    privateKeyBraavos: num.BigNumberish,
): string[] {
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    let txnHash: string = "";
    if (Object.values(ETransactionVersion3).includes(details.version as any)) {
        const det = details as V3DeployAccountSignerDetails;
        const v3det = stark.v3Details(det);
        txnHash = hash.calculateDeployAccountTransactionHash(
            {
                contractAddress: det.contractAddress,
                classHash: det.classHash,
                compiledConstructorCalldata: det.constructorCalldata,
                salt: det.addressSalt,
                version: det.version,
                chainId: det.chainId,
                nonce: det.nonce,
                nonceDataAvailabilityMode: stark.intDAM(v3det.nonceDataAvailabilityMode),
                feeDataAvailabilityMode: stark.intDAM(v3det.feeDataAvailabilityMode),
                resourceBounds: det.resourceBounds,
                tip: det.tip,
                paymasterData: det.paymasterData,
            } as CalcV3DeployAccountTxHashArgs
        )
    }
    else if (Object.values(ETransactionVersion2).includes(details.version as any)) {
        const det = details as V2DeployAccountSignerDetails;
        txnHash = hash.calculateDeployAccountTransactionHash(
            {
                ...det,
                salt: det.addressSalt,
            } as CalcV2DeployAccountTxHashArgs
        )
    } else {
        throw Error('unsupported signDeployAccountTransaction version');
    }

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
        details.chainId
    ]);
    const { r: rPoseidon, s: sPoseidon } = ec.starkCurve.sign(txnHashPoseidon, num.toHex(privateKeyBraavos));
    const signature = [
        r.toString(),
        s.toString(),
        BraavosAccountClassHash.toString(),
        ...parsedOtherSigner.map(e => e.toString()),
        details.chainId.toString(),
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
    invocationDetails: V2InvocationsSignerDetails | V3InvocationsSignerDetails
): Promise<DeployAccountContractTransaction> {
    const compiledCalldata = CallData.compile(constructorCalldata ?? []);
    const contractAddress =
        providedContractAddress ??
        calculateAddressBraavos(privateKeyBraavos);
    if (Object.values(ETransactionVersion3).includes(invocationDetails.version as any)) {
        const v3invocation = invocationDetails as V3InvocationsSignerDetails;
        const details: V3DeployAccountSignerDetails = {
            classHash,
            constructorCalldata: constructorCalldata ?? [],
            addressSalt: addressSalt ?? 0,
            contractAddress,
            ...v3invocation,
        };
        const signature = getBraavosSignature(
            details,
            privateKeyBraavos,
        );
        return {
            classHash,
            addressSalt,
            constructorCalldata: compiledCalldata,
            signature,
        };
    } else if (Object.values(ETransactionVersion2).includes(invocationDetails.version as any)) { //tx V1
        const v2invocation = invocationDetails as V2InvocationsSignerDetails;
        const details: V2DeployAccountSignerDetails = {
            classHash,
            constructorCalldata: constructorCalldata ?? [],
            addressSalt: addressSalt ?? 0,
            contractAddress,
            ...v2invocation,
            ...stark.v3Details({})
        };
        const signature = getBraavosSignature(
            details,
            privateKeyBraavos,
        );
        return {
            classHash,
            addressSalt,
            constructorCalldata: compiledCalldata,
            signature,
        };
    } else {
        throw Error('wrong version in buildBraavosAccountDeployPayload');
    }
}

export async function estimateBraavosAccountDeployFee(
    privateKeyBraavos: num.BigNumberish,
    provider: RpcProvider,
    { blockIdentifier, skipValidate, version: txVersion }: EstimateFeeDetails = { version: ETransactionVersion.V3 }
): Promise<UniversalDetails> {

    const EstimateVersion = RPC.ETransactionVersion2.F1;
    const nonce = constants.ZERO;
    const chainId = await provider.getChainId();
    const cairoVersion: CairoVersion = "1"; // dummy value, not used but mandatory
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosAccountAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);

    const payload: DeployAccountContractTransaction = await buildBraavosAccountDeployPayload(
        privateKeyBraavos,
        {
            classHash: BraavosBaseClassHash,
            addressSalt: starkKeyPubBraavos,
            constructorCalldata: BraavosConstructorCallData,
            contractAddress: BraavosAccountAddress
        },
        {
            nonce,
            chainId,
            version: EstimateVersion,
            walletAddress: BraavosAccountAddress,
            maxFee: constants.ZERO,
            cairoVersion: cairoVersion,
        }
    );
    console.log("estimate payload =", payload);

    const response = await provider.getDeployAccountEstimateFee(
        { ...payload },
        { version: EstimateVersion, nonce },
        blockIdentifier,
        skipValidate
    );
    console.log("response estimate fee =", response);
    const suggestedMaxFee = stark.estimatedFeeToMaxFee(response.overall_fee);

    return {};

}

type Version = typeof ETransactionVersion.V3 | typeof ETransactionVersion.F3;
export function isV3tx(version: string): boolean {
    return [ETransactionVersion.V3, ETransactionVersion.F3].includes(version as Version);
};

export async function deployBraavosAccount(
    privateKeyBraavos: num.BigNumberish,
    provider: RpcProvider,
    maxFeeDetails?: UniversalDetails,
    txVersion: ETransactionVersion = ETransactionVersion.V3,
): Promise<DeployContractResponse> {
    const nonce = constants.ZERO;
    const chainId = await provider.getChainId();
    const cairoVersion: CairoVersion = "1"; // dummy value, not used but mandatory
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosAccountAddress = calculateAddressBraavos(privateKeyBraavos);
    const BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);
    const feeDetails: UniversalDetails = maxFeeDetails ?? await estimateBraavosAccountDeployFee(privateKeyBraavos, provider, { version: txVersion });
    const isV3 = isV3tx(txVersion);
    if (isV3) {
        const payload: DeployAccountContractTransaction = await buildBraavosAccountDeployPayload(
            privateKeyBraavos,
            {
                classHash: BraavosBaseClassHash.toString(),
                addressSalt: starkKeyPubBraavos,
                constructorCalldata: BraavosConstructorCallData,
                contractAddress: BraavosAccountAddress
            },
            {
                chainId,
                nonce,
                version: txVersion,
                walletAddress: BraavosAccountAddress,
                cairoVersion: cairoVersion,
                ...feeDetails
            } as V3InvocationsSignerDetails
        );
        console.log("deploy payload V3 =", payload);
        return provider.deployAccountContract(
            {
                classHash: BraavosBaseClassHash,
                addressSalt: starkKeyPubBraavos,
                constructorCalldata: BraavosConstructorCallData,
                signature: payload.signature,
            },
            {
                nonce,
                version: txVersion,
                ...feeDetails
            }
        );

    } else {// V1 tx
        const payload: DeployAccountContractTransaction = await buildBraavosAccountDeployPayload(
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
                version: txVersion as ETransactionVersion2,
                walletAddress: BraavosAccountAddress,
                maxFee: feeDetails.maxFee as BigNumberish,
                cairoVersion: cairoVersion,
            }
        );
        console.log("deploy payload V1 =", payload);
        return provider.deployAccountContract(
            {
                classHash: BraavosBaseClassHash,
                addressSalt: starkKeyPubBraavos,
                constructorCalldata: BraavosConstructorCallData,
                signature: payload.signature,
            },
            {
                nonce,
                maxFee: feeDetails.maxFee,
                version: txVersion,
            }
        );
    }
}
