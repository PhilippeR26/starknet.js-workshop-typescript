// Crypto calculation for Ethereum
// launch with npx ts-node src/scripts/Starknet13/Starknet13-devnet/3.cryptoEthereum.ts
// Coded with Starknet.js v6.1.2 + experimental commit


import { Account, ec, json, Provider, hash, CallData, RpcProvider, EthSigner, eth, num, stark, addAddressPadding, encode, cairo, constants, Contract } from "starknet";
import { secp256k1 } from '@noble/curves/secp256k1';
import * as dotenv from "dotenv";
dotenv.config();


async function main() {

    const privateKeyETHraw = "0x97ee6ca34cb49060f1c303c6cb7ee2d6123e617601ef3e31ccf7bf5bef1f9"; // 3 missing leading zeros to have 32 bytes
    const privateKeyETHformatted = encode.addHexPrefix(encode.removeHexPrefix(privateKeyETHraw).padStart(64, "0"));
    const privateKeyETHbuffer = num.hexToBytes(privateKeyETHraw);
    const noblePublicKey = encode.addHexPrefix(encode.buf2hex(secp256k1.getPublicKey(encode.removeHexPrefix(privateKeyETHformatted), false)));

    const strkPriv = stark.randomAddress();
    console.log('New account :\nprivateKey=', privateKeyETHformatted);
    console.log("strk priv =", strkPriv);
    console.log("strk pub  =", ec.starkCurve.getStarkKey(strkPriv));
    const ethSigner = new EthSigner(privateKeyETHraw);
    const ethSigner2 = new EthSigner(privateKeyETHbuffer);
    const pub = await ethSigner.getPubKey();
    const pub2 = await ethSigner2.getPubKey();
    console.log({ pub, pub2 });
    const pubKeyETH = await ethSigner.getPubKey();
    console.log("nob pub =", noblePublicKey);
    console.log("eth pub =", pubKeyETH);

    const pubKeyETHy = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(-64))));
    const pubKeyETHx = cairo.uint256(addAddressPadding(encode.addHexPrefix(pubKeyETH.slice(4, -64))));
    const salt = pubKeyETHx.low;
    console.log("pubX    =", pubKeyETHx);
    console.log("pubY    =", pubKeyETHy);
    console.log("salt    =", num.toHex(salt));

    const txHash = encode.removeHexPrefix(encode.sanitizeHex(stark.randomAddress()));
    const nobleSignature = secp256k1.sign(txHash, encode.removeHexPrefix(privateKeyETHformatted));
    console.log("Noble signature =", num.toHex(nobleSignature.r), num.toHex(nobleSignature.s), nobleSignature.recovery);
    const nobleRawPubKey = secp256k1.getPublicKey(encode.removeHexPrefix(privateKeyETHformatted), false);
    console.log({ nobleRawPubKey });
    const verif = secp256k1.verify(nobleSignature, txHash, nobleRawPubKey);
    console.log("result verif =", verif);
    const recoveredPubKey = nobleSignature.recoverPublicKey(txHash);
    console.log("recoveredPubKey =", recoveredPubKey.toHex(false));

    console.log('✅ Tests performed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
