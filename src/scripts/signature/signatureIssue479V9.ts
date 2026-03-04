// Test starknet signature.
// launch with npx ts-node src/scripts/signature/signatureIssue479V9.ts
// Coded with Starknet.js v9.3.0

import { ec, hash, encode, stark, num } from "starknet";
import { assert } from "../utils/assert";

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
    const signature = ec.starkCurve.sign(encodedMessage, privKey);

    const myPoint1 = ec.starkCurve.ProjectivePoint.fromHex("02" + encode.removeHexPrefix(num.toHex64(starknetPubKey)));
    const myPoint2 = ec.starkCurve.ProjectivePoint.fromHex("03" + encode.removeHexPrefix(num.toHex64(starknetPubKey)));

    const coord1 = myPoint1.toRawBytes(false);
    const pubKey1: string = encode.addHexPrefix(encode.buf2hex(coord1));
    const isVerified1 = ec.starkCurve.verify(signature, encodedMessage, pubKey1);
    const coord2 = myPoint2.toRawBytes(false);
    const pubKey2: string = encode.addHexPrefix(encode.buf2hex(coord2));
    const isVerified2 = ec.starkCurve.verify(signature, encodedMessage, pubKey2);
    assert(isVerified1||isVerified2==true,"Error: Full pub key not found.");
    const fullPubKCalculated: string=isVerified1?pubKey1:pubKey2;

    const isVerifiedInitial = ec.starkCurve.verify(signature, encodedMessage, fullPubKey);
    const isVerifiedCalculated = ec.starkCurve.verify(signature, encodedMessage,fullPubKCalculated );

    console.log("priv: ", privKey);
    console.log("           fullPubK: ", fullPubKey);
    console.log("successfully verified: ", isVerifiedInitial);
    console.log("fullPubK calculated: ", fullPubKCalculated);
    console.log("successfully verified: ", isVerifiedCalculated);
    console.log("===========================");
}

const main = async () => {
    console.log("max PrivK=", num.toHex64(3618502788666131213697322783095070105526743751716087489154079457884512865583n));
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
    for (let i=0;i<10;i++) {
        handleVerify(stark.randomAddress());
    }
}

main()



