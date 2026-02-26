// Test starknet signature.
// launch with npx ts-node src/scripts/signature/signatureIssue479V9.ts
// Coded with Starknet.js v9.3.0

import { ec, hash, encode, stark, num } from "starknet";

// privK has to be lower than ORDER:
const ORDER = BigInt('0x800000000000011000000000000000000000000000000000000000000000001');
const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}

export function hexToBytes(hex: string): Uint8Array {
    if (typeof hex !== 'string') throw new Error('hex string expected, got ' + typeof hex);
    if (hex.length % 2) throw new Error('hex string is invalid: unpadded ' + hex.length);
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0) throw new Error('invalid byte sequence');
        array[i] = byte;
    }
    return array;
}

// Copies several Uint8Arrays into one.
export function concatBytes(...arrs: Uint8Array[]): Uint8Array {
    const r = new Uint8Array(arrs.reduce((sum, a) => sum + a.length, 0));
    let pad = 0; // walk through each item, ensure they have proper type
    arrs.forEach((a) => {
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}


const handleVerify = (privKey: string) => {
    const starknetPubKey: string = ec.starkCurve.getStarkKey(privKey); // 256 bits
    const fullPubKey = stark.getFullPublicKey(privKey); // 512 bits
    const isYodd = (BigInt(fullPubKey) & 1n) === 1n;
    const prefix = isYodd ? "03" : "02";
    // Starknet should provide prefix in their public keys, like this :
    const adaptedStark: string = prefix + encode.removeHexPrefix(starknetPubKey);
    // but in real life, it's missing.
    // The solution is the one with the higher Y coordinate.

    const encodedMessage = hash.starknetKeccak("abc123").toString(16).padStart(64, "0");
    const signature = ec.starkCurve.sign(encodedMessage,privKey);

    const myPoint1 = ec.starkCurve.ProjectivePoint.fromHex("02" + encode.removeHexPrefix(num.toHex64(starknetPubKey)));
    const myPoint2 = ec.starkCurve.ProjectivePoint.fromHex("03" + encode.removeHexPrefix(num.toHex64(starknetPubKey)));
    const y1 = num.toHex(myPoint1.y); const y1bn = BigInt(myPoint1.y);
    const y2 = num.toHex(myPoint2.y); const y2bn = BigInt(myPoint2.y);
    let coord: Uint8Array;
    if (y1bn > y2bn) {
        coord = myPoint1.toRawBytes(false);
    } else {
        coord = myPoint2.toRawBytes(false);
    }
    const pubKey: string = encode.addHexPrefix(bytesToHex(coord));
    const isVerified = ec.starkCurve.verify(signature, encodedMessage, pubKey);

    console.log("priv: ", privKey);
    console.log("fullpub: ", fullPubKey);
    console.log("y1: ", y1);
    console.log("y2: ", y2);
    console.log("strkPub: ", starknetPubKey);
    console.log("y1>y2 =", y1 > y2);
    console.log("successfully verified: ", isVerified);
    console.log("===========================");
}

const main = async () => {
    console.log("max PrivK=",num.toHex64(3618502788666131213697322783095070105526743751716087489154079457884512865583n));
    const privKeyA = "0xe7ce3142d57bbbc0c8a7c9b59d11d31811177aa1b9cc027e522a975632a606";
    handleVerify(privKeyA);
    const privKeyB = "0x7c52cc9f1107c94473eba3f2560799131371c76a002f55cac1c6aa5293cb5f0";
    handleVerify(privKeyB);
    const myPrivKey = "0x5b7d4f8710b3581ebb2b8b74efaa23d25ab0ffea2a4f3e269bf91bf9f63d634";
    handleVerify(myPrivKey);
    const myPrivKey2 = "0x5b7d4f8710b3581ebb2b8b74efaa23d25ab0ffea2a4f3e269bf91bf9f63d633";
    handleVerify(myPrivKey2);
    handleVerify("0x2e7ce3142d57bbbc0c8a7c9b59d11d31811177aa1b9cc027e522a975632a606");
    handleVerify("0x5b7d4f8710b3581ebb2b8b74efaa23d2eab0ffea2a4f3e269bf91bf9f63d633");
    handleVerify("0x5b7d4f8710b35815bb2b8b74efaa23d25ab0ffea2a4f3e269bf91bf9f63d633");
    handleVerify("0x5b7d4f8710b3581ebb2b8b74efaa23d25ab02fea2a4f3e269bf91bf9f63d633");
}

main()



