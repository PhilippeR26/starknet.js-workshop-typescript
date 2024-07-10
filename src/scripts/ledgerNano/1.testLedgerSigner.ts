import { CallData, Signer, SignerInterface, ec, encode, hash, num, shortString, stark, transaction, typedData, validateAndParseAddress, type Call, type DeclareSignerDetails, type DeployAccountSignerDetails, type InvocationsSignerDetails, type Signature, type TypedData, type V2DeclareSignerDetails, type V2DeployAccountSignerDetails, type V2InvocationsSignerDetails, type V3DeclareSignerDetails, type V3DeployAccountSignerDetails, type V3InvocationsSignerDetails, type WeierstrassSignatureType, } from "starknet"
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
//import BluetoothTransport from "@ledgerhq/hw-transport-web-ble";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import { sha256 } from '@noble/hashes/sha256';
import { ETransactionVersion2, ETransactionVersion3 } from "starknet-types-07";
import type { SignatureType } from "@noble/curves/abstract/weierstrass";
import { LedgerUSBnodeSigner } from "./3.ClassLedgerSigner";

const MASK_31 = 2n ** 31n - 1n;

// Repos :
// Ledger Starknet APP : https://github.com/LedgerHQ/app-starknet
// LedgerJS : https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs

// only for DAPPs of Desktop (not for node)
// BluetoothTransport.create(undefined,3000).then(transport => console.log("BTH",transport));




// export class LedgerSigner implements SignerInterface {
//     protected path: string;
//     constructor(path: string){};
//     getPubKey(): Promise<string> {

//     };
//     signMessage(typedData: TypedData, accountAddress: string): Promise<Signature>{};
//      signTransaction(transactions: Call[], transactionsDetail: InvocationsSignerDetails): Promise<Signature>{};
//     signDeployAccountTransaction(transaction: DeployAccountSignerDetails): Promise<Signature>{};
//     signDeclareTransaction(transaction: DeclareSignerDetails): Promise<Signature>{};
// }

const ledgerPath: string = ec.starkCurve.getAccountPath("starknet", "starkli", "0", 0);
console.log({ ledgerPath });
// const starknetHash = stringToArrayBuff4("starknet");
// console.log({starknetHash});
//process.exit();


// const apduPort = 40000;

// async function exampleSimple() {
//   const transport = await SpeculosTransport.open({ apduPort });
//   const res = await transport.send(0xE0, 0x01, 0x00, 0x00);
// }

// async function exampleAdvanced() {
//   const transport = await SpeculosTransport.open({ apduPort });
//   setTimeout(() => {
//     // in 1s i'll click on right button and release
//     transport.button("Rr");
//   }, 1000); // 1s is a tradeoff here. In future, we need to be able to "await & expect a text" but that will need a feature from speculos to notify us when text changes.
//   // derivate btc address and ask for device verification
//   const res = await transport.send(0xE0, 0x40, 0x01, 0x00, Buffer.from("058000002c8000000080000000000000000000000f"));
// }

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




async function main() {
    // console.log("aaa");
    // const transport = await TransportNodeHid.create();
    // console.log("USB");

    // // ********** get Ledger Starknet APP version
    // const apduVersion = new Uint8Array([Number("0x5a"), 0, 0, 0, 0]);
    // const resp = await transport.exchange(Buffer.from(apduVersion));
    // //const resp = await transport.send(Number("0x5a"), 0, 0, 0);
    // const starknetAPPversion = resp[0] + "." + resp[1] + "." + resp[2];
    // const versionCode = encode.addHexPrefix(encode.buf2hex(resp.subarray(3, 5)));
    // console.log("Starknet APP version =", starknetAPPversion, "\nResponse code =", versionCode);

    // // ******* getPubKey
    // console.log("*** get public key :");
    // const pathBuff = getPathBuffer(0);
    // console.log("pathBuff =", pathBuff, "\nLen =", pathBuff.length);
    // const apduGetPubK = concatenateArrayBuffer([new Uint8Array([Number("0x5a"), 1, 0, 0, 24]), pathBuff]);

    // // const respGetPublic = Uint8Array.from(await transport.exchange(Buffer.from(apduGetPubK)));
    // const respGetPublic = Uint8Array.from(await transport.send(Number("0x5a"), 1, 0, 0, Buffer.from(pathBuff)));
    // const parityPubK = num.toHex(respGetPublic[0]);
    // const pubX = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(1, 33)));
    // const pubY = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(33, 65)));
    // const fullPublicKey = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(0, 65)));
    // const pubKCode = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(65, 67)));

    // console.log("Result getPubK=", respGetPublic, "\nLen =", respGetPublic.length);
    // console.log("public key X =", pubX);
    // console.log("public key Y =", pubY);
    // console.log("full public key =", fullPublicKey);
    // console.log("Response code =", pubKCode);

    // // ************ sign
    // // sign1
    // console.log("****** sign part 1 :");
    // //console.log("data sign1 =",pathBuff, "\nLen =", pathBuff.length);

    // const respSign1 = encode.addHexPrefix(encode.buf2hex(await transport.send(Number("0x5a"), 2, 0, 0, Buffer.from(pathBuff))));
    // console.log("Response code part 1 =", respSign1);
    // // sign 2
    // console.log("******* sign part 2 :");
    // const hash0 = hash.computePedersenHashOnElements([0, 1]);
    // // const hash1 = validateAndParseAddress(hash0);
    // const hash1 = "0x5111111111111111111111111111111111111111111111111111111111111120";
    // const hash2 = "0x0511111111111111111111111111111111111111111111111111111111111112";
    // console.log("trH =", hash1);
    // const buff2 = num.hexToBytes(hash1);
    // console.log("hash =", buff2, "\nLen =", buff2.length);
    // const respSign2 = Uint8Array.from(await transport.send(Number("0x5a"), 2, 1, 0, Buffer.from(buff2)));
    // console.log("Sign 2 =", respSign2, "\nLen =", respSign2.length);
    // const r = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(1, 33))));
    // const s = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(33, 65))));
    // const v = respSign2[65];
    // console.log("r =", validateAndParseAddress(num.toHex(r)), "\ns =", validateAndParseAddress(num.toHex(s)), "\nv=", v);
    // const sign2Code = encode.addHexPrefix(encode.buf2hex(respSign2.subarray(66, 68)));
    // const sign0 = new ec.starkCurve.Signature(r, s);
    // const sign1 = sign0.addRecoveryBit(v);
    // console.log("Sign 2 =", sign1);
    // console.log("Response code =", sign2Code);
    // const recPubK = sign1.recoverPublicKey(encode.removeHexPrefix(hash2));
    // // console.log("recover pubk =", recPubK);
    // const recX = validateAndParseAddress(num.toHex(recPubK.x));
    // const recY = validateAndParseAddress(num.toHex(recPubK.y));
    // const par = recPubK.hasEvenY() ? "03" : "04";
    // console.log({ recX, recY, par });
    // const recFullPubK = "0x" + par + encode.removeHexPrefix(recX) + encode.removeHexPrefix(recY);
    // console.log({ recFullPubK });
    // const result1 = ec.starkCurve.verify(sign1, hash2, fullPublicKey);
    // console.log("verify =", result1);

    const myLedgerSigner = new LedgerUSBnodeSigner(0, "starkli");
    const pubK = await myLedgerSigner.getPubKey();
    const fullPubK = await myLedgerSigner.getFullPubKey();
    console.log({ pubK, fullPubK });
    const appV = await myLedgerSigner.getAppVersion();
    console.log({ appV });
    const myHash="0x0511111111111111111111111111111111111111111111111111111111111112";
    const sign0=await myLedgerSigner.signRaw(myHash);
    console.log({sign0});
    const result1 = ec.starkCurve.verify(sign0 as SignatureType, myHash, fullPubK)
    console.log({result1});

    console.log("✅ Test Completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

starkliPub:
0x0463f424439f5342ba7ca8bb69496d2326643a8475e28693d3f771e34a29dbe7

mypubKx:
0x03c989d68305bc3f2ee74706f8db0394619a876ce8194097c5de024ff9603495
0x0403c989d68305bc3f2ee74706f8db0394619a876ce8194097c5de024ff960349506f9de554acfbe3a7424926fcc624035b7cbfa3ee9f6fe1f97b323d3ac83ba0d

// starkli ledger sign - hash--path "m//starknet'/starkli'/0'/0'/0" 0x0511111111111111111111111111111111111111111111111111111111111112
sign:
0x05ab6fe0d58074a1962169ac8969f4c228233e79116ee97beca8b6dc74047ea6014653ee807fadfa50a57caa9d6e75b5773779f470d2467fb905fdbec04d0423