
// Recover the public key of a Ledger Nano S+/X account, from a signed hash.
// launch with npx ts-node src/scripts/ledgerNano/1.recoverLedgerPublicKey.ts
// Coded with Starknet.js v6.12.0 & devnet-rs v0.1.2 & starknet-devnet.js v0.0.5

import { ec, encode, hash, num,  validateAndParseAddress } from "starknet"
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos"; // Ledger simulator
import { sha256 } from '@noble/hashes/sha256';
import LogC from "../utils/logColors";

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


function getPathBuffer(accountId: number): Uint8Array {
    const path0 = "0x80000A55";
    const path0buff = num.hexToBytes(path0);
    console.log("path0buff =", path0buff);
    const path1buff = stringToArrayBuff4("starknet");
    console.log("path1buff =", path1buff);
    const path2buff = stringToArrayBuff4("starkli");
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


async function main() {
    console.log("aaa");
    const transport = await TransportNodeHid.create();
    console.log("USB");
    const pathBuff = getPathBuffer(0);

    // ********** get Ledger Starknet APP version
    const apduVersion = new Uint8Array([Number("0x5a"), 0, 0, 0, 0]);
    const resp = await transport.send(Number("0x5a"), 0, 0, 0);
    const starknetAPPversion = resp[0] + "." + resp[1] + "." + resp[2];
    const versionCode = encode.addHexPrefix(encode.buf2hex(resp.subarray(3, 5)));
    console.log("Starknet APP version =", starknetAPPversion, "\nResponse code =", versionCode);

    // ******* getPubKey
    console.log("*** get public key :");
    console.log("pathBuff =", pathBuff, "\nLen =", pathBuff.length);
    const apduGetPubK = concatenateArrayBuffer([new Uint8Array([Number("0x5a"), 1, 0, 0, 24]), pathBuff]);

    const respGetPublic = Uint8Array.from(await transport.send(Number("0x5a"), 1, 0, 0, Buffer.from(pathBuff)));
    const parityPubK = num.toHex(respGetPublic[0]);
    const pubX = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(1, 33)));
    const pubY = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(33, 65)));
    const fullPublicKey = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(0, 65)));
    const pubKCode = encode.addHexPrefix(encode.buf2hex(respGetPublic.subarray(65, 67)));

    console.log("Result getPubK=", respGetPublic, "\nLen =", respGetPublic.length);
    console.log("public key X =", pubX);
    console.log("public key Y =", pubY);
    console.log("full public key =", fullPublicKey);
    console.log("Response code =", pubKCode);

    // ************ sign
    // sign1
    console.log("****** sign part 1 :");
    const respSign1 = encode.addHexPrefix(encode.buf2hex(await transport.send(Number("0x5a"), 2, 0, 0, Buffer.from(pathBuff))));
    console.log("Response code part 1 =", respSign1);
    // sign 2
    console.log("******* sign part 2 :");
    const hash0 = hash.computePedersenHashOnElements([0, 1]);
    const hash1 = "0x5111111111111111111111111111111111111111111111111111111111111120";
    const hash2 = "0x0511111111111111111111111111111111111111111111111111111111111112";
    console.log("trH =", hash1);
    const buff2 = num.hexToBytes(hash1);
    console.log("hash =", buff2, "\nLen =", buff2.length);
    console.log(LogC.underscore+LogC.fg.yellow+"Sign in your Ledger the hash"+LogC.reset)
    const respSign2 = Uint8Array.from(await transport.send(Number("0x5a"), 2, 1, 0, Buffer.from(buff2)));
    console.log("Sign 2 =", respSign2, "\nLen =", respSign2.length);
    const r = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(1, 33))));
    const s = BigInt(encode.addHexPrefix(encode.buf2hex(respSign2.subarray(33, 65))));
    const v = respSign2[65];
    console.log("r =", validateAndParseAddress(num.toHex(r)), "\ns =", validateAndParseAddress(num.toHex(s)), "\nv=", v);
    const sign2Code = encode.addHexPrefix(encode.buf2hex(respSign2.subarray(66, 68)));
    const sign0 = new ec.starkCurve.Signature(r, s);
    const sign1 = sign0.addRecoveryBit(v);
    console.log("Sign 2 =", sign1);
    console.log("Response code =", sign2Code);
    const recPubK = sign1.recoverPublicKey(encode.removeHexPrefix(hash2));
    const recX = validateAndParseAddress(num.toHex(recPubK.x));
    const recY = validateAndParseAddress(num.toHex(recPubK.y));
    const par = recPubK.hasEvenY() ? "03" : "04";
    console.log({ recX, recY, par });
    const recFullPubK = "0x" + par + encode.removeHexPrefix(recX) + encode.removeHexPrefix(recY);
    console.log({ recFullPubK });
    const result1 = ec.starkCurve.verify(sign1, hash2, fullPublicKey);
    console.log("verify =", result1);
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