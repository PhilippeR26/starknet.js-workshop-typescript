
import {
    ArraySignatureType,
    Call,
    DeclareSignerDetails,
    DeployAccountSignerDetails,
    InvocationsSignerDetails,
    Signature,
    TypedData,
    Uint256,
    V3DeclareSignerDetails,
    V3DeployAccountSignerDetails,
    V3InvocationsSignerDetails,
} from 'starknet';
import { ETransactionVersion3 } from 'starknet';
import { CallData, encode, hash, stark, transaction, typedData as starknetTypeData } from 'starknet';
// import {
//     calculateDeclareTransactionHash,
//     calculateDeployAccountTransactionHash,
//     calculateInvokeTransactionHash,
// } from '../utils/hash';
// import { intDAM } from '../utils/stark';
// import { getExecuteCalldata } from 'starknet';
//import { getMessageHash } from '../utils/typedData';
import { SignerInterface } from 'starknet';
import { assert } from '../../utils/assert';
import { randomBytes } from '@noble/post-quantum/utils.js';
import * as falcon from './pkg/falcon_rs.js';
import { parseFalcon512PublicKey } from './11.falcon512utils';

const PRIV_KEY_LENGTH = 3584;
const PUB_KEY_LENGTH = 896;
const PACKED_PUB_KEY_LENGTH = 29; // felt252 array

type Falcon512KeyPair = { sk: Uint8Array; vk: Uint8Array };

function toUint8Array(key: Uint8Array | string): Uint8Array {
    return key instanceof Uint8Array ? key : encode.stringToUint8Array(key);
}

function generateKeyPair(): Falcon512KeyPair {
    const seed = randomBytes(48);
    return falcon.keygen(seed) as Falcon512KeyPair;
}


/**
 * Signer for accounts using Ethereum signature
 */
export class Falcon512Signer implements SignerInterface {
    protected privK: Uint8Array; // 3584 bytes

    protected pubK: Uint8Array; // 796 bytes

    protected starknetPublicKey: string[]; //  29 felt252

    protected pkNtt: Int32Array;

    constructor(privK?: Uint8Array | string, pubK?: Uint8Array | string) {
        assert(
            !((privK === undefined) !== (pubK === undefined)),
            'Both keys must be provided together, or neither.'
        );

        const { sk, vk } = (privK !== undefined && pubK !== undefined)
            ? { sk: toUint8Array(privK), vk: toUint8Array(pubK) }
            : generateKeyPair();

        assert(sk.length === PRIV_KEY_LENGTH, `Invalid private key length: expected ${PRIV_KEY_LENGTH}, got ${sk.length}`);
        assert(vk.length === PUB_KEY_LENGTH, `Invalid public key length: expected ${PUB_KEY_LENGTH}, got ${vk.length}`);

        this.privK = sk;
        this.pubK = vk;

        const pkTime = parseFalcon512PublicKey(vk);
        this.pkNtt = new Int32Array(falcon.ntt_public_key(pkTime));
        this.starknetPublicKey = falcon.pack_public_key_wasm(new Uint16Array(this.pkNtt));

        assert(
            this.starknetPublicKey.length === PACKED_PUB_KEY_LENGTH,
            `Unexpected packed public key length: ${this.starknetPublicKey.length}`
        );
    }

    /**
     * provides the Falcon 512 full public key
     * @returns an hex string
     */
    public async getPubKey(): Promise<string> {
        return encode.addHexPrefix(encode.buf2hex(this.pubK).padStart(PUB_KEY_LENGTH * 2, '0'));
    }

    /**
     * provides the Falcon 512 public key, formatted in Array<felt252> for S2morrow account.
     * @returns an array of string
     */
    public gets2morrowPubKey(): string[] {
        return this.starknetPublicKey;
    }

    public async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
        const msgHash = starknetTypeData.getMessageHash(typedData, accountAddress);
        return this.signRaw(msgHash);
    }

    public async signTransaction(
        transactions: Call[],
        details: InvocationsSignerDetails
    ): Promise<Signature> {
        const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
        let msgHash;

        if (Object.values(ETransactionVersion3).includes(details.version as any)) {
            const det = details as V3InvocationsSignerDetails;
            msgHash = hash.calculateInvokeTransactionHash({
                ...det,
                senderAddress: det.walletAddress,
                compiledCalldata,
                version: det.version,
                nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
                feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
            });
        } else {
            throw Error('unsupported signTransaction version');
        }
        return this.signRaw(msgHash);
    }

    public async signDeployAccountTransaction(
        details: DeployAccountSignerDetails
    ): Promise<Signature> {
        const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
        /*     const version = BigInt(details.version).toString(); */
        let msgHash;

        if (Object.values(ETransactionVersion3).includes(details.version as any)) {
            const det = details as V3DeployAccountSignerDetails;
            msgHash = hash.calculateDeployAccountTransactionHash({
                ...det,
                salt: det.addressSalt,
                compiledConstructorCalldata,
                version: det.version,
                nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
                feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
            });
        } else {
            throw Error('unsupported signDeployAccountTransaction version');
        }
        return this.signRaw(msgHash);
    }

    public async signDeclareTransaction(
        // contractClass: ContractClass,  // Should be used once class hash is present in ContractClass
        details: DeclareSignerDetails
    ): Promise<Signature> {
        let msgHash;

        if (Object.values(ETransactionVersion3).includes(details.version as any)) {
            const det = details as V3DeclareSignerDetails;
            msgHash = hash.calculateDeclareTransactionHash({
                ...det,
                version: det.version,
                nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
                feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
            });
        } else {
            throw Error('unsupported signDeclareTransaction version');
        }
        return this.signRaw(msgHash);
    }

    protected async signRaw(msgHash: string): Promise<Signature> {
        return falcon.sign_for_starknet(this.privK, msgHash, this.pkNtt);
    }
}
