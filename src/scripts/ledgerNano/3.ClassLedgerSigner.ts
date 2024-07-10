import { CallData, Signer, SignerInterface, ec, encode, hash, num, shortString, stark, transaction, typedData, validateAndParseAddress, type Call, type DeclareSignerDetails, type DeployAccountSignerDetails, type InvocationsSignerDetails, type Signature, type TypedData, type V2DeclareSignerDetails, type V2DeployAccountSignerDetails, type V2InvocationsSignerDetails, type V3DeclareSignerDetails, type V3DeployAccountSignerDetails, type V3InvocationsSignerDetails, type WeierstrassSignatureType, } from "starknet"
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
//import BluetoothTransport from "@ledgerhq/hw-transport-web-ble";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import { sha256 } from '@noble/hashes/sha256';
import { ETransactionVersion2, ETransactionVersion3 } from "starknet-types-07";
import type { SignatureType } from "@noble/curves/abstract/weierstrass";

const MASK_31 = 2n ** 31n - 1n;



function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || 'Assertion failure');
    }
}

/**
 * Combine multiple Uint8Arrays into one.
 *
 * @param {Uint8Array[]} uint8arrays
 * @returns {Uint8Array}
 */
function concatenateArrayBuffer(uint8arrays: Uint8Array[]): Uint8Array {
    const totalLength = uint8arrays.reduce(
        (total, uint8array) => total + uint8array.byteLength,
        0
    );
    const result = new Uint8Array(totalLength);
    let offset = 0;
    uint8arrays.forEach((uint8array) => {
        result.set(uint8array, offset);
        offset += uint8array.byteLength;
    });
    return result;
}

function stringToArrayBuff4(str: string): Uint8Array {
    const int31 = (n: bigint) => Number(n & MASK_31);
    //const encodedString = shortString.encodeShortString(str);
    const hashed = sha256(str);
    console.log(encode.buf2hex(hashed));
    const result: number = int31(BigInt(encode.addHexPrefix(encode.buf2hex(sha256(str)))));
    console.log("hashed", str, "=", num.toHex(result), result);
    return num.hexToBytes(num.toHex(result));
}

export class LedgerUSBnodeSigner implements SignerInterface {
    readonly accountID: number;
    readonly applicationName: string;
    readonly pathBuffer: Uint8Array;
    private appVersion: string;
    protected pubKey: string;
    protected fullPubKey: string;

    constructor(accountID: number, application: string = "LedgerW") {
        assert(accountID >= 0, "Ledger account ID shall not be a negative number.");
        assert(accountID <= MASK_31, "Ledger account ID shall be < 2**31.");
        assert(!!application, "Ledger application name shall not be empty.")
        this.accountID = accountID;
        this.pubKey = "";
        this.fullPubKey = "";
        this.applicationName = application;
        this.appVersion = "";
        this.pathBuffer = getPathBuffer(this.accountID, this.applicationName);
    }

    private async getPublicKeys() {
        const transport = await TransportNodeHid.create();
        const pathBuff = this.pathBuffer;
        const respGetPublic = Uint8Array.from(await transport.send(Number("0x5a"), 1, 0, 0, Buffer.from(pathBuff)));
        this.pubKey = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(1, 33)));
        this.fullPubKey = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(0, 65)));
        transport.close();
    }

    public async getPubKey(): Promise<string> {
        if (!this.pubKey) await this.getPublicKeys();
        return this.pubKey;
    }

    public async getFullPubKey(): Promise<string> {
        if (!this.fullPubKey) await this.getPublicKeys();
        return this.fullPubKey;
    }

    public async getAppVersion(): Promise<string> {
        if (!this.appVersion) {
            const transport = await TransportNodeHid.create();
            const resp = await transport.send(Number("0x5a"), 0, 0, 0);
            this.appVersion = resp[0] + "." + resp[1] + "." + resp[2];
            transport.close();
        }
        return this.appVersion
    }

    public async signMessage(typedDataToHash: TypedData, accountAddress: string): Promise<Signature> {
        const msgHash = typedData.getMessageHash(typedDataToHash, accountAddress);
        return this.signRaw(msgHash);
    }

    public async signTransaction(
        transactions: Call[],
        details: InvocationsSignerDetails
    ): Promise<Signature> {
        const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
        let msgHash;

        // TODO: How to do generic union discriminator for all like this
        if (Object.values(ETransactionVersion2).includes(details.version as any)) {
            const det = details as V2InvocationsSignerDetails;
            msgHash = hash.calculateInvokeTransactionHash({
                ...det,
                senderAddress: det.walletAddress,
                compiledCalldata,
                version: det.version,
            });
        } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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

        return this.signRaw(msgHash as string);
    }

    public async signDeployAccountTransaction(
        details: DeployAccountSignerDetails
    ): Promise<Signature> {
        const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
        /*     const version = BigInt(details.version).toString(); */
        let msgHash;

        if (Object.values(ETransactionVersion2).includes(details.version as any)) {
            const det = details as V2DeployAccountSignerDetails;
            msgHash = hash.calculateDeployAccountTransactionHash({
                ...det,
                salt: det.addressSalt,
                constructorCalldata: compiledConstructorCalldata,
                version: det.version,
            });
        } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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

        return this.signRaw(msgHash as string);
    }

    public async signDeclareTransaction(
        // contractClass: ContractClass,  // Should be used once class hash is present in ContractClass
        details: DeclareSignerDetails
    ): Promise<Signature> {
        let msgHash;

        if (Object.values(ETransactionVersion2).includes(details.version as any)) {
            const det = details as V2DeclareSignerDetails;
            msgHash = hash.calculateDeclareTransactionHash({
                ...det,
                version: det.version,
            });
        } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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

        return this.signRaw(msgHash as string);
    }

    public async signRaw(msgHash: string): Promise<Signature> {
        const transport = await TransportNodeHid.create();
        encode.addHexPrefix(encode.buf2hex(await transport.send(Number("0x5a"), 2, 0, 0, Buffer.from(this.pathBuffer))));
        const shiftedHash = num.toHex(BigInt(msgHash) << 4n);
        const buff2 = num.hexToBytes(shiftedHash);
        const respSign2 = Uint8Array.from(await transport.send(Number("0x5a"), 2, 1, 0, Buffer.from(buff2)));
        const r = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(1, 33))));
        const s = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(33, 65))));
        const v = respSign2[65];
        console.log("r =", validateAndParseAddress(num.toHex(r)), "\ns =", validateAndParseAddress(num.toHex(s)), "\nv=", v);
        const sign0 = new ec.starkCurve.Signature(r, s);
        const sign1 = sign0.addRecoveryBit(v);
        transport.close();
        return sign1;
    }
}


function getPathBuffer(accountId: number, applicationName: string): Uint8Array {
    const path0 = "0x80000A55";
    const path0buff = num.hexToBytes(path0);
    console.log("path0buff =", path0buff);
    const path1buff = stringToArrayBuff4("starknet");
    console.log("path1buff =", path1buff);
    const path2buff = stringToArrayBuff4(applicationName);
    console.log("path2buff =", path2buff);
    const path3buff = new Uint8Array([0, 0, 0, 0]);
    console.log("path3buff =", path3buff);
    const hex = num.toHex(accountId);
    const padded = encode.addHexPrefix(encode.removeHexPrefix(hex).padStart(8, '0'));
    const path4buff = num.hexToBytes(padded);;
    console.log("path4buff =", path4buff);
    const path5buff = new Uint8Array([0, 0, 0, 0]);
    console.log("path5buff =", path5buff);
    const pathBuff = concatenateArrayBuffer([path0buff, path1buff, path2buff, path3buff, path4buff, path5buff]);
    return pathBuff;
}

